/*
  Warnings:

  - You are about to alter the column `utilisation` on the `Assignment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "weekNumber" INTEGER,
ALTER COLUMN "utilisation" SET DATA TYPE INTEGER;

-- CreateIndex
CREATE INDEX "Assignment_weekNumber_idx" ON "Assignment"("weekNumber");

-- CreateIndex
CREATE INDEX "Assignment_startDate_endDate_idx" ON "Assignment"("startDate", "endDate");
