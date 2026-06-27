import { getPrisma } from "./db";
import { fileURLToPath } from "node:url";

const statements = [
  `CREATE TABLE IF NOT EXISTS "TradePoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "iikoDepartmentId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "costPrice" REAL NOT NULL,
    "iikoProductId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL,
    "tradePointId" TEXT,
    "iikoEmployeeId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_tradePointId_fkey" FOREIGN KEY ("tradePointId") REFERENCES "TradePoint" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"("phone")`,
  `CREATE TABLE IF NOT EXISTS "WriteOffRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "doc" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "tradePointId" TEXT,
    "productId" TEXT,
    "productNameFallback" TEXT,
    "quantity" REAL,
    "unit" TEXT,
    "reason" TEXT,
    "deductionType" TEXT,
    "deductionEmployeeId" TEXT,
    "comment" TEXT,
    "photoUrl" TEXT,
    "voiceTranscript" TEXT,
    "aiExtractedFieldsJson" TEXT NOT NULL DEFAULT '{}',
    "aiGeneratedComment" TEXT,
    "aiConfidenceScore" REAL,
    "missingFieldsJson" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "reviewedByUserId" TEXT,
    "reviewedAt" DATETIME,
    "rejectionReason" TEXT,
    "iikoSyncStatus" TEXT NOT NULL DEFAULT 'idle',
    "iikoDocumentId" TEXT,
    "costEstimate" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WriteOffRequest_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WriteOffRequest_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WriteOffRequest_deductionEmployeeId_fkey" FOREIGN KEY ("deductionEmployeeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WriteOffRequest_tradePointId_fkey" FOREIGN KEY ("tradePointId") REFERENCES "TradePoint" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WriteOffRequest_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "RequestEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "eventType" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "metadataJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RequestEvent_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "WriteOffRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RequestEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "IikoSyncLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "responseJson" TEXT,
    "errorMessage" TEXT,
    "iikoDocumentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IikoSyncLog_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "WriteOffRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "WriteOffRequest_doc_key" ON "WriteOffRequest"("doc")`,
  `CREATE INDEX IF NOT EXISTS "WriteOffRequest_createdByUserId_idx" ON "WriteOffRequest"("createdByUserId")`,
  `CREATE INDEX IF NOT EXISTS "WriteOffRequest_status_idx" ON "WriteOffRequest"("status")`,
  `CREATE INDEX IF NOT EXISTS "WriteOffRequest_tradePointId_idx" ON "WriteOffRequest"("tradePointId")`,
  `CREATE INDEX IF NOT EXISTS "WriteOffRequest_createdAt_idx" ON "WriteOffRequest"("createdAt")`,
  `CREATE INDEX IF NOT EXISTS "RequestEvent_requestId_idx" ON "RequestEvent"("requestId")`,
  `CREATE INDEX IF NOT EXISTS "IikoSyncLog_requestId_idx" ON "IikoSyncLog"("requestId")`,
  `CREATE INDEX IF NOT EXISTS "IikoSyncLog_status_idx" ON "IikoSyncLog"("status")`,
];

export async function setupDb() {
  const prisma = getPrisma();
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = ON");
  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }
  const userColumns = await prisma.$queryRawUnsafe<Array<{ name: string }>>(`PRAGMA table_info("User")`);
  if (!userColumns.some((column) => column.name === "passwordHash")) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  setupDb()
    .then(() => {
      console.log("VERA SQLite schema is ready");
    })
    .finally(async () => {
      await getPrisma().$disconnect();
    });
}
