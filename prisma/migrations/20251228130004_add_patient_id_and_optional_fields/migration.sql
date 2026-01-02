/*
  Warnings:

  - A unique constraint covering the columns `[patient_id]` on the table `patients` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `patient_id` to the `patients` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "patient_id" TEXT NOT NULL,
ALTER COLUMN "age" DROP NOT NULL,
ALTER COLUMN "gender" DROP NOT NULL,
ALTER COLUMN "phone" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "patients_patient_id_key" ON "patients"("patient_id");
