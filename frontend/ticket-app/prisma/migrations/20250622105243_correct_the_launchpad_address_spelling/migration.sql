/*
  Warnings:

  - You are about to drop the column `lauchpadAddress` on the `events` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "events" DROP COLUMN "lauchpadAddress",
ADD COLUMN     "launchpadAddress" TEXT;
