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
exports.paymentController = exports.PaymentController = void 0;
const structuredLogger_1 = require("@/utils/structuredLogger");
const constants_1 = require("@/utils/constants");
const paymentService_1 = require("@/services/paymentService");
const paymentSchemas_1 = require("@/schemas/paymentSchemas");
class PaymentController {
    /**
     * Obtener métodos de pago disponibles
     * GET /api/payment/methods
     */
    async getPaymentMethods(req, res) {
        try {
            const bankConfigs = await paymentService_1.paymentService.getActiveBankConfigurations();
            const methods = [
                // Bancos tradicionales
                ...bankConfigs.map(bank => ({
                    code: bank.bankCode,
                    name: bank.bankName,
                    type: 'BANK_TRANSFER',
                    minAmount: parseFloat(bank.minDeposit.toString()),
                    maxAmount: parseFloat(bank.maxDeposit.toString()),
                    commission: parseFloat(bank.depositCommission.toString()),
                    processingTime: '24 horas',
                    instructions: bank.instructions,
                    isActive: bank.isActive
                })),
                // Billeteras digitales
                {
                    code: 'YAPE',
                    name: 'Yape',
                    type: 'DIGITAL_WALLET',
                    minAmount: 10.00,
                    maxAmount: 500.00,
                    commission: 0.00,
                    processingTime: '30 minutos',
                    instructions: 'Transferencia instantánea vía Yape',
                    isActive: true
                },
                {
                    code: 'PLIN',
                    name: 'Plin',
                    type: 'DIGITAL_WALLET',
                    minAmount: 10.00,
                    maxAmount: 500.00,
                    commission: 0.00,
                    processingTime: '30 minutos',
                    instructions: 'Transferencia instantánea vía Plin',
                    isActive: true
                }
            ];
            res.json({
                success: true,
                data: {
                    methods: methods.filter(m => m.isActive),
                    totalMethods: methods.filter(m => m.isActive).length
                }
            });
            structuredLogger_1.logger.info('Métodos de pago consultados', {
                userId: req.user?.userId,
                methodCount: methods.filter(m => m.isActive).length
            });
        }
        catch (error) {
            structuredLogger_1.logger.error('Error obteniendo métodos de pago', error);
            res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: 'Error consultando métodos de pago'
            });
        }
    }
    /**
     * Crear solicitud de depósito (recarga de Perlas)
     * POST /api/payment/deposit
     */
    async createDepositRequest(req, res) {
        try {
            const validation = paymentSchemas_1.createDepositRequestSchema.safeParse({ body: req.body });
            if (!validation.success) {
                res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    error: 'Datos de depósito inválidos',
                    details: validation.error.errors
                });
                return;
            }
            const { amount, paymentMethod, bankAccount, userNotes } = validation.data.body;
            const userId = req.user.userId;
            const result = await paymentService_1.paymentService.createDepositRequest({
                userId,
                amount,
                paymentMethod,
                bankAccount
            });
            res.status(constants_1.HTTP_STATUS.CREATED).json({
                success: true,
                message: 'Solicitud de depósito creada exitosamente',
                data: {
                    depositRequestId: result.depositRequest.id,
                    amount,
                    pearlsAmount: parseFloat(result.depositRequest.pearlsAmount.toString()),
                    paymentMethod,
                    referenceCode: result.referenceCode,
                    expiresAt: result.depositRequest.expiresAt,
                    bankInstructions: result.bankInstructions,
                    status: result.depositRequest.status,
                    createdAt: result.depositRequest.createdAt
                }
            });
            structuredLogger_1.logger.info('Solicitud de depósito creada', {
                userId,
                depositRequestId: result.depositRequest.id,
                amount,
                paymentMethod,
                referenceCode: result.referenceCode
            });
        }
        catch (error) {
            structuredLogger_1.logger.error('Error creando solicitud de depósito', error, {
                userId: req.user.userId,
                amount: req.body.amount
            });
            const errorMessage = error instanceof Error ? error.message : 'Error procesando solicitud de depósito';
            res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: errorMessage
            });
        }
    }
    /**
     * Crear solicitud de retiro
     * POST /api/payment/withdrawal
     */
    async createWithdrawalRequest(req, res) {
        try {
            const validation = paymentSchemas_1.createWithdrawalRequestSchema.safeParse({ body: req.body });
            if (!validation.success) {
                res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    error: 'Datos de retiro inválidos',
                    details: validation.error.errors
                });
                return;
            }
            const { pearlsAmount, bankCode, accountNumber, accountType, accountHolderName, accountHolderDni, userNotes } = validation.data.body;
            const userId = req.user.userId;
            const withdrawalRequest = await paymentService_1.paymentService.createWithdrawalRequest({
                userId,
                pearlsAmount,
                bankCode,
                accountNumber,
                accountType,
                accountHolderName,
                accountHolderDni
            });
            res.status(constants_1.HTTP_STATUS.CREATED).json({
                success: true,
                message: 'Solicitud de retiro creada exitosamente',
                data: {
                    withdrawalRequestId: withdrawalRequest.id,
                    pearlsAmount: parseFloat(withdrawalRequest.pearlsAmount.toString()),
                    amountInSoles: parseFloat(withdrawalRequest.amountInSoles.toString()),
                    commission: parseFloat(withdrawalRequest.commission.toString()),
                    netAmount: parseFloat(withdrawalRequest.netAmount.toString()),
                    bankCode: withdrawalRequest.bankCode,
                    accountNumber: withdrawalRequest.accountNumber,
                    accountType: withdrawalRequest.accountType,
                    referenceCode: withdrawalRequest.referenceCode,
                    status: withdrawalRequest.status,
                    createdAt: withdrawalRequest.createdAt,
                    estimatedProcessingTime: '1-3 días hábiles'
                }
            });
            structuredLogger_1.logger.info('Solicitud de retiro creada', {
                userId,
                withdrawalRequestId: withdrawalRequest.id,
                pearlsAmount,
                netAmount: parseFloat(withdrawalRequest.netAmount.toString()),
                bankCode,
                accountNumber: accountNumber.substring(0, 4) + '****' // Log parcial por seguridad
            });
        }
        catch (error) {
            structuredLogger_1.logger.error('Error creando solicitud de retiro', error, {
                userId: req.user.userId,
                pearlsAmount: req.body.pearlsAmount
            });
            const errorMessage = error instanceof Error ? error.message : 'Error procesando solicitud de retiro';
            const statusCode = errorMessage.includes('Saldo insuficiente') ?
                constants_1.HTTP_STATUS.BAD_REQUEST : constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR;
            res.status(statusCode).json({
                success: false,
                error: errorMessage
            });
        }
    }
    /**
     * Obtener solicitudes de depósito del usuario
     * GET /api/payment/deposits
     */
    async getUserDepositRequests(req, res) {
        try {
            const userId = req.user.userId;
            const { status, limit = '20', offset = '0' } = req.query;
            const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
            const prisma = new PrismaClient();
            const whereClause = { userId };
            if (status) {
                whereClause.status = status;
            }
            const depositRequests = await prisma.depositRequest.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                take: parseInt(limit),
                skip: parseInt(offset)
            });
            const formattedRequests = depositRequests.map(req => ({
                id: req.id,
                amount: parseFloat(req.amount.toString()),
                pearlsAmount: parseFloat(req.pearlsAmount.toString()),
                paymentMethod: req.paymentMethod,
                referenceCode: req.referenceCode,
                bankReference: req.bankReference,
                status: req.status,
                adminNotes: req.adminNotes,
                createdAt: req.createdAt,
                expiresAt: req.expiresAt,
                validatedAt: req.validatedAt,
                isExpired: new Date() > req.expiresAt,
                canUploadProof: req.status === 'PENDING' && new Date() < req.expiresAt
            }));
            res.json({
                success: true,
                data: {
                    requests: formattedRequests,
                    pagination: {
                        limit: parseInt(limit),
                        offset: parseInt(offset),
                        total: formattedRequests.length
                    }
                }
            });
            structuredLogger_1.logger.info('Solicitudes de depósito consultadas', {
                userId,
                status,
                resultCount: formattedRequests.length
            });
        }
        catch (error) {
            structuredLogger_1.logger.error('Error obteniendo solicitudes de depósito', error, { userId: req.user.userId });
            res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: 'Error consultando solicitudes de depósito'
            });
        }
    }
    /**
     * Obtener solicitudes de retiro del usuario
     * GET /api/payment/withdrawals
     */
    async getUserWithdrawalRequests(req, res) {
        try {
            const userId = req.user.userId;
            const { status, limit = '20', offset = '0' } = req.query;
            const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
            const prisma = new PrismaClient();
            const whereClause = { userId };
            if (status) {
                whereClause.status = status;
            }
            const withdrawalRequests = await prisma.withdrawalRequest.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                take: parseInt(limit),
                skip: parseInt(offset)
            });
            const formattedRequests = withdrawalRequests.map(req => ({
                id: req.id,
                pearlsAmount: parseFloat(req.pearlsAmount.toString()),
                amountInSoles: parseFloat(req.amountInSoles.toString()),
                commission: parseFloat(req.commission.toString()),
                netAmount: parseFloat(req.netAmount.toString()),
                bankCode: req.bankCode,
                accountNumber: req.accountNumber.replace(/^(.{4}).*(.{4})$/, '$1****$2'), // Ofuscar número
                accountType: req.accountType,
                accountHolderName: req.accountHolderName,
                referenceCode: req.referenceCode,
                status: req.status,
                adminNotes: req.adminNotes,
                bankTransactionId: req.bankTransactionId,
                createdAt: req.createdAt,
                processedAt: req.processedAt,
                estimatedProcessingTime: this.getProcessingTimeByStatus(req.status)
            }));
            res.json({
                success: true,
                data: {
                    requests: formattedRequests,
                    pagination: {
                        limit: parseInt(limit),
                        offset: parseInt(offset),
                        total: formattedRequests.length
                    }
                }
            });
            structuredLogger_1.logger.info('Solicitudes de retiro consultadas', {
                userId,
                status,
                resultCount: formattedRequests.length
            });
        }
        catch (error) {
            structuredLogger_1.logger.error('Error obteniendo solicitudes de retiro', error, { userId: req.user.userId });
            res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: 'Error consultando solicitudes de retiro'
            });
        }
    }
    /**
     * Cancelar solicitud de depósito (solo si está pendiente)
     * DELETE /api/payment/deposits/:depositRequestId
     */
    async cancelDepositRequest(req, res) {
        try {
            const { depositRequestId } = req.params;
            const userId = req.user.userId;
            const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
            const prisma = new PrismaClient();
            const depositRequest = await prisma.depositRequest.findUnique({
                where: { id: depositRequestId }
            });
            if (!depositRequest) {
                res.status(constants_1.HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    error: 'Solicitud de depósito no encontrada'
                });
                return;
            }
            if (depositRequest.userId !== userId) {
                res.status(constants_1.HTTP_STATUS.FORBIDDEN).json({
                    success: false,
                    error: 'No autorizado para cancelar esta solicitud'
                });
                return;
            }
            if (depositRequest.status !== 'PENDING') {
                res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    error: 'Solo se pueden cancelar solicitudes pendientes'
                });
                return;
            }
            const cancelledRequest = await prisma.depositRequest.update({
                where: { id: depositRequestId },
                data: {
                    status: 'CANCELLED',
                    adminNotes: 'Cancelado por el usuario'
                }
            });
            res.json({
                success: true,
                message: 'Solicitud de depósito cancelada exitosamente',
                data: {
                    id: cancelledRequest.id,
                    status: cancelledRequest.status,
                    cancelledAt: cancelledRequest.updatedAt
                }
            });
            structuredLogger_1.logger.info('Solicitud de depósito cancelada', {
                userId,
                depositRequestId,
                amount: parseFloat(depositRequest.amount.toString())
            });
        }
        catch (error) {
            structuredLogger_1.logger.error('Error cancelando solicitud de depósito', error, {
                userId: req.user.userId,
                depositRequestId: req.params.depositRequestId
            });
            res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: 'Error cancelando solicitud de depósito'
            });
        }
    }
    /**
     * Obtener configuración del sistema de pagos
     * GET /api/payment/config
     */
    async getPaymentConfiguration(req, res) {
        try {
            const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
            const prisma = new PrismaClient();
            const config = await prisma.paymentConfiguration.findFirst();
            if (!config) {
                res.json({
                    success: true,
                    data: {
                        p2pTransferEnabled: true,
                        p2pTransferCommission: 2.50,
                        defaultDailyLimit: 1000.00,
                        defaultMonthlyLimit: 20000.00,
                        depositsEnabled: true,
                        withdrawalsEnabled: true,
                        transfersEnabled: true,
                        announcementMessage: null
                    }
                });
                return;
            }
            res.json({
                success: true,
                data: {
                    p2pTransferEnabled: config.p2pTransferEnabled,
                    p2pTransferCommission: parseFloat(config.p2pTransferCommission.toString()),
                    defaultDailyLimit: parseFloat(config.defaultDailyLimit.toString()),
                    defaultMonthlyLimit: parseFloat(config.defaultMonthlyLimit.toString()),
                    depositsEnabled: config.depositsEnabled,
                    withdrawalsEnabled: config.withdrawalsEnabled,
                    transfersEnabled: config.transfersEnabled,
                    announcementMessage: config.announcementMessage,
                    maintenanceMessage: config.maintenanceMessage
                }
            });
        }
        catch (error) {
            structuredLogger_1.logger.error('Error obteniendo configuración de pagos', error);
            res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: 'Error consultando configuración del sistema'
            });
        }
    }
    /**
     * Obtener tiempo estimado de procesamiento según estado
     */
    getProcessingTimeByStatus(status) {
        switch (status) {
            case 'PENDING':
                return '1-3 días hábiles';
            case 'PROCESSING':
                return 'En proceso - 24-48 horas';
            case 'APPROVED':
                return 'Procesando transferencia bancaria';
            case 'COMPLETED':
                return 'Completado';
            case 'REJECTED':
                return 'Rechazado';
            default:
                return 'Tiempo no determinado';
        }
    }
}
exports.PaymentController = PaymentController;
exports.paymentController = new PaymentController();
//# sourceMappingURL=paymentController.js.map