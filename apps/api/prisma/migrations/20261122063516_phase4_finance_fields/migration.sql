-- AlterTable
ALTER TABLE "Todo" ADD COLUMN     "amount" DECIMAL(20,4);

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "paymentMethod" TEXT;
