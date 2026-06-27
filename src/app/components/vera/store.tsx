import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from "react";
import { api } from "./api";

/* ================================================================== */
/* VERA data layer.                                                    */
/* No seeded transactional data — the queue starts empty and fills as  */
/* employees submit write-offs. Persistence + backend live in api.ts.  */
/* ================================================================== */

export type Role = "employee" | "manager";
export type Status = "pending" | "approved" | "rejected";
export type Sync = "idle" | "syncing" | "synced" | "failed";
export type Category = "Meat" | "Dairy" | "Bakery" | "Produce" | "Seafood" | "Prepared";

export type Employee = { id: string; name: string; role: string; point: string; hue: number };
export type Product = { name: string; category: Category; unit: string; cost: number };

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

/* Reference catalog. In production these come from the backend
   (api.listEmployees / api.listProducts); kept here as defaults. */
export const POINTS = ["Aktau Mall", "Dostyk Plaza", "Mega Silk Way", "Esentai Gourmet"];

const DEFAULT_EMPLOYEES: Employee[] = [
  { id: "e1", name: "Aigerim Yusupova", role: "Shift lead", point: "Aktau Mall", hue: 348 },
  { id: "e2", name: "Daniyar Sembin", role: "Line cook", point: "Dostyk Plaza", hue: 18 },
  { id: "e3", name: "Madina Karimova", role: "Barista", point: "Aktau Mall", hue: 286 },
  { id: "e4", name: "Ruslan Beketov", role: "Stock keeper", point: "Mega Silk Way", hue: 200 },
  { id: "e5", name: "Aliya Tursyn", role: "Pastry chef", point: "Dostyk Plaza", hue: 150 },
  { id: "e6", name: "Timur Aldiyar", role: "Line cook", point: "Esentai Gourmet", hue: 42 },
];

export let EMPLOYEES: Employee[] = DEFAULT_EMPLOYEES;

export const PRODUCTS: Product[] = [
  { name: "Beef cutlets", category: "Meat", unit: "pcs", cost: 710 },
  { name: "Chicken fillet", category: "Meat", unit: "kg", cost: 2200 },
  { name: "Mozzarella", category: "Dairy", unit: "kg", cost: 4480 },
  { name: "Heavy cream", category: "Dairy", unit: "L", cost: 1650 },
  { name: "Croissants", category: "Bakery", unit: "pcs", cost: 315 },
  { name: "Sourdough loaf", category: "Bakery", unit: "pcs", cost: 980 },
  { name: "Cherry tomatoes", category: "Produce", unit: "kg", cost: 1280 },
  { name: "Avocado", category: "Produce", unit: "pcs", cost: 690 },
  { name: "Salmon fillet", category: "Seafood", unit: "kg", cost: 9550 },
  { name: "Caesar bowls", category: "Prepared", unit: "pcs", cost: 1740 },
];

let docSeq = Date.now() % 100000;
const nextDoc = () => `WO-${docSeq++}`;

type Store = {
  me: Employee;
  loading: boolean;
  requests: WriteOff[];
  employees: Employee[];
  submit: (d: Draft) => void;
  approve: (id: string) => void;
  reject: (id: string, note: string) => void;
  retrySync: (id: string) => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<WriteOff[]>([]);
  const [employees, setEmployees] = useState<Employee[]>(DEFAULT_EMPLOYEES);
  const [loading, setLoading] = useState(true);

  // initial load (localStorage now, REST when VITE_VERA_API_URL is set)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [rows, emps] = await Promise.all([
          api.listWriteOffs(),
          api.listEmployees(DEFAULT_EMPLOYEES),
        ]);
        if (!alive) return;
        EMPLOYEES = emps;
        setEmployees(emps);
        setRequests(rows);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const submit = useCallback((d: Draft) => {
    const wo: WriteOff = {
      ...d,
      id: crypto.randomUUID(),
      doc: nextDoc(),
      employeeId: "e1",
      createdAt: Date.now(),
      status: "pending",
      sync: "idle",
    };
    setRequests((r) => [wo, ...r]);
    void api.createWriteOff(wo);
  }, []);

  const approve = useCallback((id: string) => {
    setRequests((r) => r.map((w) => (w.id === id ? { ...w, status: "approved", sync: "syncing" } : w)));
    void api.updateWriteOff(id, { status: "approved", sync: "syncing" });
    void api.requestSync(id).then((sync) => {
      setRequests((r) => r.map((w) => (w.id === id ? { ...w, sync } : w)));
      void api.updateWriteOff(id, { sync });
    });
  }, []);

  const reject = useCallback((id: string, note: string) => {
    setRequests((r) => r.map((w) => (w.id === id ? { ...w, status: "rejected", reviewerNote: note } : w)));
    void api.updateWriteOff(id, { status: "rejected", reviewerNote: note });
  }, []);

  const retrySync = useCallback((id: string) => {
    setRequests((r) => r.map((w) => (w.id === id ? { ...w, sync: "syncing" } : w)));
    void api.updateWriteOff(id, { sync: "syncing" });
    void api.requestSync(id).then((sync) => {
      setRequests((r) => r.map((w) => (w.id === id ? { ...w, sync } : w)));
      void api.updateWriteOff(id, { sync });
    });
  }, []);

  const value = useMemo<Store>(
    () => ({ me: employees[0], loading, requests, employees, submit, approve, reject, retrySync }),
    [employees, loading, requests, submit, approve, reject, retrySync]
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
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.floor(h / 24)} d ago`;
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

    const byPoint = POINTS.map((p) => ({
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
