"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const walletController_1 = require("@/controllers/walletController");
const auth_1 = require("@/middleware/auth");
const validation_1 = require("@/middleware/validation");
const paymentSchemas_1 = require("@/schemas/paymentSchemas");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/wallet
 * @desc    Obtener información completa de la billetera
 * @access  Private
 */
router.get('/', auth_1.authenticate, walletController_1.walletController.getWalletInfo);
/**
 * @route   GET /api/wallet/balance
 * @desc    Obtener balance actual de Perlas
 * @access  Private
 */
router.get('/balance', auth_1.authenticate, walletController_1.walletController.getBalance);
/**
 * @route   GET /api/wallet/transactions
 * @desc    Obtener historial de transacciones de la billetera
 * @access  Private
 */
router.get('/transactions', auth_1.authenticate, 
// Simplified validation middleware to avoid TypeScript issues
(req, res, next) => {
    // Ensure required parameters exist with defaults
    req.query.limit = req.query.limit || '50';
    req.query.offset = req.query.offset || '0';
    // Basic validation
    const limit = parseInt(req.query.limit);
    const offset = parseInt(req.query.offset);
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
}, walletController_1.walletController.getTransactionHistory);
/**
 * @route   POST /api/wallet/transfer
 * @desc    Realizar transferencia P2P entre usuarios
 * @access  Private
 */
router.post('/transfer', auth_1.authenticate, (0, validation_1.validateRequest)({ body: paymentSchemas_1.createP2PTransferSchema }), walletController_1.walletController.transferPearls);
/**
 * @route   GET /api/wallet/verify-username/:username
 * @desc    Verificar si un username existe y es válido para transferencias
 * @access  Private
 */
router.get('/verify-username/:username', auth_1.authenticate, walletController_1.walletController.verifyUsername);
exports.default = router;
//# sourceMappingURL=wallet.js.map