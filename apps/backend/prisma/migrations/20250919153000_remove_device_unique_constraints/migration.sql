/* Remove unique constraints from hostname and ipAddress, and create partial unique indexes */

-- AlterTable
ALTER TABLE "devices" DROP CONSTRAINT IF EXISTS "devices_hostname_key";

-- AlterTable
ALTER TABLE "devices" DROP CONSTRAINT IF EXISTS "devices_ipAddress_key";

-- CreateIndex
CREATE UNIQUE INDEX "devices_hostname_active_key" ON "devices"("hostname") WHERE "isActive" = true;

-- CreateIndex
CREATE UNIQUE INDEX "devices_ipAddress_active_key" ON "devices"("ipAddress") WHERE "isActive" = true;