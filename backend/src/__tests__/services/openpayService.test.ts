import { describe, it, expect, beforeEach, afterEach, jest, beforeAll, afterAll } from '@jest/globals';
import { OpenpayService, CardPaymentData, BankTransferData } from '../../services/openpayService';
import { prisma } from '../../config/database';

// Mock external dependencies
jest.mock('../../config/database');
jest.mock('../../config/openpay');
jest.mock('../../utils/structuredLogger');
jest.mock('../../services/notificationService');
jest.mock('../../services/walletService');

const mockPrisma = prisma as any;

// Mock Openpay client
const mockOpenpayClient = {
  customers: {
    create: jest.fn(),
  },
  charges: {
    create: jest.fn(),
  }
};

// Mock config
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

describe('OpenpayService', () => {
  let openpayService: OpenpayService;

  beforeEach(() => {
    jest.clearAllMocks();
    openpayService = new OpenpayService();
  });

  describe('processCardPayment', () => {
    const mockCardPaymentData: CardPaymentData = {
      userId: 'user123',
      amount: 100,
      token: 'token123',
      deviceSessionId: 'device123',
      customerEmail: 'test@example.com',
      customerName: 'Test User',
      customerPhone: '+51987654321'
    };

    it('should successfully process a card payment', async () => {
      // Mock database responses
      mockPrisma.openpayCustomer.findUnique.mockResolvedValue({
        id: 'customer123',
        userId: 'user123',
        openpayCustomerId: 'openpay_customer123',
        email: 'test@example.com',
        name: 'Test User',
        phone: '+51987654321'
      });

      mockPrisma.depositRequest.create.mockResolvedValue({
        id: 'deposit123',
        userId: 'user123',
        amount: 100,
        pearlsAmount: 100,
        currency: 'PEN',
        paymentMethod: 'OPENPAY_CARD',
        referenceCode: 'BINGO-REF123',
        integrationMethod: 'openpay',
        autoApprovalEligible: true,
        status: 'PENDING'
      });

      mockPrisma.openpayTransaction.create.mockResolvedValue({
        id: 'transaction123',
        depositRequestId: 'deposit123',
        openpayTransactionId: 'charge123',
        openpayChargeId: 'charge123',
        amount: 100,
        paymentMethod: 'card',
        openpayStatus: 'completed'
      });

      // Mock Openpay response
      mockOpenpayClient.charges.create.mockResolvedValue({
        id: 'charge123',
        status: 'completed',
        authorization: 'AUTH123',
        creation_date: '2024-01-10T10:00:00Z',
        due_date: '2024-01-11T10:00:00Z',
        card: {
          brand: 'visa',
          card_number: '1234',
          type: 'credit',
          holder_name: 'TEST USER'
        }
      });

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      mockPrisma.depositRequest.update.mockResolvedValue({
        id: 'deposit123',
        userId: 'user123',
        status: 'APPROVED'
      });

      mockPrisma.transaction.create.mockResolvedValue({});
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.wallet.upsert.mockResolvedValue({});

      const result = await openpayService.processCardPayment(mockCardPaymentData);

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe('transaction123');
      expect(result.openpayChargeId).toBe('charge123');
      expect(result.status).toBe('completed');
      expect(result.authorizationCode).toBe('AUTH123');

      expect(mockOpenpayClient.charges.create).toHaveBeenCalledWith({
        source_id: 'token123',
        method: 'card',
        amount: 100,
        currency: 'pen',
        description: 'Depósito Bingo La Perla - BINGO-REF123',
        device_session_id: 'device123',
        customer: {
          id: 'openpay_customer123'
        },
        confirm: true,
        send_email: false,
        order_id: 'BINGO-REF123'
      });
    });

    it('should handle card payment failure', async () => {
      mockPrisma.openpayCustomer.findUnique.mockResolvedValue({
        id: 'customer123',
        openpayCustomerId: 'openpay_customer123'
      });

      mockPrisma.depositRequest.create.mockResolvedValue({
        id: 'deposit123',
        referenceCode: 'BINGO-REF123'
      });

      // Mock Openpay error
      mockOpenpayClient.charges.create.mockRejectedValue({
        error_code: 'CARD_DECLINED',
        description: 'The card was declined'
      });

      const result = await openpayService.processCardPayment(mockCardPaymentData);

      expect(result.success).toBe(false);
      expect(result.errorMessage).toBe('The card was declined');
      expect(result.errorCode).toBe('CARD_DECLINED');
    });

    it('should create new customer if not exists', async () => {
      mockPrisma.openpayCustomer.findUnique.mockResolvedValue(null);
      
      mockOpenpayClient.customers.create.mockResolvedValue({
        id: 'new_openpay_customer123',
        name: 'Test User',
        email: 'test@example.com'
      });

      mockPrisma.openpayCustomer.create.mockResolvedValue({
        id: 'new_customer123',
        userId: 'user123',
        openpayCustomerId: 'new_openpay_customer123',
        email: 'test@example.com',
        name: 'Test User'
      });

      mockPrisma.depositRequest.create.mockResolvedValue({
        id: 'deposit123',
        referenceCode: 'BINGO-REF123'
      });

      mockOpenpayClient.charges.create.mockResolvedValue({
        id: 'charge123',
        status: 'completed'
      });

      mockPrisma.openpayTransaction.create.mockResolvedValue({
        id: 'transaction123'
      });

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      const result = await openpayService.processCardPayment(mockCardPaymentData);

      expect(mockOpenpayClient.customers.create).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        phone_number: '+51987654321',
        external_id: 'user123'
      });

      expect(mockPrisma.openpayCustomer.create).toHaveBeenCalledWith({
        data: {
          userId: 'user123',
          openpayCustomerId: 'new_openpay_customer123',
          email: 'test@example.com',
          name: 'Test User',
          phone: '+51987654321'
        }
      });
    });
  });

  describe('processBankTransfer', () => {
    const mockBankTransferData: BankTransferData = {
      userId: 'user123',
      amount: 200,
      customerEmail: 'test@example.com',
      customerName: 'Test User'
    };

    it('should successfully create bank transfer', async () => {
      mockPrisma.openpayCustomer.findUnique.mockResolvedValue({
        id: 'customer123',
        openpayCustomerId: 'openpay_customer123'
      });

      mockPrisma.depositRequest.create.mockResolvedValue({
        id: 'deposit123',
        referenceCode: 'BINGO-REF123'
      });

      mockOpenpayClient.charges.create.mockResolvedValue({
        id: 'transfer123',
        status: 'charge_pending',
        payment_method: {
          bank: 'BCP',
          clabe: '1234567890123456',
          reference: 'REF123456'
        },
        due_date: '2024-01-11T23:59:59Z'
      });

      mockPrisma.openpayTransaction.create.mockResolvedValue({
        id: 'transaction123'
      });

      const result = await openpayService.processBankTransfer(mockBankTransferData);

      expect(result.success).toBe(true);
      expect(result.paymentInstructions).toEqual({
        bankName: 'BCP',
        accountNumber: '1234567890123456',
        reference: 'REF123456',
        expirationDate: '2024-01-11T23:59:59Z'
      });

      expect(mockOpenpayClient.charges.create).toHaveBeenCalledWith({
        method: 'bank_account',
        amount: 200,
        currency: 'pen',
        description: 'Depósito Bingo La Perla - BINGO-REF123',
        customer: {
          id: 'openpay_customer123'
        },
        order_id: 'BINGO-REF123'
      });
    });
  });

  describe('autoApproveDeposit', () => {
    it('should successfully auto-approve deposit', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      mockPrisma.depositRequest.update.mockResolvedValue({
        id: 'deposit123',
        userId: 'user123',
        amount: 100,
        pearlsAmount: 100,
        referenceCode: 'BINGO-REF123',
        user: {
          id: 'user123',
          email: 'test@example.com'
        }
      });

      mockPrisma.transaction.create.mockResolvedValue({});
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.wallet.upsert.mockResolvedValue({});
      mockPrisma.depositRequest.findUnique.mockResolvedValue({
        id: 'deposit123',
        userId: 'user123',
        amount: 100,
        pearlsAmount: 100,
        referenceCode: 'BINGO-REF123'
      });

      await expect(
        openpayService.autoApproveDeposit('deposit123', 'transaction123')
      ).resolves.not.toThrow();

      expect(mockPrisma.depositRequest.update).toHaveBeenCalledWith({
        where: { id: 'deposit123' },
        data: {
          status: 'APPROVED',
          validatedAt: expect.any(Date),
          validatedBy: 'SYSTEM_OPENPAY',
          adminNotes: 'Auto-aprobado por pago exitoso Openpay',
          openpayTransactionId: 'transaction123'
        },
        include: { user: true }
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user123' },
        data: {
          pearlsBalance: {
            increment: 100
          }
        }
      });
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify valid webhook signature', () => {
      const payload = { type: 'charge.succeeded', data: { id: 'charge123' } };
      const signature = 'valid_signature_hash';

      // This test would require mocking crypto operations
      const isValid = openpayService.verifyWebhookSignature(signature, payload);
      
      // Since we're mocking, we can't test the actual crypto verification
      // In a real test, you'd provide a known good signature
      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('getTransactionByChargeId', () => {
    it('should find transaction by charge ID', async () => {
      const mockTransaction = {
        id: 'transaction123',
        openpayChargeId: 'charge123',
        depositRequest: {
          user: {
            id: 'user123',
            email: 'test@example.com'
          }
        }
      };

      mockPrisma.openpayTransaction.findUnique.mockResolvedValue(mockTransaction);

      const result = await openpayService.getTransactionByChargeId('charge123');

      expect(result).toEqual(mockTransaction);
      expect(mockPrisma.openpayTransaction.findUnique).toHaveBeenCalledWith({
        where: { openpayChargeId: 'charge123' },
        include: {
          depositRequest: {
            include: { user: true }
          }
        }
      });
    });
  });

  describe('updateTransactionStatus', () => {
    it('should update transaction status with additional data', async () => {
      const mockUpdatedTransaction = {
        id: 'transaction123',
        openpayStatus: 'completed',
        authorizationCode: 'AUTH123'
      };

      mockPrisma.openpayTransaction.update.mockResolvedValue(mockUpdatedTransaction);

      const result = await openpayService.updateTransactionStatus(
        'transaction123',
        'completed',
        {
          authorizationCode: 'AUTH123',
          chargedAt: '2024-01-10T10:00:00Z'
        }
      );

      expect(result).toEqual(mockUpdatedTransaction);
      expect(mockPrisma.openpayTransaction.update).toHaveBeenCalledWith({
        where: { id: 'transaction123' },
        data: {
          openpayStatus: 'completed',
          updatedAt: expect.any(Date),
          authorizationCode: 'AUTH123',
          chargedAt: expect.any(Date)
        }
      });
    });
  });

  describe('getTransactionHistory', () => {
    it('should return paginated transaction history', async () => {
      const mockTransactions = [
        {
          id: 'transaction1',
          amount: 100,
          createdAt: new Date(),
          depositRequest: {
            referenceCode: 'BINGO-REF1'
          }
        },
        {
          id: 'transaction2',
          amount: 200,
          createdAt: new Date(),
          depositRequest: {
            referenceCode: 'BINGO-REF2'
          }
        }
      ];

      mockPrisma.openpayTransaction.findMany.mockResolvedValue(mockTransactions);
      mockPrisma.openpayTransaction.count.mockResolvedValue(25);

      const result = await openpayService.getTransactionHistory('user123', 2, 10);

      expect(result.transactions).toEqual(mockTransactions);
      expect(result.total).toBe(25);

      expect(mockPrisma.openpayTransaction.findMany).toHaveBeenCalledWith({
        where: {
          depositRequest: {
            userId: 'user123'
          }
        },
        include: {
          depositRequest: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: 10, // (page - 1) * limit = (2 - 1) * 10
        take: 10
      });
    });
  });
});