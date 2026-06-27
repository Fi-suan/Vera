import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

/* ================================================================== */
/* VERA data layer — a believable operating system, not a demo card.   */
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

export const POINTS = ["Aktau Mall", "Dostyk Plaza", "Mega Silk Way", "Esentai Gourmet"];

export const EMPLOYEES: Employee[] = [
  { id: "e1", name: "Aigerim Yusupova", role: "Shift lead", point: "Aktau Mall", hue: 348 },
  { id: "e2", name: "Daniyar Sembin", role: "Line cook", point: "Dostyk Plaza", hue: 18 },
  { id: "e3", name: "Madina Karimova", role: "Barista", point: "Aktau Mall", hue: 286 },
  { id: "e4", name: "Ruslan Beketov", role: "Stock keeper", point: "Mega Silk Way", hue: 200 },
  { id: "e5", name: "Aliya Tursyn", role: "Pastry chef", point: "Dostyk Plaza", hue: 150 },
  { id: "e6", name: "Timur Aldiyar", role: "Line cook", point: "Esentai Gourmet", hue: 42 },
];

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

const H = 3600_000;
const D = 24 * H;
const now = Date.now();

const PHOTO = (id: string) =>
  ({
    a: "https://images.unsplash.com/photo-1466637574441-749b8f19452f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900",
    b: "https://images.unsplash.com/photo-1591189863430-ab87e120f312?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900",
    c: "https://images.unsplash.com/photo-1503810473512-f64b56827964?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900",
  }[id]);

let docSeq = 20480;
const nextDoc = () => `WO-${docSeq++}`;

const seed: WriteOff[] = [
  { id: "s1", doc: nextDoc(), product: "Beef cutlets", category: "Meat", qty: "3 pcs", point: "Aktau Mall", reason: "Fell on the floor during order assembly", deduction: "without", comment: "3 beef cutlets fell on the floor during order assembly and cannot be reused per sanitary rules.", employeeId: "e1", createdAt: now - 0.6 * H, status: "pending", sync: "idle", loss: 2130, photo: PHOTO("a"), transcript: "Write off 3 cutlets, they fell on the floor during assembly, Aktau Mall, without deduction." },
  { id: "s2", doc: nextDoc(), product: "Mozzarella", category: "Dairy", qty: "1.2 kg", point: "Dostyk Plaza", reason: "Expired shelf life found at morning check", deduction: "with", comment: "1.2 kg mozzarella past shelf life, removed during the morning stock check.", employeeId: "e2", createdAt: now - 1.4 * H, status: "pending", sync: "idle", loss: 5376, photo: PHOTO("b") },
  { id: "s3", doc: nextDoc(), product: "Salmon fillet", category: "Seafood", qty: "0.8 kg", point: "Dostyk Plaza", reason: "Cold chain broken overnight (fridge fault)", deduction: "with", comment: "0.8 kg salmon fillet lost cold chain after an overnight fridge fault.", employeeId: "e5", createdAt: now - 3 * H, status: "pending", sync: "idle", loss: 7640, photo: PHOTO("c") },
  { id: "s4", doc: nextDoc(), product: "Croissants", category: "Bakery", qty: "6 pcs", point: "Aktau Mall", reason: "Over-baked and burned in the oven", deduction: "without", comment: "6 croissants over-baked and burned, not suitable for sale.", employeeId: "e3", createdAt: now - 5 * H, status: "approved", sync: "synced", loss: 1890 },
  { id: "s5", doc: nextDoc(), product: "Cherry tomatoes", category: "Produce", qty: "4 kg", point: "Mega Silk Way", reason: "Crushed and spoiled on delivery", deduction: "without", comment: "4 kg cherry tomatoes crushed and spoiled on arrival from the supplier.", employeeId: "e4", createdAt: now - 1 * D, status: "rejected", sync: "idle", loss: 5120, reviewerNote: "Photo unclear: please retake with the damage clearly visible." },
  { id: "s6", doc: nextDoc(), product: "Chicken fillet", category: "Meat", qty: "2.5 kg", point: "Esentai Gourmet", reason: "Thawed beyond safe window", deduction: "without", comment: "2.5 kg chicken fillet thawed past the safe window during a busy lunch.", employeeId: "e6", createdAt: now - 1.2 * D, status: "approved", sync: "synced", loss: 5500 },
  { id: "s7", doc: nextDoc(), product: "Caesar bowls", category: "Prepared", qty: "5 pcs", point: "Aktau Mall", reason: "Prepared in excess, end of day", deduction: "with", comment: "5 Caesar bowls prepared in excess and unsold at end of day.", employeeId: "e1", createdAt: now - 2 * D, status: "approved", sync: "failed", loss: 8700 },
  { id: "s8", doc: nextDoc(), product: "Heavy cream", category: "Dairy", qty: "3 L", point: "Dostyk Plaza", reason: "Curdled, temperature excursion", deduction: "without", comment: "3 L heavy cream curdled after a temperature excursion overnight.", employeeId: "e2", createdAt: now - 2.4 * D, status: "approved", sync: "synced", loss: 4950 },
  { id: "s9", doc: nextDoc(), product: "Avocado", category: "Produce", qty: "8 pcs", point: "Mega Silk Way", reason: "Overripe, unusable", deduction: "without", comment: "8 avocados overripe and unusable for service.", employeeId: "e4", createdAt: now - 3 * D, status: "approved", sync: "synced", loss: 5520 },
  { id: "s10", doc: nextDoc(), product: "Sourdough loaf", category: "Bakery", qty: "4 pcs", point: "Esentai Gourmet", reason: "Stale, past sell-by", deduction: "without", comment: "4 sourdough loaves stale and past sell-by.", employeeId: "e6", createdAt: now - 4 * D, status: "approved", sync: "synced", loss: 3920 },
  { id: "s11", doc: nextDoc(), product: "Beef cutlets", category: "Meat", qty: "5 pcs", point: "Aktau Mall", reason: "Dropped tray during plating", deduction: "with", comment: "5 beef cutlets lost when a tray was dropped during plating.", employeeId: "e3", createdAt: now - 5 * D, status: "approved", sync: "synced", loss: 3550 },
  { id: "s12", doc: nextDoc(), product: "Salmon fillet", category: "Seafood", qty: "0.5 kg", point: "Dostyk Plaza", reason: "Off smell at prep", deduction: "without", comment: "0.5 kg salmon developed an off smell at prep and was discarded.", employeeId: "e5", createdAt: now - 6 * D, status: "approved", sync: "synced", loss: 4775 },
];

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

