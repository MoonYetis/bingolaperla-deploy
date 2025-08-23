import { Router } from 'express';
import { paymentAdminController } from '@/controllers/admin/paymentAdminController';
import { authenticate } from '@/middleware/auth';
import { requireAdmin } from '@/middleware/adminAuth';
import { validateRequest } from '@/middleware/validation';
import { 
  approveDepositSchema, 
  rejectDepositSchema, 
  adminListDepositsSchema 
} from '@/schemas/paymentSchemas';

const router = Router();

// Aplicar middleware de autenticación y admin a todas las rutas
router.use(authenticate);
router.use(requireAdmin as any);

/**
 * @route   GET /api/admin/payment/dashboard
 * @desc    Obtener dashboard de estadísticas de pagos
 * @access  Admin
 */
router.get('/dashboard', paymentAdminController.getPaymentDashboard as any);

/**
 * @route   GET /api/admin/payment/statistics
 * @desc    Obtener estadísticas financieras detalladas
 * @access  Admin
 */
router.get('/statistics', paymentAdminController.getFinancialStatistics as any);

/**
 * @route   GET /api/admin/payment/deposits/pending
 * @desc    Obtener lista de depósitos pendientes
 * @access  Admin
 */
router.get('/deposits/pending', 
  validateRequest({ query: adminListDepositsSchema.shape.query }),
  paymentAdminController.getPendingDeposits as any
);

/**
 * @route   POST /api/admin/payment/deposits/:depositRequestId/approve
 * @desc    Aprobar solicitud de depósito
 * @access  Admin
 */
router.post('/deposits/:depositRequestId/approve', 
  validateRequest({ body: approveDepositSchema.shape.body, params: approveDepositSchema.shape.params }),
  paymentAdminController.approveDeposit as any
);

/**
 * @route   POST /api/admin/payment/deposits/:depositRequestId/reject
 * @desc    Rechazar solicitud de depósito
 * @access  Admin
 */
router.post('/deposits/:depositRequestId/reject', 
  validateRequest({ body: rejectDepositSchema.shape.body, params: rejectDepositSchema.shape.params }),
  paymentAdminController.rejectDeposit as any
);

/**
 * @route   GET /api/admin/payment/withdrawals/pending
 * @desc    Obtener lista de retiros pendientes
 * @access  Admin
 */
router.get('/withdrawals/pending', 
  paymentAdminController.getPendingWithdrawals as any
);

export default router;