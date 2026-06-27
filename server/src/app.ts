import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import multer from "multer";
import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { unlink } from "node:fs/promises";
import path from "node:path";
import type { PrismaClient, User } from "@prisma/client";
import { getPrisma } from "./db";
import { HttpError, sendError } from "./http";
import { REVIEWER_ROLES } from "./constants";
import { extractWriteOffFields, testAiProvider, transcribeAudio } from "./extraction";
import { serializeRequest } from "./serializer";
import { hashPassword, issueAccessToken, publicUser, verifyAccessToken, verifyPassword } from "./auth";
import {
  attachPhotoSchema,
  createWriteOffSchema,
  extractSchema,
  loginSchema,
  patchWriteOffSchema,
  registerSchema,
  rejectSchema,
  reviewerListSchema,
  transcribeSchema,
  validateReadyForReview,
} from "./validation";
import { syncToIiko, testIikoConnection } from "./iiko";
import { createOpenApiSpec } from "./openapi";
import { getCorsOptions } from "./config";
import { saveProofPhoto } from "./storage";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const upload = multer({
  dest: path.resolve(process.cwd(), "server/uploads"),
  limits: { fileSize: 8 * 1024 * 1024 },
});

type AppOptions = {
  prisma?: PrismaClient;
};

function cleanObject<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as Partial<T>;
}

async function getRequestOrThrow(prisma: PrismaClient, id: string) {
  const request = await prisma.writeOffRequest.findUnique({ where: { id } });
  if (!request) throw new HttpError(404, "Write-off request not found");
  return request;
}

