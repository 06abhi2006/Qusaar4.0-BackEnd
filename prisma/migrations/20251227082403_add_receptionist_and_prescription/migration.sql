-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('DAY', 'NIGHT');

-- AlterTable
ALTER TABLE "medical_records" ADD COLUMN     "prescription" TEXT;

-- CreateTable
CREATE TABLE "receptionists" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "shift_type" "ShiftType" NOT NULL,
    "work_start_time" TEXT NOT NULL,
    "work_end_time" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receptionists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "receptionists_user_id_key" ON "receptionists"("user_id");

-- AddForeignKey
ALTER TABLE "receptionists" ADD CONSTRAINT "receptionists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
