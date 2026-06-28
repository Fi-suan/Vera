import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { ApiError, api } from "./api";
import type { CreateFields, Extraction } from "./api";
import { translate as T } from "./i18n";

/* ================================================================== */
/* VERA data layer.                                                    */
/* No seeded transactional data — the queue starts empty and fills as  */
/* employees submit write-offs. Persistence + backend live in api.ts.  */
/* ================================================================== */

export type Role = "employee" | "manager";
export type Status = "pending" | "approved" | "rejected";
export type Sync = "idle" | "syncing" | "synced" | "failed";
export type Category = "Meat" | "Dairy" | "Bakery" | "Produce" | "Seafood" | "Prepared";

export type Employee = { id: string; name: string; role: string; point: string; hue: number; tradePointId?: string | null };
export type Product = { id: string; name: string; category: Category; unit: string; cost: number };

/* Rich presentation block produced by the backend serializer
   (server/src/serializer.ts buildRequestUi). Lets the manager view show the
   full lifecycle (missing_info/syncing/synced/failed) and the right actions. */
export type WriteOffUi = {
  statusLabel: string;
  statusTone: "neutral" | "warning" | "success" | "danger" | "info";
  costLabel: string;
  missingFieldLabels: string[];
  sync: { status: string; label: string; tone: string; documentId?: string | null };
  actions: {
    canEdit: boolean;
    canAttachPhoto: boolean;
    canSubmit: boolean;
    canApprove: boolean;
    canReject: boolean;
    canRetryIikoSync: boolean;
  };
  primaryAction: string | null;
};

export type WriteOff = {
  id: string;
  doc: string;
  product: string;
  category: Category;
  qty: string;
  point: string;
  reason: string;
  deduction: "without" | "with";
  comment: string;
  employeeId: string;
  createdAt: number;
  status: Status;
  sync: Sync;
  loss: number;
  reviewerNote?: string;
  photo?: string;
  transcript?: string;
  /** Raw backend status (8-state lifecycle) for fidelity beyond the coarse `status`. */
  backendStatus: string;
  /** Backend-computed labels/actions; absent on optimistic local rows. */
  ui?: WriteOffUi;
};

export type Draft = {
  product: string;
  category: Category;
  qty: string;
  point: string;
  reason: string;
  deduction: "without" | "with";
  comment: string;
  loss: number;
  photo?: string;
  transcript?: string;
};

const DEFAULT_EMPLOYEES: Employee[] = [
  { id: "e1", name: "Aigerim Yusupova", role: "Shift lead", point: "Aktau Mall", hue: 348 },
  { id: "e2", name: "Daniyar Sembin", role: "Line cook", point: "Dostyk Plaza", hue: 18 },
  { id: "e3", name: "Madina Karimova", role: "Barista", point: "Aktau Mall", hue: 286 },
  { id: "e4", name: "Ruslan Beketov", role: "Stock keeper", point: "Mega Silk Way", hue: 200 },
  { id: "e5", name: "Aliya Tursyn", role: "Pastry chef", point: "Dostyk Plaza", hue: 150 },
  { id: "e6", name: "Timur Aldiyar", role: "Line cook", point: "Esentai Gourmet", hue: 42 },
];

export let EMPLOYEES: Employee[] = DEFAULT_EMPLOYEES;

/* Default catalog (fallback before bootstrap loads the real one from the API). */
export const PRODUCTS: Product[] = [
  { id: "p-beef-cutlets", name: "Beef cutlets", category: "Meat", unit: "pcs", cost: 710 },
  { id: "p-chicken-fillet", name: "Chicken fillet", category: "Meat", unit: "kg", cost: 2200 },
  { id: "p-mozzarella", name: "Mozzarella", category: "Dairy", unit: "kg", cost: 4480 },
  { id: "p-cream", name: "Heavy cream", category: "Dairy", unit: "L", cost: 1650 },
  { id: "p-croissants", name: "Croissants", category: "Bakery", unit: "pcs", cost: 315 },
  { id: "p-sourdough", name: "Sourdough loaf", category: "Bakery", unit: "pcs", cost: 980 },
  { id: "p-tomatoes", name: "Cherry tomatoes", category: "Produce", unit: "kg", cost: 1280 },
  { id: "p-avocado", name: "Avocado", category: "Produce", unit: "pcs", cost: 690 },
  { id: "p-salmon", name: "Salmon fillet", category: "Seafood", unit: "kg", cost: 9550 },
  { id: "p-caesar", name: "Caesar bowls", category: "Prepared", unit: "pcs", cost: 1740 },
];

