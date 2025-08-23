import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import { Express } from 'express';
import { prisma } from '../../config/database';
import { createTestApp, createTestUser, createAuthToken, cleanupTestData } from '../helpers/testSetup';

// Mock external dependencies
jest.mock('../../config/openpay');
jest.mock('../../utils/structuredLogger');

const mockOpenpayClient = {
  customers: {
    create: jest.fn(),
  },
  charges: {
    create: jest.fn(),
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

describe('Openpay API Endpoints Integration Tests', () => {
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

  describe('POST /api/openpay/card', () => {
    const cardPaymentPayload = {
      amount: 100,
      token: 'test_token_123',
      deviceSessionId: 'device_session_123',
      customerEmail: 'test@example.com',
      customerName: 'Test User',
      customerPhone: '+51987654321'
    };

    it('should process card payment successfully', async () => {
      // Mock successful Openpay response
      mockOpenpayClient.customers.create.mockResolvedValue({
        id: 'openpay_customer_123',
        name: 'Test User',
        email: 'test@example.com'
      });

      mockOpenpayClient.charges.create.mockResolvedValue({
        id: 'charge_123',
        status: 'completed',
        authorization: 'AUTH123456',
        creation_date: '2024-01-10T10:00:00Z',
        card: {
          brand: 'visa',
          card_number: '1234',
          type: 'credit',
          holder_name: 'TEST USER'
        }
      });

      const response = await request(app)
        .post('/api/openpay/card')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cardPaymentPayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.transactionId).toBeDefined();
      expect(response.body.openpayChargeId).toBe('charge_123');
      expect(response.body.status).toBe('completed');
      expect(response.body.authorizationCode).toBe('AUTH123456');
    });

    it('should handle card payment failure', async () => {
      // Mock Openpay error
      mockOpenpayClient.charges.create.mockRejectedValue({
        error_code: 'CARD_DECLINED',
        description: 'The card was declined by the bank'
      });

      const response = await request(app)
        .post('/api/openpay/card')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cardPaymentPayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('The card was declined by the bank');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/openpay/card')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 'invalid_amount', // Invalid amount
          customerEmail: 'invalid_email', // Invalid email
          customerName: '' // Empty name
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/openpay/card')
        .send(cardPaymentPayload);

      expect(response.status).toBe(401);
    });

    it('should enforce rate limiting', async () => {
      // Mock successful response for rate limiting test
      mockOpenpayClient.charges.create.mockResolvedValue({
        id: 'charge_123',
        status: 'completed'
      });

      // Make multiple requests quickly to trigger rate limiting
      const requests = Array(12).fill(null).map(() =>
        request(app)
          .post('/api/openpay/card')
          .set('Authorization', `Bearer ${authToken}`)
          .send(cardPaymentPayload)
      );

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited (429 status)
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should validate amount range', async () => {
      // Test minimum amount
      const minAmountResponse = await request(app)
        .post('/api/openpay/card')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...cardPaymentPayload,
          amount: 0.5 // Below minimum
        });

      expect(minAmountResponse.status).toBe(400);
      expect(minAmountResponse.body.code).toBe('AMOUNT_OUT_OF_RANGE');

      // Test maximum amount
      const maxAmountResponse = await request(app)
        .post('/api/openpay/card')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...cardPaymentPayload,
          amount: 15000 // Above maximum
        });

      expect(maxAmountResponse.status).toBe(400);
      expect(maxAmountResponse.body.code).toBe('AMOUNT_OUT_OF_RANGE');
    });
  });

  describe('POST /api/openpay/bank-transfer', () => {
    const bankTransferPayload = {
      amount: 200,
      customerEmail: 'test@example.com',
      customerName: 'Test User'
    };

    it('should create bank transfer successfully', async () => {
      mockOpenpayClient.charges.create.mockResolvedValue({
        id: 'transfer_123',
        status: 'charge_pending',
        payment_method: {
          bank: 'BCP',
          clabe: '1234567890123456',
          reference: 'REF123456789'
        },
        due_date: '2024-01-11T23:59:59Z'
      });

      const response = await request(app)
        .post('/api/openpay/bank-transfer')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bankTransferPayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.paymentInstructions).toEqual({
        bankName: 'BCP',
        accountNumber: '1234567890123456',
        reference: 'REF123456789',
        expirationDate: '2024-01-11T23:59:59Z'
      });
    });

    it('should handle bank transfer creation failure', async () => {
      mockOpenpayClient.charges.create.mockRejectedValue({
        error_code: 'BANK_TRANSFER_ERROR',
        description: 'Unable to create bank transfer'
      });

      const response = await request(app)
        .post('/api/openpay/bank-transfer')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bankTransferPayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Unable to create bank transfer');
    });
  });

  describe('GET /api/openpay/transaction/:transactionId', () => {
    it('should get transaction status', async () => {
      // Create a test transaction
      const transaction = await prisma.openpayTransaction.create({
        data: {
          openpayTransactionId: 'test_transaction_123',
          openpayChargeId: 'test_charge_123',
          amount: 100,
          currency: 'PEN',
          paymentMethod: 'card',
          openpayStatus: 'completed',
          customerId: testUser.id,
          customerEmail: 'test@example.com',
          operationType: 'card',
          depositRequest: {
            create: {
              userId: testUser.id,
              amount: 100,
              pearlsAmount: 100,
              currency: 'PEN',
              paymentMethod: 'OPENPAY_CARD',
              referenceCode: 'TEST-REF-123',
              integrationMethod: 'openpay',
              autoApprovalEligible: true,
              status: 'APPROVED',
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
            }
          }
        },
        include: {
          depositRequest: true
        }
      });

      const response = await request(app)
        .get(`/api/openpay/transaction/${transaction.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.transaction.id).toBe(transaction.id);
      expect(response.body.transaction.status).toBe('completed');
      expect(response.body.transaction.amount).toBe(100);
    });

    it('should return 404 for non-existent transaction', async () => {
      const response = await request(app)
        .get('/api/openpay/transaction/non_existent_id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should not allow access to other users transactions', async () => {
      // Create another user
      const otherUser = await createTestUser('other@example.com');
      const otherUserToken = createAuthToken(otherUser);

      // Create transaction for first user
      const transaction = await prisma.openpayTransaction.create({
        data: {
          openpayTransactionId: 'test_transaction_456',
          openpayChargeId: 'test_charge_456',
          amount: 100,
          currency: 'PEN',
          paymentMethod: 'card',
          openpayStatus: 'completed',
          customerId: testUser.id,
          customerEmail: testUser.email,
          operationType: 'card',
          depositRequest: {
            create: {
              userId: testUser.id,
              amount: 100,
              pearlsAmount: 100,
              currency: 'PEN',
              paymentMethod: 'OPENPAY_CARD',
              referenceCode: 'TEST-REF-456',
              integrationMethod: 'openpay',
              autoApprovalEligible: true,
              status: 'APPROVED',
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
            }
          }
        }
      });

      // Try to access with other user's token
      const response = await request(app)
        .get(`/api/openpay/transaction/${transaction.id}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(response.status).toBe(404); // Should not find transaction
    });
  });

  describe('GET /api/openpay/transactions', () => {
    beforeEach(async () => {
      // Create multiple test transactions
      await prisma.openpayTransaction.createMany({
        data: [
          {
            openpayTransactionId: 'trans_1',
            openpayChargeId: 'charge_1',
            amount: 100,
            currency: 'PEN',
            paymentMethod: 'card',
            openpayStatus: 'completed',
            customerId: testUser.id,
            customerEmail: testUser.email,
            operationType: 'card',
            depositRequestId: (await prisma.depositRequest.create({
              data: {
                userId: testUser.id,
                amount: 100,
                pearlsAmount: 100,
                currency: 'PEN',
                paymentMethod: 'OPENPAY_CARD',
                referenceCode: 'TEST-REF-1',
                integrationMethod: 'openpay',
                autoApprovalEligible: true,
                status: 'APPROVED',
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
              }
            })).id
          },
          {
            openpayTransactionId: 'trans_2',
            openpayChargeId: 'charge_2',
            amount: 200,
            currency: 'PEN',
            paymentMethod: 'bank_transfer',
            openpayStatus: 'pending',
            customerId: testUser.id,
            customerEmail: testUser.email,
            operationType: 'bank_transfer',
            depositRequestId: (await prisma.depositRequest.create({
              data: {
                userId: testUser.id,
                amount: 200,
                pearlsAmount: 200,
                currency: 'PEN',
                paymentMethod: 'OPENPAY_BANK_TRANSFER',
                referenceCode: 'TEST-REF-2',
                integrationMethod: 'openpay',
                autoApprovalEligible: false,
                status: 'PENDING',
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
              }
            })).id
          }
        ]
      });
    });

    it('should get transaction history with pagination', async () => {
      const response = await request(app)
        .get('/api/openpay/transactions?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.transactions.length).toBe(1);
      expect(response.body.total).toBeGreaterThanOrEqual(2);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(1);
    });

    it('should return empty array for user with no transactions', async () => {
      const newUser = await createTestUser('empty@example.com');
      const newUserToken = createAuthToken(newUser);

      const response = await request(app)
        .get('/api/openpay/transactions')
        .set('Authorization', `Bearer ${newUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.transactions).toEqual([]);
      expect(response.body.total).toBe(0);
    });
  });

  describe('POST /api/webhooks/openpay', () => {
    const webhookPayload = {
      type: 'charge.succeeded',
      event_date: '2024-01-10T10:00:00Z',
      data: {
        object: {
          id: 'charge_webhook_123',
          amount: 100,
          status: 'completed',
          authorization: 'AUTH_WEBHOOK_123',
          creation_date: '2024-01-10T10:00:00Z'
        }
      }
    };

    it('should process successful charge webhook', async () => {
      // Create a pending transaction that matches the webhook
      const transaction = await prisma.openpayTransaction.create({
        data: {
          openpayTransactionId: 'charge_webhook_123',
          openpayChargeId: 'charge_webhook_123',
          amount: 100,
          currency: 'PEN',
          paymentMethod: 'card',
          openpayStatus: 'charge_pending',
          customerId: testUser.id,
          customerEmail: testUser.email,
          operationType: 'card',
          depositRequest: {
            create: {
              userId: testUser.id,
              amount: 100,
              pearlsAmount: 100,
              currency: 'PEN',
              paymentMethod: 'OPENPAY_CARD',
              referenceCode: 'WEBHOOK-REF-123',
              integrationMethod: 'openpay',
              autoApprovalEligible: true,
              status: 'PENDING',
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
            }
          }
        }
      });

      const response = await request(app)
        .post('/api/webhooks/openpay')
        .send(webhookPayload);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);

      // Check that transaction was updated
      const updatedTransaction = await prisma.openpayTransaction.findUnique({
        where: { id: transaction.id },
        include: { depositRequest: true }
      });

      expect(updatedTransaction?.openpayStatus).toBe('completed');
      expect(updatedTransaction?.authorizationCode).toBe('AUTH_WEBHOOK_123');
      expect(updatedTransaction?.depositRequest.status).toBe('APPROVED');
    });

    it('should handle charge failed webhook', async () => {
      const failedWebhookPayload = {
        type: 'charge.failed',
        event_date: '2024-01-10T10:00:00Z',
        data: {
          object: {
            id: 'charge_webhook_failed',
            amount: 100,
            status: 'failed',
            error_code: 'INSUFFICIENT_FUNDS',
            error_message: 'Insufficient funds in card'
          }
        }
      };

      // Create a pending transaction
      await prisma.openpayTransaction.create({
        data: {
          openpayTransactionId: 'charge_webhook_failed',
          openpayChargeId: 'charge_webhook_failed',
          amount: 100,
          currency: 'PEN',
          paymentMethod: 'card',
          openpayStatus: 'charge_pending',
          customerId: testUser.id,
          customerEmail: testUser.email,
          operationType: 'card',
          depositRequest: {
            create: {
              userId: testUser.id,
              amount: 100,
              pearlsAmount: 100,
              currency: 'PEN',
              paymentMethod: 'OPENPAY_CARD',
              referenceCode: 'FAILED-REF-123',
              integrationMethod: 'openpay',
              autoApprovalEligible: true,
              status: 'PENDING',
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
            }
          }
        }
      });

      const response = await request(app)
        .post('/api/webhooks/openpay')
        .send(failedWebhookPayload);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });

    it('should handle unknown charge ID gracefully', async () => {
      const unknownChargePayload = {
        type: 'charge.succeeded',
        event_date: '2024-01-10T10:00:00Z',
        data: {
          object: {
            id: 'unknown_charge_id',
            amount: 100,
            status: 'completed'
          }
        }
      };

      const response = await request(app)
        .post('/api/webhooks/openpay')
        .send(unknownChargePayload);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });

    it('should handle malformed webhook payload', async () => {
      const response = await request(app)
        .post('/api/webhooks/openpay')
        .send({ invalid: 'payload' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});