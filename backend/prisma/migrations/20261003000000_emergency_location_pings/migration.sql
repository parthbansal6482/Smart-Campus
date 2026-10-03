-- CreateTable
CREATE TABLE "emergency_location_pings" (
    "id" TEXT NOT NULL,
    "emergency_id" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy_m" DOUBLE PRECISION,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emergency_location_pings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "emergency_location_pings_emergency_id_recorded_at_idx" ON "emergency_location_pings"("emergency_id", "recorded_at");

-- AddForeignKey
ALTER TABLE "emergency_location_pings" ADD CONSTRAINT "emergency_location_pings_emergency_id_fkey" FOREIGN KEY ("emergency_id") REFERENCES "emergencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