async function getFullRequest(prisma: PrismaClient, id: string) {
  const request = await prisma.writeOffRequest.findUnique({
    where: { id },
    include: {
      createdBy: true,
      reviewedBy: true,
      deductionEmployee: true,
      product: true,
      tradePoint: true,
      events: { orderBy: { createdAt: "asc" } },
      syncLogs: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!request) throw new HttpError(404, "Write-off request not found");
  return request;
}

async function addEvent(
  prisma: PrismaClient,
  input: {
    requestId: string;
    actorUserId?: string | null;
    eventType: string;
    fromStatus?: string | null;
    toStatus?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  await prisma.requestEvent.create({
    data: {
      requestId: input.requestId,
      actorUserId: input.actorUserId,
      eventType: input.eventType,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      metadataJson: JSON.stringify(input.metadata ?? {}),
    },
  });
}

function requireAuth(req: Request) {
  if (!req.user) throw new HttpError(401, "Authentication is required");
  return req.user;
}

function requireReviewer(user: User) {
  if (!REVIEWER_ROLES.includes(user.role as (typeof REVIEWER_ROLES)[number])) {
    throw new HttpError(403, "Reviewer or admin role is required");
  }
}

function routeId(req: Request, key = "id") {
  const value = req.params[key];
  return Array.isArray(value) ? value[0] : value;
}

function toWriteOffData(body: ReturnType<typeof createWriteOffSchema.parse>) {
  const productNameFallback = body.productNameFallback ?? body.productName ?? null;
  return cleanObject({
    tradePointId: body.tradePointId ?? null,
    productId: body.productId ?? null,
    productNameFallback,
    quantity: body.quantity ?? null,
    unit: body.unit ?? null,
    reason: body.reason ?? null,
    deductionType: body.deductionType ?? null,
    deductionEmployeeId: body.deductionEmployeeId ?? null,
    comment: body.comment ?? body.aiGeneratedComment ?? null,
    photoUrl: body.photoUrl ?? null,
    voiceTranscript: body.voiceTranscript ?? null,
    aiExtractedFieldsJson: JSON.stringify(body.aiExtractedFields ?? {}),
    aiGeneratedComment: body.aiGeneratedComment ?? body.comment ?? null,
    aiConfidenceScore: body.aiConfidenceScore ?? null,
    missingFieldsJson: JSON.stringify(body.missingFields ?? []),
  });
}

async function calculateCostEstimate(prisma: PrismaClient, productId?: string | null, quantity?: number | null) {
  if (!productId || !quantity) return 0;
  const product = await prisma.product.findUnique({ where: { id: productId } });
  return product ? product.costPrice * quantity : 0;
}

export function createApp(options: AppOptions = {}) {
  const prisma = options.prisma ?? getPrisma();
  const app = express();

  app.set("trust proxy", 1);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
          imgSrc: ["'self'", "data:", "blob:", "https:"],
          mediaSrc: ["'self'", "data:", "blob:"],
          connectSrc: ["'self'", "https:"],
          objectSrc: ["'none'"],
        },
      },
    }),
  );
  app.use(cors(getCorsOptions()));
  app.use(express.json({ limit: "2mb" }));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "rate_limited", message: "Too many authentication attempts, please try again later" },
  });
  app.use(["/api/auth/login", "/api/auth/register"], authLimiter);
  app.use("/uploads", express.static(path.resolve(process.cwd(), "server/uploads")));

  app.use(async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const authHeader = req.header("authorization");
      const bearerToken = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];
      const demoHeaderUserId = process.env.ALLOW_DEMO_HEADER === "true" ? req.header("x-demo-user-id") : null;
      const userId = bearerToken ? verifyAccessToken(bearerToken).sub : demoHeaderUserId;
      const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
      if (user) req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "vera-backend" });
  });

  app.get("/api/ready", async (_req, res, next) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ ok: true, service: "vera-backend", database: "ready" });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/openapi.json", (_req, res) => {
    res.json(createOpenApiSpec());
  });

  app.get("/api/docs", (_req, res) => {
    res.type("html").send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>VERA API Docs</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({ url: "/api/openapi.json", dom_id: "#swagger-ui" });
    </script>
  </body>
</html>`);
  });

  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const body = registerSchema.parse(req.body);
      const existing = await prisma.user.findFirst({
        where: {
          OR: [{ email: body.email }, ...(body.phone ? [{ phone: body.phone }] : [])],
        },
      });
      if (existing) throw new HttpError(409, "User with this email or phone already exists");

      const user = await prisma.user.create({
        data: {
          id: randomUUID(),
          name: body.name,
          email: body.email,
          phone: body.phone ?? null,
          passwordHash: await hashPassword(body.password),
          role: body.role,
          tradePointId: body.tradePointId ?? null,
        },
      });

      res.status(201).json({ user: publicUser(user), accessToken: issueAccessToken(user), tokenType: "Bearer" });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/login", async (req, res, next) => {
    try {
      const body = loginSchema.parse(req.body);
      const user = await prisma.user.findUnique({ where: { email: body.email } });
      if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
        throw new HttpError(401, "Invalid email or password");
      }

      res.json({ user: publicUser(user), accessToken: issueAccessToken(user), tokenType: "Bearer" });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/auth/me", async (req, res, next) => {
    try {
      const user = requireAuth(req);
      res.json({ user: publicUser(user) });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/bootstrap", async (req, res, next) => {
    try {
      requireAuth(req);
      const [users, tradePoints, products] = await Promise.all([
        prisma.user.findMany({ orderBy: { name: "asc" } }),
        prisma.tradePoint.findMany({ orderBy: { name: "asc" } }),
        prisma.product.findMany({ orderBy: { name: "asc" } }),
      ]);
      res.json({ users: users.map(publicUser), tradePoints, products });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/write-offs/transcribe", upload.single("audio"), async (req, res, next) => {
    try {
      requireAuth(req);
      const body = transcribeSchema.parse(req.body ?? {});
      if (body.mockTranscript) {
        res.json({ transcript: body.mockTranscript, provider: "mock_input" });
        return;
      }
      if (!req.file) throw new HttpError(400, "mockTranscript or audio file is required");
      res.json(await transcribeAudio(req.file));
    } catch (error) {
      next(error);
    } finally {
      if (req.file) await unlink(req.file.path).catch(() => undefined);
    }
  });

  app.post("/api/write-offs/extract", async (req, res, next) => {
    try {
      requireAuth(req);
      const { transcript } = extractSchema.parse(req.body);
      const extraction = await extractWriteOffFields(prisma, transcript);
      res.json(extraction);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/ai/test-provider", async (req, res, next) => {
    try {
      const user = requireAuth(req);
      requireReviewer(user);
      res.json(await testAiProvider());
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/write-offs", async (req, res, next) => {
    try {
      const user = requireAuth(req);
      const body = createWriteOffSchema.parse(req.body);
      const data = toWriteOffData(body);
      const costEstimate = await calculateCostEstimate(prisma, data.productId as string | null, data.quantity as number | null);
      const missingFields = validateReadyForReview({
        tradePointId: data.tradePointId as string | null,
        productId: data.productId as string | null,
        productNameFallback: data.productNameFallback as string | null,
        quantity: data.quantity as number | null,
        reason: data.reason as string | null,
        deductionType: data.deductionType as string | null,
        deductionEmployeeId: data.deductionEmployeeId as string | null,
        comment: data.comment as string | null,
        photoUrl: data.photoUrl as string | null,
      });
      const status = missingFields.length ? "missing_info" : "pending_review";
      const request = await prisma.writeOffRequest.create({
        data: {
          ...data,
          doc: `WO-${Date.now()}`,
          createdByUserId: user.id,
          status,
          costEstimate,
          missingFieldsJson: JSON.stringify(missingFields),
        },
      });

      await addEvent(prisma, {
        requestId: request.id,
        actorUserId: user.id,
        eventType: "created",
        toStatus: status,
        metadata: { missingFields },
      });
      if (request.voiceTranscript) {
        await addEvent(prisma, { requestId: request.id, actorUserId: user.id, eventType: "voice_transcribed" });
      }
      if (request.aiGeneratedComment) {
        await addEvent(prisma, { requestId: request.id, actorUserId: user.id, eventType: "ai_fields_extracted" });
      }
      if (status === "pending_review") {
        await addEvent(prisma, { requestId: request.id, actorUserId: user.id, eventType: "submitted", toStatus: status });
      }

      res.status(201).json(serializeRequest(await getFullRequest(prisma, request.id), user));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/write-offs/:id/photo", upload.single("photo"), async (req, res, next) => {
    try {
      const user = requireAuth(req);
      const request = await getRequestOrThrow(prisma, routeId(req));
      if (request.createdByUserId !== user.id && user.role !== "admin") throw new HttpError(403, "Only request creator can attach photo");
      if (!["draft", "missing_info"].includes(request.status)) throw new HttpError(409, "Photo can be changed only before review submission");

      const body = attachPhotoSchema.parse(req.body ?? {});
      const storedPhoto = !body.photoUrl && req.file ? await saveProofPhoto(req.file) : null;
      const photoUrl = body.photoUrl ?? storedPhoto?.url ?? null;
      if (!photoUrl) throw new HttpError(400, "photoUrl or photo file is required");

      const updated = await prisma.writeOffRequest.update({
        where: { id: request.id },
        data: { photoUrl },
      });
      await addEvent(prisma, {
        requestId: request.id,
        actorUserId: user.id,
        eventType: "photo_attached",
        fromStatus: request.status,
        toStatus: updated.status,
        metadata: { photoUrl, storage: storedPhoto },
      });

      res.json(serializeRequest(await getFullRequest(prisma, request.id), user));
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/write-offs/:id", async (req, res, next) => {
    try {
      const user = requireAuth(req);
      const request = await getRequestOrThrow(prisma, routeId(req));
      if (request.createdByUserId !== user.id && user.role !== "admin") throw new HttpError(403, "Only request creator can edit it");
      if (!["draft", "missing_info"].includes(request.status)) throw new HttpError(409, "Only draft or missing_info requests can be edited");

      const body = patchWriteOffSchema.parse(req.body);
      const data = toWriteOffData({ ...body, aiExtractedFields: body.aiExtractedFields ?? {}, missingFields: body.missingFields ?? [] });
      const nextData = { ...request, ...data };
      const missingFields = validateReadyForReview({
        tradePointId: nextData.tradePointId as string | null,
        productId: nextData.productId as string | null,
        productNameFallback: nextData.productNameFallback as string | null,
        quantity: nextData.quantity as number | null,
        reason: nextData.reason as string | null,
        deductionType: nextData.deductionType as string | null,
        deductionEmployeeId: nextData.deductionEmployeeId as string | null,
        comment: nextData.comment as string | null,
        photoUrl: nextData.photoUrl as string | null,
      });

      await prisma.writeOffRequest.update({
        where: { id: request.id },
        data: {
          ...data,
          status: body.status ?? (missingFields.length ? "missing_info" : request.status),
          missingFieldsJson: JSON.stringify(missingFields),
          costEstimate: await calculateCostEstimate(prisma, nextData.productId as string | null, nextData.quantity as number | null),
        },
      });
      await addEvent(prisma, {
        requestId: request.id,
        actorUserId: user.id,
        eventType: "missing_info_requested",
        fromStatus: request.status,
        toStatus: missingFields.length ? "missing_info" : request.status,
        metadata: { missingFields },
      });

      res.json(serializeRequest(await getFullRequest(prisma, request.id), user));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/write-offs/:id/submit", async (req, res, next) => {
    try {
      const user = requireAuth(req);
      const request = await getRequestOrThrow(prisma, routeId(req));
      if (request.createdByUserId !== user.id && user.role !== "admin") throw new HttpError(403, "Only request creator can submit it");
      if (!["draft", "missing_info"].includes(request.status)) throw new HttpError(409, "Only draft or missing_info requests can be submitted");

      const missingFields = validateReadyForReview(request);
      if (missingFields.length) {
        await prisma.writeOffRequest.update({
          where: { id: request.id },
          data: { status: "missing_info", missingFieldsJson: JSON.stringify(missingFields) },
        });
        await addEvent(prisma, {
          requestId: request.id,
          actorUserId: user.id,
          eventType: "missing_info_requested",
          fromStatus: request.status,
          toStatus: "missing_info",
          metadata: { missingFields },
        });
        throw new HttpError(422, "Request is missing required fields", { missingFields });
      }

      await prisma.writeOffRequest.update({
        where: { id: request.id },
        data: { status: "pending_review", missingFieldsJson: "[]" },
      });
      await addEvent(prisma, {
        requestId: request.id,
        actorUserId: user.id,
        eventType: "submitted",
        fromStatus: request.status,
        toStatus: "pending_review",
      });

      res.json(serializeRequest(await getFullRequest(prisma, request.id), user));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/me/write-offs", async (req, res, next) => {
    try {
      const user = requireAuth(req);
      const requests = await prisma.writeOffRequest.findMany({
        where: { createdByUserId: user.id },
        orderBy: { createdAt: "desc" },
        include: { createdBy: true, product: true, tradePoint: true, events: true, syncLogs: true },
      });
      res.json({ items: requests.map((request) => serializeRequest(request, user)) });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/reviewer/write-offs", async (req, res, next) => {
    try {
      const user = requireAuth(req);
      requireReviewer(user);
      const query = reviewerListSchema.parse(req.query);
      const where = cleanObject({
        status: query.status,
        tradePointId: query.tradePointId,
        createdByUserId: query.employeeId,
        deductionType: query.deductionType,
        createdAt:
          query.dateFrom || query.dateTo
            ? cleanObject({
                gte: query.dateFrom ? new Date(query.dateFrom) : undefined,
                lte: query.dateTo ? new Date(query.dateTo) : undefined,
              })
            : undefined,
      });
      const requests = await prisma.writeOffRequest.findMany({
        where,
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        include: { createdBy: true, reviewedBy: true, product: true, tradePoint: true, syncLogs: true },
      });
      res.json({ items: requests.map((request) => serializeRequest(request, user)) });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/write-offs/:id", async (req, res, next) => {
    try {
      const user = requireAuth(req);
      const fullRequest = await getFullRequest(prisma, routeId(req));
      const isReviewer = REVIEWER_ROLES.includes(user.role as (typeof REVIEWER_ROLES)[number]);
      if (fullRequest.createdByUserId !== user.id && !isReviewer) {
        throw new HttpError(403, "Only the request creator or a reviewer can view this write-off");
      }
      res.json(serializeRequest(fullRequest, user));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/write-offs/:id/approve", async (req, res, next) => {
    try {
      const user = requireAuth(req);
      requireReviewer(user);
      const request = await getRequestOrThrow(prisma, routeId(req));
      if (request.createdByUserId === user.id) throw new HttpError(403, "Employee cannot approve their own request");
      if (request.status !== "pending_review") throw new HttpError(409, "Only pending_review requests can be approved");

      await prisma.writeOffRequest.update({
        where: { id: request.id },
        data: {
          status: "approved",
          reviewedByUserId: user.id,
          reviewedAt: new Date(),
          rejectionReason: null,
        },
      });
      await addEvent(prisma, {
        requestId: request.id,
        actorUserId: user.id,
        eventType: "approved",
        fromStatus: request.status,
        toStatus: "approved",
      });

      const synced = await syncToIiko(prisma, request.id, user);
      res.json(serializeRequest(await getFullRequest(prisma, synced.id), user));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/write-offs/:id/reject", async (req, res, next) => {
    try {
      const user = requireAuth(req);
      requireReviewer(user);
      const body = rejectSchema.parse(req.body);
      const request = await getRequestOrThrow(prisma, routeId(req));
      if (request.createdByUserId === user.id) throw new HttpError(403, "Employee cannot reject their own request");
      if (request.status !== "pending_review") throw new HttpError(409, "Only pending_review requests can be rejected");

      await prisma.writeOffRequest.update({
        where: { id: request.id },
        data: {
          status: "rejected",
          reviewedByUserId: user.id,
          reviewedAt: new Date(),
          rejectionReason: body.reason,
        },
      });
      await addEvent(prisma, {
        requestId: request.id,
        actorUserId: user.id,
        eventType: "rejected",
        fromStatus: request.status,
        toStatus: "rejected",
        metadata: { reason: body.reason },
      });

      res.json(serializeRequest(await getFullRequest(prisma, request.id), user));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/iiko/sync-logs", async (req, res, next) => {
    try {
      const user = requireAuth(req);
      requireReviewer(user);
      const logs = await prisma.iikoSyncLog.findMany({
        orderBy: { createdAt: "desc" },
        include: { request: { include: { product: true, tradePoint: true, createdBy: true } } },
      });
      res.json({
        items: logs.map((log) => ({
          ...log,
          payload: JSON.parse(log.payloadJson),
          response: log.responseJson ? JSON.parse(log.responseJson) : null,
          payloadJson: undefined,
          responseJson: undefined,
        })),
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/iiko/test-connection", async (req, res, next) => {
    try {
      const user = requireAuth(req);
      requireReviewer(user);
      res.json(await testIikoConnection());
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/iiko/retry/:requestId", async (req, res, next) => {
    try {
      const user = requireAuth(req);
      requireReviewer(user);
      const request = await getRequestOrThrow(prisma, routeId(req, "requestId"));
      if (request.status !== "iiko_sync_failed") throw new HttpError(409, "Only failed Iiko sync can be retried");

      await prisma.writeOffRequest.update({
        where: { id: request.id },
        data: { status: "approved", iikoSyncStatus: "idle" },
      });
      const synced = await syncToIiko(prisma, request.id, user);
      res.json(serializeRequest(await getFullRequest(prisma, synced.id), user));
    } catch (error) {
      next(error);
    }
  });

  const distDir = path.resolve(process.cwd(), "dist");
  const indexHtml = path.join(distDir, "index.html");
  if (existsSync(indexHtml)) {
    app.use(express.static(distDir));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api/") || req.path.startsWith("/uploads/")) {
        next();
        return;
      }
      res.sendFile(indexHtml);
    });
  }

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    sendError(res, error);
  });

  return app;
}
