/*
  Warnings:

  - The primary key for the `alerts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `severity` column on the `alerts` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `metrics` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `type` to the `alerts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `alerts` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnums
CREATE TYPE "public"."DeviceStatus" AS ENUM ('ONLINE', 'OFFLINE', 'DEGRADED', 'UNKNOWN', 'MAINTENANCE');
CREATE TYPE "public"."AlertSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');
CREATE TYPE "public"."AlertType" AS ENUM ('CPU', 'MEMORY', 'DISK', 'NETWORK', 'OFFLINE', 'CUSTOM');
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'USER', 'VIEWER');

-- CreateTable: users
CREATE TABLE "public"."users" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "name" TEXT,
  "role" "public"."UserRole" NOT NULL DEFAULT 'USER',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastLoginAt" TIMESTAMP(3),
  "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
  "lockedUntil" TIMESTAMP(3),
  "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
  "mfaSecret" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable: device_groups
CREATE TABLE "public"."device_groups" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "device_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: users
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");
CREATE INDEX "users_email_idx" ON "public"."users"("email");
CREATE INDEX "users_isActive_idx" ON "public"."users"("isActive");
CREATE INDEX "users_role_idx" ON "public"."users"("role");
CREATE INDEX "users_lastLoginAt_idx" ON "public"."users"("lastLoginAt");
CREATE INDEX "users_lockedUntil_idx" ON "public"."users"("lockedUntil");
CREATE INDEX "users_email_isActive_idx" ON "public"."users"("email", "isActive");

-- CreateIndex: device_groups
CREATE INDEX "device_groups_name_idx" ON "public"."device_groups"("name");
CREATE INDEX "device_groups_isActive_idx" ON "public"."device_groups"("isActive");
CREATE INDEX "device_groups_name_isActive_idx" ON "public"."device_groups"("name", "isActive");

-- AlterTable: devices (add fields, allow NULL first)
ALTER TABLE "public"."devices"
ADD COLUMN "description" TEXT,
ADD COLUMN "status" "public"."DeviceStatus" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN "type" TEXT,
ADD COLUMN "location" TEXT,
ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "lastSeen" TIMESTAMP(3),
ADD COLUMN "userId" TEXT,
ADD COLUMN "deviceGroupId" TEXT;

-- CreateIndex: devices
CREATE INDEX "devices_isActive_idx" ON "public"."devices"("isActive");
CREATE INDEX "devices_status_idx" ON "public"."devices"("status");
CREATE INDEX "devices_lastSeen_idx" ON "public"."devices"("lastSeen");
CREATE INDEX "devices_userId_idx" ON "public"."devices"("userId");
CREATE INDEX "devices_deviceGroupId_idx" ON "public"."devices"("deviceGroupId");

-- AlterTable: metrics (change id to text, add fields)
ALTER TABLE "public"."metrics"
DROP CONSTRAINT "metrics_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "timestamp" SET DATA TYPE TIMESTAMPTZ,
ADD COLUMN "networkIn" DOUBLE PRECISION,
ADD COLUMN "networkOut" DOUBLE PRECISION,
ADD COLUMN "uptime" INTEGER,
ADD COLUMN "temperature" DOUBLE PRECISION,
ADD COLUMN "custom" JSONB,
ADD CONSTRAINT "metrics_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "metrics_id_seq";

-- CreateIndex: metrics
CREATE INDEX "metrics_deviceId_idx" ON "public"."metrics"("deviceId");
CREATE INDEX "metrics_timestamp_idx" ON "public"."metrics"("timestamp");
CREATE INDEX "metrics_deviceId_timestamp_idx" ON "public"."metrics"("deviceId", "timestamp");
CREATE INDEX "metrics_timestamp_deviceId_idx" ON "public"."metrics"("timestamp", "deviceId");
CREATE INDEX "metrics_deviceId_timestamp_cpu_idx" ON "public"."metrics"("deviceId", "timestamp", "cpu");
CREATE INDEX "metrics_deviceId_timestamp_memory_idx" ON "public"."metrics"("deviceId", "timestamp", "memory");
CREATE INDEX "metrics_deviceId_timestamp_disk_idx" ON "public"."metrics"("deviceId", "timestamp", "disk");

-- AlterTable: alerts (change id, add fields safely)
ALTER TABLE "public"."alerts"
DROP CONSTRAINT "alerts_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
-- Keep old severity as text temporarily
ADD COLUMN "old_severity_text" TEXT,
ADD COLUMN "type" "public"."AlertType",
ADD COLUMN "isResolved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "resolvedAt" TIMESTAMP(3),
ADD COLUMN "acknowledgedAt" TIMESTAMP(3),
ADD COLUMN "metadata" JSONB,
ADD COLUMN "userId" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3),
ADD CONSTRAINT "alerts_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "alerts_id_seq";

-- Migrate old severity to enum
UPDATE "public"."alerts" SET "old_severity_text" = "severity";
ALTER TABLE "public"."alerts"
DROP COLUMN "severity",
ADD COLUMN "severity" "public"."AlertSeverity" NOT NULL DEFAULT 'ERROR';

-- Set required fields for existing alerts
UPDATE "public"."alerts"
SET 
  "type" = 'CUSTOM',
  "updatedAt" = COALESCE("updatedAt", "createdAt")
WHERE "type" IS NULL OR "updatedAt" IS NULL;

-- Make them required now
ALTER TABLE "public"."alerts" ALTER COLUMN "type" SET NOT NULL;
ALTER TABLE "public"."alerts" ALTER COLUMN "updatedAt" SET NOT NULL;

-- CreateIndex: alerts
CREATE INDEX "alerts_deviceId_idx" ON "public"."alerts"("deviceId");
CREATE INDEX "alerts_isResolved_idx" ON "public"."alerts"("isResolved");
CREATE INDEX "alerts_severity_idx" ON "public"."alerts"("severity");
CREATE INDEX "alerts_type_idx" ON "public"."alerts"("type");
CREATE INDEX "alerts_createdAt_idx" ON "public"."alerts"("createdAt");
CREATE INDEX "alerts_resolvedAt_idx" ON "public"."alerts"("resolvedAt");
CREATE INDEX "alerts_deviceId_isResolved_idx" ON "public"."alerts"("deviceId", "isResolved");
CREATE INDEX "alerts_isResolved_severity_createdAt_idx" ON "public"."alerts"("isResolved", "severity", "createdAt");
CREATE INDEX "alerts_type_isResolved_idx" ON "public"."alerts"("type", "isResolved");

-- AddForeignKeys
ALTER TABLE "public"."devices" ADD CONSTRAINT "devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."devices" ADD CONSTRAINT "devices_deviceGroupId_fkey" FOREIGN KEY ("deviceGroupId") REFERENCES "public"."device_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."alerts" ADD CONSTRAINT "alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Insert default data
INSERT INTO "public"."device_groups" ("id", "name", "description", "createdAt", "updatedAt")
VALUES ('default-group', 'Default Group', 'All devices belong here by default', NOW(), NOW());

UPDATE "public"."devices" 
SET "deviceGroupId" = 'default-group' 
WHERE "deviceGroupId" IS NULL;

-- Optional: Insert admin user (replace $2b$... with real bcrypt hash)
-- INSERT INTO "public"."users" ("id", "email", "password", "name", "role", "isActive", "createdAt", "updatedAt")
-- VALUES ('user_admin', 'admin@freemonitor.app', '$2b$10$...', 'Admin', 'ADMIN', true, NOW(), NOW());