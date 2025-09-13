/*
  Warnings:

  - You are about to drop the column `creatorId` on the `alerts` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `alerts` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `device_groups` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `devices` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[passwordResetToken]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."alerts" DROP CONSTRAINT "alerts_creatorId_fkey";

-- DropIndex
DROP INDEX "public"."alerts_creatorId_idx";

-- DropIndex
DROP INDEX "public"."alerts_deletedAt_idx";

-- DropIndex
DROP INDEX "public"."alerts_userId_idx";

-- DropIndex
DROP INDEX "public"."device_groups_deletedAt_idx";

-- DropIndex
DROP INDEX "public"."device_groups_name_key";

-- DropIndex
DROP INDEX "public"."devices_deletedAt_idx";

-- DropIndex
DROP INDEX "public"."devices_name_idx";

-- DropIndex
DROP INDEX "public"."devices_name_key";

-- DropIndex
DROP INDEX "public"."users_deletedAt_idx";

-- AlterTable
ALTER TABLE "public"."alerts" DROP COLUMN "creatorId",
DROP COLUMN "deletedAt";

-- AlterTable
ALTER TABLE "public"."device_groups" DROP COLUMN "deletedAt";

-- AlterTable
ALTER TABLE "public"."devices" DROP COLUMN "deletedAt",
ALTER COLUMN "type" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "passwordResetExpiresAt" TIMESTAMP(3),
ADD COLUMN     "passwordResetToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_passwordResetToken_key" ON "public"."users"("passwordResetToken");
