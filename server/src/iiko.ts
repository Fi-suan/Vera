import type { PrismaClient, User, WriteOffRequest } from "@prisma/client";
import { HttpError } from "./http";

type RequestWithRelations = WriteOffRequest & {
  product?: { iikoProductId: string; name: string } | null;
  tradePoint?: { iikoDepartmentId: string; name: string } | null;
  deductionEmployee?: { iikoEmployeeId: string | null; name: string } | null;
};

type IikoReadyPayload = {
  departmentId: string | null;
  items: Array<{
    productId: string | null;
    amount: number | null;
    unit: string | null;
    reason: string | null;
    comment: string | null;
  }>;
  deductionType: string | null;
  employeeId: string | null;
};

type IikoSyncResult = {
  status: "synced" | "failed";
  response?: Record<string, unknown>;
  errorMessage?: string;
  iikoDocumentId?: string;
};

type IikoConnectionResult = {
  adapter: "mock" | "real";
  configured: boolean;
  ok: boolean;
  message: string;
  details?: unknown;
};

type IikoAdapter = {
  name: "mock" | "real";
  testConnection(): Promise<IikoConnectionResult>;
  createWriteOffDocument(request: RequestWithRelations, payload: IikoReadyPayload): Promise<IikoSyncResult>;
};

type IikoConfig = {
  adapter: "mock" | "real";
  baseUrl: string;
  apiLogin?: string;
  organizationId?: string;
};

const DEFAULT_IIKO_BASE_URL = "https://api-ru.iiko.services";

function getIikoConfig(): IikoConfig {
  return {
    adapter: process.env.IIKO_ADAPTER === "real" ? "real" : "mock",
    baseUrl: (process.env.IIKO_BASE_URL ?? DEFAULT_IIKO_BASE_URL).replace(/\/$/, ""),
    apiLogin: process.env.IIKO_API_LOGIN,
    organizationId: process.env.IIKO_ORGANIZATION_ID,
  };
}

function shouldFailMockSync(request: WriteOffRequest) {
  const text = `${request.reason ?? ""} ${request.comment ?? ""} ${request.productNameFallback ?? ""}`.toLowerCase();
  return text.includes("sync fail") || text.includes("iiko fail");
}

function assertRealIikoConfigured(config: IikoConfig) {
  const missing = [
    ["IIKO_API_LOGIN", config.apiLogin],
    ["IIKO_ORGANIZATION_ID", config.organizationId],
  ].filter(([, value]) => !value);

  if (missing.length) {
    throw new HttpError(503, "Real Iiko adapter is not configured", {
      missing: missing.map(([key]) => key),
    });
  }
}

async function iikoCloudRequest<T>(path: string, body: Record<string, unknown>, token?: string) {
  const config = getIikoConfig();
  const res = await fetch(`${config.baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const data = text ? (JSON.parse(text) as T) : ({} as T);

  if (!res.ok) {
    throw new HttpError(res.status, "Iiko API request failed", {
      path,
      status: res.status,
      response: data,
    });
  }

  return data;
}

async function getIikoAccessToken() {
  const config = getIikoConfig();
  assertRealIikoConfigured(config);
  const data = await iikoCloudRequest<{ token?: string }>("/api/1/access_token", {
    apiLogin: config.apiLogin,
  });
  if (!data.token) throw new HttpError(502, "Iiko did not return an access token");
  return data.token;
}

class MockIikoAdapter implements IikoAdapter {
  name = "mock" as const;

  async testConnection(): Promise<IikoConnectionResult> {
    return {
      adapter: "mock",
      configured: true,
      ok: true,
      message: "Mock Iiko adapter is active. No real Iiko credentials are used.",
    };
  }

  async createWriteOffDocument(request: RequestWithRelations): Promise<IikoSyncResult> {
    if (shouldFailMockSync(request)) {
      return {
        status: "failed",
        errorMessage: "Mock Iiko sync failed by request content",
      };
    }

    const iikoDocumentId = `WR-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    return {
      status: "synced",
      iikoDocumentId,
      response: {
        status: "synced",
        iikoDocumentId,
        message: "Mock write-off document created successfully",
      },
    };
  }
}

class RealIikoCloudAdapter implements IikoAdapter {
  name = "real" as const;

  async testConnection(): Promise<IikoConnectionResult> {
    const config = getIikoConfig();
    assertRealIikoConfigured(config);
    const token = await getIikoAccessToken();
    const organizations = await iikoCloudRequest<Record<string, unknown>>(
      "/api/1/organizations",
      { organizationIds: [config.organizationId], returnAdditionalInfo: false },
      token,
    );

    return {
      adapter: "real",
      configured: true,
      ok: true,
      message: "Connected to iikoCloud and fetched organization information.",
      details: organizations,
    };
  }

