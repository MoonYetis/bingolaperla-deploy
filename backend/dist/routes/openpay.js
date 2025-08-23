"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const openpayController_1 = require("@/controllers/openpayController");
const auth_1 = require("@/middleware/auth");
const rateLimiting_1 = require("@/middleware/rateLimiting");
const openpaySecurityMiddleware_1 = require("@/middleware/openpaySecurityMiddleware");
const router = (0, express_1.Router)();
const openpayController = new openpayController_1.OpenpayController();
// Rate limiting for payment operations
const paymentRateLimit = (0, rateLimiting_1.createRateLimit)(15 * 60 * 1000, // 15 minutes
10 // 10 payment attempts per 15 minutes
);
// Public endpoint - Payment method information (no auth required)
router.get('/payment-methods', async (req, res) => {
    await openpayController.getPaymentMethods(req, res);
});
// All other Openpay routes require authentication
router.use(auth_1.authenticate);
// Payment processing routes with security middleware
router.post('/card', paymentRateLimit, ...openpaySecurityMiddleware_1.applyPaymentSecurity, async (req, res) => {
    await openpayController.processCardPayment(req, res);
});
router.post('/bank-transfer', paymentRateLimit, ...openpaySecurityMiddleware_1.applyPaymentSecurity, async (req, res) => {
    await openpayController.processBankTransfer(req, res);
});
router.post('/cash', paymentRateLimit, ...openpaySecurityMiddleware_1.applyPaymentSecurity, async (req, res) => {
    await openpayController.processCashPayment(req, res);
});
// Transaction status and history
router.get('/transaction/:transactionId', async (req, res) => {
    await openpayController.getTransactionStatus(req, res);
});
router.get('/transactions', async (req, res) => {
    await openpayController.getTransactionHistory(req, res);
});
exports.default = router;
//# sourceMappingURL=openpay.js.map