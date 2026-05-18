-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_paymentRequestId_fkey";

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "paymentRequestId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_paymentRequestId_fkey" FOREIGN KEY ("paymentRequestId") REFERENCES "PaymentRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
