/*
  Warnings:

  - A unique constraint covering the columns `[paymentRequestId,type]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Transaction_paymentRequestId_type_key" ON "Transaction"("paymentRequestId", "type");
