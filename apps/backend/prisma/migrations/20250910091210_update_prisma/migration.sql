/*
  Warnings:

  - The `type` column on the `devices` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[hostname]` on the table `devices` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ipAddress]` on the table `devices` will be added. If there are existing duplicate values, this will fail.
  - Made the column `ipAddress` on table `devices` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."DeviceType" AS ENUM ('SERVER', 'ROUTER', 'IOT');

-- AlterTable
ALTER TABLE "public"."devices" ALTER COLUMN "ipAddress" SET NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "public"."DeviceType";

-- CreateIndex
CREATE UNIQUE INDEX "devices_hostname_key" ON "public"."devices"("hostname");

-- CreateIndex
CREATE UNIQUE INDEX "devices_ipAddress_key" ON "public"."devices"("ipAddress");

-- CreateIndex
CREATE INDEX "devices_ipAddress_idx" ON "public"."devices"("ipAddress");

-- CreateIndex
CREATE INDEX "devices_hostname_idx" ON "public"."devices"("hostname");
