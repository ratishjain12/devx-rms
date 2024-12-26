/*
  Warnings:

  - Changed the type of `client_satisfaction` on the `Project` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Satisfaction" AS ENUM ('ABOUT_TO_FIRE', 'NOT_HAPPY', 'IDK', 'OK', 'HAPPY', 'OVER_THE_MOON');

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "client_satisfaction",
ADD COLUMN     "client_satisfaction" "Satisfaction" NOT NULL;
