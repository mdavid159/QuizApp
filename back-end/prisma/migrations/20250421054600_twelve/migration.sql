/*
  Warnings:

  - A unique constraint covering the columns `[uuid]` on the table `Quiz` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Quiz" DROP CONSTRAINT "Quiz_userId_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "Quiz_uuid_key" ON "Quiz"("uuid");
