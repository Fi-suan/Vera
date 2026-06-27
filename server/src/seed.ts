import type { PrismaClient } from "@prisma/client";
import { fileURLToPath } from "node:url";
import { hashPassword } from "./auth";
import { getPrisma } from "./db";

export const demoUsers = [
  { id: "u-employee-aigerim", name: "Aigerim Yusupova", email: "aigerim@vera.demo", role: "employee", tradePointId: "tp-aktau", iikoEmployeeId: "iiko-emp-aigerim" },
  { id: "u-employee-daniyar", name: "Daniyar Sembin", email: "daniyar@vera.demo", role: "employee", tradePointId: "tp-dostyk", iikoEmployeeId: "iiko-emp-daniyar" },
  { id: "u-employee-madina", name: "Madina Karimova", email: "madina@vera.demo", role: "employee", tradePointId: "tp-aktau", iikoEmployeeId: "iiko-emp-madina" },
  { id: "u-reviewer-zarina", name: "Zarina Omarova", email: "zarina@vera.demo", role: "reviewer", tradePointId: null, iikoEmployeeId: "iiko-reviewer-zarina" },
  { id: "u-admin", name: "VERA Admin", email: "admin@vera.demo", role: "admin", tradePointId: null, iikoEmployeeId: null },
];

export const demoPassword = "VeraDemo2026!";

export const demoTradePoints = [
  { id: "tp-aktau", name: "Aktau Mall", address: "Aktau Mall food court", iikoDepartmentId: "iiko-dept-aktau" },
  { id: "tp-dostyk", name: "Dostyk Plaza", address: "Dostyk Plaza, Almaty", iikoDepartmentId: "iiko-dept-dostyk" },
  { id: "tp-mega", name: "Mega Silk Way", address: "Mega Silk Way, Astana", iikoDepartmentId: "iiko-dept-mega" },
  { id: "tp-esentai", name: "Esentai Gourmet", address: "Esentai Mall, Almaty", iikoDepartmentId: "iiko-dept-esentai" },
];

export const demoProducts = [
  { id: "p-beef-cutlets", name: "Beef cutlets", category: "Meat", unit: "pcs", costPrice: 710, iikoProductId: "iiko-product-beef-cutlets" },
  { id: "p-chicken-fillet", name: "Chicken fillet", category: "Meat", unit: "kg", costPrice: 2200, iikoProductId: "iiko-product-chicken-fillet" },
  { id: "p-mozzarella", name: "Mozzarella", category: "Dairy", unit: "kg", costPrice: 4480, iikoProductId: "iiko-product-mozzarella" },
  { id: "p-cream", name: "Heavy cream", category: "Dairy", unit: "L", costPrice: 1650, iikoProductId: "iiko-product-heavy-cream" },
  { id: "p-croissants", name: "Croissants", category: "Bakery", unit: "pcs", costPrice: 315, iikoProductId: "iiko-product-croissants" },
  { id: "p-sourdough", name: "Sourdough loaf", category: "Bakery", unit: "pcs", costPrice: 980, iikoProductId: "iiko-product-sourdough" },
  { id: "p-tomatoes", name: "Cherry tomatoes", category: "Produce", unit: "kg", costPrice: 1280, iikoProductId: "iiko-product-cherry-tomatoes" },
  { id: "p-avocado", name: "Avocado", category: "Produce", unit: "pcs", costPrice: 690, iikoProductId: "iiko-product-avocado" },
  { id: "p-salmon", name: "Salmon fillet", category: "Seafood", unit: "kg", costPrice: 9550, iikoProductId: "iiko-product-salmon" },
  { id: "p-caesar", name: "Caesar bowls", category: "Prepared", unit: "pcs", costPrice: 1740, iikoProductId: "iiko-product-caesar-bowls" },
];

async function createEvent(prisma: PrismaClient, requestId: string, eventType: string, toStatus: string, actorUserId = "u-employee-aigerim") {
  await prisma.requestEvent.create({
    data: {
      requestId,
      actorUserId,
      eventType,
      toStatus,
      metadataJson: "{}",
    },
  });
}

