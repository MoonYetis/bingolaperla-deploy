"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paymentAdminController_1 = require("@/controllers/admin/paymentAdminController");
const auth_1 = require("@/middleware/auth");
const adminAuth_1 = require("@/middleware/adminAuth");
const validation_1 = require("@/middleware/validation");
const paymentSchemas_1 = require("@/schemas/paymentSchemas");
const router = (0, express_1.Router)();
// Aplicar middleware de autenticación y admin a todas las rutas
router.use(auth_1.authenticate);
router.use(adminAuth_1.requireAdmin);
/**
 * @route   GET /api/admin/payment/dashboard
 * @desc    Obtener dashboard de estadísticas de pagos
 * @access  Admin
 */
router.get('/dashboard', paymentAdminController_1.paymentAdminController.getPaymentDashboard);
/**
 * @route   GET /api/admin/payment/statistics
 * @desc    Obtener estadísticas financieras detalladas
 * @access  Admin
 */
router.get('/statistics', paymentAdminController_1.paymentAdminController.getFinancialStatistics);
/**
 * @route   GET /api/admin/payment/deposits/pending
 * @desc    Obtener lista de depósitos pendientes
 * @access  Admin
 */
router.get('/deposits/pending', (0, validation_1.validateRequest)({ query: paymentSchemas_1.adminListDepositsSchema.shape.query }), paymentAdminController_1.paymentAdminController.getPendingDeposits);
/**
 * @route   POST /api/admin/payment/deposits/:depositRequestId/approve
 * @desc    Aprobar solicitud de depósito
 * @access  Admin
 */
router.post('/deposits/:depositRequestId/approve', (0, validation_1.validateRequest)({ body: paymentSchemas_1.approveDepositSchema.shape.body, params: paymentSchemas_1.approveDepositSchema.shape.params }), paymentAdminController_1.paymentAdminController.approveDeposit);
/**
 * @route   POST /api/admin/payment/deposits/:depositRequestId/reject
 * @desc    Rechazar solicitud de depósito
 * @access  Admin
 */
router.post('/deposits/:depositRequestId/reject', (0, validation_1.validateRequest)({ body: paymentSchemas_1.rejectDepositSchema.shape.body, params: paymentSchemas_1.rejectDepositSchema.shape.params }), paymentAdminController_1.paymentAdminController.rejectDeposit);
/**
 * @route   GET /api/admin/payment/withdrawals/pending
 * @desc    Obtener lista de retiros pendientes
 * @access  Admin
 */
router.get('/withdrawals/pending', paymentAdminController_1.paymentAdminController.getPendingWithdrawals);
exports.default = router;
//# sourceMappingURL=paymentAdmin.js.map