type Store = {
  me: Employee;
  requests: WriteOff[];
  employees: Employee[];
  submit: (d: Draft) => void;
  approve: (id: string) => void;
  reject: (id: string, note: string) => void;
  retrySync: (id: string) => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<WriteOff[]>(seed);

  const submit = useCallback((d: Draft) => {
    const wo: WriteOff = { ...d, id: crypto.randomUUID(), doc: nextDoc(), employeeId: "e1", createdAt: Date.now(), status: "pending", sync: "idle" };
    setRequests((r) => [wo, ...r]);
  }, []);

  const approve = useCallback((id: string) => {
    setRequests((r) => r.map((w) => (w.id === id ? { ...w, status: "approved", sync: "syncing" } : w)));
    window.setTimeout(() => setRequests((r) => r.map((w) => (w.id === id ? { ...w, sync: Math.random() > 0.85 ? "failed" : "synced" } : w))), 2600);
  }, []);

  const reject = useCallback((id: string, note: string) => {
    setRequests((r) => r.map((w) => (w.id === id ? { ...w, status: "rejected", reviewerNote: note } : w)));
  }, []);

  const retrySync = useCallback((id: string) => {
    setRequests((r) => r.map((w) => (w.id === id ? { ...w, sync: "syncing" } : w)));
    window.setTimeout(() => setRequests((r) => r.map((w) => (w.id === id ? { ...w, sync: "synced" } : w))), 2200);
  }, []);

  const value = useMemo<Store>(
    () => ({ me: EMPLOYEES[0], requests, employees: EMPLOYEES, submit, approve, reject, retrySync }),
    [requests, submit, approve, reject, retrySync]
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

export const empById = (id: string) => EMPLOYEES.find((e) => e.id === id)!;

export function useAnalytics() {
  const { requests } = useStore();
  return useMemo(() => {
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
      const loss = requests.filter((r) => r.status !== "rejected" && r.createdAt >= dayStart && r.createdAt < dayStart + D).reduce((s, r) => s + r.loss, 0);
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
    })).sort((a, b) => b.loss - a.loss);
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
