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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const testSetup_1 = require("./helpers/testSetup");
// Global test setup
(0, globals_1.beforeAll)(async () => {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test_jwt_secret_for_openpay_tests';
    process.env.DATABASE_URL = 'file:./test_openpay.db';
    // Openpay test configuration
    process.env.OPENPAY_MERCHANT_ID = 'test_merchant_id';
    process.env.OPENPAY_PRIVATE_KEY = 'test_private_key';
    process.env.OPENPAY_PUBLIC_KEY = 'test_public_key';
    process.env.OPENPAY_PRODUCTION = 'false';
    process.env.OPENPAY_WEBHOOK_USERNAME = 'test_webhook_user';
    process.env.OPENPAY_WEBHOOK_PASSWORD = 'test_webhook_password';
    // Database setup
    await (0, testSetup_1.setupTestDatabase)();
    console.log('🧪 Test environment initialized');
});
// Global test teardown
(0, globals_1.afterAll)(async () => {
    await (0, testSetup_1.teardownTestDatabase)();
    console.log('🧹 Test environment cleaned up');
});
// Clean up between test suites
(0, globals_1.beforeEach)(async () => {
    // This ensures each test starts with a clean slate
    await (0, testSetup_1.cleanupTestData)();
});
// Optional: Additional cleanup after each test
(0, globals_1.afterEach)(async () => {
    // Clear any test-specific state if needed
});
// Mock console methods to reduce noise during tests
const originalConsole = { ...console };
(0, globals_1.beforeAll)(() => {
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
});
(0, globals_1.afterAll)(() => {
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
});
// Increase timeout for longer operations
jest.setTimeout(30000);
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
// Export test utilities for use in tests
__exportStar(require("./helpers/testSetup"), exports);
//# sourceMappingURL=setup.js.map