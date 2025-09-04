/*
  Warnings:

  - You are about to drop the column `old_severity_text` on the `alerts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."alerts" DROP COLUMN "old_severity_text";

-- AlterTable
ALTER TABLE "public"."devices" ALTER COLUMN "tags" DROP DEFAULT;
