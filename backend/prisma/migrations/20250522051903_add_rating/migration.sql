-- CreateTable
CREATE TABLE "BusRating" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "busId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusRating_busId_idx" ON "BusRating"("busId");

-- CreateIndex
CREATE UNIQUE INDEX "BusRating_userId_busId_key" ON "BusRating"("userId", "busId");

-- AddForeignKey
ALTER TABLE "BusRating" ADD CONSTRAINT "BusRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusRating" ADD CONSTRAINT "BusRating_busId_fkey" FOREIGN KEY ("busId") REFERENCES "buses"("busId") ON DELETE RESTRICT ON UPDATE CASCADE;
