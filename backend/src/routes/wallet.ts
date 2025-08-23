import { Router } from 'express';
import { walletController } from '@/controllers/walletController';
import { authenticate } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validation';
import { getTransactionHistorySchema, createP2PTransferSchema } from '@/schemas/paymentSchemas';

const router = Router();

/**
 * @route   GET /api/wallet
 * @desc    Obtener información completa de la billetera
 * @access  Private
 */
router.get('/', authenticate, walletController.getWalletInfo as any);

/**
 * @route   GET /api/wallet/balance
 * @desc    Obtener balance actual de Perlas
 * @access  Private
 */
router.get('/balance', authenticate, walletController.getBalance as any);

/**
 * @route   GET /api/wallet/transactions
 * @desc    Obtener historial de transacciones de la billetera
 * @access  Private
 */
router.get('/transactions', 
  authenticate, 
  // Simplified validation middleware to avoid TypeScript issues
  (req, res, next) => {
    // Ensure required parameters exist with defaults
    req.query.limit = req.query.limit || '50';
    req.query.offset = req.query.offset || '0';
    
    // Basic validation
    const limit = parseInt(req.query.limit as string);
    const offset = parseInt(req.query.offset as string);
    
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        error: 'Limit must be between 1 and 100'
      });
    }
    
    if (isNaN(offset) || offset < 0) {
      return res.status(400).json({
        success: false,
        error: 'Offset must be 0 or greater'
      });
    }
    
    next();
  },
  walletController.getTransactionHistory as any
);

/**
 * @route   POST /api/wallet/transfer
 * @desc    Realizar transferencia P2P entre usuarios
 * @access  Private
 */
router.post('/transfer', 
  authenticate, 
  validateRequest({ body: createP2PTransferSchema }), 
  walletController.transferPearls as any
);

/**
 * @route   GET /api/wallet/verify-username/:username
 * @desc    Verificar si un username existe y es válido para transferencias
 * @access  Private
 */
router.get('/verify-username/:username', 
  authenticate, 
  walletController.verifyUsername as any
);

export default router;