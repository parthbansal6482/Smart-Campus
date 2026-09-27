-- AlterTable
ALTER TABLE "offers" ADD COLUMN     "expires_at" TIMESTAMP(3),
ADD COLUMN     "max_redemptions" INTEGER,
ADD COLUMN     "redemption_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "refresh_tokens" ADD COLUMN     "ip_address" TEXT,
ADD COLUMN     "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "user_agent" TEXT;

