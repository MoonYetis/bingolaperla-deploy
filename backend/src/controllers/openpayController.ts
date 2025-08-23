import { Request, Response } from 'express';
import { z } from 'zod';
import { HTTP_STATUS } from '@/utils/constants';
import { logger } from '@/utils/structuredLogger';
import { OpenpayService } from '@/services/openpayService';
import { validateRequest } from '@/middleware/validation';

// Validation schemas
const cardPaymentSchema = z.object({
  amount: z.number().min(1).max(10000),
  token: z.string().min(1),
  deviceSessionId: z.string().min(1),
  customerEmail: z.string().email(),
  customerName: z.string().min(1),
  customerPhone: z.string().optional(),
  saveCard: z.boolean().default(false)
});

const bankTransferSchema = z.object({
  amount: z.number().min(1).max(10000),
  customerEmail: z.string().email(),
  customerName: z.string().min(1)
});

const cashPaymentSchema = z.object({
  amount: z.number().min(1).max(10000),
  customerEmail: z.string().email(),
  customerName: z.string().min(1)
});

export class OpenpayController {
  private openpayService: OpenpayService;

  constructor() {
    this.openpayService = new OpenpayService();
  }

  /**
   * Process credit/debit card payment
   */
  async processCardPayment(req: Request, res: Response): Promise<void> {
    try {
      const validation = cardPaymentSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Invalid payment data',
          details: validation.error.errors
        });
        return;
      }

      const { amount, token, deviceSessionId, customerEmail, customerName, customerPhone } = validation.data;
      const userId = req.user!.userId;

      logger.info('Processing card payment request', {
        userId,
        amount,
        customerEmail
      });

      // Validate user has sufficient limits (if needed)
      // TODO: Add daily/monthly limit checks

      // Process payment
      const result = await this.openpayService.processCardPayment({
        userId,
        amount,
        token,
        deviceSessionId,
        customerEmail,
        customerName,
        customerPhone
      });

      if (result.success) {
        logger.info('Card payment processed successfully', {
          userId,
          transactionId: result.transactionId,
          openpayChargeId: result.openpayChargeId,
          status: result.status
        });

        res.status(HTTP_STATUS.OK).json({
          success: true,
          transactionId: result.transactionId,
          openpayChargeId: result.openpayChargeId,
          status: result.status,
          authorizationCode: result.authorizationCode,
          message: result.status === 'completed' 
            ? 'Pago procesado exitosamente. Perlas agregadas a tu cuenta.'
            : 'Pago en proceso. Recibirás confirmación cuando se complete.'
        });
      } else {
        logger.warn('Card payment failed', {
          userId,
          amount,
          errorCode: result.errorCode,
          errorMessage: result.errorMessage
        });

        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: result.errorMessage,
          errorCode: result.errorCode
        });
      }

    } catch (error: any) {
      logger.error('Card payment processing error', error, {
        userId: req.user?.userId,
        body: { ...req.body, token: '[REDACTED]' }
      });

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Error processing payment',
        message: 'Please try again later'
      });
    }
  }

  /**
   * Process bank transfer payment
   */
  async processBankTransfer(req: Request, res: Response): Promise<void> {
    try {
      const validation = bankTransferSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Invalid payment data',
          details: validation.error.errors
        });
        return;
      }

      const { amount, customerEmail, customerName } = validation.data;
      const userId = req.user!.userId;

      logger.info('Processing bank transfer request', {
        userId,
        amount,
        customerEmail
      });

      const result = await this.openpayService.processBankTransfer({
        userId,
        amount,
        customerEmail,
        customerName
      });

      if (result.success) {
        logger.info('Bank transfer created successfully', {
          userId,
          transactionId: result.transactionId,
          openpayChargeId: result.openpayChargeId
        });

        res.status(HTTP_STATUS.OK).json({
          success: true,
          transactionId: result.transactionId,
          openpayChargeId: result.openpayChargeId,
          status: result.status,
          paymentInstructions: result.paymentInstructions,
          message: 'Instrucciones de transferencia bancaria generadas. Sigue los pasos para completar tu pago.'
        });
      } else {
        logger.warn('Bank transfer creation failed', {
          userId,
          amount,
          errorCode: result.errorCode,
          errorMessage: result.errorMessage
        });

        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: result.errorMessage,
          errorCode: result.errorCode
        });
      }

    } catch (error: any) {
      logger.error('Bank transfer processing error', error, {
        userId: req.user?.userId
      });

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Error creating bank transfer',
        message: 'Please try again later'
      });
    }
  }

  /**
   * Process cash payment (convenience stores)
   */
  async processCashPayment(req: Request, res: Response): Promise<void> {
    try {
      const validation = cashPaymentSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Invalid payment data',
          details: validation.error.errors
        });
        return;
      }

      const { amount, customerEmail, customerName } = validation.data;
      const userId = req.user!.userId;

      logger.info('Processing cash payment request', {
        userId,
        amount,
        customerEmail
      });

      // TODO: Implement cash payment processing
      // This would create a reference for payment at convenience stores
      
      res.status(HTTP_STATUS.NOT_IMPLEMENTED).json({
        error: 'Cash payments not yet implemented',
        message: 'This feature will be available soon'
      });

    } catch (error: any) {
      logger.error('Cash payment processing error', error, {
        userId: req.user?.userId
      });

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Error processing cash payment',
        message: 'Please try again later'
      });
    }
  }

  /**
   * Get available Openpay payment methods
   */
  async getPaymentMethods(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId; // Optional for public access

      logger.info('Getting available Openpay payment methods', { userId: userId || 'anonymous' });

      // Return available Openpay payment methods
      const paymentMethods = [
        {
          type: 'card',
          name: 'Tarjeta de Crédito/Débito',
          description: 'Pago con tarjeta de crédito o débito',
          enabled: true,
          icon: 'credit-card',
          supportedBrands: ['visa', 'mastercard', 'american_express'],
          processingTime: 'Inmediato',
          fees: {
            type: 'percentage',
            value: 3.5,
            description: '3.5% + IVA por transacción'
          }
        },
        {
          type: 'bank_transfer',
          name: 'Transferencia Bancaria',
          description: 'Transferencia desde tu banco en línea',
          enabled: true,
          icon: 'bank',
          supportedBanks: ['bcp', 'bbva', 'scotiabank', 'interbank', 'banbif'],
          processingTime: '1-2 días hábiles',
          fees: {
            type: 'fixed',
            value: 0,
            description: 'Sin costo adicional'
          }
        },
        {
          type: 'store',
          name: 'Pago en Tienda',
          description: 'Pago en efectivo en tiendas autorizadas',
          enabled: true,
          icon: 'store',
          supportedStores: ['tambo', 'oxxo', 'mass', 'full', 'repshop'],
          processingTime: '1-3 días hábiles',
          fees: {
            type: 'fixed',
            value: 2.50,
            description: 'S/ 2.50 por transacción'
          },
          limits: {
            min: 10,
            max: 500,
            description: 'Mínimo S/ 10, Máximo S/ 500 por transacción'
          }
        }
      ];

      // Get user's saved cards for the card payment method (only if user is logged in)
      let savedCards: any[] = [];
      
      if (userId) {
        try {
          const customer = await this.openpayService.getUserCustomer(userId);
          if (customer) {
            const customerPaymentMethods = await this.openpayService.getCustomerPaymentMethods(customer.id);
            savedCards = customerPaymentMethods.map(pm => ({
              id: pm.id,
              cardType: pm.cardType,
              cardBrand: pm.cardBrand,
              cardNumberMasked: pm.cardNumberMasked,
              cardHolderName: pm.cardHolderName,
              expirationMonth: pm.expirationMonth,
              expirationYear: pm.expirationYear,
              isDefault: pm.isDefault,
              isActive: pm.isActive
            }));
          }
        } catch (error) {
          logger.warn('Could not retrieve saved cards for user', { userId, error });
        }
      }

      // Add saved cards to the card payment method
      const cardMethodIndex = paymentMethods.findIndex(pm => pm.type === 'card');
      if (cardMethodIndex !== -1) {
        (paymentMethods[cardMethodIndex] as any).savedCards = savedCards;
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        paymentMethods,
        message: 'Métodos de pago disponibles obtenidos correctamente'
      });

    } catch (error: any) {
      logger.error('Error getting payment methods', error, {
        userId: req.user?.userId
      });

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Error retrieving payment methods',
        message: 'No se pudieron obtener los métodos de pago disponibles'
      });
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(req: Request, res: Response): Promise<void> {
    try {
      const { transactionId } = req.params;
      const userId = req.user!.userId;

      if (!transactionId) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Transaction ID required'
        });
        return;
      }

      logger.info('Getting transaction status', { userId, transactionId });

      const transaction = await this.openpayService.getTransaction(transactionId, userId);

      if (!transaction) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          error: 'Transaction not found'
        });
        return;
      }

      res.status(HTTP_STATUS.OK).json({
        transactionId: transaction.id,
        openpayChargeId: transaction.openpayChargeId,
        status: transaction.openpayStatus,
        amount: transaction.amount,
        currency: transaction.currency,
        paymentMethod: transaction.paymentMethod,
        authorizationCode: transaction.authorizationCode,
        createdAt: transaction.createdAt,
        chargedAt: transaction.chargedAt,
        errorCode: transaction.openpayErrorCode,
        errorMessage: transaction.openpayErrorMessage
      });

    } catch (error: any) {
      logger.error('Error getting transaction status', error, {
        userId: req.user?.userId,
        transactionId: req.params.transactionId
      });

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Error retrieving transaction status'
      });
    }
  }

  /**
   * Get user's Openpay transaction history
   */
  async getTransactionHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

      logger.info('Getting transaction history', { userId, page, limit });

      const { transactions, total } = await this.openpayService.getTransactionHistory(
        userId, 
        page, 
        limit
      );

      res.status(HTTP_STATUS.OK).json({
        transactions: transactions.map(t => ({
          id: t.id,
          openpayChargeId: t.openpayChargeId,
          amount: t.amount,
          currency: t.currency,
          paymentMethod: t.paymentMethod,
          status: t.openpayStatus,
          authorizationCode: t.authorizationCode,
          createdAt: t.createdAt,
          chargedAt: t.chargedAt
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });

    } catch (error: any) {
      logger.error('Error getting transaction history', error, {
        userId: req.user?.userId
      });

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Error retrieving transaction history'
      });
    }
  }
}

export default OpenpayController;