"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestAssertions = exports.TestDataFactory = void 0;
exports.createTestApp = createTestApp;
exports.createTestUser = createTestUser;
exports.createAdminUser = createAdminUser;
exports.createAuthToken = createAuthToken;
exports.createTestOpenpayCustomer = createTestOpenpayCustomer;
exports.createTestDepositRequest = createTestDepositRequest;
exports.createTestOpenpayTransaction = createTestOpenpayTransaction;
exports.createTestWebhookEvent = createTestWebhookEvent;
exports.cleanupTestData = cleanupTestData;
exports.setupTestDatabase = setupTestDatabase;
exports.teardownTestDatabase = teardownTestDatabase;
const express_1 = __importDefault(require("express"));
const database_1 = require("../../config/database");
const structuredLogger_1 = require("../../utils/structuredLogger");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Mock environment for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.DATABASE_URL = 'file:./test.db';
async function createTestApp() {
    const app = (0, express_1.default)();
    // Basic middleware
    app.use(express_1.default.json());
    // Import routes after environment is set
    const authRoutes = (await Promise.resolve().then(() => __importStar(require('../../routes/auth')))).default;
    const openpayRoutes = (await Promise.resolve().then(() => __importStar(require('../../routes/openpay')))).default;
    const openpayWebhookRoutes = (await Promise.resolve().then(() => __importStar(require('../../routes/webhooks/openpay')))).default;
    // Apply routes
    app.use('/api/auth', authRoutes);
    app.use('/api/openpay', openpayRoutes);
    app.use('/api/webhooks/openpay', openpayWebhookRoutes);
    return app;
}
async function createTestUser(email = 'test@example.com', username = 'testuser', password = 'password123') {
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    const user = await database_1.prisma.user.create({
        data: {
            email,
            username,
            password: hashedPassword,
            fullName: 'Test User',
            role: 'USER',
            pearlsBalance: 0,
            isActive: true,
            isVerified: true
        }
    });
    // Create wallet
    await database_1.prisma.wallet.create({
        data: {
            userId: user.id,
            balance: 0
        }
    });
    return user;
}
async function createAdminUser(email = 'admin@example.com', username = 'admin', password = 'admin123') {
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    return await database_1.prisma.user.create({
        data: {
            email,
            username,
            password: hashedPassword,
            fullName: 'Admin User',
            role: 'ADMIN',
            pearlsBalance: 0,
            isActive: true,
            isVerified: true
        }
    });
}
function createAuthToken(user, expiresIn = '1h') {
    const payload = {
        userId: user.id,
        email: user.email,
        role: user.role
    };
    const options = {
        expiresIn
    };
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, options);
}
async function createTestOpenpayCustomer(userId) {
    return await database_1.prisma.openpayCustomer.create({
        data: {
            userId,
            openpayCustomerId: `test_customer_${userId}`,
            email: 'test@example.com',
            name: 'Test Customer',
            phone: '+51987654321'
        }
    });
}
async function createTestDepositRequest(userId, amount = 100, status = 'PENDING') {
    return await database_1.prisma.depositRequest.create({
        data: {
            userId,
            amount,
            pearlsAmount: amount, // 1:1 conversion
            currency: 'PEN',
            paymentMethod: 'OPENPAY_CARD',
            referenceCode: `TEST-${Date.now()}`,
            integrationMethod: 'openpay',
            autoApprovalEligible: true,
            status,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
    });
}
async function createTestOpenpayTransaction(depositRequestId, openpayChargeId, status = 'pending') {
    return await database_1.prisma.openpayTransaction.create({
        data: {
            depositRequestId,
            openpayTransactionId: openpayChargeId,
            openpayChargeId,
            amount: 100,
            currency: 'PEN',
            paymentMethod: 'card',
            openpayStatus: status,
            customerId: 'test_customer_id',
            customerEmail: 'test@example.com',
            operationType: 'card',
            deviceSessionId: 'test_device_session'
        }
    });
}
async function createTestWebhookEvent(transactionId, eventType = 'charge.succeeded') {
    return await database_1.prisma.openpayWebhookEvent.create({
        data: {
            openpayEventId: `webhook_${Date.now()}`,
            eventType,
            transactionId,
            payload: JSON.stringify({
                type: eventType,
                event_date: new Date().toISOString(),
                data: {
                    object: {
                        id: transactionId,
                        status: 'completed'
                    }
                }
            }),
            processingStatus: 'pending',
            webhookSignature: 'test_signature'
        }
    });
}
async function cleanupTestData() {
    try {
        // Clean up in reverse dependency order
        await database_1.prisma.openpayWebhookEvent.deleteMany({});
        await database_1.prisma.openpayPaymentMethod.deleteMany({});
        await database_1.prisma.openpayTransaction.deleteMany({});
        await database_1.prisma.openpayCustomer.deleteMany({});
        await database_1.prisma.depositRequest.deleteMany({});
        await database_1.prisma.transaction.deleteMany({});
        await database_1.prisma.wallet.deleteMany({});
        await database_1.prisma.user.deleteMany({});
        structuredLogger_1.logger.info('Test data cleanup completed');
    }
    catch (error) {
        structuredLogger_1.logger.error('Error cleaning up test data', error);
    }
}
async function setupTestDatabase() {
    try {
        // In a real setup, you might run migrations here
        structuredLogger_1.logger.info('Test database setup completed');
    }
    catch (error) {
        structuredLogger_1.logger.error('Error setting up test database', error);
        throw error;
    }
}
async function teardownTestDatabase() {
    try {
        await cleanupTestData();
        await database_1.prisma.$disconnect();
        structuredLogger_1.logger.info('Test database teardown completed');
    }
    catch (error) {
        structuredLogger_1.logger.error('Error tearing down test database', error);
    }
}
// Test data factories
exports.TestDataFactory = {
    user: (overrides = {}) => ({
        email: 'factory@example.com',
        username: 'factoryuser',
        fullName: 'Factory User',
        role: 'USER',
        pearlsBalance: 0,
        isActive: true,
        isVerified: true,
        ...overrides
    }),
    depositRequest: (userId, overrides = {}) => ({
        userId,
        amount: 100,
        pearlsAmount: 100,
        currency: 'PEN',
        paymentMethod: 'OPENPAY_CARD',
        referenceCode: `FACTORY-${Date.now()}`,
        integrationMethod: 'openpay',
        autoApprovalEligible: true,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        ...overrides
    }),
    openpayTransaction: (depositRequestId, overrides = {}) => ({
        depositRequestId,
        openpayTransactionId: `factory_charge_${Date.now()}`,
        openpayChargeId: `factory_charge_${Date.now()}`,
        amount: 100,
        currency: 'PEN',
        paymentMethod: 'card',
        openpayStatus: 'pending',
        customerId: 'factory_customer_id',
        customerEmail: 'factory@example.com',
        operationType: 'card',
        ...overrides
    }),
    webhookPayload: (chargeId, eventType = 'charge.succeeded', overrides = {}) => ({
        type: eventType,
        event_date: new Date().toISOString(),
        data: {
            object: {
                id: chargeId,
                amount: 100,
                status: eventType.includes('succeeded') ? 'completed' : 'failed',
                creation_date: new Date().toISOString(),
                ...(overrides.objectData || {})
            }
        },
        ...overrides
    })
};
// Test assertion helpers
exports.TestAssertions = {
    expectSuccessfulPayment: (response, expectedAmount) => {
        expect(response.body.success).toBe(true);
        expect(response.body.transactionId).toBeDefined();
        expect(response.body.openpayChargeId).toBeDefined();
        expect(typeof response.body.amount).toBe('number');
    },
    expectFailedPayment: (response, expectedError) => {
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
        if (expectedError) {
            expect(response.body.error).toContain(expectedError);
        }
    },
    expectValidationError: (response, expectedCode) => {
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        if (expectedCode) {
            expect(response.body.code).toBe(expectedCode);
        }
    },
    expectUnauthorized: (response) => {
        expect(response.status).toBe(401);
    },
    expectRateLimited: (response) => {
        expect(response.status).toBe(429);
    }
};
exports.default = {
    createTestApp,
    createTestUser,
    createAdminUser,
    createAuthToken,
    createTestOpenpayCustomer,
    createTestDepositRequest,
    createTestOpenpayTransaction,
    createTestWebhookEvent,
    cleanupTestData,
    setupTestDatabase,
    teardownTestDatabase,
    TestDataFactory: exports.TestDataFactory,
    TestAssertions: exports.TestAssertions
};
//# sourceMappingURL=testSetup.js.map