function hueFromId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return h;
}

type BackendUser = { id: string; name: string; role: string; tradePointId?: string | null };
type BackendTradePoint = { id: string; name: string };

function toEmployee(user: BackendUser, tradePoints: BackendTradePoint[]): Employee {
  const point = tradePoints.find((t) => t.id === user.tradePointId)?.name ?? "—";
  return { id: user.id, name: user.name, role: user.role, point, hue: hueFromId(user.id), tradePointId: user.tradePointId ?? null };
}

const toFrontRole = (backendRole: string): Role => (backendRole === "employee" ? "employee" : "manager");

export type TradePoint = { id: string; name: string };

function toProduct(p: { id: string; name: string; category: string; unit: string; costPrice: number }): Product {
  const category = (["Meat", "Dairy", "Bakery", "Produce", "Seafood", "Prepared"].includes(p.category)
    ? p.category
    : "Prepared") as Category;
  return { id: p.id, name: p.name, category, unit: p.unit, cost: p.costPrice };
}

function missingFieldLabel(field: string) {
  const map: Record<string, string> = {
    tradePointId: "trade point",
    productId: "product",
    productNameFallback: "product name",
    quantity: "quantity",
    reason: "reason",
    deductionType: "deduction type",
    deductionEmployeeId: "employee for deduction",
    comment: "comment",
    photoUrl: "proof photo",
  };
  return map[field] ?? field;
}

function applyBootstrap(
  user: BackendUser,
  boot: {
    users: BackendUser[];
    tradePoints: BackendTradePoint[];
    products: Array<{ id: string; name: string; category: string; unit: string; costPrice: number }>;
  },
  setters: {
    setEmployees: (value: Employee[]) => void;
    setProducts: (value: Product[]) => void;
    setTradePoints: (value: TradePoint[]) => void;
    setMe: (value: Employee) => void;
  },
) {
  const emps = boot.users.map((u) => toEmployee(u, boot.tradePoints));
  EMPLOYEES = emps;
  setters.setEmployees(emps);
  setters.setProducts(boot.products.map(toProduct));
  setters.setTradePoints(boot.tradePoints);
  setters.setMe(emps.find((e) => e.id === user.id) ?? toEmployee(user, boot.tradePoints));
  return toFrontRole(user.role);
}

