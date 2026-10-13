-- AlterTable
ALTER TABLE "menu_items" ADD COLUMN     "review_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stock" INTEGER;

-- CreateTable
CREATE TABLE "menu_reviews" (
    "id" TEXT NOT NULL,
    "menu_item_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "menu_reviews_menu_item_id_created_at_idx" ON "menu_reviews"("menu_item_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "menu_reviews_menu_item_id_user_id_key" ON "menu_reviews"("menu_item_id", "user_id");

-- AddForeignKey
ALTER TABLE "menu_reviews" ADD CONSTRAINT "menu_reviews_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_reviews" ADD CONSTRAINT "menu_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
