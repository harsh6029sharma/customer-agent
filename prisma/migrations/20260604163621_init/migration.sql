/*
  Warnings:

  - The `category` column on the `Ticket` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `priority` column on the `Ticket` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Category" AS ENUM ('BILLING', 'TECHNICAL', 'FEATURE_REQUEST', 'ACCOUNT', 'OTHER');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'OPEN',
DROP COLUMN "category",
ADD COLUMN     "category" "Category",
DROP COLUMN "priority",
ADD COLUMN     "priority" "Priority";
