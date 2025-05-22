/*
  Warnings:

  - You are about to drop the `Bus` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Bus";

-- CreateTable
CREATE TABLE "buses" (
    "busId" TEXT NOT NULL,
    "busNumber" TEXT NOT NULL,
    "userId" INTEGER,
    "driverName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buses_pkey" PRIMARY KEY ("busId")
);

-- CreateIndex
CREATE UNIQUE INDEX "buses_busNumber_key" ON "buses"("busNumber");

-- CreateIndex
CREATE UNIQUE INDEX "buses_userId_key" ON "buses"("userId");

-- AddForeignKey
ALTER TABLE "buses" ADD CONSTRAINT "buses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