export async function seedDemo(prisma: PrismaClient) {
  await prisma.iikoSyncLog.deleteMany();
  await prisma.requestEvent.deleteMany();
  await prisma.writeOffRequest.deleteMany();
  await prisma.user.deleteMany();
  await prisma.product.deleteMany();
  await prisma.tradePoint.deleteMany();

  await prisma.tradePoint.createMany({ data: demoTradePoints });
  await prisma.product.createMany({ data: demoProducts });
  const passwordHash = await hashPassword(demoPassword);
  await prisma.user.createMany({ data: demoUsers.map((user) => ({ ...user, passwordHash })) });

  const now = Date.now();
  const requests = [
    {
      id: "wo-pending-cutlets",
      doc: "WO-20480",
      createdByUserId: "u-employee-aigerim",
      tradePointId: "tp-aktau",
      productId: "p-beef-cutlets",
      quantity: 3,
      unit: "pcs",
      reason: "Fell on the floor during order assembly",
      deductionType: "without_deduction",
      comment: "3 beef cutlets fell on the floor during order assembly and cannot be reused per sanitary rules.",
      photoUrl: "https://images.unsplash.com/photo-1466637574441-749b8f19452f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900",
      voiceTranscript: "Write off 3 cutlets, they fell on the floor during assembly, Aktau Mall, without deduction.",
      aiGeneratedComment: "3 beef cutlets fell on the floor during order assembly and cannot be reused per sanitary rules.",
      aiConfidenceScore: 0.92,
      status: "pending_review",
      costEstimate: 2130,
      createdAt: new Date(now - 40 * 60 * 1000),
    },
    {
      id: "wo-pending-mozzarella",
      doc: "WO-20481",
      createdByUserId: "u-employee-daniyar",
      tradePointId: "tp-dostyk",
      productId: "p-mozzarella",
      quantity: 1.2,
      unit: "kg",
      reason: "Expired shelf life found at morning check",
      deductionType: "with_deduction",
      deductionEmployeeId: "u-employee-daniyar",
      comment: "1.2 kg mozzarella past shelf life, removed during the morning stock check.",
      photoUrl: "https://images.unsplash.com/photo-1591189863430-ab87e120f312?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900",
      aiGeneratedComment: "1.2 kg mozzarella past shelf life, removed during the morning stock check.",
      aiConfidenceScore: 0.88,
      status: "pending_review",
      costEstimate: 5376,
      createdAt: new Date(now - 90 * 60 * 1000),
    },
    {
      id: "wo-synced-croissants",
      doc: "WO-20482",
      createdByUserId: "u-employee-madina",
      tradePointId: "tp-aktau",
      productId: "p-croissants",
      quantity: 6,
      unit: "pcs",
      reason: "Over-baked and burned in the oven",
      deductionType: "without_deduction",
      comment: "6 croissants over-baked and burned, not suitable for sale.",
      photoUrl: "https://images.unsplash.com/photo-1503810473512-f64b56827964?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900",
      aiGeneratedComment: "6 croissants over-baked and burned, not suitable for sale.",
      aiConfidenceScore: 0.9,
      status: "synced_to_iiko",
      reviewedByUserId: "u-reviewer-zarina",
      reviewedAt: new Date(now - 4 * 60 * 60 * 1000),
      iikoSyncStatus: "synced",
      iikoDocumentId: "WR-2026-20482",
      costEstimate: 1890,
      createdAt: new Date(now - 5 * 60 * 60 * 1000),
    },
    {
      id: "wo-rejected-tomatoes",
      doc: "WO-20483",
      createdByUserId: "u-employee-aigerim",
      tradePointId: "tp-mega",
      productId: "p-tomatoes",
      quantity: 4,
      unit: "kg",
      reason: "Crushed and spoiled on delivery",
      deductionType: "without_deduction",
      comment: "4 kg cherry tomatoes crushed and spoiled on arrival from the supplier.",
      photoUrl: "https://images.unsplash.com/photo-1503810473512-f64b56827964?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900",
      status: "rejected",
      reviewedByUserId: "u-reviewer-zarina",
      reviewedAt: new Date(now - 22 * 60 * 60 * 1000),
      rejectionReason: "Photo unclear: please retake with damage clearly visible.",
      costEstimate: 5120,
      createdAt: new Date(now - 24 * 60 * 60 * 1000),
    },
    {
      id: "wo-failed-caesar",
      doc: "WO-20484",
      createdByUserId: "u-employee-aigerim",
      tradePointId: "tp-aktau",
      productId: "p-caesar",
      quantity: 5,
      unit: "pcs",
      reason: "Prepared in excess, end of day, sync fail",
      deductionType: "with_deduction",
      deductionEmployeeId: "u-employee-aigerim",
      comment: "5 Caesar bowls prepared in excess and unsold at end of day.",
      photoUrl: "https://images.unsplash.com/photo-1466637574441-749b8f19452f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900",
      status: "iiko_sync_failed",
      reviewedByUserId: "u-reviewer-zarina",
      reviewedAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
      iikoSyncStatus: "failed",
      costEstimate: 8700,
      createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const request of requests) {
    await prisma.writeOffRequest.create({
      data: {
        ...request,
        aiExtractedFieldsJson: "{}",
        missingFieldsJson: "[]",
      },
    });
    await createEvent(prisma, request.id, "created", request.status, request.createdByUserId);
    if (request.status === "pending_review") {
      await createEvent(prisma, request.id, "submitted", "pending_review", request.createdByUserId);
    }
  }

  await prisma.iikoSyncLog.create({
    data: {
      requestId: "wo-synced-croissants",
      status: "synced",
      payloadJson: JSON.stringify({ departmentId: "iiko-dept-aktau", items: [{ productId: "iiko-product-croissants", amount: 6, unit: "pcs" }] }),
      responseJson: JSON.stringify({ status: "synced", iikoDocumentId: "WR-2026-20482" }),
      iikoDocumentId: "WR-2026-20482",
    },
  });

  await prisma.iikoSyncLog.create({
    data: {
      requestId: "wo-failed-caesar",
      status: "failed",
      payloadJson: JSON.stringify({ departmentId: "iiko-dept-aktau", items: [{ productId: "iiko-product-caesar-bowls", amount: 5, unit: "pcs" }] }),
      errorMessage: "Mock Iiko sync failed by request content",
    },
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  seedDemo(getPrisma())
    .then(() => {
      console.log("VERA demo database seeded");
    })
    .finally(async () => {
      await getPrisma().$disconnect();
    });
}
