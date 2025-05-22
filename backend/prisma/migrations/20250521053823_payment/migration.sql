-- DropIndex
DROP INDEX "Ticket_userId_key";

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "metadata" TEXT,
ADD COLUMN     "ticketId" TEXT;

-- CreateIndex
CREATE INDEX "Payment_ticketId_idx" ON "Payment"("ticketId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE SET NULL ON UPDATE CASCADE;
