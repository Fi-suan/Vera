import type { IikoSyncLog, RequestEvent, User, WriteOffRequest, Product, TradePoint } from "@prisma/client";
import { parseJson } from "./http";
import { REVIEWER_ROLES } from "./constants";

type FullRequest = WriteOffRequest & {
  createdBy?: User;
  reviewedBy?: User | null;
  deductionEmployee?: User | null;
  product?: Product | null;
  tradePoint?: TradePoint | null;
  events?: RequestEvent[];
  syncLogs?: IikoSyncLog[];
};

export function serializeRequest(request: FullRequest, viewer?: User | null) {
  const missingFields = parseJson<string[]>(request.missingFieldsJson, []);
  const events = request.events?.map((event) => ({
    ...event,
    metadata: parseJson<Record<string, unknown>>(event.metadataJson, {}),
    metadataJson: undefined,
  }));
  const syncLogs = request.syncLogs?.map((log) => ({
    ...log,
    payload: parseJson<Record<string, unknown>>(log.payloadJson, {}),
    response: parseJson<Record<string, unknown> | null>(log.responseJson, null),
    payloadJson: undefined,
    responseJson: undefined,
  }));

  return {
    ...request,
    aiExtractedFields: parseJson<Record<string, unknown>>(request.aiExtractedFieldsJson, {}),
    missingFields,
    events,
    syncLogs,
    ui: buildRequestUi(request, { missingFields, events, syncLogs, viewer }),
    aiExtractedFieldsJson: undefined,
    missingFieldsJson: undefined,
  };
}

type SerializedEvent = Omit<RequestEvent, "metadataJson"> & {
  metadata: Record<string, unknown>;
  metadataJson: undefined;
};

type SerializedSyncLog = Omit<IikoSyncLog, "payloadJson" | "responseJson"> & {
  payload: Record<string, unknown>;
  response: Record<string, unknown> | null;
  payloadJson: undefined;
  responseJson: undefined;
};

function buildRequestUi(
  request: FullRequest,
  input: {
    missingFields: string[];
    events?: SerializedEvent[];
    syncLogs?: SerializedSyncLog[];
    viewer?: User | null;
  },
) {
  const productName = request.product?.name ?? request.productNameFallback ?? "Unknown product";
  const tradePointName = request.tradePoint?.name ?? "Trade point not selected";
  const employeeName = request.createdBy?.name ?? "Unknown employee";
  const reviewerName = request.reviewedBy?.name ?? null;
  const quantityLabel = request.quantity && request.unit ? `${formatNumber(request.quantity)} ${request.unit}` : null;
  const status = statusPresentation(request.status);
  const sync = syncPresentation(request);
  const actions = actionHints(request, input.viewer);

  return {
    title: productName,
    subtitle: [quantityLabel, tradePointName].filter(Boolean).join(" · "),
    statusLabel: status.label,
    statusTone: status.tone,
    productName,
    tradePointName,
    employeeName,
    reviewerName,
    quantityLabel,
    costLabel: formatMoney(request.costEstimate),
    photoRequired: input.missingFields.includes("photoUrl"),
    missingFieldLabels: input.missingFields.map(missingFieldLabel),
    sync,
    actions,
    primaryAction: primaryAction(actions),
    timeline: input.events?.map((event) => ({
      id: event.id,
      type: event.eventType,
      label: eventLabel(event.eventType),
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      at: event.createdAt,
      actorUserId: event.actorUserId,
      metadata: event.metadata,
    })) ?? [],
    latestSyncLog: input.syncLogs?.[0]
      ? {
          id: input.syncLogs[0].id,
          status: input.syncLogs[0].status,
          errorMessage: input.syncLogs[0].errorMessage,
          iikoDocumentId: input.syncLogs[0].iikoDocumentId,
          createdAt: input.syncLogs[0].createdAt,
        }
      : null,
  };
}

function statusPresentation(status: string) {
  const map: Record<string, { label: string; tone: "neutral" | "warning" | "success" | "danger" | "info" }> = {
    draft: { label: "Draft", tone: "neutral" },
    missing_info: { label: "Needs details", tone: "warning" },
    pending_review: { label: "Waiting for review", tone: "info" },
    approved: { label: "Approved", tone: "success" },
    rejected: { label: "Rejected", tone: "danger" },
    syncing_to_iiko: { label: "Syncing to Iiko", tone: "info" },
    synced_to_iiko: { label: "Synced to Iiko", tone: "success" },
    iiko_sync_failed: { label: "Iiko sync failed", tone: "danger" },
  };
  return map[status] ?? { label: status, tone: "neutral" };
}

function syncPresentation(request: FullRequest) {
  const map: Record<string, { label: string; tone: "neutral" | "info" | "success" | "danger" }> = {
    idle: { label: "Not synced", tone: "neutral" },
    syncing: { label: "Syncing", tone: "info" },
    synced: { label: "Synced", tone: "success" },
    failed: { label: "Failed", tone: "danger" },
  };
  return {
    status: request.iikoSyncStatus,
    label: map[request.iikoSyncStatus]?.label ?? request.iikoSyncStatus,
    tone: map[request.iikoSyncStatus]?.tone ?? "neutral",
    documentId: request.iikoDocumentId,
  };
}

function actionHints(request: FullRequest, viewer?: User | null) {
  const isCreator = viewer?.id === request.createdByUserId;
  const isAdmin = viewer?.role === "admin";
  const isReviewer = Boolean(viewer && REVIEWER_ROLES.includes(viewer.role as (typeof REVIEWER_ROLES)[number]));
  const editableStatus = ["draft", "missing_info"].includes(request.status);

  return {
    canEdit: editableStatus && (isCreator || isAdmin),
    canAttachPhoto: editableStatus && (isCreator || isAdmin),
    canSubmit: editableStatus && (isCreator || isAdmin),
    canApprove: request.status === "pending_review" && isReviewer && !isCreator,
    canReject: request.status === "pending_review" && isReviewer && !isCreator,
    canRetryIikoSync: request.status === "iiko_sync_failed" && isReviewer,
  };
}

function primaryAction(actions: ReturnType<typeof actionHints>) {
  if (actions.canApprove) return "approve";
  if (actions.canSubmit) return "submit";
  if (actions.canRetryIikoSync) return "retry_iiko_sync";
  if (actions.canEdit) return "edit";
  return null;
}

function missingFieldLabel(field: string) {
  const map: Record<string, string> = {
    tradePointId: "Trade point",
    productId: "Product",
    productNameFallback: "Product name",
    quantity: "Quantity",
    reason: "Reason",
    deductionType: "Deduction type",
    deductionEmployeeId: "Employee for deduction",
    comment: "Comment",
    photoUrl: "Proof photo",
  };
  return map[field] ?? field;
}

function eventLabel(eventType: string) {
  const map: Record<string, string> = {
    created: "Created",
    voice_transcribed: "Voice transcribed",
    ai_fields_extracted: "AI extracted fields",
    photo_attached: "Photo attached",
    missing_info_requested: "Missing details requested",
    submitted: "Submitted for review",
    approved: "Approved",
    rejected: "Rejected",
    iiko_sync_started: "Iiko sync started",
    iiko_sync_succeeded: "Iiko sync succeeded",
    iiko_sync_failed: "Iiko sync failed",
  };
  return map[eventType] ?? eventType;
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("ru-KZ", {
    style: "currency",
    currency: "KZT",
    maximumFractionDigits: 0,
  }).format(value);
}
