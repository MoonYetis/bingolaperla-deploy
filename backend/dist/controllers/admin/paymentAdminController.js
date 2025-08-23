"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentAdminController = exports.PaymentAdminController = void 0;
const structuredLogger_1 = require("@/utils/structuredLogger");
const constants_1 = require("@/utils/constants");
const paymentService_1 = require("@/services/paymentService");
const adminAuth_1 = require("@/middleware/adminAuth");
const paymentSchemas_1 = require("@/schemas/paymentSchemas");
class PaymentAdminController {
    /**
     * Obtener dashboard de estadísticas de pagos
     * GET /api/admin/payment/dashboard
     */
    async getPaymentDashboard(req, res) {
        try {
            const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
            const prisma = new PrismaClient();
            const [pendingDeposits, pendingWithdrawals, todayTransactions, monthlyVolume, systemConfig] = await Promise.all([
                // Depósitos pendientes
                prisma.depositRequest.count({ where: { status: 'PENDING' } }),
                // Retiros pendientes
                prisma.withdrawalRequest.count({ where: { status: 'PENDING' } }),
                // Transacciones del día
                prisma.transaction.findMany({
                    where: {
                        createdAt: {
                            gte: new Date(new Date().setHours(0, 0, 0, 0))
                        }
                    }
                }),
                // Volumen mensual de transacciones
                prisma.transaction.aggregate({
                    where: {
                        createdAt: {
                            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                        },
                        type: { in: ['PEARL_PURCHASE', 'WITHDRAWAL'] }
                    },
                    _sum: { amount: true },
                    _count: true
                }),
                // Configuración del sistema
                prisma.paymentConfiguration.findFirst()
            ]);
            // Calcular estadísticas del día
            const todayStats = {
                totalTransactions: todayTransactions.length,
                totalVolume: todayTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount.toString()), 0),
                deposits: todayTransactions.filter(tx => tx.type === 'PEARL_PURCHASE').length,
                withdrawals: todayTransactions.filter(tx => tx.type === 'WITHDRAWAL').length,
                transfers: todayTransactions.filter(tx => tx.type === 'PEARL_TRANSFER').length
            };
            // Obtener alertas del sistema
            const alerts = [];
            if (pendingDeposits > 10) {
                alerts.push({
                    type: 'warning',
                    message: `${pendingDeposits} depósitos pendientes de validación`,
                    action: 'Revisar depósitos pendientes'
                });
            }
            if (pendingWithdrawals > 5) {
                alerts.push({
                    type: 'info',
                    message: `${pendingWithdrawals} retiros pendientes de procesamiento`,
                    action: 'Procesar retiros pendientes'
                });
            }
            res.json({
                success: true,
                data: {
                    pendingRequests: {
                        deposits: pendingDeposits,
                        withdrawals: pendingWithdrawals
                    },
                    todayStats,
                    monthlyStats: {
                        totalVolume: parseFloat(monthlyVolume._sum.amount?.toString() || '0'),
                        totalTransactions: monthlyVolume._count
                    },
                    systemStatus: {
                        depositsEnabled: systemConfig?.depositsEnabled || true,
                        withdrawalsEnabled: systemConfig?.withdrawalsEnabled || true,
                        transfersEnabled: systemConfig?.transfersEnabled || true,
                        p2pCommission: parseFloat(systemConfig?.p2pTransferCommission?.toString() || '2.50')
                    },
                    alerts,
                    lastUpdated: new Date()
                }
            });
            structuredLogger_1.logger.info('Dashboard de pagos admin consultado', {
                adminId: req.user.userId,
                pendingDeposits,
                pendingWithdrawals
            });
        }
        catch (error) {
            structuredLogger_1.logger.error('Error obteniendo dashboard admin', error, { adminId: req.user.userId });
            res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: 'Error consultando dashboard de pagos'
            });
        }
    }
    /**
     * Obtener lista de depósitos pendientes
     * GET /api/admin/payment/deposits/pending
     */
    async getPendingDeposits(req, res) {
        try {
            const validation = paymentSchemas_1.adminListDepositsSchema.safeParse({ query: req.query });
            if (!validation.success) {
                res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    error: 'Parámetros de consulta inválidos',
                    details: validation.error.errors
                });
                return;
            }
            const { status = 'PENDING', paymentMethod, limit, offset } = validation.data.query;
            const deposits = await paymentService_1.paymentService.getPendingDeposits({
                limit,
                offset
                // TODO: filtrar por paymentMethod si se proporciona
            });
            const formattedDeposits = deposits.map(deposit => ({
                id: deposit.id,
                userId: deposit.userId,
                user: {
                    username: deposit.user?.username || 'N/A',
                    email: deposit.user?.email || 'N/A',
                    fullName: deposit.user?.fullName || 'N/A'
                },
                amount: parseFloat(deposit.amount.toString()),
                pearlsAmount: parseFloat(deposit.pearlsAmount.toString()),
                paymentMethod: deposit.paymentMethod,
                referenceCode: deposit.referenceCode,
                bankReference: deposit.bankReference,
                bankAccount: deposit.bankAccount,
                bankAccountName: deposit.bankAccountName,
                status: deposit.status,
                proofImage: deposit.proofImage,
                createdAt: deposit.createdAt,
                expiresAt: deposit.expiresAt,
                isExpired: new Date() > deposit.expiresAt,
                timeRemaining: this.getTimeRemaining(deposit.expiresAt)
            }));
            res.json({
                success: true,
                data: {
                    deposits: formattedDeposits,
                    pagination: {
                        limit,
                        offset,
                        total: formattedDeposits.length
                    }
                }
            });
            structuredLogger_1.logger.info('Depósitos pendientes consultados por admin', {
                adminId: req.user.userId,
                resultCount: formattedDeposits.length,
                status,
                paymentMethod
            });
        }
        catch (error) {
            structuredLogger_1.logger.error('Error obteniendo depósitos pendientes', error, {
                adminId: req.user.userId
            });
            res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: 'Error consultando depósitos pendientes'
            });
        }
    }
    /**
     * Aprobar solicitud de depósito
     * POST /api/admin/payment/deposits/:depositRequestId/approve
     */
    async approveDeposit(req, res) {
        try {
            const validation = paymentSchemas_1.approveDepositSchema.safeParse({
                body: req.body,
                params: req.params
            });
            if (!validation.success) {
                res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    error: 'Datos de aprobación inválidos',
                    details: validation.error.errors
                });
                return;
            }
            const { depositRequestId } = validation.data.params;
            const { bankReference, adminNotes, proofImageUrl } = validation.data.body;
            const adminId = req.user.userId;
            const result = await paymentService_1.paymentService.approveDeposit(depositRequestId, adminId, bankReference, adminNotes);
            // Crear log de auditoría
            await (0, adminAuth_1.createAdminAuditLog)(adminId, 'DEPOSIT_APPROVED', 'DEPOSIT_REQUEST', depositRequestId, {
                amount: parseFloat(result.depositRequest.amount.toString()),
                userId: result.depositRequest.userId,
                bankReference,
                adminNotes
            }, req.ip);
            res.json({
                success: true,
                message: 'Depósito aprobado exitosamente',
                data: {
                    depositRequestId,
                    userId: result.depositRequest.userId,
                    amount: parseFloat(result.depositRequest.amount.toString()),
                    pearlsAmount: parseFloat(result.depositRequest.pearlsAmount.toString()),
                    newUserBalance: result.creditResult.newBalance,
                    approvedAt: result.depositRequest.validatedAt,
                    transactionId: result.creditResult.transaction.id
                }
            });
            structuredLogger_1.logger.info('Depósito aprobado por admin', {
                adminId,
                depositRequestId,
                userId: result.depositRequest.userId,
                amount: parseFloat(result.depositRequest.amount.toString()),
                bankReference
            });
        }
        catch (error) {
            structuredLogger_1.logger.error('Error aprobando depósito', error, {
                adminId: req.user.userId,
                depositRequestId: req.params.depositRequestId
            });
            const errorMessage = error instanceof Error ? error.message : 'Error procesando aprobación';
            const statusCode = errorMessage.includes('no encontrada') || errorMessage.includes('expirada') ?
                constants_1.HTTP_STATUS.NOT_FOUND : constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR;
            res.status(statusCode).json({
                success: false,
                error: errorMessage
            });
        }
    }
    /**
     * Rechazar solicitud de depósito
     * POST /api/admin/payment/deposits/:depositRequestId/reject
     */
    async rejectDeposit(req, res) {
        try {
            const validation = paymentSchemas_1.rejectDepositSchema.safeParse({
                body: req.body,
                params: req.params
            });
            if (!validation.success) {
                res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    error: 'Datos de rechazo inválidos',
                    details: validation.error.errors
                });
                return;
            }
            const { depositRequestId } = validation.data.params;
            const { reason } = validation.data.body;
            const adminId = req.user.userId;
            const rejectedDeposit = await paymentService_1.paymentService.rejectDeposit(depositRequestId, adminId, reason);
            // Crear log de auditoría
            await (0, adminAuth_1.createAdminAuditLog)(adminId, 'DEPOSIT_REJECTED', 'DEPOSIT_REQUEST', depositRequestId, {
                amount: parseFloat(rejectedDeposit.amount.toString()),
                userId: rejectedDeposit.userId,
                reason
            }, req.ip);
            res.json({
                success: true,
                message: 'Depósito rechazado',
                data: {
                    depositRequestId,
                    userId: rejectedDeposit.userId,
                    amount: parseFloat(rejectedDeposit.amount.toString()),
                    reason,
                    rejectedAt: rejectedDeposit.validatedAt
                }
            });
            structuredLogger_1.logger.info('Depósito rechazado por admin', {
                adminId,
                depositRequestId,
                userId: rejectedDeposit.userId,
                reason
            });
        }
        catch (error) {
            structuredLogger_1.logger.error('Error rechazando depósito', error, {
                adminId: req.user.userId,
                depositRequestId: req.params.depositRequestId
            });
            const errorMessage = error instanceof Error ? error.message : 'Error procesando rechazo';
            res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: errorMessage
            });
        }
    }
    /**
     * Obtener lista de retiros pendientes
     * GET /api/admin/payment/withdrawals/pending
     */
    async getPendingWithdrawals(req, res) {
        try {
            const { limit = '20', offset = '0' } = req.query;
            const withdrawals = await paymentService_1.paymentService.getPendingWithdrawals({
                limit: parseInt(limit),
                offset: parseInt(offset)
            });
            const formattedWithdrawals = withdrawals.map(withdrawal => ({
                id: withdrawal.id,
                userId: withdrawal.userId,
                user: {
                    username: withdrawal.user?.username || 'N/A',
                    email: withdrawal.user?.email || 'N/A',
                    fullName: withdrawal.user?.fullName || 'N/A'
                },
                pearlsAmount: parseFloat(withdrawal.pearlsAmount.toString()),
                amountInSoles: parseFloat(withdrawal.amountInSoles.toString()),
                commission: parseFloat(withdrawal.commission.toString()),
                netAmount: parseFloat(withdrawal.netAmount.toString()),
                bankCode: withdrawal.bankCode,
                accountNumber: withdrawal.accountNumber,
                accountType: withdrawal.accountType,
                accountHolderName: withdrawal.accountHolderName,
                accountHolderDni: withdrawal.accountHolderDni,
                referenceCode: withdrawal.referenceCode,
                status: withdrawal.status,
                createdAt: withdrawal.createdAt
            }));
            res.json({
                success: true,
                data: {
                    withdrawals: formattedWithdrawals,
                    pagination: {
                        limit: parseInt(limit),
                        offset: parseInt(offset),
                        total: formattedWithdrawals.length
                    }
                }
            });
            structuredLogger_1.logger.info('Retiros pendientes consultados por admin', {
                adminId: req.user.userId,
                resultCount: formattedWithdrawals.length
            });
        }
        catch (error) {
            structuredLogger_1.logger.error('Error obteniendo retiros pendientes', error, {
                adminId: req.user.userId
            });
            res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: 'Error consultando retiros pendientes'
            });
        }
    }
    /**
     * Obtener estadísticas financieras detalladas
     * GET /api/admin/payment/statistics
     */
    async getFinancialStatistics(req, res) {
        try {
            const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
            const prisma = new PrismaClient();
            const now = new Date();
            const today = new Date(now.setHours(0, 0, 0, 0));
            const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const [totalWallets, totalPearlsCirculation, todayTransactions, monthlyTransactions, depositStats, withdrawalStats] = await Promise.all([
                // Total de billeteras activas
                prisma.wallet.count({ where: { isActive: true } }),
                // Total de Perlas en circulación
                prisma.wallet.aggregate({
                    where: { isActive: true },
                    _sum: { balance: true }
                }),
                // Transacciones de hoy
                prisma.transaction.aggregate({
                    where: { createdAt: { gte: today } },
                    _count: true,
                    _sum: { amount: true }
                }),
                // Transacciones del mes
                prisma.transaction.aggregate({
                    where: { createdAt: { gte: thisMonth } },
                    _count: true,
                    _sum: { amount: true }
                }),
                // Estadísticas de depósitos
                prisma.depositRequest.groupBy({
                    by: ['status'],
                    _count: true,
                    _sum: { amount: true }
                }),
                // Estadísticas de retiros
                prisma.withdrawalRequest.groupBy({
                    by: ['status'],
                    _count: true,
                    _sum: { pearlsAmount: true }
                })
            ]);
            res.json({
                success: true,
                data: {
                    overview: {
                        totalActiveWallets: totalWallets,
                        totalPearlsInCirculation: parseFloat(totalPearlsCirculation._sum.balance?.toString() || '0'),
                        dailyTransactions: todayTransactions._count,
                        dailyVolume: parseFloat(todayTransactions._sum.amount?.toString() || '0'),
                        monthlyTransactions: monthlyTransactions._count,
                        monthlyVolume: parseFloat(monthlyTransactions._sum.amount?.toString() || '0')
                    },
                    deposits: depositStats.map(stat => ({
                        status: stat.status,
                        count: stat._count,
                        totalAmount: parseFloat(stat._sum.amount?.toString() || '0')
                    })),
                    withdrawals: withdrawalStats.map(stat => ({
                        status: stat.status,
                        count: stat._count,
                        totalAmount: parseFloat(stat._sum.pearlsAmount?.toString() || '0')
                    })),
                    generatedAt: new Date()
                }
            });
            structuredLogger_1.logger.info('Estadísticas financieras consultadas por admin', {
                adminId: req.user.userId
            });
        }
        catch (error) {
            structuredLogger_1.logger.error('Error obteniendo estadísticas financieras', error);
            res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: 'Error consultando estadísticas financieras'
            });
        }
    }
    /**
     * Calcular tiempo restante hasta expiración
     */
    getTimeRemaining(expiresAt) {
        const now = new Date();
        const timeDiff = expiresAt.getTime() - now.getTime();
        if (timeDiff <= 0) {
            return 'Expirado';
        }
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        else {
            return `${minutes}m`;
        }
    }
}
exports.PaymentAdminController = PaymentAdminController;
exports.paymentAdminController = new PaymentAdminController();
//# sourceMappingURL=paymentAdminController.js.map