const baseUrl = (process.env.VERA_API_URL ?? "http://localhost:4000/api").replace(/\/$/, "");
const password = process.env.VERA_DEMO_PASSWORD ?? "VeraDemo2026!";

type Auth = {
  accessToken: string;
  user: { id: string; email: string; role: string };
};

async function requestJson<T>(path: string, init: RequestInit = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...(init.body && typeof init.body === "string" ? { "Content-Type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(`${init.method ?? "GET"} ${path} failed: ${res.status} ${body?.message ?? text}`);
  }
  return body as T;
}

async function login(email: string) {
  return requestJson<Auth>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

function authHeaders(auth: Auth) {
  return { Authorization: `Bearer ${auth.accessToken}` };
}

async function main() {
  console.log(`VERA demo verification against ${baseUrl}`);

  const employee = await login("aigerim@vera.demo");
  await requestJson("/bootstrap", { headers: authHeaders(employee) });

  const extraction = await requestJson<{ productId: string; tradePointId: string; quantity: number; deductionType: string; comment: string }>("/write-offs/extract", {
    method: "POST",
    headers: authHeaders(employee),
    body: JSON.stringify({
      transcript: "Списать 2 чизбургера курица х2 на Turan 55d, ошибочный заказ, без удержания",
    }),
  });

  const created = await requestJson<{ id: string; status: string }>("/write-offs", {
    method: "POST",
    headers: authHeaders(employee),
    body: JSON.stringify({
      tradePointId: extraction.tradePointId ?? "tp-bahandi-turan-55d",
      productId: extraction.productId ?? "p-bahandi-p008",
      quantity: extraction.quantity ?? 2,
      unit: "pcs",
      reason: "Wrong order assembled during rush hour",
      deductionType: extraction.deductionType ?? "without_deduction",
      comment: extraction.comment ?? "2 чизбургера курица х2 were assembled for the wrong order and cannot be sold.",
      voiceTranscript: "Списать 2 чизбургера курица х2 на Turan 55d, ошибочный заказ, без удержания",
      aiGeneratedComment: extraction.comment,
      aiConfidenceScore: 0.9,
    }),
  });

  await requestJson(`/write-offs/${created.id}/photo`, {
    method: "POST",
    headers: authHeaders(employee),
    body: JSON.stringify({ photoUrl: "https://example.com/vera-demo-proof.jpg" }),
  });

  const submitted = await requestJson<{ status: string }>(`/write-offs/${created.id}/submit`, {
    method: "POST",
    headers: authHeaders(employee),
    body: "{}",
  });
  if (submitted.status !== "pending_review") {
    throw new Error(`Expected pending_review after submit, got ${submitted.status}`);
  }

  const reviewer = await login("zarina@vera.demo");
  const queue = await requestJson<{ items: Array<{ id: string }> }>("/reviewer/write-offs?status=pending_review", {
    headers: authHeaders(reviewer),
  });
  if (!queue.items.some((item) => item.id === created.id)) {
    throw new Error("Created request was not found in reviewer queue.");
  }

  const approved = await requestJson<{ status: string; iikoSyncStatus: string; iikoDocumentId?: string }>(`/write-offs/${created.id}/approve`, {
    method: "POST",
    headers: authHeaders(reviewer),
    body: "{}",
  });
  if (!["synced_to_iiko", "iiko_sync_failed"].includes(approved.status)) {
    throw new Error(`Expected Iiko terminal status after approve, got ${approved.status}`);
  }

  const logs = await requestJson<{ items: Array<{ requestId: string; payload: unknown; status: string }> }>("/iiko/sync-logs", {
    headers: authHeaders(reviewer),
  });
  const syncLog = logs.items.find((item) => item.requestId === created.id);
  if (!syncLog) throw new Error("Iiko sync log was not created.");

  console.log("VERA demo verification passed", {
    requestId: created.id,
    finalStatus: approved.status,
    iikoSyncStatus: approved.iikoSyncStatus,
    iikoDocumentId: approved.iikoDocumentId ?? null,
    syncLogStatus: syncLog.status,
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
