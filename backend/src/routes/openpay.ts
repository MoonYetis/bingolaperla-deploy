import { Router } from 'express';
import { OpenpayController } from '@/controllers/openpayController';
import { authenticate } from '@/middleware/auth';
import { createRateLimit } from '@/middleware/rateLimiting';
import { applyPaymentSecurity } from '@/middleware/openpaySecurityMiddleware';

const router = Router();
const openpayController = new OpenpayController();

// Rate limiting for payment operations
const paymentRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  10 // 10 payment attempts per 15 minutes
);

// Public endpoint - Payment method information (no auth required)
router.get('/payment-methods', async (req, res) => {
  await openpayController.getPaymentMethods(req, res);
});

// All other Openpay routes require authentication
router.use(authenticate);

// Payment processing routes with security middleware
router.post('/card', paymentRateLimit, ...applyPaymentSecurity, async (req, res) => {
  await openpayController.processCardPayment(req, res);
});

router.post('/bank-transfer', paymentRateLimit, ...applyPaymentSecurity, async (req, res) => {
  await openpayController.processBankTransfer(req, res);
});

router.post('/cash', paymentRateLimit, ...applyPaymentSecurity, async (req, res) => {
  await openpayController.processCashPayment(req, res);
});

// Transaction status and history
router.get('/transaction/:transactionId', async (req, res) => {
  await openpayController.getTransactionStatus(req, res);
});

router.get('/transactions', async (req, res) => {
  await openpayController.getTransactionHistory(req, res);
});

export default router;