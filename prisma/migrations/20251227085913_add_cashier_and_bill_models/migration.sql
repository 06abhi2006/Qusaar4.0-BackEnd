-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'cashier';

-- CreateTable
CREATE TABLE "cashiers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "shift_type" "ShiftType" NOT NULL,
    "work_start_time" TEXT NOT NULL,
    "work_end_time" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cashiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bills" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "medical_record_id" TEXT,
    "cashier_id" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "BillStatus" NOT NULL DEFAULT 'PENDING',
    "payment_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cashiers_user_id_key" ON "cashiers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "bills_medical_record_id_key" ON "bills"("medical_record_id");

-- CreateIndex
CREATE INDEX "bills_patient_id_idx" ON "bills"("patient_id");

-- CreateIndex
CREATE INDEX "bills_doctor_id_idx" ON "bills"("doctor_id");

-- CreateIndex
CREATE INDEX "bills_status_idx" ON "bills"("status");

-- AddForeignKey
ALTER TABLE "cashiers" ADD CONSTRAINT "cashiers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_medical_record_id_fkey" FOREIGN KEY ("medical_record_id") REFERENCES "medical_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_cashier_id_fkey" FOREIGN KEY ("cashier_id") REFERENCES "cashiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
