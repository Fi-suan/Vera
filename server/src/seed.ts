import type { PrismaClient } from "@prisma/client";
import { fileURLToPath } from "node:url";
import { hashPassword } from "./auth";
import { getPrisma } from "./db";

export const demoUsers = [
  { id: "u-employee-aigerim", name: "Aigerim Yusupova", email: "aigerim@vera.demo", role: "employee", tradePointId: "tp-bahandi-turan-55d", iikoEmployeeId: "iiko-emp-aigerim" },
  { id: "u-employee-daniyar", name: "Daniyar Sembin", email: "daniyar@vera.demo", role: "employee", tradePointId: "tp-bahandi-khan-shatyr", iikoEmployeeId: "iiko-emp-daniyar" },
  { id: "u-employee-madina", name: "Madina Karimova", email: "madina@vera.demo", role: "employee", tradePointId: "tp-bahandi-mega-silk-way", iikoEmployeeId: "iiko-emp-madina" },
  { id: "u-reviewer-zarina", name: "Zarina Omarova", email: "zarina@vera.demo", role: "reviewer", tradePointId: null, iikoEmployeeId: "iiko-reviewer-zarina" },
  { id: "u-admin", name: "VERA Admin", email: "admin@vera.demo", role: "admin", tradePointId: null, iikoEmployeeId: null },
];

export const demoPassword = "VeraDemo2026!";

export const demoTradePoints = [
  { id: "tp-bahandi-turan-55d", name: "Bahandi Astana — Turan 55d", address: "Проспект Туран, 55д киоск, Астана", iikoDepartmentId: "iiko-dept-bahandi-turan-55d" },
  { id: "tp-bahandi-zhenis-28", name: "Bahandi Astana — Zhenis 28", address: "Проспект Женис, 28, Астана", iikoDepartmentId: "iiko-dept-bahandi-zhenis-28" },
  { id: "tp-bahandi-temirkazyk-2b", name: "Bahandi Astana — Temirkazyk 2B", address: "Улица Темирказык, 2Б, Астана", iikoDepartmentId: "iiko-dept-bahandi-temirkazyk-2b" },
  { id: "tp-bahandi-khan-shatyr", name: "Bahandi Astana — Khan Shatyr", address: "Хан Шатыр, проспект Туран, 37, Астана", iikoDepartmentId: "iiko-dept-bahandi-khan-shatyr" },
  { id: "tp-bahandi-mangilik-el-56", name: "Bahandi Astana — Mangilik El 56", address: "Проспект Мангилик Ел, 56, Астана", iikoDepartmentId: "iiko-dept-bahandi-mangilik-el-56" },
  { id: "tp-bahandi-imanova-3", name: "Bahandi Astana — Imanova 3", address: "Амангельды Иманова улица, 3 киоск, Астана", iikoDepartmentId: "iiko-dept-bahandi-imanova-3" },
  { id: "tp-bahandi-asia-park", name: "Bahandi Astana — Asia Park", address: "ТРЦ Asia Park, Кабанбай батыр проспект, 21, Астана", iikoDepartmentId: "iiko-dept-bahandi-asia-park" },
  { id: "tp-bahandi-tauelsizdik-34-7", name: "Bahandi Astana — Tauelsizdik 34/7", address: "Проспект Тауелсиздик, 34/7, Астана", iikoDepartmentId: "iiko-dept-bahandi-tauelsizdik-34-7" },
  { id: "tp-bahandi-mega-silk-way", name: "Bahandi Astana — Mega Silk Way", address: "ТРЦ MEGA Silk Way, Кабанбай батыр проспект, 62, Астана", iikoDepartmentId: "iiko-dept-bahandi-mega-silk-way" },
  { id: "tp-bahandi-edil-26", name: "Bahandi Astana — Edil 26", address: "Улица Едил, 26, Астана", iikoDepartmentId: "iiko-dept-bahandi-edil-26" },
  { id: "tp-bahandi-petrova-22g", name: "Bahandi Astana — Petrova 22g", address: "Улица Алексея Петрова, 22г, Астана", iikoDepartmentId: "iiko-dept-bahandi-petrova-22g" },
  { id: "tp-bahandi-nazhimedenov-26", name: "Bahandi Astana — Nazhimedenov 26", address: "Улица Жумекен Нажимеденов, 26, Астана", iikoDepartmentId: "iiko-dept-bahandi-nazhimedenov-26" },
  { id: "tp-bahandi-aruzhan", name: "Bahandi Astana — Aruzhan", address: "ТРЦ Аружан, Илияса Жансугурова улица, 8/1, Астана", iikoDepartmentId: "iiko-dept-bahandi-aruzhan" },
  { id: "tp-bahandi-baitursynuly-34", name: "Bahandi Astana — Baitursynuly 34", address: "Улица Ахмет Байтурсынулы, 34, Астана", iikoDepartmentId: "iiko-dept-bahandi-baitursynuly-34" },
];

