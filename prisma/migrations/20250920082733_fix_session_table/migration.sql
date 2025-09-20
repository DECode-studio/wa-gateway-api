-- CreateTable
CREATE TABLE "public"."WaSession" (
    "id" TEXT NOT NULL,
    "sessionName" TEXT NOT NULL,
    "deviceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'disconnected',
    "qrCode" TEXT,
    "lastError" TEXT,
    "authBackup" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WaSession_sessionName_key" ON "public"."WaSession"("sessionName");
