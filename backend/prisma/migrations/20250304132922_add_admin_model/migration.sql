/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Admin` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Admin` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Admin" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";
