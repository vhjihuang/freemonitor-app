/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `device_groups` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `devices` will be added. If there are existing duplicate values, this will fail.
  - Made the column `type` on table `devices` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."alerts" ADD COLUMN     "creatorId" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."device_groups" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."devices" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ALTER COLUMN "type" SET NOT NULL;

-- CreateIndex
CREATE INDEX "alerts_userId_idx" ON "public"."alerts"("userId");

-- CreateIndex
CREATE INDEX "alerts_creatorId_idx" ON "public"."alerts"("creatorId");

-- CreateIndex
CREATE INDEX "alerts_deletedAt_idx" ON "public"."alerts"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "device_groups_name_key" ON "public"."device_groups"("name");

-- CreateIndex
CREATE INDEX "device_groups_deletedAt_idx" ON "public"."device_groups"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "devices_name_key" ON "public"."devices"("name");

-- CreateIndex
CREATE INDEX "devices_name_idx" ON "public"."devices"("name");

-- CreateIndex
CREATE INDEX "devices_deletedAt_idx" ON "public"."devices"("deletedAt");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "public"."users"("deletedAt");

-- AddForeignKey
ALTER TABLE "public"."alerts" ADD CONSTRAINT "alerts_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
