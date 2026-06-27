import type { WriteOff, Draft, Employee, Product, Category, Role, WriteOffUi } from "./store";

/* ================================================================== */
/* VERA backend client.                                                */
/*                                                                    */
/* Talks to the real VERA API (Express + Prisma) described in          */
/* server/src/openapi.ts. Auth is JWT bearer; the token is obtained    */
/* via login() and kept in localStorage so reloads stay signed in.     */
/*                                                                    */
/* Base URL:                                                           */
/*   - Set VITE_VERA_API_URL when the API is on another origin         */
/*     (e.g. dev: http://localhost:4000).                              */
/*   - Left empty in production, where Express serves this built app   */
/*     from the same origin, so "/api/..." resolves directly.          */
/* ================================================================== */

const RAW_BASE = ((import.meta as any).env?.VITE_VERA_API_URL ?? "").replace(/\/$/, "");
const API = `${RAW_BASE}/api`;

const TOKEN_KEY = "vera.token";

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

let token: string | null = (() => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
})();

function setToken(next: string | null) {
  token = next;
  try {
    if (next) localStorage.setItem(TOKEN_KEY, next);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable — keep the token in memory for this session */
  }
}

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { ...((init.headers as Record<string, string>) ?? {}) };
  // JSON bodies get a content-type; FormData (multipart) must keep the
  // browser-generated boundary, so we only set it for string bodies.
  if (typeof init.body === "string" && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...init, headers });
  if (!res.ok) {
    let message = `VERA API ${res.status}`;
    let details: unknown;
    try {
      const body = await res.json();
      message = body?.message || message;
      details = body?.details;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, message, details);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/* ---- Backend shapes (subset we consume) ------------------------- */

export type BackendUser = {
  id: string;
  name: string;
  email?: string | null;
  role: string;
  tradePointId?: string | null;
};
type BackendTradePoint = { id: string; name: string };
type BackendProduct = { id: string; name: string; category: string; unit: string; costPrice: number };
type BackendRequest = {
  id: string;
  doc: string;
  status: string;
  productNameFallback?: string | null;
  quantity?: number | null;
  unit?: string | null;
  reason?: string | null;
  deductionType?: string | null;
  comment?: string | null;
  photoUrl?: string | null;
  voiceTranscript?: string | null;
  createdByUserId: string;
  rejectionReason?: string | null;
  iikoSyncStatus: string;
  costEstimate: number;
  createdAt: string;
  product?: BackendProduct | null;
  tradePoint?: BackendTradePoint | null;
  ui?: WriteOffUi;
};

export type Bootstrap = {
  users: BackendUser[];
  tradePoints: BackendTradePoint[];
  products: BackendProduct[];
};

/* Structured fields returned by POST /api/write-offs/extract
   (server/src/extraction.ts). */
export type Extraction = {
  productId: string | null;
  productName: string | null;
  quantity: number | null;
  unit: string | null;
  tradePointId: string | null;
  tradePointName: string | null;
  reason: string | null;
  deductionType: "with_deduction" | "without_deduction" | null;
  deductionEmployeeId: string | null;
  deductionEmployeeName: string | null;
  comment: string | null;
  aiGeneratedComment: string | null;
  missingFields: string[];
  confidenceScore: number;
  provider: string;
};

/* Payload accepted by POST /api/write-offs (createWriteOffSchema). */
export type CreateFields = {
  tradePointId?: string | null;
  productId?: string | null;
  productName?: string | null;
  quantity?: number | null;
  unit?: string | null;
  reason?: string | null;
  deductionType?: "with_deduction" | "without_deduction" | null;
  deductionEmployeeId?: string | null;
  comment?: string | null;
  voiceTranscript?: string | null;
  aiGeneratedComment?: string | null;
  aiConfidenceScore?: number | null;
};

/* Catalog cache, filled by bootstrap(); used to resolve names -> ids
   when an employee submits a draft. */
let catalog: { products: BackendProduct[]; tradePoints: BackendTradePoint[] } = {
  products: [],
  tradePoints: [],
};

/* ---- Mapping: backend <-> frontend ------------------------------ */

const CATEGORIES: Category[] = ["Meat", "Dairy", "Bakery", "Produce", "Seafood", "Prepared"];
const toCategory = (value?: string | null): Category =>
  CATEGORIES.includes(value as Category) ? (value as Category) : "Prepared";

function statusToFront(status: string): WriteOff["status"] {
  if (status === "rejected") return "rejected";
  if (["approved", "syncing_to_iiko", "synced_to_iiko", "iiko_sync_failed"].includes(status)) return "approved";
  return "pending";
}

function syncToFront(status: string): WriteOff["sync"] {
  return (["idle", "syncing", "synced", "failed"].includes(status) ? status : "idle") as WriteOff["sync"];
}

function toWriteOff(r: BackendRequest): WriteOff {
  return {
    id: r.id,
    doc: r.doc,
    product: r.product?.name ?? r.productNameFallback ?? "—",
    category: toCategory(r.product?.category),
    qty: r.quantity != null ? `${r.quantity}${r.unit ? ` ${r.unit}` : ""}` : "—",
    point: r.tradePoint?.name ?? "—",
    reason: r.reason ?? "",
    deduction: r.deductionType === "with_deduction" ? "with" : "without",
    comment: r.comment ?? "",
    employeeId: r.createdByUserId,
    createdAt: new Date(r.createdAt).getTime(),
    status: statusToFront(r.status),
    sync: syncToFront(r.iikoSyncStatus),
    loss: r.costEstimate ?? 0,
    reviewerNote: r.rejectionReason ?? undefined,
    photo: r.photoUrl ?? undefined,
    transcript: r.voiceTranscript ?? undefined,
    backendStatus: r.status,
    ui: r.ui,
  };
}

/* ---- Public client ---------------------------------------------- */

export const api = {
  hasToken: () => Boolean(token),

  async login(email: string, password: string): Promise<BackendUser> {
    const data = await req<{ user: BackendUser; accessToken: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(data.accessToken);
    return data.user;
  },

  async me(): Promise<BackendUser> {
    const data = await req<{ user: BackendUser }>("/auth/me");
    return data.user;
  },

  logout() {
    setToken(null);
  },

  async bootstrap(): Promise<Bootstrap> {
    const data = await req<Bootstrap>("/bootstrap");
    catalog = { products: data.products, tradePoints: data.tradePoints };
    return data;
  },

  /** Catalog cached by the last bootstrap() (products + trade points). */
  getCatalog() {
    return catalog;
  },

  async listWriteOffs(role: Role): Promise<WriteOff[]> {
    const path = role === "manager" ? "/reviewer/write-offs" : "/me/write-offs";
    const data = await req<{ items: BackendRequest[] }>(path);
    return data.items.map(toWriteOff);
  },

  /** Send recorded audio to Gemini (or mock) for transcription. */
  async transcribe(audio: Blob): Promise<{ transcript: string; provider: string }> {
    const form = new FormData();
    form.append("audio", audio, "recording.webm");
    return req<{ transcript: string; provider: string }>("/write-offs/transcribe", {
      method: "POST",
      body: form,
    });
  },

  /** Structure a transcript into write-off fields (catalog-reconciled). */
  async extract(transcript: string): Promise<Extraction> {
    return req<Extraction>("/write-offs/extract", {
      method: "POST",
      body: JSON.stringify({ transcript }),
    });
  },

  /** Create a write-off from structured fields. Returns the created row. */
  async createWriteOff(fields: CreateFields): Promise<WriteOff> {
    const created = await req<BackendRequest>("/write-offs", {
      method: "POST",
      body: JSON.stringify(fields),
    });
    return toWriteOff(created);
  },

  /** Attach a real proof photo (multipart) to a draft/missing_info write-off. */
  async uploadPhoto(id: string, file: Blob): Promise<WriteOff> {
    const form = new FormData();
    form.append("photo", file, "proof.jpg");
    const updated = await req<BackendRequest>(`/write-offs/${id}/photo`, {
      method: "POST",
      body: form,
    });
    return toWriteOff(updated);
  },

  /** Submit a draft/missing_info write-off for review. */
  async submit(id: string): Promise<WriteOff> {
    const updated = await req<BackendRequest>(`/write-offs/${id}/submit`, {
      method: "POST",
      body: "{}",
    });
    return toWriteOff(updated);
  },

  async approve(id: string): Promise<void> {
    await req(`/write-offs/${id}/approve`, { method: "POST", body: "{}" });
  },

  async reject(id: string, reason: string): Promise<void> {
    await req(`/write-offs/${id}/reject`, { method: "POST", body: JSON.stringify({ reason }) });
  },

  async retrySync(id: string): Promise<void> {
    await req(`/iiko/retry/${id}`, { method: "POST", body: "{}" });
  },
};

export type { WriteOff, Draft, Employee, Product };
