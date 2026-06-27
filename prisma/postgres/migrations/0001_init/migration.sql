-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL,
    "tradePointId" TEXT,
    "iikoEmployeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradePoint" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "iikoDepartmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradePoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "costPrice" DOUBLE PRECISION NOT NULL,
    "iikoProductId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WriteOffRequest" (
    "id" TEXT NOT NULL,
    "doc" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "tradePointId" TEXT,
    "productId" TEXT,
    "productNameFallback" TEXT,
    "quantity" DOUBLE PRECISION,
    "unit" TEXT,
    "reason" TEXT,
    "deductionType" TEXT,
    "deductionEmployeeId" TEXT,
    "comment" TEXT,
    "photoUrl" TEXT,
    "voiceTranscript" TEXT,
    "aiExtractedFieldsJson" TEXT NOT NULL DEFAULT '{}',
    "aiGeneratedComment" TEXT,
    "aiConfidenceScore" DOUBLE PRECISION,
    "missingFieldsJson" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "iikoSyncStatus" TEXT NOT NULL DEFAULT 'idle',
    "iikoDocumentId" TEXT,
    "costEstimate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WriteOffRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestEvent" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "eventType" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "metadataJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IikoSyncLog" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "responseJson" TEXT,
    "errorMessage" TEXT,
    "iikoDocumentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IikoSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "WriteOffRequest_doc_key" ON "WriteOffRequest"("doc");

-- CreateIndex
CREATE INDEX "WriteOffRequest_createdByUserId_idx" ON "WriteOffRequest"("createdByUserId");

-- CreateIndex
CREATE INDEX "WriteOffRequest_status_idx" ON "WriteOffRequest"("status");

-- CreateIndex
CREATE INDEX "WriteOffRequest_tradePointId_idx" ON "WriteOffRequest"("tradePointId");

-- CreateIndex
CREATE INDEX "WriteOffRequest_createdAt_idx" ON "WriteOffRequest"("createdAt");

-- CreateIndex
CREATE INDEX "RequestEvent_requestId_idx" ON "RequestEvent"("requestId");

-- CreateIndex
CREATE INDEX "IikoSyncLog_requestId_idx" ON "IikoSyncLog"("requestId");

-- CreateIndex
CREATE INDEX "IikoSyncLog_status_idx" ON "IikoSyncLog"("status");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tradePointId_fkey" FOREIGN KEY ("tradePointId") REFERENCES "TradePoint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WriteOffRequest" ADD CONSTRAINT "WriteOffRequest_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WriteOffRequest" ADD CONSTRAINT "WriteOffRequest_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WriteOffRequest" ADD CONSTRAINT "WriteOffRequest_deductionEmployeeId_fkey" FOREIGN KEY ("deductionEmployeeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WriteOffRequest" ADD CONSTRAINT "WriteOffRequest_tradePointId_fkey" FOREIGN KEY ("tradePointId") REFERENCES "TradePoint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WriteOffRequest" ADD CONSTRAINT "WriteOffRequest_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestEvent" ADD CONSTRAINT "RequestEvent_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "WriteOffRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestEvent" ADD CONSTRAINT "RequestEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IikoSyncLog" ADD CONSTRAINT "IikoSyncLog_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "WriteOffRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
