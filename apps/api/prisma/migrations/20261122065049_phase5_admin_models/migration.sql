-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "categoryType" "TransactionType" NOT NULL DEFAULT 'EXPENSE',
ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationTemplate" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Announcement_isActive_startsAt_endsAt_idx" ON "Announcement"("isActive", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "Announcement_deletedAt_idx" ON "Announcement"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_key_key" ON "NotificationTemplate"("key");
