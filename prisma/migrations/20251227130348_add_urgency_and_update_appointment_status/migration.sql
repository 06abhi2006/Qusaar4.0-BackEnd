/*
  Warnings:

  - The values [scheduled,completed,cancelled] on the enum `AppointmentStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "UrgencyLevel" AS ENUM ('NORMAL', 'HIGH');

-- AlterEnum
BEGIN;
CREATE TYPE "AppointmentStatus_new" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');
ALTER TABLE "appointments" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "appointments" ALTER COLUMN "status" TYPE "AppointmentStatus_new" USING ("status"::text::"AppointmentStatus_new");
ALTER TYPE "AppointmentStatus" RENAME TO "AppointmentStatus_old";
ALTER TYPE "AppointmentStatus_new" RENAME TO "AppointmentStatus";
DROP TYPE "AppointmentStatus_old";
ALTER TABLE "appointments" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "urgency" "UrgencyLevel" NOT NULL DEFAULT 'NORMAL',
ALTER COLUMN "status" SET DEFAULT 'PENDING';
