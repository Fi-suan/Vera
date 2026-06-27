export function createOpenApiSpec() {
  const bearerAuth = [{ bearerAuth: [] }];
  const json = "application/json";

  const schemaRef = (name: string) => ({ $ref: `#/components/schemas/${name}` });
  const jsonBody = (schema: unknown) => ({ required: true, content: { [json]: { schema } } });
  const ok = (schema: unknown, description = "OK") => ({
    description,
    content: { [json]: { schema } },
  });
  const error = (description = "Error") => ({
    description,
    content: { [json]: { schema: schemaRef("ErrorResponse") } },
  });

  return {
    openapi: "3.1.0",
    info: {
      title: "VERA Backend API",
      version: "0.1.0",
      description:
        "Voice-first write-off control API. Employee speaks, VERA structures, manager verifies, Iiko syncs.",
    },
    servers: [{ url: "/api", description: "Current backend" }],
    tags: [
      { name: "Health" },
      { name: "Auth" },
      { name: "Bootstrap" },
      { name: "AI" },
      { name: "Write-offs" },
      { name: "Reviewer" },
      { name: "Iiko" },
    ],
    paths: {
      "/health": {
        get: {
          tags: ["Health"],
          summary: "Health check",
          responses: { 200: ok(schemaRef("HealthResponse")) },
        },
      },
      "/ready": {
        get: {
          tags: ["Health"],
          summary: "Readiness check including database connectivity",
          responses: { 200: ok(schemaRef("ReadyResponse")), 500: error("Database not ready") },
        },
      },
      "/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register a user",
          requestBody: jsonBody(schemaRef("RegisterRequest")),
          responses: { 201: ok(schemaRef("AuthResponse"), "Registered"), 400: error(), 409: error("User exists") },
        },
      },
      "/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login with email and password",
          requestBody: jsonBody(schemaRef("LoginRequest")),
          responses: { 200: ok(schemaRef("AuthResponse")), 401: error("Invalid credentials") },
        },
      },
      "/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Current authenticated user",
          security: bearerAuth,
          responses: { 200: ok({ type: "object", properties: { user: schemaRef("User") }, required: ["user"] }), 401: error("Unauthorized") },
        },
      },
      "/bootstrap": {
        get: {
          tags: ["Bootstrap"],
          summary: "Reference data for app startup",
          responses: { 200: ok(schemaRef("BootstrapResponse")) },
        },
      },
      "/ai/test-provider": {
        post: {
          tags: ["AI"],
          summary: "Check active AI provider",
          security: bearerAuth,
          responses: { 200: ok(schemaRef("ProviderStatus")), 401: error("Unauthorized"), 403: error("Reviewer role required") },
        },
      },
      "/write-offs/transcribe": {
        post: {
          tags: ["AI", "Write-offs"],
          summary: "Transcribe audio or echo mock transcript",
          security: bearerAuth,
          requestBody: {
            required: true,
            content: {
              [json]: { schema: schemaRef("TranscribeRequest") },
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: {
                    audio: { type: "string", format: "binary" },
                    mockTranscript: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 200: ok(schemaRef("TranscribeResponse")), 400: error(), 401: error("Unauthorized") },
        },
      },
      "/write-offs/extract": {
        post: {
          tags: ["AI", "Write-offs"],
          summary: "Extract structured write-off fields from transcript",
          security: bearerAuth,
          requestBody: jsonBody(schemaRef("ExtractRequest")),
          responses: { 200: ok(schemaRef("ExtractionResponse")), 401: error("Unauthorized") },
        },
      },
      "/write-offs": {
        post: {
          tags: ["Write-offs"],
          summary: "Create a write-off request",
          security: bearerAuth,
          requestBody: jsonBody(schemaRef("CreateWriteOffRequest")),
          responses: { 201: ok(schemaRef("WriteOffRequest"), "Created"), 400: error(), 401: error("Unauthorized") },
        },
      },
      "/write-offs/{id}": {
        get: {
          tags: ["Write-offs"],
          summary: "Get full write-off request details",
          security: bearerAuth,
          parameters: [pathParam("id")],
          responses: { 200: ok(schemaRef("WriteOffRequest")), 401: error("Unauthorized"), 404: error("Not found") },
        },
        patch: {
          tags: ["Write-offs"],
          summary: "Edit draft or missing-info request",
          security: bearerAuth,
          parameters: [pathParam("id")],
          requestBody: jsonBody(schemaRef("PatchWriteOffRequest")),
          responses: { 200: ok(schemaRef("WriteOffRequest")), 409: error("Invalid status") },
        },
      },
      "/write-offs/{id}/photo": {
        post: {
          tags: ["Write-offs"],
          summary: "Attach photo proof",
          security: bearerAuth,
          parameters: [pathParam("id")],
          requestBody: {
            required: true,
            content: {
              [json]: { schema: schemaRef("AttachPhotoRequest") },
              "multipart/form-data": {
                schema: { type: "object", properties: { photo: { type: "string", format: "binary" }, photoUrl: { type: "string" } } },
              },
            },
          },
          responses: { 200: ok(schemaRef("WriteOffRequest")), 409: error("Invalid status") },
        },
      },
      "/write-offs/{id}/submit": {
        post: {
          tags: ["Write-offs"],
          summary: "Submit draft or missing-info request for review",
          security: bearerAuth,
          parameters: [pathParam("id")],
          responses: { 200: ok(schemaRef("WriteOffRequest")), 422: error("Missing required fields") },
        },
      },
      "/me/write-offs": {
        get: {
          tags: ["Write-offs"],
          summary: "Current employee request history",
          security: bearerAuth,
          responses: { 200: ok({ type: "object", properties: { items: { type: "array", items: schemaRef("WriteOffRequest") } }, required: ["items"] }) },
        },
      },
      "/reviewer/write-offs": {
        get: {
          tags: ["Reviewer"],
          summary: "Reviewer queue and filtered records",
          security: bearerAuth,
          parameters: [
            queryParam("status", schemaRef("RequestStatus")),
            queryParam("tradePointId"),
            queryParam("employeeId"),
            queryParam("deductionType", schemaRef("DeductionType")),
            queryParam("dateFrom", { type: "string", format: "date-time" }),
            queryParam("dateTo", { type: "string", format: "date-time" }),
          ],
          responses: { 200: ok({ type: "object", properties: { items: { type: "array", items: schemaRef("WriteOffRequest") } }, required: ["items"] }) },
        },
      },
      "/write-offs/{id}/approve": {
        post: {
          tags: ["Reviewer"],
          summary: "Approve request and trigger Iiko sync",
          security: bearerAuth,
          parameters: [pathParam("id")],
          responses: { 200: ok(schemaRef("WriteOffRequest")), 403: error("Cannot approve own request"), 409: error("Invalid status") },
        },
      },
      "/write-offs/{id}/reject": {
        post: {
          tags: ["Reviewer"],
          summary: "Reject request with reason",
          security: bearerAuth,
          parameters: [pathParam("id")],
          requestBody: jsonBody(schemaRef("RejectRequest")),
          responses: { 200: ok(schemaRef("WriteOffRequest")), 400: error(), 409: error("Invalid status") },
        },
      },
      "/iiko/test-connection": {
        post: {
          tags: ["Iiko"],
          summary: "Check Iiko adapter connection",
          security: bearerAuth,
          responses: { 200: ok(schemaRef("ProviderStatus")), 403: error("Reviewer role required"), 503: error("Not configured") },
        },
      },
      "/iiko/sync-logs": {
        get: {
          tags: ["Iiko"],
          summary: "List Iiko sync logs",
          security: bearerAuth,
          responses: { 200: ok({ type: "object", properties: { items: { type: "array", items: schemaRef("IikoSyncLog") } }, required: ["items"] }) },
        },
      },
      "/iiko/retry/{requestId}": {
        post: {
          tags: ["Iiko"],
          summary: "Retry failed Iiko sync",
          security: bearerAuth,
          parameters: [pathParam("requestId")],
          responses: { 200: ok(schemaRef("WriteOffRequest")), 409: error("Only failed sync can be retried") },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      schemas: schemas(),
    },
  };
}

function pathParam(name: string) {
  return { name, in: "path", required: true, schema: { type: "string" } };
}

function queryParam(name: string, schema: unknown = { type: "string" }) {
  return { name, in: "query", required: false, schema };
}

function schemas() {
  const nullableString = { type: ["string", "null"] };
  const nullableNumber = { type: ["number", "null"] };

  return {
    Role: { type: "string", enum: ["employee", "reviewer", "admin"] },
    DeductionType: { type: "string", enum: ["with_deduction", "without_deduction"] },
    RequestStatus: {
      type: "string",
      enum: ["draft", "missing_info", "pending_review", "approved", "rejected", "syncing_to_iiko", "synced_to_iiko", "iiko_sync_failed"],
    },
    HealthResponse: { type: "object", properties: { ok: { type: "boolean" }, service: { type: "string" } }, required: ["ok", "service"] },
    ReadyResponse: {
      type: "object",
      properties: { ok: { type: "boolean" }, service: { type: "string" }, database: { type: "string", enum: ["ready"] } },
      required: ["ok", "service", "database"],
    },
    ErrorResponse: {
      type: "object",
      properties: { error: { type: "string" }, message: { type: "string" }, details: {} },
      required: ["error", "message"],
    },
    RegisterRequest: {
      type: "object",
      properties: {
        name: { type: "string", minLength: 2 },
        email: { type: "string", format: "email" },
        phone: { type: "string" },
        password: { type: "string", minLength: 8 },
        role: { $ref: "#/components/schemas/Role" },
        tradePointId: nullableString,
      },
      required: ["name", "email", "password"],
    },
    LoginRequest: {
      type: "object",
      properties: { email: { type: "string", format: "email" }, password: { type: "string" } },
      required: ["email", "password"],
    },
    AuthResponse: {
      type: "object",
      properties: { user: { $ref: "#/components/schemas/User" }, accessToken: { type: "string" }, tokenType: { type: "string", enum: ["Bearer"] } },
      required: ["user", "accessToken", "tokenType"],
    },
    User: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        email: nullableString,
        phone: nullableString,
        role: { $ref: "#/components/schemas/Role" },
        tradePointId: nullableString,
        iikoEmployeeId: nullableString,
        createdAt: { type: "string", format: "date-time" },
      },
      required: ["id", "name", "role", "createdAt"],
    },
    TradePoint: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        address: { type: "string" },
        iikoDepartmentId: { type: "string" },
        createdAt: { type: "string", format: "date-time" },
      },
      required: ["id", "name", "address", "iikoDepartmentId", "createdAt"],
    },
    Product: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        category: { type: "string" },
        unit: { type: "string" },
        costPrice: { type: "number" },
        iikoProductId: { type: "string" },
        createdAt: { type: "string", format: "date-time" },
      },
      required: ["id", "name", "category", "unit", "costPrice", "iikoProductId", "createdAt"],
    },
    BootstrapResponse: {
      type: "object",
      properties: {
        users: { type: "array", items: { $ref: "#/components/schemas/User" } },
        tradePoints: { type: "array", items: { $ref: "#/components/schemas/TradePoint" } },
        products: { type: "array", items: { $ref: "#/components/schemas/Product" } },
      },
      required: ["users", "tradePoints", "products"],
    },
    TranscribeRequest: { type: "object", properties: { mockTranscript: { type: "string" } } },
    TranscribeResponse: {
      type: "object",
      properties: { transcript: { type: "string" }, provider: { type: "string" } },
      required: ["transcript", "provider"],
    },
    ExtractRequest: { type: "object", properties: { transcript: { type: "string" } }, required: ["transcript"] },
    ExtractionResponse: {
      type: "object",
      properties: {
        productId: nullableString,
        productName: nullableString,
        quantity: nullableNumber,
        unit: nullableString,
        tradePointId: nullableString,
        tradePointName: nullableString,
        reason: nullableString,
        deductionType: { oneOf: [{ $ref: "#/components/schemas/DeductionType" }, { type: "null" }] },
        deductionEmployeeId: nullableString,
        deductionEmployeeName: nullableString,
        comment: { type: "string" },
        aiGeneratedComment: { type: "string" },
        missingFields: { type: "array", items: { type: "string" } },
        confidenceScore: { type: "number" },
        provider: { type: "string", enum: ["mock", "gemini"] },
      },
      required: ["missingFields", "confidenceScore", "provider"],
    },
    CreateWriteOffRequest: writeOffInputSchema(false),
    PatchWriteOffRequest: writeOffInputSchema(true),
    AttachPhotoRequest: { type: "object", properties: { photoUrl: { type: "string" } } },
    RejectRequest: { type: "object", properties: { reason: { type: "string", minLength: 3 } }, required: ["reason"] },
    RequestEvent: {
      type: "object",
      properties: {
        id: { type: "string" },
        requestId: { type: "string" },
        actorUserId: nullableString,
        eventType: { type: "string" },
        fromStatus: nullableString,
        toStatus: nullableString,
        metadata: { type: "object", additionalProperties: true },
        createdAt: { type: "string", format: "date-time" },
      },
      required: ["id", "requestId", "eventType", "createdAt"],
    },
    IikoSyncLog: {
      type: "object",
      properties: {
        id: { type: "string" },
        requestId: { type: "string" },
        status: { type: "string" },
        payload: { type: "object", additionalProperties: true },
        response: { oneOf: [{ type: "object", additionalProperties: true }, { type: "null" }] },
        errorMessage: nullableString,
        iikoDocumentId: nullableString,
        createdAt: { type: "string", format: "date-time" },
      },
      required: ["id", "requestId", "status", "payload", "createdAt"],
    },
    WriteOffRequest: {
      type: "object",
      properties: {
        id: { type: "string" },
        doc: { type: "string" },
        createdByUserId: { type: "string" },
        tradePointId: nullableString,
        productId: nullableString,
        productNameFallback: nullableString,
        quantity: nullableNumber,
        unit: nullableString,
        reason: nullableString,
        deductionType: { oneOf: [{ $ref: "#/components/schemas/DeductionType" }, { type: "null" }] },
        deductionEmployeeId: nullableString,
        comment: nullableString,
        photoUrl: nullableString,
        voiceTranscript: nullableString,
        aiExtractedFields: { type: "object", additionalProperties: true },
        aiGeneratedComment: nullableString,
        aiConfidenceScore: nullableNumber,
        missingFields: { type: "array", items: { type: "string" } },
        status: { $ref: "#/components/schemas/RequestStatus" },
        reviewedByUserId: nullableString,
        reviewedAt: { type: ["string", "null"], format: "date-time" },
        rejectionReason: nullableString,
        iikoSyncStatus: { type: "string", enum: ["idle", "syncing", "synced", "failed"] },
        iikoDocumentId: nullableString,
        costEstimate: { type: "number" },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
        createdBy: { $ref: "#/components/schemas/User" },
        reviewedBy: { oneOf: [{ $ref: "#/components/schemas/User" }, { type: "null" }] },
        deductionEmployee: { oneOf: [{ $ref: "#/components/schemas/User" }, { type: "null" }] },
        product: { oneOf: [{ $ref: "#/components/schemas/Product" }, { type: "null" }] },
        tradePoint: { oneOf: [{ $ref: "#/components/schemas/TradePoint" }, { type: "null" }] },
        events: { type: "array", items: { $ref: "#/components/schemas/RequestEvent" } },
        syncLogs: { type: "array", items: { $ref: "#/components/schemas/IikoSyncLog" } },
        ui: { $ref: "#/components/schemas/WriteOffRequestUi" },
      },
      required: ["id", "doc", "createdByUserId", "status", "iikoSyncStatus", "costEstimate", "createdAt", "updatedAt", "missingFields", "aiExtractedFields", "ui"],
    },
    WriteOffRequestUi: {
      type: "object",
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
        statusLabel: { type: "string" },
        statusTone: { type: "string", enum: ["neutral", "warning", "success", "danger", "info"] },
        productName: { type: "string" },
        tradePointName: { type: "string" },
        employeeName: { type: "string" },
        reviewerName: nullableString,
        quantityLabel: nullableString,
        costLabel: { type: "string" },
        photoRequired: { type: "boolean" },
        missingFieldLabels: { type: "array", items: { type: "string" } },
        sync: {
          type: "object",
          properties: {
            status: { type: "string" },
            label: { type: "string" },
            tone: { type: "string", enum: ["neutral", "info", "success", "danger"] },
            documentId: nullableString,
          },
          required: ["status", "label", "tone"],
        },
        actions: {
          type: "object",
          properties: {
            canEdit: { type: "boolean" },
            canAttachPhoto: { type: "boolean" },
            canSubmit: { type: "boolean" },
            canApprove: { type: "boolean" },
            canReject: { type: "boolean" },
            canRetryIikoSync: { type: "boolean" },
          },
          required: ["canEdit", "canAttachPhoto", "canSubmit", "canApprove", "canReject", "canRetryIikoSync"],
        },
        primaryAction: { type: ["string", "null"], enum: ["approve", "submit", "retry_iiko_sync", "edit", null] },
        timeline: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              type: { type: "string" },
              label: { type: "string" },
              fromStatus: nullableString,
              toStatus: nullableString,
              at: { type: "string", format: "date-time" },
              actorUserId: nullableString,
              metadata: { type: "object", additionalProperties: true },
            },
            required: ["id", "type", "label", "at", "metadata"],
          },
        },
        latestSyncLog: {
          oneOf: [
            {
              type: "object",
              properties: {
                id: { type: "string" },
                status: { type: "string" },
                errorMessage: nullableString,
                iikoDocumentId: nullableString,
                createdAt: { type: "string", format: "date-time" },
              },
              required: ["id", "status", "createdAt"],
            },
            { type: "null" },
          ],
        },
      },
      required: ["title", "subtitle", "statusLabel", "statusTone", "productName", "tradePointName", "employeeName", "costLabel", "photoRequired", "missingFieldLabels", "sync", "actions", "timeline"],
    },
    ProviderStatus: {
      type: "object",
      properties: {
        provider: { type: "string" },
        adapter: { type: "string" },
        configured: { type: "boolean" },
        ok: { type: "boolean" },
        model: { type: "string" },
        message: { type: "string" },
        details: {},
      },
      required: ["configured", "ok", "message"],
    },
  };
}

function writeOffInputSchema(partial: boolean) {
  const properties = {
    tradePointId: { type: ["string", "null"] },
    productId: { type: ["string", "null"] },
    productName: { type: ["string", "null"] },
    productNameFallback: { type: ["string", "null"] },
    quantity: { type: ["number", "null"] },
    unit: { type: ["string", "null"] },
    reason: { type: ["string", "null"] },
    deductionType: { oneOf: [{ $ref: "#/components/schemas/DeductionType" }, { type: "null" }] },
    deductionEmployeeId: { type: ["string", "null"] },
    comment: { type: ["string", "null"] },
    photoUrl: { type: ["string", "null"] },
    voiceTranscript: { type: ["string", "null"] },
    aiExtractedFields: { type: "object", additionalProperties: true },
    aiGeneratedComment: { type: ["string", "null"] },
    aiConfidenceScore: { type: ["number", "null"], minimum: 0, maximum: 1 },
    missingFields: { type: "array", items: { type: "string" } },
    ...(partial ? { status: { type: "string", enum: ["draft", "missing_info"] } } : {}),
  };
  return {
    type: "object",
    properties,
    additionalProperties: false,
  };
}