  async createWriteOffDocument(_request: RequestWithRelations, payload: IikoReadyPayload): Promise<IikoSyncResult> {
    const config = getIikoConfig();
    assertRealIikoConfigured(config);
    await getIikoAccessToken();

    return {
      status: "failed",
      errorMessage:
        "Real Iiko credentials are configured, but the write-off document endpoint is not enabled yet. Confirm the sponsor's iiko API method for inventory write-offs before enabling real stock mutation.",
      response: {
        adapter: "real",
        organizationId: config.organizationId,
        preparedPayload: payload,
      },
    };
  }
}

function getIikoAdapter(): IikoAdapter {
  return getIikoConfig().adapter === "real" ? new RealIikoCloudAdapter() : new MockIikoAdapter();
}

export function buildIikoPayload(request: RequestWithRelations): IikoReadyPayload {
  return {
    departmentId: request.tradePoint?.iikoDepartmentId ?? request.tradePointId ?? null,
    items: [
      {
        productId: request.product?.iikoProductId ?? request.productId ?? request.productNameFallback ?? null,
        amount: request.quantity,
        unit: request.unit,
        reason: request.reason,
        comment: request.comment,
      },
    ],
    deductionType: request.deductionType,
    employeeId: request.deductionEmployee?.iikoEmployeeId ?? null,
  };
}

export async function testIikoConnection() {
  return getIikoAdapter().testConnection();
}

export async function syncToIiko(prisma: PrismaClient, requestId: string, actor: User) {
  const syncing = await prisma.writeOffRequest.update({
    where: { id: requestId },
    data: { status: "syncing_to_iiko", iikoSyncStatus: "syncing" },
    include: { product: true, tradePoint: true, deductionEmployee: true },
  });

  await prisma.requestEvent.create({
    data: {
      requestId,
      actorUserId: actor.id,
      eventType: "iiko_sync_started",
      fromStatus: "approved",
      toStatus: "syncing_to_iiko",
      metadataJson: "{}",
    },
  });

  const payload = buildIikoPayload(syncing);
  const adapter = getIikoAdapter();
  let result: IikoSyncResult;

  try {
    result = await adapter.createWriteOffDocument(syncing, payload);
  } catch (error) {
    result = {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Iiko sync failed",
      response: error instanceof HttpError ? { details: error.details } : undefined,
    };
  }

  if (result.status === "failed") {
    const errorMessage = result.errorMessage ?? "Iiko sync failed";
    await prisma.iikoSyncLog.create({
      data: {
        requestId,
        status: "failed",
        payloadJson: JSON.stringify(payload),
        responseJson: result.response ? JSON.stringify(result.response) : null,
        errorMessage,
      },
    });

    const failed = await prisma.writeOffRequest.update({
      where: { id: requestId },
      data: { status: "iiko_sync_failed", iikoSyncStatus: "failed" },
      include: { product: true, tradePoint: true, createdBy: true, reviewedBy: true, deductionEmployee: true, events: true, syncLogs: true },
    });

    await prisma.requestEvent.create({
      data: {
        requestId,
        actorUserId: actor.id,
        eventType: "iiko_sync_failed",
        fromStatus: "syncing_to_iiko",
        toStatus: "iiko_sync_failed",
        metadataJson: JSON.stringify({ adapter: adapter.name, errorMessage }),
      },
    });

    return failed;
  }

  const response = result.response ?? {
    status: "synced",
    iikoDocumentId: result.iikoDocumentId,
  };

  await prisma.iikoSyncLog.create({
    data: {
      requestId,
      status: "synced",
      payloadJson: JSON.stringify(payload),
      responseJson: JSON.stringify(response),
      iikoDocumentId: result.iikoDocumentId,
    },
  });

  const synced = await prisma.writeOffRequest.update({
    where: { id: requestId },
    data: { status: "synced_to_iiko", iikoSyncStatus: "synced", iikoDocumentId: result.iikoDocumentId },
    include: { product: true, tradePoint: true, createdBy: true, reviewedBy: true, deductionEmployee: true, events: true, syncLogs: true },
  });

  await prisma.requestEvent.create({
    data: {
      requestId,
      actorUserId: actor.id,
      eventType: "iiko_sync_succeeded",
      fromStatus: "syncing_to_iiko",
      toStatus: "synced_to_iiko",
      metadataJson: JSON.stringify({ adapter: adapter.name, iikoDocumentId: result.iikoDocumentId }),
    },
  });

  return synced;
}