type Store = {
  me: Employee;
  loading: boolean;
  requests: WriteOff[];
  employees: Employee[];
  products: Product[];
  tradePoints: TradePoint[];
  authReady: boolean;
  login: (email: string, password: string) => Promise<Role>;
  register: (input: { name: string; email: string; password: string; role: Role }) => Promise<Role>;
  updateMe: (input: { name?: string; tradePointId?: string | null }) => Promise<void>;
  restoreSession: () => Promise<Role | null>;
  logout: () => void;
  transcribe: (audio: Blob) => Promise<{ transcript: string; provider: string }>;
  extract: (transcript: string) => Promise<Extraction>;
  submitWriteOff: (input: { fields: CreateFields; photoFile?: File | null }) => Promise<WriteOff>;
  approve: (id: string) => void;
  reject: (id: string, note: string) => void;
  retrySync: (id: string) => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<WriteOff[]>([]);
  const [employees, setEmployees] = useState<Employee[]>(DEFAULT_EMPLOYEES);
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [tradePoints, setTradePoints] = useState<TradePoint[]>([]);
  const [me, setMe] = useState<Employee | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(!api.hasToken());

  const refresh = useCallback(async (forRole?: Role) => {
    const r = forRole ?? role;
    if (!r) return;
    setRequests(await api.listWriteOffs(r));
  }, [role]);

  const login = useCallback(async (email: string, password: string): Promise<Role> => {
    setLoading(true);
    try {
      const user = await api.login(email, password);
      const boot = await api.bootstrap();
      const frontRole = applyBootstrap(user, boot, { setEmployees, setProducts, setTradePoints, setMe });
      setRole(frontRole);
      await refresh(frontRole);
      return frontRole;
    } finally {
      setLoading(false);
      setAuthReady(true);
    }
  }, [refresh]);

  const register = useCallback(async (input: { name: string; email: string; password: string; role: Role }): Promise<Role> => {
    setLoading(true);
    try {
      const user = await api.register({
        name: input.name,
        email: input.email,
        password: input.password,
        role: input.role === "manager" ? "reviewer" : "employee",
      });
      const boot = await api.bootstrap();
      const frontRole = applyBootstrap(user, boot, { setEmployees, setProducts, setTradePoints, setMe });
      setRole(frontRole);
      await refresh(frontRole);
      return frontRole;
    } finally {
      setLoading(false);
      setAuthReady(true);
    }
  }, [refresh]);

  const updateMe = useCallback(async (input: { name?: string; tradePointId?: string | null }): Promise<void> => {
    const updated = await api.updateMe(input);
    setMe(toEmployee(updated, tradePoints));
  }, [tradePoints]);

  const restoreSession = useCallback(async (): Promise<Role | null> => {
    if (!api.hasToken()) {
      setAuthReady(true);
      return null;
    }
    setLoading(true);
    try {
      const user = await api.me();
      const boot = await api.bootstrap();
      const frontRole = applyBootstrap(user, boot, { setEmployees, setProducts, setTradePoints, setMe });
      setRole(frontRole);
      await refresh(frontRole);
      return frontRole;
    } catch {
      api.logout();
      setMe(null);
      setRole(null);
      setRequests([]);
      return null;
    } finally {
      setLoading(false);
      setAuthReady(true);
    }
  }, [refresh]);

  const logout = useCallback(() => {
    api.logout();
    setMe(null);
    setRole(null);
    setRequests([]);
  }, []);

  const transcribe = useCallback((audio: Blob) => api.transcribe(audio), []);
  const extract = useCallback((transcript: string) => api.extract(transcript), []);

  // Full lifecycle: create -> (photo upload) -> submit -> refresh.
  const submitWriteOff = useCallback(
    async ({ fields, photoFile }: { fields: CreateFields; photoFile?: File | null }): Promise<WriteOff> => {
      const payload: CreateFields = { ...fields };
      if (payload.deductionType === "with_deduction" && !payload.deductionEmployeeId && me) {
        payload.deductionEmployeeId = me.id;
      }
      let result = await api.createWriteOff(payload);
      if (photoFile) result = await api.uploadPhoto(result.id, photoFile);
      try {
        result = await api.submit(result.id);
      } catch (error) {
        await refresh();
        if (error instanceof ApiError && error.status === 422) {
          const detailFields = (error.details as { missingFields?: string[] } | undefined)?.missingFields ?? [];
          const labels = detailFields.length ? detailFields.map(missingFieldLabel) : (result.ui?.missingFieldLabels ?? []);
          throw new Error(`Please add missing details: ${labels.length ? labels.join(", ") : "required fields"}.`);
        }
        throw error;
      }
      await refresh();
      return result;
    },
    [me, refresh],
  );

  const approve = useCallback((id: string) => {
    setRequests((r) => r.map((w) => (w.id === id ? { ...w, status: "approved", sync: "syncing" } : w)));
    void api.approve(id).finally(() => refresh());
  }, [refresh]);

  const reject = useCallback((id: string, note: string) => {
    setRequests((r) => r.map((w) => (w.id === id ? { ...w, status: "rejected", reviewerNote: note } : w)));
    void api.reject(id, note).finally(() => refresh());
  }, [refresh]);

  const retrySync = useCallback((id: string) => {
    setRequests((r) => r.map((w) => (w.id === id ? { ...w, sync: "syncing" } : w)));
    void api.retrySync(id).finally(() => refresh());
  }, [refresh]);

  const value = useMemo<Store>(
    () => ({ me: me ?? DEFAULT_EMPLOYEES[0], loading, requests, employees, products, tradePoints, authReady, login, register, updateMe, restoreSession, logout, transcribe, extract, submitWriteOff, approve, reject, retrySync }),
    [me, loading, requests, employees, products, tradePoints, authReady, login, register, updateMe, restoreSession, logout, transcribe, extract, submitWriteOff, approve, reject, retrySync]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore outside provider");
  return c;
}

export const tenge = (n: number) => `${Math.round(n).toLocaleString("ru-RU")} ₸`;
export const tengeShort = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K ₸` : `${Math.round(n)} ₸`);

export const timeAgo = (ts: number) => {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return T("justNow");
  if (m < 60) return `${m} ${T("minAgo")}`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ${T("hAgo")}`;
  return `${Math.floor(h / 24)} ${T("dAgo")}`;
};

