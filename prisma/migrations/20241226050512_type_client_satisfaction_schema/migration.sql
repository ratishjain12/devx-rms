/*
  Warnings:

  - Added the required column `client_satisfaction` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "client_satisfaction" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL;
