"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paymentController_1 = require("@/controllers/paymentController");
const auth_1 = require("@/middleware/auth");
const validation_1 = require("@/middleware/validation");
const paymentSchemas_1 = require("@/schemas/paymentSchemas");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/payment/methods
 * @desc    Obtener métodos de pago disponibles
 * @access  Public
 */
router.get('/methods', paymentController_1.paymentController.getPaymentMethods);
/**
 * @route   GET /api/payment/config
 * @desc    Obtener configuración del sistema de pagos
 * @access  Public
 */
router.get('/config', paymentController_1.paymentController.getPaymentConfiguration);
/**
 * @route   POST /api/payment/deposit
 * @desc    Crear solicitud de depósito (recarga de Perlas)
 * @access  Private
 */
router.post('/deposit', auth_1.authenticate, (0, validation_1.validateRequest)({ body: paymentSchemas_1.createDepositRequestSchema.shape.body }), paymentController_1.paymentController.createDepositRequest);
/**
 * @route   POST /api/payment/withdrawal
 * @desc    Crear solicitud de retiro
 * @access  Private
 */
router.post('/withdrawal', auth_1.authenticate, (0, validation_1.validateRequest)({ body: paymentSchemas_1.createWithdrawalRequestSchema.shape.body }), paymentController_1.paymentController.createWithdrawalRequest);
/**
 * @route   GET /api/payment/deposits
 * @desc    Obtener solicitudes de depósito del usuario
 * @access  Private
 */
router.get('/deposits', auth_1.authenticate, paymentController_1.paymentController.getUserDepositRequests);
/**
 * @route   GET /api/payment/withdrawals
 * @desc    Obtener solicitudes de retiro del usuario
 * @access  Private
 */
router.get('/withdrawals', auth_1.authenticate, paymentController_1.paymentController.getUserWithdrawalRequests);
/**
 * @route   DELETE /api/payment/deposits/:depositRequestId
 * @desc    Cancelar solicitud de depósito
 * @access  Private
 */
router.delete('/deposits/:depositRequestId', auth_1.authenticate, paymentController_1.paymentController.cancelDepositRequest);
exports.default = router;
//# sourceMappingURL=payment.js.map