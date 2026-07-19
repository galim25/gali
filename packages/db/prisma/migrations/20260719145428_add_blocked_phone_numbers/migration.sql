-- CreateTable
CREATE TABLE "blocked_phone_numbers" (
    "id" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "blocked_by_user_id" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocked_phone_numbers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blocked_phone_numbers_phone_number_key" ON "blocked_phone_numbers"("phone_number");

-- AddForeignKey
ALTER TABLE "blocked_phone_numbers" ADD CONSTRAINT "blocked_phone_numbers_blocked_by_user_id_fkey" FOREIGN KEY ("blocked_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
