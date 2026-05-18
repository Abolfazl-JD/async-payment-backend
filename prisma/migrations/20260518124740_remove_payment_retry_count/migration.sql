/*
  Warnings:

  - You are about to drop the column `retryCount` on the `PaymentRequest` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PaymentRequest" DROP COLUMN "retryCount";
