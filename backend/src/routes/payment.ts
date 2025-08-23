import { Router } from 'express';
import { paymentController } from '@/controllers/paymentController';
import { authenticate } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validation';
import { 
  createDepositRequestSchema, 
  createWithdrawalRequestSchema 
} from '@/schemas/paymentSchemas';

const router = Router();

/**
 * @route   GET /api/payment/methods
 * @desc    Obtener métodos de pago disponibles
 * @access  Public
 */
router.get('/methods', paymentController.getPaymentMethods);

/**
 * @route   GET /api/payment/config
 * @desc    Obtener configuración del sistema de pagos
 * @access  Public
 */
router.get('/config', paymentController.getPaymentConfiguration);

/**
 * @route   POST /api/payment/deposit
 * @desc    Crear solicitud de depósito (recarga de Perlas)
 * @access  Private
 */
router.post('/deposit', 
  authenticate, 
  validateRequest({ body: createDepositRequestSchema.shape.body }), 
  paymentController.createDepositRequest as any
);

/**
 * @route   POST /api/payment/withdrawal
 * @desc    Crear solicitud de retiro
 * @access  Private
 */
router.post('/withdrawal', 
  authenticate, 
  validateRequest({ body: createWithdrawalRequestSchema.shape.body }), 
  paymentController.createWithdrawalRequest as any
);

/**
 * @route   GET /api/payment/deposits
 * @desc    Obtener solicitudes de depósito del usuario
 * @access  Private
 */
router.get('/deposits', 
  authenticate, 
  paymentController.getUserDepositRequests as any
);

/**
 * @route   GET /api/payment/withdrawals
 * @desc    Obtener solicitudes de retiro del usuario
 * @access  Private
 */
router.get('/withdrawals', 
  authenticate, 
  paymentController.getUserWithdrawalRequests as any
);

/**
 * @route   DELETE /api/payment/deposits/:depositRequestId
 * @desc    Cancelar solicitud de depósito
 * @access  Private
 */
router.delete('/deposits/:depositRequestId', 
  authenticate, 
  paymentController.cancelDepositRequest as any
);

export default router;