export const archivedTradePoints = [
  { id: "tp-bahandi-syganak-1b-2", name: "Bahandi Astana — Syganak 1B/2", address: "Улица Сыганак, 1Б/2, Астана", status: "archived" as const },
];

export const demoProducts = [
  { id: "p-bahandi-p001", name: "Бургер говядина", category: "Burger", unit: "pcs", costPrice: 735, iikoProductId: "iiko-product-bahandi-p001" },
  { id: "p-bahandi-p002", name: "Бургер говядина х2", category: "Burger", unit: "pcs", costPrice: 1165, iikoProductId: "iiko-product-bahandi-p002" },
  { id: "p-bahandi-p003", name: "Чизбургер говядина", category: "Burger", unit: "pcs", costPrice: 830, iikoProductId: "iiko-product-bahandi-p003" },
  { id: "p-bahandi-p004", name: "Чизбургер говядина х2", category: "Burger", unit: "pcs", costPrice: 1260, iikoProductId: "iiko-product-bahandi-p004" },
  { id: "p-bahandi-p005", name: "Бургер курица", category: "Burger", unit: "pcs", costPrice: 625, iikoProductId: "iiko-product-bahandi-p005" },
  { id: "p-bahandi-p006", name: "Бургер курица х2", category: "Burger", unit: "pcs", costPrice: 945, iikoProductId: "iiko-product-bahandi-p006" },
  { id: "p-bahandi-p007", name: "Чизбургер курица", category: "Burger", unit: "pcs", costPrice: 720, iikoProductId: "iiko-product-bahandi-p007" },
  { id: "p-bahandi-p008", name: "Чизбургер курица х2", category: "Burger", unit: "pcs", costPrice: 1040, iikoProductId: "iiko-product-bahandi-p008" },
  { id: "p-bahandi-p009", name: "Бургер микс x2", category: "Burger", unit: "pcs", costPrice: 1055, iikoProductId: "iiko-product-bahandi-p009" },
  { id: "p-bahandi-p010", name: "Чизбургер микс x2", category: "Burger", unit: "pcs", costPrice: 1150, iikoProductId: "iiko-product-bahandi-p010" },
  { id: "p-bahandi-p011", name: "Картофель фри", category: "Side", unit: "pcs", costPrice: 300, iikoProductId: "iiko-product-bahandi-p011" },
  { id: "p-bahandi-p012", name: "Комбо чизбургер говядина", category: "Combo", unit: "pcs", costPrice: 1610, iikoProductId: "iiko-product-bahandi-p012" },
  { id: "p-bahandi-p013", name: "Комбо чизбургер говядина х2", category: "Combo", unit: "pcs", costPrice: 2040, iikoProductId: "iiko-product-bahandi-p013" },
  { id: "p-bahandi-p014", name: "Комбо чизбургер курица", category: "Combo", unit: "pcs", costPrice: 1500, iikoProductId: "iiko-product-bahandi-p014" },
  { id: "p-bahandi-p015", name: "Комбо чизбургер курица х2", category: "Combo", unit: "pcs", costPrice: 1820, iikoProductId: "iiko-product-bahandi-p015" },
  { id: "p-bahandi-p016", name: "Комбо чизбургер микс x2", category: "Combo", unit: "pcs", costPrice: 1930, iikoProductId: "iiko-product-bahandi-p016" },
  { id: "p-bahandi-p017", name: "Coca-cola 0,5 л", category: "Drink", unit: "bottle", costPrice: 320, iikoProductId: "iiko-product-bahandi-p017" },
  { id: "p-bahandi-p018", name: "Coca-cola 1 л", category: "Drink", unit: "bottle", costPrice: 550, iikoProductId: "iiko-product-bahandi-p018" },
  { id: "p-bahandi-p019", name: "Coca-cola без сахара", category: "Drink", unit: "bottle", costPrice: 320, iikoProductId: "iiko-product-bahandi-p019" },
  { id: "p-bahandi-p020", name: "Fanta", category: "Drink", unit: "bottle", costPrice: 320, iikoProductId: "iiko-product-bahandi-p020" },
  { id: "p-bahandi-p021", name: "Sprite", category: "Drink", unit: "bottle", costPrice: 320, iikoProductId: "iiko-product-bahandi-p021" },
  { id: "p-bahandi-p022", name: "Fuse tea", category: "Drink", unit: "bottle", costPrice: 330, iikoProductId: "iiko-product-bahandi-p022" },
  { id: "p-bahandi-p023", name: "Bonaqua", category: "Drink", unit: "bottle", costPrice: 190, iikoProductId: "iiko-product-bahandi-p023" },
  { id: "p-bahandi-p024", name: "Piko", category: "Drink", unit: "pack", costPrice: 210, iikoProductId: "iiko-product-bahandi-p024" },
  { id: "p-bahandi-p025", name: "Компот Bahandi", category: "Drink", unit: "cup", costPrice: 250, iikoProductId: "iiko-product-bahandi-p025" },
  { id: "p-bahandi-p026", name: "Айран", category: "Drink", unit: "bottle", costPrice: 220, iikoProductId: "iiko-product-bahandi-p026" },
  { id: "p-bahandi-p027", name: "Schweppes", category: "Drink", unit: "bottle", costPrice: 430, iikoProductId: "iiko-product-bahandi-p027" },
  { id: "p-bahandi-p028", name: "Соус барбекью 25 г", category: "Add-on", unit: "pcs", costPrice: 95, iikoProductId: "iiko-product-bahandi-p028" },
  { id: "p-bahandi-p029", name: "Соус кетчуп 25 г", category: "Add-on", unit: "pcs", costPrice: 90, iikoProductId: "iiko-product-bahandi-p029" },
  { id: "p-bahandi-p030", name: "Соус сырный 25 г", category: "Add-on", unit: "pcs", costPrice: 100, iikoProductId: "iiko-product-bahandi-p030" },
  { id: "p-bahandi-p031", name: "Халапеньо", category: "Add-on", unit: "portion", costPrice: 85, iikoProductId: "iiko-product-bahandi-p031" },
  { id: "p-bahandi-p032", name: "Сыр Гауда 25 г", category: "Add-on", unit: "pcs", costPrice: 95, iikoProductId: "iiko-product-bahandi-p032" },
];

