import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { setupTestDatabase, teardownTestDatabase, cleanupTestData } from './helpers/testSetup';

// Global test setup
beforeAll(async () => {
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
  await setupTestDatabase();
  
  console.log('🧪 Test environment initialized');
});

// Global test teardown
afterAll(async () => {
  await teardownTestDatabase();
  console.log('🧹 Test environment cleaned up');
});

// Clean up between test suites
beforeEach(async () => {
  // This ensures each test starts with a clean slate
  await cleanupTestData();
});

// Optional: Additional cleanup after each test
afterEach(async () => {
  // Clear any test-specific state if needed
});

// Mock console methods to reduce noise during tests
const originalConsole = { ...console };

beforeAll(() => {
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
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
export * from './helpers/testSetup';