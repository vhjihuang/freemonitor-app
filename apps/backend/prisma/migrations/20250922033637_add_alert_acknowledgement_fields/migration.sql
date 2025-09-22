-- CreateEnum
CREATE TYPE "public"."AlertStatus" AS ENUM ('UNACKNOWLEDGED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED');

-- AlterTable
ALTER TABLE "public"."alerts" ADD COLUMN     "acknowledgeComment" TEXT,
ADD COLUMN     "acknowledgedBy" TEXT,
ADD COLUMN     "status" "public"."AlertStatus" NOT NULL DEFAULT 'UNACKNOWLEDGED';
