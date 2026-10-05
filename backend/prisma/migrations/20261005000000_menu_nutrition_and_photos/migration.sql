-- AlterTable
ALTER TABLE "menu_items" ADD COLUMN     "gallery_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "serving_size" TEXT,
ADD COLUMN     "calories" INTEGER,
ADD COLUMN     "protein_g" DOUBLE PRECISION,
ADD COLUMN     "carbs_g" DOUBLE PRECISION,
ADD COLUMN     "fat_g" DOUBLE PRECISION,
ADD COLUMN     "fiber_g" DOUBLE PRECISION,
ADD COLUMN     "sugar_g" DOUBLE PRECISION,
ADD COLUMN     "sodium_mg" DOUBLE PRECISION,
ADD COLUMN     "ingredients" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "allergens" TEXT[] DEFAULT ARRAY[]::TEXT[];
