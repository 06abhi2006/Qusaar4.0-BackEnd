-- CreateEnum
CREATE TYPE "BedStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'CLEANING');

-- CreateEnum
CREATE TYPE "AdmissionStatus" AS ENUM ('ADMITTED', 'DISCHARGED');

-- CreateEnum
CREATE TYPE "TriageLevel" AS ENUM ('CRITICAL', 'MODERATE', 'NORMAL');

-- CreateEnum
CREATE TYPE "EmergencyStatus" AS ENUM ('TRIAGE', 'TREATMENT', 'ADMITTED', 'DISCHARGED');

-- CreateEnum
CREATE TYPE "OperationStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LabStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RadiologyTestType" AS ENUM ('XRAY', 'CT', 'MRI', 'ULTRASOUND');

-- CreateEnum
CREATE TYPE "RadiologyStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED', 'PAID');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'nurse';
ALTER TYPE "UserRole" ADD VALUE 'lab_technician';
ALTER TYPE "UserRole" ADD VALUE 'radiologist';
ALTER TYPE "UserRole" ADD VALUE 'pharmacist';
ALTER TYPE "UserRole" ADD VALUE 'insurance_officer';

-- CreateTable
CREATE TABLE "nurses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "shift_type" "ShiftType" NOT NULL,
    "work_start_time" TEXT NOT NULL,
    "work_end_time" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nurses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_technicians" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_technicians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "radiologists" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "radiologists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pharmacists" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pharmacists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wards" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "floor" INTEGER NOT NULL,
    "gender" TEXT,
    "capacity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beds" (
    "id" TEXT NOT NULL,
    "ward_id" TEXT NOT NULL,
    "bed_number" TEXT NOT NULL,
    "status" "BedStatus" NOT NULL DEFAULT 'AVAILABLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ipd_admissions" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "bed_id" TEXT NOT NULL,
    "admission_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "discharge_date" TIMESTAMP(3),
    "diagnosis" TEXT,
    "status" "AdmissionStatus" NOT NULL DEFAULT 'ADMITTED',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ipd_admissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_cases" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT,
    "patientName" TEXT,
    "care_provider_id" TEXT,
    "triageLevel" "TriageLevel" NOT NULL DEFAULT 'NORMAL',
    "status" "EmergencyStatus" NOT NULL DEFAULT 'TRIAGE',
    "symptoms" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operation_schedules" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "theater_name" TEXT NOT NULL,
    "procedure_name" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "status" "OperationStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operation_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_tests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "normal_range" TEXT,
    "units" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_requests" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "test_id" TEXT NOT NULL,
    "status" "LabStatus" NOT NULL DEFAULT 'PENDING',
    "result_value" TEXT,
    "result_file_url" TEXT,
    "notes" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "lab_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "radiology_requests" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "test_type" "RadiologyTestType" NOT NULL,
    "body_part" TEXT NOT NULL,
    "status" "RadiologyStatus" NOT NULL DEFAULT 'PENDING',
    "image_url" TEXT,
    "report_url" TEXT,
    "findings" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "radiology_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pharmacy_inventory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "stock" INTEGER NOT NULL,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "batch_number" TEXT,
    "expiry_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pharmacy_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_policies" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "provider_name" TEXT NOT NULL,
    "policy_number" TEXT NOT NULL,
    "coverage_amount" DOUBLE PRECISION NOT NULL,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_till" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_claims" (
    "id" TEXT NOT NULL,
    "policy_id" TEXT NOT NULL,
    "bill_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'SUBMITTED',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "nurses_user_id_key" ON "nurses"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "lab_technicians_user_id_key" ON "lab_technicians"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "radiologists_user_id_key" ON "radiologists"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "pharmacists_user_id_key" ON "pharmacists"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "wards_name_key" ON "wards"("name");

-- CreateIndex
CREATE UNIQUE INDEX "beds_ward_id_bed_number_key" ON "beds"("ward_id", "bed_number");

-- CreateIndex
CREATE UNIQUE INDEX "ipd_admissions_bed_id_key" ON "ipd_admissions"("bed_id");

-- CreateIndex
CREATE UNIQUE INDEX "lab_tests_name_key" ON "lab_tests"("name");

-- CreateIndex
CREATE UNIQUE INDEX "lab_tests_code_key" ON "lab_tests"("code");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_policies_patient_id_key" ON "insurance_policies"("patient_id");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_policies_policy_number_key" ON "insurance_policies"("policy_number");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_claims_bill_id_key" ON "insurance_claims"("bill_id");

-- AddForeignKey
ALTER TABLE "nurses" ADD CONSTRAINT "nurses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_technicians" ADD CONSTRAINT "lab_technicians_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "radiologists" ADD CONSTRAINT "radiologists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacists" ADD CONSTRAINT "pharmacists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beds" ADD CONSTRAINT "beds_ward_id_fkey" FOREIGN KEY ("ward_id") REFERENCES "wards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ipd_admissions" ADD CONSTRAINT "ipd_admissions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ipd_admissions" ADD CONSTRAINT "ipd_admissions_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ipd_admissions" ADD CONSTRAINT "ipd_admissions_bed_id_fkey" FOREIGN KEY ("bed_id") REFERENCES "beds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_cases" ADD CONSTRAINT "emergency_cases_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operation_schedules" ADD CONSTRAINT "operation_schedules_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operation_schedules" ADD CONSTRAINT "operation_schedules_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_requests" ADD CONSTRAINT "lab_requests_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_requests" ADD CONSTRAINT "lab_requests_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_requests" ADD CONSTRAINT "lab_requests_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "lab_tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "radiology_requests" ADD CONSTRAINT "radiology_requests_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "radiology_requests" ADD CONSTRAINT "radiology_requests_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_policies" ADD CONSTRAINT "insurance_policies_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_claims" ADD CONSTRAINT "insurance_claims_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "insurance_policies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_claims" ADD CONSTRAINT "insurance_claims_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
