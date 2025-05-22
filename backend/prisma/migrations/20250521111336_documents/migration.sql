-- DropIndex
DROP INDEX "Bus_busNumber_key";

-- AlterTable
ALTER TABLE "Bus" ALTER COLUMN "busNumber" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "busNumber" TEXT;
