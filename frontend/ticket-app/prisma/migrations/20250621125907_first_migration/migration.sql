-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ORGANIZER', 'STAFF', 'ADMIN');

-- CreateEnum
CREATE TYPE "KYEStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NOT_STARTED');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'LIVE', 'ENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('AVAILABLE', 'SOLD', 'USED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('PURCHASE', 'RESALE');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CryptoCurrency" AS ENUM ('USDT', 'USDC');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "profileImage" TEXT,
    "walletAddress" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "kyeStatus" "KYEStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "kyeSubmittedAt" TIMESTAMP(3),
    "kyeApprovedAt" TIMESTAMP(3),
    "kyeRejectedAt" TIMESTAMP(3),
    "kyeRejectionReason" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kye_verifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationName" TEXT NOT NULL,
    "organizationAddress" TEXT NOT NULL,
    "organizationPhone" TEXT NOT NULL,
    "organizationWebsite" TEXT,
    "representativeName" TEXT NOT NULL,
    "representativeEmail" TEXT NOT NULL,
    "representativePhone" TEXT NOT NULL,
    "representativeIdType" TEXT NOT NULL,
    "representativeIdNumber" TEXT NOT NULL,
    "organizationRegistration" TEXT,
    "representativeId" TEXT,
    "proofOfAddress" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "notes" TEXT,

    CONSTRAINT "kye_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "category" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "organizerId" TEXT NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "contractAddress" TEXT,
    "contractNetwork" TEXT,
    "deployedAt" TIMESTAMP(3),
    "platformFeePercent" DECIMAL(65,30) NOT NULL DEFAULT 2.5,
    "royaltyFeePercent" DECIMAL(65,30) NOT NULL DEFAULT 0.1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_types" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "currency" "CryptoCurrency" NOT NULL DEFAULT 'USDC',
    "totalSupply" INTEGER NOT NULL,
    "maxPerWallet" INTEGER NOT NULL DEFAULT 4,
    "saleStartDate" TIMESTAMP(3),
    "saleEndDate" TIMESTAMP(3),
    "isTransferable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "ticketTypeId" TEXT NOT NULL,
    "ownerId" TEXT,
    "status" "TicketStatus" NOT NULL DEFAULT 'AVAILABLE',
    "qrCode" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "usedBy" TEXT,
    "originalPrice" DECIMAL(65,30) NOT NULL,
    "currentPrice" DECIMAL(65,30),
    "currency" "CryptoCurrency" NOT NULL,
    "mintedAt" TIMESTAMP(3),
    "mintTransactionHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" TEXT NOT NULL,
    "ticketTypeId" TEXT NOT NULL,
    "acceptToken" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "transactionHash" TEXT,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "ticketId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "currency" "CryptoCurrency" NOT NULL,
    "platformFee" DECIMAL(65,30) NOT NULL,
    "royaltyFee" DECIMAL(65,30) NOT NULL,
    "sellerReceives" DECIMAL(65,30) NOT NULL,
    "paymentMethod" TEXT,
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_validations" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "validatedBy" TEXT,
    "syncedToChain" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_validations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_walletAddress_key" ON "users"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "kye_verifications_userId_key" ON "kye_verifications"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_tokenId_key" ON "tickets"("tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_qrCode_key" ON "tickets"("qrCode");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_transactionHash_key" ON "transactions"("transactionHash");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_validations_ticketId_key" ON "ticket_validations"("ticketId");

-- AddForeignKey
ALTER TABLE "kye_verifications" ADD CONSTRAINT "kye_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_types" ADD CONSTRAINT "ticket_types_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "ticket_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "ticket_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