export const empById = (id: string) => EMPLOYEES.find((e) => e.id === id) ?? EMPLOYEES[0];

export function useAnalytics() {
  const { requests } = useStore();
  return useMemo(() => {
    const D = 86400_000;
    const now = Date.now();
    const pending = requests.filter((r) => r.status === "pending");
    const approved = requests.filter((r) => r.status === "approved");
    const rejected = requests.filter((r) => r.status === "rejected");
    const weekLoss = requests.filter((r) => r.status !== "rejected").reduce((s, r) => s + r.loss, 0);
    const pendingLoss = pending.reduce((s, r) => s + r.loss, 0);
    const syncIssues = requests.filter((r) => r.sync === "failed").length;
    const decided = approved.length + rejected.length;
    const approvalRate = decided ? Math.round((approved.length / decided) * 100) : 0;

    const days = Array.from({ length: 7 }).map((_, i) => {
      const dayStart = now - (6 - i) * D;
      const label = new Date(dayStart).toLocaleDateString("en-US", { weekday: "short" });
      const loss = requests
        .filter((r) => r.status !== "rejected" && r.createdAt >= dayStart && r.createdAt < dayStart + D)
        .reduce((s, r) => s + r.loss, 0);
      return { label, loss };
    });

    const byCategory = (["Meat", "Dairy", "Bakery", "Produce", "Seafood", "Prepared"] as Category[])
      .map((cat) => ({ cat, loss: requests.filter((r) => r.category === cat && r.status !== "rejected").reduce((s, r) => s + r.loss, 0) }))
      .filter((x) => x.loss > 0)
      .sort((a, b) => b.loss - a.loss);

    // Derive trade points from the real requests, not a hardcoded list, so the
    // breakdown matches whatever points the backend actually returns.
    const pointNames = Array.from(new Set(requests.map((r) => r.point).filter((p) => p && p !== "—")));
    const byPoint = pointNames.map((p) => ({
      point: p,
      loss: requests.filter((r) => r.point === p && r.status !== "rejected").reduce((s, r) => s + r.loss, 0),
      count: requests.filter((r) => r.point === p).length,
    }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.loss - a.loss);

    return { pending, approved, rejected, weekLoss, pendingLoss, syncIssues, approvalRate, days, byCategory, byPoint, total: requests.length };
  }, [requests]);
}

export const CATEGORY_COLOR: Record<Category, string> = {
  Meat: "#f2555f",
  Dairy: "#f6b95e",
  Bakery: "#d98c5f",
  Produce: "#68c7a2",
  Seafood: "#5fa8d9",
  Prepared: "#b86fd9",
};
