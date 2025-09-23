-- CreateTable
CREATE TABLE "public"."metric_history" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "cpu" DOUBLE PRECISION NOT NULL,
    "memory" DOUBLE PRECISION NOT NULL,
    "disk" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL,
    "networkIn" DOUBLE PRECISION,
    "networkOut" DOUBLE PRECISION,
    "uptime" INTEGER,
    "temperature" DOUBLE PRECISION,
    "custom" JSONB,
    "aggregationLevel" TEXT,

    CONSTRAINT "metric_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "metric_history_deviceId_idx" ON "public"."metric_history"("deviceId");

-- CreateIndex
CREATE INDEX "metric_history_timestamp_idx" ON "public"."metric_history"("timestamp");

-- CreateIndex
CREATE INDEX "metric_history_deviceId_timestamp_idx" ON "public"."metric_history"("deviceId", "timestamp");

-- CreateIndex
CREATE INDEX "metric_history_aggregationLevel_idx" ON "public"."metric_history"("aggregationLevel");

-- AddForeignKey
ALTER TABLE "public"."metric_history" ADD CONSTRAINT "metric_history_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "public"."devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
