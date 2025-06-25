/*
  Warnings:

  - You are about to drop the column `approvedAt` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `contractAddress` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `contractNetwork` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `deployedAt` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `organizerId` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `rejectedAt` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `rejectionReason` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `ticket_types` table. All the data in the column will be lost.
  - You are about to drop the column `isTransferable` on the `ticket_types` table. All the data in the column will be lost.
  - You are about to drop the column `maxPerWallet` on the `ticket_types` table. All the data in the column will be lost.
  - You are about to drop the column `saleEndDate` on the `ticket_types` table. All the data in the column will be lost.
  - You are about to drop the column `saleStartDate` on the `ticket_types` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ticket_types` table. All the data in the column will be lost.
  - You are about to drop the column `lastSyncAt` on the `ticket_validations` table. All the data in the column will be lost.
  - You are about to drop the column `syncedToChain` on the `ticket_validations` table. All the data in the column will be lost.
  - You are about to drop the column `ticketId` on the `ticket_validations` table. All the data in the column will be lost.
  - You are about to drop the `kye_verifications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payment_methods` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tickets` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `transactions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[tokenId]` on the table `ticket_validations` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `organizerAddress` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contractAddress` to the `ticket_validations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eventId` to the `ticket_validations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ticketTypeId` to the `ticket_validations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tokenId` to the `ticket_validations` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "events" DROP CONSTRAINT "events_organizerId_fkey";

-- DropForeignKey
ALTER TABLE "kye_verifications" DROP CONSTRAINT "kye_verifications_userId_fkey";

-- DropForeignKey
ALTER TABLE "payment_methods" DROP CONSTRAINT "payment_methods_ticketTypeId_fkey";

-- DropForeignKey
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_eventId_fkey";

-- DropForeignKey
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_ticketTypeId_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_buyerId_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_sellerId_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_ticketId_fkey";

-- DropIndex
DROP INDEX "ticket_validations_ticketId_key";

-- AlterTable
ALTER TABLE "events" DROP COLUMN "approvedAt",
DROP COLUMN "contractAddress",
DROP COLUMN "contractNetwork",
DROP COLUMN "deployedAt",
DROP COLUMN "organizerId",
DROP COLUMN "rejectedAt",
DROP COLUMN "rejectionReason",
DROP COLUMN "status",
ADD COLUMN     "bannerUrl" TEXT,
ADD COLUMN     "lauchpadAddress" TEXT,
ADD COLUMN     "maxPerWallet" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "organizerAddress" TEXT NOT NULL,
ADD COLUMN     "ticketAddress" TEXT;

-- AlterTable
ALTER TABLE "ticket_types" DROP COLUMN "createdAt",
DROP COLUMN "isTransferable",
DROP COLUMN "maxPerWallet",
DROP COLUMN "saleEndDate",
DROP COLUMN "saleStartDate",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "ticket_validations" DROP COLUMN "lastSyncAt",
DROP COLUMN "syncedToChain",
DROP COLUMN "ticketId",
ADD COLUMN     "contractAddress" TEXT NOT NULL,
ADD COLUMN     "eventId" TEXT NOT NULL,
ADD COLUMN     "ticketTypeId" TEXT NOT NULL,
ADD COLUMN     "tokenId" TEXT NOT NULL;

-- DropTable
DROP TABLE "kye_verifications";

-- DropTable
DROP TABLE "payment_methods";

-- DropTable
DROP TABLE "tickets";

-- DropTable
DROP TABLE "transactions";

-- DropTable
DROP TABLE "users";

-- DropEnum
DROP TYPE "EventStatus";

-- DropEnum
DROP TYPE "KYEStatus";

-- DropEnum
DROP TYPE "TicketStatus";

-- DropEnum
DROP TYPE "TransactionStatus";

-- DropEnum
DROP TYPE "TransactionType";

-- DropEnum
DROP TYPE "UserRole";

-- CreateIndex
CREATE UNIQUE INDEX "ticket_validations_tokenId_key" ON "ticket_validations"("tokenId");

-- AddForeignKey
ALTER TABLE "ticket_validations" ADD CONSTRAINT "ticket_validations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_validations" ADD CONSTRAINT "ticket_validations_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "ticket_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
