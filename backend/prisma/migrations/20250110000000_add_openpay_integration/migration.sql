-- CreateTable
CREATE TABLE "openpay_customers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "openpayCustomerId" TEXT NOT NULL UNIQUE,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "openpay_customers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "openpay_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "depositRequestId" TEXT NOT NULL,
    "openpayTransactionId" TEXT NOT NULL UNIQUE,
    "openpayChargeId" TEXT UNIQUE,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PEN',
    "paymentMethod" TEXT NOT NULL,
    "paymentMethodDetails" TEXT,
    "openpayStatus" TEXT NOT NULL,
    "openpayErrorCode" TEXT,
    "openpayErrorMessage" TEXT,
    "customerId" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "authorizationCode" TEXT,
    "operationType" TEXT,
    "deviceSessionId" TEXT,
    "riskScore" DECIMAL(3,2),
    "fraudIndicators" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "chargedAt" DATETIME,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "openpay_transactions_depositRequestId_fkey" FOREIGN KEY ("depositRequestId") REFERENCES "deposit_requests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "openpay_webhook_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "openpayEventId" TEXT NOT NULL UNIQUE,
    "eventType" TEXT NOT NULL,
    "transactionId" TEXT,
    "webhookSignature" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "processedAt" DATETIME,
    "processingStatus" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "openpay_webhook_events_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "openpay_transactions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "openpay_payment_methods" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "openpayCardId" TEXT UNIQUE,
    "cardType" TEXT,
    "cardBrand" TEXT,
    "cardNumberMasked" TEXT,
    "cardHolderName" TEXT,
    "expirationMonth" TEXT,
    "expirationYear" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "openpay_payment_methods_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "openpay_customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Add new fields to existing deposit_requests table
ALTER TABLE "deposit_requests" ADD COLUMN "integrationMethod" TEXT DEFAULT 'manual';
ALTER TABLE "deposit_requests" ADD COLUMN "openpayTransactionId" TEXT;
ALTER TABLE "deposit_requests" ADD COLUMN "autoApprovalEligible" BOOLEAN DEFAULT false;
ALTER TABLE "deposit_requests" ADD COLUMN "processingFee" DECIMAL(10,2) DEFAULT 0.00;

-- CreateIndex
CREATE INDEX "idx_openpay_customers_userId" ON "openpay_customers"("userId");
CREATE INDEX "idx_openpay_transactions_depositRequestId" ON "openpay_transactions"("depositRequestId");
CREATE INDEX "idx_openpay_transactions_openpayStatus" ON "openpay_transactions"("openpayStatus");
CREATE INDEX "idx_openpay_transactions_createdAt" ON "openpay_transactions"("createdAt");
CREATE INDEX "idx_openpay_webhook_events_eventType" ON "openpay_webhook_events"("eventType");
CREATE INDEX "idx_openpay_webhook_events_processingStatus" ON "openpay_webhook_events"("processingStatus");
CREATE INDEX "idx_openpay_payment_methods_customerId" ON "openpay_payment_methods"("customerId");

-- Add foreign key constraint for openpayTransactionId in deposit_requests
-- Note: This is optional as it's added after the fact
CREATE INDEX "idx_deposit_requests_openpayTransactionId" ON "deposit_requests"("openpayTransactionId");