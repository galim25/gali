-- DropIndex
DROP INDEX "work_days_barber_id_idx";

-- DropIndex
DROP INDEX "work_days_work_date_key";

-- AlterTable
ALTER TABLE "work_days" ALTER COLUMN "barber_id" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "work_days_barber_id_work_date_key" ON "work_days"("barber_id", "work_date");
