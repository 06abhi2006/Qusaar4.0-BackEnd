/*
  Warnings:

  - You are about to drop the column `department` on the `doctors` table. All the data in the column will be lost.
  - Added the required column `cabin_number` to the `doctors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `department_id` to the `doctors` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "doctors" DROP COLUMN "department",
ADD COLUMN     "biography" TEXT,
ADD COLUMN     "cabin_number" TEXT NOT NULL,
ADD COLUMN     "consultation_fee" DOUBLE PRECISION NOT NULL DEFAULT 500.00,
ADD COLUMN     "department_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "floor" INTEGER NOT NULL,
    "wing" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
