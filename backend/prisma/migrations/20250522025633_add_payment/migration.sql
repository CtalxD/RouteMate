/*
  Warnings:

  - The `paymentStatus` column on the `Ticket` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "paymentMethod" TEXT;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "expiresAt" TIMESTAMP(3),
DROP COLUMN "paymentStatus",
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'INITIATED';

-- CreateIndex
CREATE INDEX "Ticket_busNumberPlate_idx" ON "Ticket"("busNumberPlate");

-- CreateIndex
CREATE INDEX "Ticket_paymentStatus_idx" ON "Ticket"("paymentStatus");

-- CreateIndex
CREATE INDEX "Ticket_createdAt_idx" ON "Ticket"("createdAt");
