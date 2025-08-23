-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "balance" DECIMAL NOT NULL DEFAULT 0.00,
    "dailyLimit" DECIMAL NOT NULL DEFAULT 1000.00,
    "monthlyLimit" DECIMAL NOT NULL DEFAULT 10000.00,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFrozen" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "deposit_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "pearlsAmount" DECIMAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PEN',
    "paymentMethod" TEXT NOT NULL,
    "referenceCode" TEXT NOT NULL,
    "bankReference" TEXT,
    "bankAccount" TEXT,
    "bankAccountName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "validatedBy" TEXT,
    "validatedAt" DATETIME,
    "proofImage" TEXT,
    "proofImageAdmin" TEXT,
    "transactionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "deposit_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "withdrawal_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "pearlsAmount" DECIMAL NOT NULL,
    "amountInSoles" DECIMAL NOT NULL,
    "commission" DECIMAL NOT NULL DEFAULT 0.00,
    "netAmount" DECIMAL NOT NULL,
    "bankCode" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "accountHolderName" TEXT NOT NULL,
    "accountHolderDni" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "processedBy" TEXT,
    "processedAt" DATETIME,
    "bankTransactionId" TEXT,
    "transferProof" TEXT,
    "referenceCode" TEXT NOT NULL,
    "transactionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "withdrawal_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payment_references" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "expiresAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "bank_configurations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bankCode" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "accountHolderName" TEXT NOT NULL,
    "cci" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "minDeposit" DECIMAL NOT NULL DEFAULT 1.00,
    "maxDeposit" DECIMAL NOT NULL DEFAULT 5000.00,
    "depositCommission" DECIMAL NOT NULL DEFAULT 0.00,
    "instructions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "adminId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "description" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "payment_configurations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "p2pTransferEnabled" BOOLEAN NOT NULL DEFAULT true,
    "p2pTransferCommission" DECIMAL NOT NULL DEFAULT 0.50,
    "defaultDailyLimit" DECIMAL NOT NULL DEFAULT 1000.00,
    "defaultMonthlyLimit" DECIMAL NOT NULL DEFAULT 10000.00,
    "depositExpirationHours" INTEGER NOT NULL DEFAULT 24,
    "referenceExpirationHours" INTEGER NOT NULL DEFAULT 48,
    "depositsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "withdrawalsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "transfersEnabled" BOOLEAN NOT NULL DEFAULT true,
    "maintenanceMessage" TEXT,
    "announcementMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "gameId" TEXT,
    "type" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "paymentId" TEXT,
    "pearlsAmount" DECIMAL,
    "fromUserId" TEXT,
    "toUserId" TEXT,
    "commissionAmount" DECIMAL DEFAULT 0.00,
    "referenceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "transactions_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "transactions_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_transactions" ("amount", "createdAt", "description", "gameId", "id", "paymentId", "paymentMethod", "status", "type", "updatedAt", "userId") SELECT "amount", "createdAt", "description", "gameId", "id", "paymentId", "paymentMethod", "status", "type", "updatedAt", "userId" FROM "transactions";
DROP TABLE "transactions";
ALTER TABLE "new_transactions" RENAME TO "transactions";
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "balance" DECIMAL NOT NULL DEFAULT 0.00,
    "pearlsBalance" DECIMAL NOT NULL DEFAULT 0.00,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "fullName" TEXT,
    "phone" TEXT,
    "dni" TEXT,
    "birthDate" DATETIME
);
INSERT INTO "new_users" ("createdAt", "email", "id", "password", "role", "updatedAt", "username") SELECT "createdAt", "email", "id", "password", "role", "updatedAt", "username" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_dni_key" ON "users"("dni");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "wallets_userId_key" ON "wallets"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "deposit_requests_referenceCode_key" ON "deposit_requests"("referenceCode");

-- CreateIndex
CREATE UNIQUE INDEX "withdrawal_requests_referenceCode_key" ON "withdrawal_requests"("referenceCode");

-- CreateIndex
CREATE UNIQUE INDEX "payment_references_code_key" ON "payment_references"("code");

-- CreateIndex
CREATE UNIQUE INDEX "bank_configurations_bankCode_key" ON "bank_configurations"("bankCode");