const legacyDemoTradePointIds = ["tp-aktau", "tp-dostyk", "tp-mega", "tp-esentai"];
const legacyDemoProductIds = [
  "p-beef-cutlets",
  "p-chicken-fillet",
  "p-mozzarella",
  "p-cream",
  "p-croissants",
  "p-sourdough",
  "p-tomatoes",
  "p-avocado",
  "p-salmon",
  "p-caesar",
];

async function createEvent(prisma: PrismaClient, requestId: string, eventType: string, toStatus: string, actorUserId = "u-employee-aigerim") {
  const existing = await prisma.requestEvent.findFirst({ where: { requestId, eventType, toStatus } });
  if (existing) return;
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

async function seedReferenceData(prisma: PrismaClient) {
  const passwordHash = await hashPassword(demoPassword);

  for (const tradePoint of demoTradePoints) {
    await prisma.tradePoint.upsert({
      where: { id: tradePoint.id },
      create: tradePoint,
      update: tradePoint,
    });
  }

  for (const product of demoProducts) {
    await prisma.product.upsert({
      where: { id: product.id },
      create: product,
      update: product,
    });
  }

  for (const user of demoUsers) {
    await prisma.user.upsert({
      where: { id: user.id },
      create: { ...user, passwordHash },
      update: { ...user, passwordHash },
    });
  }

  await prisma.product.deleteMany({ where: { id: { in: legacyDemoProductIds } } });
  await prisma.tradePoint.deleteMany({ where: { id: { in: legacyDemoTradePointIds } } });
}

async function seedSampleWriteOffs(prisma: PrismaClient) {
  const now = Date.now();
  const requests = [
    {
      id: "wo-pending-cutlets",
      doc: "WO-20480",
      createdByUserId: "u-employee-aigerim",
      tradePointId: "tp-bahandi-turan-55d",
      productId: "p-bahandi-p008",
      quantity: 2,
      unit: "pcs",
      reason: "Wrong order assembled during rush hour",
      deductionType: "without_deduction",
      comment: "2 чизбургера курица х2 were assembled for the wrong order and cannot be sold after handoff.",
      photoUrl: "https://images.unsplash.com/photo-1466637574441-749b8f19452f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900",
      voiceTranscript: "Списать 2 чизбургера курица х2 на Bahandi Turan 55d, ошибочный заказ, без удержания.",
      aiGeneratedComment: "2 чизбургера курица х2 were assembled for the wrong order and cannot be sold after handoff.",
      aiConfidenceScore: 0.92,
      status: "pending_review",
      costEstimate: 2080,
      createdAt: new Date(now - 40 * 60 * 1000),
    },
    {
      id: "wo-pending-mozzarella",
      doc: "WO-20481",
      createdByUserId: "u-employee-daniyar",
      tradePointId: "tp-bahandi-khan-shatyr",
      productId: "p-bahandi-p011",
      quantity: 3,
      unit: "pcs",
      reason: "Cold and unsold after holding time",
      deductionType: "with_deduction",
      deductionEmployeeId: "u-employee-daniyar",
      comment: "3 portions of fries exceeded holding time and were cold at counter check.",
      photoUrl: "https://images.unsplash.com/photo-1591189863430-ab87e120f312?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900",
      aiGeneratedComment: "3 portions of fries exceeded holding time and were cold at counter check.",
      aiConfidenceScore: 0.88,
      status: "pending_review",
      costEstimate: 900,
      createdAt: new Date(now - 90 * 60 * 1000),
    },
    {
      id: "wo-synced-croissants",
      doc: "WO-20482",
      createdByUserId: "u-employee-madina",
      tradePointId: "tp-bahandi-mega-silk-way",
      productId: "p-bahandi-p017",
      quantity: 4,
      unit: "bottle",
      reason: "Damaged bottles found during stock handover",
      deductionType: "without_deduction",
      comment: "4 Coca-cola 0,5 л bottles were damaged during stock handover and removed from sale.",
      photoUrl: "https://images.unsplash.com/photo-1503810473512-f64b56827964?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900",
      aiGeneratedComment: "4 Coca-cola 0,5 л bottles were damaged during stock handover and removed from sale.",
      aiConfidenceScore: 0.9,
      status: "synced_to_iiko",
      reviewedByUserId: "u-reviewer-zarina",
      reviewedAt: new Date(now - 4 * 60 * 60 * 1000),
      iikoSyncStatus: "synced",
      iikoDocumentId: "WR-2026-20482",
      costEstimate: 1280,
      createdAt: new Date(now - 5 * 60 * 60 * 1000),
    },
    {
      id: "wo-rejected-tomatoes",
      doc: "WO-20483",
      createdByUserId: "u-employee-aigerim",
      tradePointId: "tp-bahandi-zhenis-28",
      productId: "p-bahandi-p012",
      quantity: 1,
      unit: "pcs",
      reason: "Returned combo without clear proof photo",
      deductionType: "without_deduction",
      comment: "1 комбо чизбургер говядина was returned, but the proof photo does not show the item clearly.",
      photoUrl: "https://images.unsplash.com/photo-1503810473512-f64b56827964?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900",
      status: "rejected",
      reviewedByUserId: "u-reviewer-zarina",
      reviewedAt: new Date(now - 22 * 60 * 60 * 1000),
      rejectionReason: "Photo unclear: please retake with damage clearly visible.",
      costEstimate: 1610,
      createdAt: new Date(now - 24 * 60 * 60 * 1000),
    },
    {
      id: "wo-failed-caesar",
      doc: "WO-20484",
      createdByUserId: "u-employee-aigerim",
      tradePointId: "tp-bahandi-turan-55d",
      productId: "p-bahandi-p003",
      quantity: 5,
      unit: "pcs",
      reason: "Prepared in excess at end of day, sync fail",
      deductionType: "with_deduction",
      deductionEmployeeId: "u-employee-aigerim",
      comment: "5 чизбургеров говядина were prepared in excess and unsold at end of day.",
      photoUrl: "https://images.unsplash.com/photo-1466637574441-749b8f19452f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900",
      status: "iiko_sync_failed",
      reviewedByUserId: "u-reviewer-zarina",
      reviewedAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
      iikoSyncStatus: "failed",
      costEstimate: 4150,
      createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const request of requests) {
    await prisma.writeOffRequest.upsert({
      where: { id: request.id },
      create: {
        ...request,
        aiExtractedFieldsJson: "{}",
        missingFieldsJson: "[]",
      },
      update: {
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

  const syncedLog = await prisma.iikoSyncLog.findFirst({ where: { requestId: "wo-synced-croissants", status: "synced" } });
  if (!syncedLog) {
    await prisma.iikoSyncLog.create({
      data: {
        requestId: "wo-synced-croissants",
        status: "synced",
        payloadJson: JSON.stringify({ departmentId: "iiko-dept-bahandi-mega-silk-way", items: [{ productId: "iiko-product-bahandi-p017", amount: 4, unit: "bottle" }] }),
        responseJson: JSON.stringify({ status: "synced", iikoDocumentId: "WR-2026-20482" }),
        iikoDocumentId: "WR-2026-20482",
      },
    });
  }

  const failedLog = await prisma.iikoSyncLog.findFirst({ where: { requestId: "wo-failed-caesar", status: "failed" } });
  if (!failedLog) {
    await prisma.iikoSyncLog.create({
      data: {
        requestId: "wo-failed-caesar",
        status: "failed",
        payloadJson: JSON.stringify({ departmentId: "iiko-dept-bahandi-turan-55d", items: [{ productId: "iiko-product-bahandi-p003", amount: 5, unit: "pcs" }] }),
        errorMessage: "Mock Iiko sync failed by request content",
      },
    });
  }
}

export async function seedDemo(prisma: PrismaClient) {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DESTRUCTIVE_SEED !== "true") {
    throw new Error(
      "Refusing to run the destructive demo seed in production. Set ALLOW_DESTRUCTIVE_SEED=true to override (this wipes all data).",
    );
  }

  await prisma.iikoSyncLog.deleteMany();
  await prisma.requestEvent.deleteMany();
  await prisma.writeOffRequest.deleteMany();
  await prisma.user.deleteMany();
  await prisma.product.deleteMany();
  await prisma.tradePoint.deleteMany();

  await seedReferenceData(prisma);
  await seedSampleWriteOffs(prisma);
}

export async function seedDemoIdempotent(prisma: PrismaClient) {
  await seedReferenceData(prisma);
  await seedSampleWriteOffs(prisma);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const seed = process.env.SEED_MODE === "reset" || process.env.ALLOW_DESTRUCTIVE_SEED === "true" ? seedDemo : seedDemoIdempotent;
  seed(getPrisma())
    .then(() => {
      console.log(process.env.SEED_MODE === "reset" || process.env.ALLOW_DESTRUCTIVE_SEED === "true" ? "VERA demo database reset and seeded" : "VERA demo reference data is ready");
    })
    .finally(async () => {
      await getPrisma().$disconnect();
    });
}
