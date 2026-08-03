-- AlterTable
ALTER TABLE "work_days" ADD COLUMN     "barber_id" TEXT;

-- CreateTable
CREATE TABLE "barbers" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "barbers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "work_days_barber_id_idx" ON "work_days"("barber_id");

-- AddForeignKey
ALTER TABLE "work_days" ADD CONSTRAINT "work_days_barber_id_fkey" FOREIGN KEY ("barber_id") REFERENCES "barbers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
