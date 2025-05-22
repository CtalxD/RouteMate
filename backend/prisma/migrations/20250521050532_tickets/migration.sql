/*
  Warnings:

  - You are about to drop the column `speed` on the `DriverLocation` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('INITIATED', 'PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- AlterTable
ALTER TABLE "DriverLocation" DROP COLUMN "speed";

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "userId" INTEGER;

-- CreateIndex
CREATE INDEX "DriverLocation_isOnline_idx" ON "DriverLocation"("isOnline");

-- CreateIndex
CREATE INDEX "DriverLocation_lastUpdated_idx" ON "DriverLocation"("lastUpdated");

-- CreateIndex
CREATE INDEX "Ticket_userId_idx" ON "Ticket"("userId");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
