-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "adminComment" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';
