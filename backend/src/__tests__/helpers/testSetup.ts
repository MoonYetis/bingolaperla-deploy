import { Express } from 'express';
import express from 'express';
import { prisma } from '../../config/database';
import { logger } from '../../utils/structuredLogger';
import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Mock environment for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.DATABASE_URL = 'file:./test.db';

export async function createTestApp(): Promise<Express> {
  const app = express();
  
  // Basic middleware
  app.use(express.json());
  
  // Import routes after environment is set
  const authRoutes = (await import('../../routes/auth')).default;
  const openpayRoutes = (await import('../../routes/openpay')).default;
  const openpayWebhookRoutes = (await import('../../routes/webhooks/openpay')).default;
  
  // Apply routes
  app.use('/api/auth', authRoutes);
  app.use('/api/openpay', openpayRoutes);
  app.use('/api/webhooks/openpay', openpayWebhookRoutes);
  
  return app;
}

export async function createTestUser(
  email: string = 'test@example.com',
  username: string = 'testuser',
  password: string = 'password123'
) {
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = await prisma.user.create({
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
  await prisma.wallet.create({
    data: {
      userId: user.id,
      balance: 0
    }
  });
  
  return user;
}

export async function createAdminUser(
  email: string = 'admin@example.com',
  username: string = 'admin',
  password: string = 'admin123'
) {
  const hashedPassword = await bcrypt.hash(password, 10);
  
  return await prisma.user.create({
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

export function createAuthToken(user: any, expiresIn: string | number = '1h'): string {
  const payload = { 
    userId: user.id, 
    email: user.email, 
    role: user.role 
  };
  const options: any = { 
    expiresIn 
  };
  return jwt.sign(payload, process.env.JWT_SECRET as string, options);
}

export async function createTestOpenpayCustomer(userId: string) {
  return await prisma.openpayCustomer.create({
    data: {
      userId,
      openpayCustomerId: `test_customer_${userId}`,
      email: 'test@example.com',
      name: 'Test Customer',
      phone: '+51987654321'
    }
  });
}

export async function createTestDepositRequest(
  userId: string,
  amount: number = 100,
  status: string = 'PENDING'
) {
  return await prisma.depositRequest.create({
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

export async function createTestOpenpayTransaction(
  depositRequestId: string,
  openpayChargeId: string,
  status: string = 'pending'
) {
  return await prisma.openpayTransaction.create({
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

export async function createTestWebhookEvent(
  transactionId: string,
  eventType: string = 'charge.succeeded'
) {
  return await prisma.openpayWebhookEvent.create({
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

export async function cleanupTestData() {
  try {
    // Clean up in reverse dependency order
    await prisma.openpayWebhookEvent.deleteMany({});
    await prisma.openpayPaymentMethod.deleteMany({});
    await prisma.openpayTransaction.deleteMany({});
    await prisma.openpayCustomer.deleteMany({});
    await prisma.depositRequest.deleteMany({});
    await prisma.transaction.deleteMany({});
    await prisma.wallet.deleteMany({});
    await prisma.user.deleteMany({});
    
    logger.info('Test data cleanup completed');
  } catch (error) {
    logger.error('Error cleaning up test data', error as Error);
  }
}

export async function setupTestDatabase() {
  try {
    // In a real setup, you might run migrations here
    logger.info('Test database setup completed');
  } catch (error) {
    logger.error('Error setting up test database', error as Error);
    throw error;
  }
}

export async function teardownTestDatabase() {
  try {
    await cleanupTestData();
    await prisma.$disconnect();
    logger.info('Test database teardown completed');
  } catch (error) {
    logger.error('Error tearing down test database', error as Error);
  }
}

// Test data factories
export const TestDataFactory = {
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

  depositRequest: (userId: string, overrides = {}) => ({
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

  openpayTransaction: (depositRequestId: string, overrides = {}) => ({
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

  webhookPayload: (chargeId: string, eventType = 'charge.succeeded', overrides: any = {}) => ({
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
export const TestAssertions = {
  expectSuccessfulPayment: (response: any, expectedAmount: number) => {
    expect(response.body.success).toBe(true);
    expect(response.body.transactionId).toBeDefined();
    expect(response.body.openpayChargeId).toBeDefined();
    expect(typeof response.body.amount).toBe('number');
  },

  expectFailedPayment: (response: any, expectedError?: string) => {
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeDefined();
    if (expectedError) {
      expect(response.body.error).toContain(expectedError);
    }
  },

  expectValidationError: (response: any, expectedCode?: string) => {
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    if (expectedCode) {
      expect(response.body.code).toBe(expectedCode);
    }
  },

  expectUnauthorized: (response: any) => {
    expect(response.status).toBe(401);
  },

  expectRateLimited: (response: any) => {
    expect(response.status).toBe(429);
  }
};

export default {
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
  TestDataFactory,
  TestAssertions
};