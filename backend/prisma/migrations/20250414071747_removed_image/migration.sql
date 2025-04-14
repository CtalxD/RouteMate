/*
  Warnings:

  - You are about to drop the column `blueBookImage` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `vehicleImage` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `numberOfTickets` on the `Ticket` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Document" DROP COLUMN "blueBookImage",
DROP COLUMN "vehicleImage";

-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "numberOfTickets",
ADD COLUMN     "passengerNames" TEXT[],
ADD COLUMN     "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING';
