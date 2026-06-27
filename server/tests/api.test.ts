import { PrismaClient } from "@prisma/client";
import path from "node:path";
import { writeFile } from "node:fs/promises";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { seedDemo, seedDemoIdempotent } from "../src/seed";

process.env.DATABASE_URL ??= "file:./test.db";

const prisma = new PrismaClient();
const app = createApp({ prisma });

let employee: { authorization: string };
let reviewer: { authorization: string };

async function login(email: string) {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "VeraDemo2026!" })
    .expect(200);
  return { authorization: `Bearer ${res.body.accessToken}` };
}

describe("VERA backend MVP", () => {
  beforeAll(async () => {
    await seedDemo(prisma);
    employee = await login("aigerim@vera.demo");
    reviewer = await login("zarina@vera.demo");
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("protects write-off endpoints with bearer auth", async () => {
    await request(app)
      .post("/api/write-offs/extract")
      .send({ transcript: "Write off buns, they are damaged." })
      .expect(401);
  });

  it("serves OpenAPI contract and Swagger UI", async () => {
    const spec = await request(app)
      .get("/api/openapi.json")
      .expect(200);

    expect(spec.body.openapi).toBe("3.1.0");
    expect(spec.body.components.securitySchemes.bearerAuth.scheme).toBe("bearer");
    expect(spec.body.paths["/ready"]).toBeTruthy();
    expect(spec.body.paths["/auth/login"]).toBeTruthy();
    expect(spec.body.paths["/write-offs/{id}/approve"]).toBeTruthy();
    expect(spec.body.paths["/iiko/test-connection"]).toBeTruthy();

    const docs = await request(app)
      .get("/api/docs")
      .expect(200);
    expect(docs.text).toContain("SwaggerUIBundle");
  });

  it("reports readiness after database check", async () => {
    const res = await request(app)
      .get("/api/ready")
      .expect(200);

    expect(res.body.database).toBe("ready");
  });

  it("returns current user without exposing password hash", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set(employee)
      .expect(200);

    expect(res.body.user.email).toBe("aigerim@vera.demo");
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it("exposes AI provider status to reviewers", async () => {
    const res = await request(app)
      .post("/api/ai/test-provider")
      .set(reviewer)
      .send({})
      .expect(200);

    expect(res.body.provider).toBe("mock");
    expect(res.body.ok).toBe(true);
  });

  it("accepts mockTranscript without an audio upload", async () => {
    const res = await request(app)
      .post("/api/write-offs/transcribe")
      .set(employee)
      .send({ mockTranscript: "Списать 2 круассана на Достык, без удержания." })
      .expect(200);

    expect(res.body.transcript).toContain("круассана");
    expect(res.body.provider).toBe("mock_input");
  });

  it("extracts structured fields and missing fields from an incomplete transcript", async () => {
    const res = await request(app)
      .post("/api/write-offs/extract")
      .set(employee)
      .send({ transcript: "Write off buns, they are damaged." })
      .expect(200);

    expect(res.body.productName).toBe("Buns");
    expect(res.body.provider).toBe("mock");
    expect(res.body.reason).toBe("Damaged product");
    expect(res.body.missingFields).toContain("quantity");
    expect(res.body.missingFields).toContain("tradePointId");
    expect(res.body.missingFields).toContain("deductionType");
  });

  it("keeps incomplete requests in missing_info and rejects submit until photo is attached", async () => {
    const created = await request(app)
      .post("/api/write-offs")
      .set(employee)
      .send({
        tradePointId: "tp-aktau",
        productId: "p-beef-cutlets",
        quantity: 3,
        unit: "pcs",
        reason: "Fell on the floor during order assembly",
        deductionType: "without_deduction",
        comment: "3 beef cutlets fell on the floor and cannot be reused.",
      })
      .expect(201);

    expect(created.body.status).toBe("missing_info");
    expect(created.body.missingFields).toContain("photoUrl");

    await request(app)
      .post(`/api/write-offs/${created.body.id}/submit`)
      .set(employee)
      .send({})
      .expect(422);

    await request(app)
      .post(`/api/write-offs/${created.body.id}/photo`)
      .set(employee)
      .send({ photoUrl: "https://example.com/proof.jpg" })
      .expect(200);

    const submitted = await request(app)
      .post(`/api/write-offs/${created.body.id}/submit`)
      .set(employee)
      .send({})
      .expect(200);

    expect(submitted.body.status).toBe("pending_review");
  });

  it("stores uploaded proof photos through the storage adapter", async () => {
    const proofPath = path.resolve("/tmp", `vera-proof-${Date.now()}.jpg`);
    await writeFile(proofPath, Buffer.from([0xff, 0xd8, 0xff, 0xd9]));

    const created = await request(app)
      .post("/api/write-offs")
      .set(employee)
      .send({
        tradePointId: "tp-aktau",
        productId: "p-beef-cutlets",
        quantity: 1,
        unit: "pcs",
        reason: "Dropped during plating",
        deductionType: "without_deduction",
        comment: "1 beef cutlet dropped during plating and cannot be reused.",
      })
      .expect(201);

    const withPhoto = await request(app)
      .post(`/api/write-offs/${created.body.id}/photo`)
      .set(employee)
      .attach("photo", proofPath)
      .expect(200);

    expect(withPhoto.body.photoUrl).toMatch(/^\/uploads\/proofs\//);
    expect(withPhoto.body.events.at(-1).metadata.storage.adapter).toBe("local");
  });

  it("approves pending requests and writes mock Iiko sync logs", async () => {
    const created = await request(app)
      .post("/api/write-offs")
      .set(employee)
      .send({
        tradePointId: "tp-aktau",
        productId: "p-croissants",
        quantity: 2,
        unit: "pcs",
        reason: "Over-baked and burned",
        deductionType: "without_deduction",
        comment: "2 croissants burned in the oven and are not suitable for sale.",
        photoUrl: "https://example.com/croissants.jpg",
      })
      .expect(201);

    expect(created.body.status).toBe("pending_review");

    const approved = await request(app)
      .post(`/api/write-offs/${created.body.id}/approve`)
      .set(reviewer)
      .send({})
      .expect(200);

    expect(approved.body.status).toBe("synced_to_iiko");
    expect(approved.body.iikoSyncStatus).toBe("synced");
    expect(approved.body.iikoDocumentId).toMatch(/^WR-/);
    expect(approved.body.events.map((event: { eventType: string }) => event.eventType)).toContain("approved");
    expect(approved.body.syncLogs[0].status).toBe("synced");
  });

  it("does not allow an employee to approve their own request", async () => {
    await request(app)
      .post("/api/write-offs/wo-pending-cutlets/approve")
      .set(employee)
      .send({})
      .expect(403);
  });

  it("requires a rejection reason", async () => {
    await request(app)
      .post("/api/write-offs/wo-pending-mozzarella/reject")
      .set(reviewer)
      .send({})
      .expect(400);
  });

  it("does not let an employee read another employee's write-off", async () => {
    await request(app)
      .get("/api/write-offs/wo-synced-croissants")
      .set(employee)
      .expect(403);
  });

  it("lets the owner read their own write-off", async () => {
    await request(app)
      .get("/api/write-offs/wo-failed-caesar")
      .set(employee)
      .expect(200);
  });

  it("lets a reviewer read any write-off", async () => {
    await request(app)
      .get("/api/write-offs/wo-synced-croissants")
      .set(reviewer)
      .expect(200);
  });

  it("requires authentication for bootstrap data", async () => {
    await request(app).get("/api/bootstrap").expect(401);
    await request(app).get("/api/bootstrap").set(employee).expect(200);
  });

  it("keeps user-created write-offs when idempotent seed runs again", async () => {
    await prisma.writeOffRequest.create({
      data: {
        id: "wo-user-created-preserved",
        doc: "WO-PRESERVE-1",
        createdByUserId: "u-employee-aigerim",
        tradePointId: "tp-aktau",
        productId: "p-croissants",
        quantity: 1,
        unit: "pcs",
        reason: "Manual user-created request should survive seed",
        deductionType: "without_deduction",
        comment: "Manual user-created request should survive idempotent seed.",
        photoUrl: "https://example.com/preserve.jpg",
        status: "pending_review",
        costEstimate: 315,
      },
    });

    await seedDemoIdempotent(prisma);

    const preserved = await prisma.writeOffRequest.findUnique({ where: { id: "wo-user-created-preserved" } });
    expect(preserved?.doc).toBe("WO-PRESERVE-1");
  });

  it("filters reviewer queue by status and trade point", async () => {
    const res = await request(app)
      .get("/api/reviewer/write-offs")
      .query({ status: "pending_review", tradePointId: "tp-dostyk" })
      .set(reviewer)
      .expect(200);

    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.items.every((item: { status: string; tradePointId: string }) => item.status === "pending_review" && item.tradePointId === "tp-dostyk")).toBe(true);
    expect(res.body.items[0].ui.statusLabel).toBe("Waiting for review");
    expect(res.body.items[0].ui.actions.canApprove).toBe(true);
    expect(res.body.items[0].ui.actions.canReject).toBe(true);
    expect(res.body.items[0].ui.primaryAction).toBe("approve");
  });

  it("exposes Iiko adapter connection status to reviewers", async () => {
    const res = await request(app)
      .post("/api/iiko/test-connection")
      .set(reviewer)
      .send({})
      .expect(200);

    expect(res.body.adapter).toBe("mock");
    expect(res.body.ok).toBe(true);
  });

  it("retries failed Iiko syncs and preserves retry guard", async () => {
    const retry = await request(app)
      .post("/api/iiko/retry/wo-failed-caesar")
      .set(reviewer)
      .send({})
      .expect(200);

    expect(retry.body.status).toBe("iiko_sync_failed");
    expect(retry.body.iikoSyncStatus).toBe("failed");

    await request(app)
      .post("/api/iiko/retry/wo-synced-croissants")
      .set(reviewer)
      .send({})
      .expect(409);
  });
});
