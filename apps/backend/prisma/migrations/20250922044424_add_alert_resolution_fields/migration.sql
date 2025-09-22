-- AlterTable
ALTER TABLE "public"."alerts" ADD COLUMN     "resolveComment" TEXT,
ADD COLUMN     "resolvedBy" TEXT,
ADD COLUMN     "solutionType" TEXT;
