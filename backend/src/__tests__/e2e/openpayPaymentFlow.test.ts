import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import { Express } from 'express';
import { prisma } from '../../config/database';
import { 
  createTestApp, 
  createTestUser, 
  createAuthToken, 
  cleanupTestData,
  TestDataFactory,
  TestAssertions
} from '../helpers/testSetup';

// Mock external dependencies
jest.mock('../../config/openpay');
jest.mock('../../utils/structuredLogger');
jest.mock('../../services/notificationService');

const mockOpenpayClient = {
  customers: {
    create: jest.fn(),
    get: jest.fn(),
  },
  charges: {
    create: jest.fn(),
    get: jest.fn(),
  }
};

jest.mock('../../config/openpay', () => ({
  createOpenpayClient: () => mockOpenpayClient,
  openpayConfig: {
    merchantId: 'test_merchant',
    privateKey: 'test_private_key',
    publicKey: 'test_public_key',
    production: false,
    webhookUsername: 'test_user',
    webhookPassword: 'test_password'
  }
}));

describe('Openpay Payment Flow E2E Tests', () => {
  let app: Express;
  let testUser: any;
  let authToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    testUser = await createTestUser();
    authToken = createAuthToken(testUser);
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe('Complete Card Payment Flow', () => {
    it('should complete full card payment flow with automatic approval', async () => {
      // 1. Mock Openpay customer creation
      mockOpenpayClient.customers.create.mockResolvedValue({
        id: 'openpay_customer_e2e_123',
        name: 'Test User E2E',
        email: 'test@example.com',
        external_id: testUser.id
      });

      // 2. Mock successful card charge
      mockOpenpayClient.charges.create.mockResolvedValue({
        id: 'charge_e2e_123',
        status: 'completed',
        amount: 150,
        currency: 'pen',
        authorization: 'AUTH_E2E_123',
        creation_date: '2024-01-10T10:00:00Z',
        due_date: '2024-01-11T10:00:00Z',
        card: {
          brand: 'visa',
          card_number: '1234',
          type: 'credit',
          holder_name: 'TEST USER E2E'
        },
        order_id: 'BINGO-TEST-E2E'
      });

      // 3. Get initial user balance
      const initialUser = await prisma.user.findUnique({
        where: { id: testUser.id },
        select: { pearlsBalance: true }
      });
      const initialBalance = parseFloat(initialUser!.pearlsBalance.toString());

      // 4. Process card payment
      const paymentResponse = await request(app)
        .post('/api/openpay/card')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 150,
          token: 'test_token_e2e_123',
          deviceSessionId: 'device_e2e_123',
          customerEmail: 'test@example.com',
          customerName: 'Test User E2E',
          customerPhone: '+51987654321'
        });

      // 5. Verify payment response
      TestAssertions.expectSuccessfulPayment(paymentResponse, 150);
      expect(paymentResponse.body.status).toBe('completed');
      expect(paymentResponse.body.authorizationCode).toBe('AUTH_E2E_123');

      const transactionId = paymentResponse.body.transactionId;

      // 6. Verify transaction was created
      const transaction = await prisma.openpayTransaction.findUnique({
        where: { id: transactionId },
        include: {
          depositRequest: {
            include: {
              user: true
            }
          }
        }
      });

      expect(transaction).toBeTruthy();
      expect(transaction!.openpayStatus).toBe('completed');
      expect(transaction!.amount).toBe(150);
      expect(transaction!.authorizationCode).toBe('AUTH_E2E_123');
      expect(transaction!.depositRequest.status).toBe('APPROVED');

      // 7. Verify user balance was updated
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id },
        select: { pearlsBalance: true }
      });
      const newBalance = parseFloat(updatedUser!.pearlsBalance.toString());
      expect(newBalance).toBe(initialBalance + 150);

      // 8. Verify wallet was updated
      const wallet = await prisma.wallet.findUnique({
        where: { userId: testUser.id }
      });
      expect(parseFloat(wallet!.balance.toString())).toBe(newBalance);

      // 9. Verify transaction history entry
      const transactionHistory = await request(app)
        .get('/api/openpay/transactions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(transactionHistory.status).toBe(200);
      expect(transactionHistory.body.transactions.length).toBeGreaterThan(0);
      
      const historyTransaction = transactionHistory.body.transactions.find(
        (t: any) => t.id === transactionId
      );
      expect(historyTransaction).toBeTruthy();
      expect(historyTransaction.status).toBe('completed');
    });

    it('should handle card payment with pending status and webhook confirmation', async () => {
      // 1. Mock pending card charge
      mockOpenpayClient.charges.create.mockResolvedValue({
        id: 'charge_pending_123',
        status: 'charge_pending',
        amount: 75,
        currency: 'pen',
        creation_date: '2024-01-10T10:00:00Z',
        due_date: '2024-01-11T10:00:00Z',
        card: {
          brand: 'mastercard',
          card_number: '5678',
          type: 'debit',
          holder_name: 'PENDING USER'
        }
      });

      // 2. Process card payment
      const paymentResponse = await request(app)
        .post('/api/openpay/card')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 75,
          token: 'test_token_pending_123',
          deviceSessionId: 'device_pending_123',
          customerEmail: 'pending@example.com',
          customerName: 'Pending User'
        });

      // 3. Verify payment is initially pending
      TestAssertions.expectSuccessfulPayment(paymentResponse, 75);
      expect(paymentResponse.body.status).toBe('charge_pending');

      const transactionId = paymentResponse.body.transactionId;

      // 4. Get initial user balance (should be unchanged)
      const initialUser = await prisma.user.findUnique({
        where: { id: testUser.id },
        select: { pearlsBalance: true }
      });
      const initialBalance = parseFloat(initialUser!.pearlsBalance.toString());

      // 5. Simulate webhook confirmation
      const webhookResponse = await request(app)
        .post('/api/webhooks/openpay')
        .send({
          type: 'charge.succeeded',
          event_date: '2024-01-10T10:05:00Z',
          data: {
            object: {
              id: 'charge_pending_123',
              amount: 75,
              status: 'completed',
              authorization: 'AUTH_WEBHOOK_123',
              creation_date: '2024-01-10T10:00:00Z',
              charged_date: '2024-01-10T10:05:00Z'
            }
          }
        });

      expect(webhookResponse.status).toBe(200);
      expect(webhookResponse.body.received).toBe(true);

      // 6. Verify transaction was updated by webhook
      const updatedTransaction = await prisma.openpayTransaction.findUnique({
        where: { id: transactionId },
        include: { depositRequest: true }
      });

      expect(updatedTransaction!.openpayStatus).toBe('completed');
      expect(updatedTransaction!.authorizationCode).toBe('AUTH_WEBHOOK_123');
      expect(updatedTransaction!.depositRequest.status).toBe('APPROVED');

      // 7. Verify user balance was updated after webhook
      const finalUser = await prisma.user.findUnique({
        where: { id: testUser.id },
        select: { pearlsBalance: true }
      });
      const finalBalance = parseFloat(finalUser!.pearlsBalance.toString());
      expect(finalBalance).toBe(initialBalance + 75);
    });
  });

  describe('Complete Bank Transfer Flow', () => {
    it('should complete bank transfer flow with manual confirmation', async () => {
      // 1. Mock bank transfer creation
      mockOpenpayClient.charges.create.mockResolvedValue({
        id: 'transfer_e2e_123',
        status: 'charge_pending',
        amount: 300,
        currency: 'pen',
        method: 'bank_account',
        creation_date: '2024-01-10T10:00:00Z',
        due_date: '2024-01-12T23:59:59Z',
        payment_method: {
          bank: 'Banco de Crédito del Perú',
          clabe: '0021350100000001234567',
          reference: 'BINGO300REF789'
        }
      });

      // 2. Create bank transfer
      const transferResponse = await request(app)
        .post('/api/openpay/bank-transfer')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 300,
          customerEmail: 'transfer@example.com',
          customerName: 'Transfer User'
        });

      // 3. Verify bank transfer instructions
      TestAssertions.expectSuccessfulPayment(transferResponse, 300);
      expect(transferResponse.body.paymentInstructions).toEqual({
        bankName: 'Banco de Crédito del Perú',
        accountNumber: '0021350100000001234567',
        reference: 'BINGO300REF789',
        expirationDate: '2024-01-12T23:59:59Z'
      });

      const transactionId = transferResponse.body.transactionId;

      // 4. Verify transaction is pending (not auto-approved)
      const transaction = await prisma.openpayTransaction.findUnique({
        where: { id: transactionId },
        include: { depositRequest: true }
      });

      expect(transaction!.openpayStatus).toBe('charge_pending');
      expect(transaction!.depositRequest.status).toBe('PENDING');
      expect(transaction!.depositRequest.autoApprovalEligible).toBe(false);

      // 5. Get user balance (should be unchanged)
      const initialUser = await prisma.user.findUnique({
        where: { id: testUser.id },
        select: { pearlsBalance: true }
      });
      const initialBalance = parseFloat(initialUser!.pearlsBalance.toString());

      // 6. Simulate successful bank transfer webhook
      const webhookResponse = await request(app)
        .post('/api/webhooks/openpay')
        .send({
          type: 'charge.succeeded',
          event_date: '2024-01-10T12:00:00Z',
          data: {
            object: {
              id: 'transfer_e2e_123',
              amount: 300,
              status: 'completed',
              method: 'bank_account',
              charged_date: '2024-01-10T12:00:00Z'
            }
          }
        });

      expect(webhookResponse.status).toBe(200);

      // 7. Verify balance updated after webhook
      const finalUser = await prisma.user.findUnique({
        where: { id: testUser.id },
        select: { pearlsBalance: true }
      });
      const finalBalance = parseFloat(finalUser!.pearlsBalance.toString());
      expect(finalBalance).toBe(initialBalance + 300);

      // 8. Verify deposit request is now approved
      const updatedTransaction = await prisma.openpayTransaction.findUnique({
        where: { id: transactionId },
        include: { depositRequest: true }
      });
      expect(updatedTransaction!.depositRequest.status).toBe('APPROVED');
    });
  });

  describe('Payment Error Handling Flows', () => {
    it('should handle card declined scenario', async () => {
      // 1. Mock card declined error
      mockOpenpayClient.charges.create.mockRejectedValue({
        error_code: 'CARD_DECLINED',
        description: 'The card was declined by the issuing bank',
        http_code: 402,
        category: 'REQUEST'
      });

      // 2. Attempt card payment
      const paymentResponse = await request(app)
        .post('/api/openpay/card')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 100,
          token: 'declined_card_token',
          deviceSessionId: 'device_declined',
          customerEmail: 'declined@example.com',
          customerName: 'Declined User'
        });

      // 3. Verify error response
      TestAssertions.expectFailedPayment(paymentResponse, 'declined');
      expect(paymentResponse.body.errorCode).toBe('CARD_DECLINED');

      // 4. Verify user balance unchanged
      const user = await prisma.user.findUnique({
        where: { id: testUser.id },
        select: { pearlsBalance: true }
      });
      const balance = parseFloat(user!.pearlsBalance.toString());
      // Balance should remain the same as initial test setup
      expect(balance).toBeGreaterThanOrEqual(0);

      // 5. Verify no approved deposit request was created
      const depositRequests = await prisma.depositRequest.findMany({
        where: { 
          userId: testUser.id,
          status: 'APPROVED'
        }
      });
      
      // Should not have new approved requests from this failed payment
      const recentApproved = depositRequests.filter(req => 
        Date.now() - req.createdAt.getTime() < 5000 // Last 5 seconds
      );
      expect(recentApproved.length).toBe(0);
    });

    it('should handle webhook for failed charge', async () => {
      // 1. Create a pending transaction
      const depositRequest = await prisma.depositRequest.create({
        data: TestDataFactory.depositRequest(testUser.id)
      });

      const transaction = await prisma.openpayTransaction.create({
        data: TestDataFactory.openpayTransaction(depositRequest.id, {
          openpayChargeId: 'charge_will_fail_123',
          openpayStatus: 'charge_pending'
        })
      });

      // 2. Send failure webhook
      const webhookResponse = await request(app)
        .post('/api/webhooks/openpay')
        .send({
          type: 'charge.failed',
          event_date: '2024-01-10T10:00:00Z',
          data: {
            object: {
              id: 'charge_will_fail_123',
              amount: 100,
              status: 'failed',
              error_code: 'INSUFFICIENT_FUNDS',
              error_message: 'Insufficient funds'
            }
          }
        });

      expect(webhookResponse.status).toBe(200);

      // 3. Verify transaction updated to failed
      const updatedTransaction = await prisma.openpayTransaction.findUnique({
        where: { id: transaction.id },
        include: { depositRequest: true }
      });

      expect(updatedTransaction!.openpayStatus).toBe('failed');
      expect(updatedTransaction!.openpayErrorCode).toBe('INSUFFICIENT_FUNDS');
      expect(updatedTransaction!.openpayErrorMessage).toBe('Insufficient funds');
      
      // Deposit should remain pending or be marked as failed
      expect(updatedTransaction!.depositRequest.status).not.toBe('APPROVED');
    });
  });

  describe('Security and Validation Flows', () => {
    it('should prevent payment attempts with invalid amounts', async () => {
      const testCases = [
        { amount: 0, expectedError: 'AMOUNT_OUT_OF_RANGE' },
        { amount: -50, expectedError: 'AMOUNT_OUT_OF_RANGE' },
        { amount: 15000, expectedError: 'AMOUNT_OUT_OF_RANGE' },
        { amount: 'invalid', expectedError: 'INVALID_AMOUNT' },
        { amount: null, expectedError: 'INVALID_AMOUNT' }
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .post('/api/openpay/card')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            amount: testCase.amount,
            token: 'test_token',
            deviceSessionId: 'device_test',
            customerEmail: 'test@example.com',
            customerName: 'Test User'
          });

        TestAssertions.expectValidationError(response, testCase.expectedError);
      }
    });

    it('should prevent unauthorized access to payment endpoints', async () => {
      const endpoints = [
        { method: 'post', path: '/api/openpay/card' },
        { method: 'post', path: '/api/openpay/bank-transfer' },
        { method: 'get', path: '/api/openpay/transactions' },
        { method: 'get', path: '/api/openpay/transaction/test_id' }
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)[endpoint.method](endpoint.path)
          .send({ test: 'data' });

        TestAssertions.expectUnauthorized(response);
      }
    });

    it('should enforce rate limiting on payment endpoints', async () => {
      // Mock successful Openpay response to focus on rate limiting
      mockOpenpayClient.charges.create.mockResolvedValue({
        id: 'rate_limit_charge',
        status: 'completed'
      });

      // Make multiple requests quickly
      const promises = Array(15).fill(null).map((_, index) =>
        request(app)
          .post('/api/openpay/card')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            amount: 10 + index, // Vary amounts to avoid duplicate detection
            token: `rate_limit_token_${index}`,
            deviceSessionId: `rate_limit_device_${index}`,
            customerEmail: 'ratelimit@example.com',
            customerName: 'Rate Limit User'
          })
      );

      const responses = await Promise.all(promises);
      
      // Some requests should be rate limited
      const rateLimited = responses.filter(res => res.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('Transaction Status and History Flows', () => {
    it('should provide real-time transaction status updates', async () => {
      // 1. Create a pending transaction
      const depositRequest = await prisma.depositRequest.create({
        data: TestDataFactory.depositRequest(testUser.id)
      });

      const transaction = await prisma.openpayTransaction.create({
        data: TestDataFactory.openpayTransaction(depositRequest.id, {
          openpayChargeId: 'status_update_123',
          openpayStatus: 'charge_pending'
        })
      });

      // 2. Check initial status
      const initialStatusResponse = await request(app)
        .get(`/api/openpay/transaction/${transaction.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(initialStatusResponse.status).toBe(200);
      expect(initialStatusResponse.body.transaction.status).toBe('charge_pending');

      // 3. Simulate webhook status update
      await request(app)
        .post('/api/webhooks/openpay')
        .send({
          type: 'charge.succeeded',
          event_date: '2024-01-10T10:00:00Z',
          data: {
            object: {
              id: 'status_update_123',
              status: 'completed',
              authorization: 'STATUS_AUTH_123'
            }
          }
        });

      // 4. Check updated status
      const updatedStatusResponse = await request(app)
        .get(`/api/openpay/transaction/${transaction.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(updatedStatusResponse.status).toBe(200);
      expect(updatedStatusResponse.body.transaction.status).toBe('completed');
      expect(updatedStatusResponse.body.transaction.authorizationCode).toBe('STATUS_AUTH_123');
    });

    it('should provide comprehensive transaction history with filtering', async () => {
      // Create multiple transactions with different statuses
      const testTransactions = [
        { status: 'completed', amount: 100 },
        { status: 'failed', amount: 50 },
        { status: 'pending', amount: 200 }
      ];

      for (const [index, txData] of testTransactions.entries()) {
        const depositRequest = await prisma.depositRequest.create({
          data: TestDataFactory.depositRequest(testUser.id, {
            amount: txData.amount,
            status: txData.status === 'completed' ? 'APPROVED' : 'PENDING'
          })
        });

        await prisma.openpayTransaction.create({
          data: TestDataFactory.openpayTransaction(depositRequest.id, {
            openpayChargeId: `history_charge_${index}`,
            openpayStatus: txData.status,
            amount: txData.amount
          })
        });
      }

      // Get transaction history
      const historyResponse = await request(app)
        .get('/api/openpay/transactions?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(historyResponse.status).toBe(200);
      expect(historyResponse.body.transactions.length).toBeGreaterThanOrEqual(3);
      expect(historyResponse.body.total).toBeGreaterThanOrEqual(3);

      // Verify transactions are ordered by creation date (newest first)
      const transactions = historyResponse.body.transactions;
      for (let i = 1; i < transactions.length; i++) {
        const prevDate = new Date(transactions[i-1].createdAt);
        const currDate = new Date(transactions[i].createdAt);
        expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
      }
    });
  });
});