import type { WriteOff, Draft, Employee, Product } from "./store";

/* ================================================================== */
/* VERA backend bridge.                                                */
/*                                                                    */
/* HOW TO CONNECT A REAL BACKEND:                                      */
/*   1. Set VITE_VERA_API_URL in your env (e.g. https://api.vera.app). */
/*   2. Implement these REST endpoints on your server:                 */
/*        GET    /write-offs            -> WriteOff[]                   */
/*        POST   /write-offs            <- WriteOff   (created row)     */
/*        PATCH  /write-offs/:id        <- Partial<WriteOff>           */
/*        GET    /employees             -> Employee[]                   */
/*        GET    /products              -> Product[]                    */
/*        POST   /write-offs/:id/sync   -> { sync: "synced"|"failed" }  */
/*   3. That's it — no UI changes needed.                              */
/*                                                                    */
/* With no API URL set, everything is persisted to localStorage so the */
/* app is fully usable offline and survives reloads.                   */
/* ================================================================== */

const BASE: string = ((import.meta as any).env?.VITE_VERA_API_URL ?? "").replace(/\/$/, "");
const LS_KEY = "vera.writeoffs.v1";

export const isRemote = () => BASE.length > 0;

function readLS(): WriteOff[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}
function writeLS(rows: WriteOff[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(rows));
  } catch {
    /* storage unavailable — stay in-memory for the session */
  }
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`VERA API ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  async listWriteOffs(): Promise<WriteOff[]> {
    if (isRemote()) return json<WriteOff[]>(await fetch(`${BASE}/write-offs`));
    return readLS();
  },

  async createWriteOff(row: WriteOff): Promise<WriteOff> {
    if (isRemote()) {
      return json<WriteOff>(
        await fetch(`${BASE}/write-offs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(row),
        })
      );
    }
    writeLS([row, ...readLS()]);
    return row;
  },

  async updateWriteOff(id: string, patch: Partial<WriteOff>): Promise<void> {
    if (isRemote()) {
      await fetch(`${BASE}/write-offs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      return;
    }
    writeLS(readLS().map((w) => (w.id === id ? { ...w, ...patch } : w)));
  },

  /* Catalog (reference data). Override on the server when ready. */
  async listEmployees(fallback: Employee[]): Promise<Employee[]> {
    if (isRemote()) return json<Employee[]>(await fetch(`${BASE}/employees`));
    return fallback;
  },
  async listProducts(fallback: Product[]): Promise<Product[]> {
    if (isRemote()) return json<Product[]>(await fetch(`${BASE}/products`));
    return fallback;
  },

  /* Iiko sync — server decides the outcome in production. */
  async requestSync(id: string): Promise<"synced" | "failed"> {
    if (isRemote()) {
      const r = await json<{ sync: "synced" | "failed" }>(
        await fetch(`${BASE}/write-offs/${id}/sync`, { method: "POST" })
      );
      return r.sync;
    }
    // local simulation
    await new Promise((res) => setTimeout(res, 2200));
    return Math.random() > 0.85 ? "failed" : "synced";
  },
};

export type { WriteOff, Draft };
