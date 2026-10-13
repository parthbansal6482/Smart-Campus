-- CreateTable
CREATE TABLE "campus_settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by_id" TEXT,

    CONSTRAINT "campus_settings_pkey" PRIMARY KEY ("key")
);
