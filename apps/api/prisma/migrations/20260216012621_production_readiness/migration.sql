-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'PAYMENT_DISPUTED';

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'DISPUTED';

-- AlterTable
ALTER TABLE "companion_profiles" ADD COLUMN     "chargesEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "payoutsEnabled" BOOLEAN NOT NULL DEFAULT false;
