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
exports.walletController = exports.WalletController = void 0;
const structuredLogger_1 = require("@/utils/structuredLogger");
const constants_1 = require("@/utils/constants");
const walletService_1 = require("@/services/walletService");
const paymentSchemas_1 = require("@/schemas/paymentSchemas");
class WalletController {
    /**
     * Obtener información de la billetera del usuario
     * GET /api/wallet
     */
    async getWalletInfo(req, res) {
        try {
            const userId = req.user.userId;
            // Obtener o crear billetera
            let wallet = await walletService_1.walletService.getByUserId(userId);
            if (!wallet) {
                wallet = await walletService_1.walletService.createWallet(userId);
            }
            const balance = await walletService_1.walletService.getBalance(userId);
            res.json({
                success: true,
                data: {
                    id: wallet.id,
                    userId: wallet.userId,
                    balance: balance.balance,
                    dailyLimit: balance.dailyLimit,
                    monthlyLimit: balance.monthlyLimit,
                    isActive: balance.isActive,
                    isFrozen: balance.isFrozen,
                    createdAt: wallet.createdAt,
                    updatedAt: wallet.updatedAt
                }
            });
            structuredLogger_1.logger.info('Información de billetera consultada', {
                userId,
                balance: balance.balance
            });
        }
        catch (error) {
            structuredLogger_1.logger.error('Error obteniendo información de billetera', error, { userId: req.user.userId });
            res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: 'Error consultando información de billetera'
            });
        }
    }
    /**
     * Obtener balance actual de Perlas
     * GET /api/wallet/balance
     */
    async getBalance(req, res) {
        try {
            const userId = req.user.userId;
            const balance = await walletService_1.walletService.getBalance(userId);
            res.json({
                success: true,
                data: {
                    balance: balance.balance,
                    dailyLimit: balance.dailyLimit,
                    monthlyLimit: balance.monthlyLimit,
                    isActive: balance.isActive,
                    isFrozen: balance.isFrozen
                }
            });
            structuredLogger_1.logger.info('Balance consultado', {
                userId,
                balance: balance.balance
            });
        }
        catch (error) {
            structuredLogger_1.logger.error('Error obteniendo balance', error, { userId: req.user.userId });
            res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error instanceof Error ? error.message : 'Error consultando balance'
            });
        }
    }
    /**
     * Obtener historial de transacciones
     * GET /api/wallet/transactions
     */
    async getTransactionHistory(req, res) {
        try {
            // Parameters are already validated by middleware
            const limit = parseInt(req.query.limit) || 50;
            const offset = parseInt(req.query.offset) || 0;
            const type = req.query.type;
            const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : undefined;
            const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : undefined;
            const userId = req.user.userId;
            const transactions = await walletService_1.walletService.getTransactionHistory(userId, {
                limit,
                offset,
                type,
                dateFrom,
                dateTo
            });
            // Formatear transacciones para el frontend
            const formattedTransactions = transactions.map(tx => ({
                id: tx.id,
                type: tx.type,
                amount: parseFloat(tx.amount.toString()),
                pearlsAmount: tx.pearlsAmount ? parseFloat(tx.pearlsAmount.toString()) : null,
                description: tx.description,
                status: tx.status,
                paymentMethod: tx.paymentMethod,
                commissionAmount: tx.commissionAmount ? parseFloat(tx.commissionAmount.toString()) : null,
                referenceId: tx.referenceId,
                createdAt: tx.createdAt,
                fromUser: tx.fromUserId ? { id: tx.fromUserId } : null,
                toUser: tx.toUserId ? { id: tx.toUserId } : null,
                // Determinar si es entrada o salida de dinero
                isCredit: tx.userId === userId && ['PEARL_PURCHASE', 'PRIZE_PAYOUT'].includes(tx.type) ||
                    tx.toUserId === userId && tx.type === 'PEARL_TRANSFER',
                isDebit: tx.userId === userId && ['CARD_PURCHASE', 'WITHDRAWAL', 'COMMISSION'].includes(tx.type) ||
                    tx.fromUserId === userId && tx.type === 'PEARL_TRANSFER'
            }));
            res.json({
                success: true,
                data: {
                    transactions: formattedTransactions,
                    pagination: {
                        limit,
                        offset,
                        total: formattedTransactions.length
                    }
                }
            });
            structuredLogger_1.logger.info('Historial de transacciones consultado', {
                userId,
                limit,
                offset,
                type,
                resultCount: formattedTransactions.length
            });
        }
        catch (error) {
            structuredLogger_1.logger.error('Error obteniendo historial', error, { userId: req.user.userId });
            res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: 'Error consultando historial de transacciones'
            });
        }
    }
    /**
     * Realizar transferencia P2P entre usuarios
     * POST /api/wallet/transfer
     */
    async transferPearls(req, res) {
        try {
            const userId = req.user.userId;
            const validation = paymentSchemas_1.createP2PTransferSchema.safeParse({ body: req.body });
            if (!validation.success) {
                res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    error: 'Datos de transferencia inválidos',
                    details: validation.error.errors
                });
                return;
            }
            const { toUsername, amount, description } = validation.data.body;
            const fromUserId = userId;
            // Buscar usuario destinatario
            const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
            const prisma = new PrismaClient();
            const toUser = await prisma.user.findUnique({
                where: { username: toUsername },
                select: { id: true, username: true, isActive: true }
            });
            if (!toUser) {
                res.status(constants_1.HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    error: 'Usuario destinatario no encontrado'
                });
                return;
            }
            if (!toUser.isActive) {
                res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    error: 'Usuario destinatario no está activo'
                });
                return;
            }
            if (userId === toUser.id) {
                res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    error: 'No puedes transferir Perlas a ti mismo'
                });
                return;
            }
            // Obtener configuración de comisión
            const paymentConfig = await prisma.paymentConfiguration.findFirst();
            const commission = paymentConfig?.p2pTransferCommission || 2.50;
            // Realizar transferencia
            const result = await walletService_1.walletService.transferPearls(userId, toUser.id, amount, description, parseFloat(commission.toString()));
            res.json({
                success: true,
                message: 'Transferencia P2P realizada exitosamente',
                data: {
                    fromTransactionId: result.fromTransaction.id,
                    toTransactionId: result.toTransaction.id,
                    amount,
                    commission: parseFloat(commission.toString()),
                    totalDebit: amount + parseFloat(commission.toString()),
                    toUsername: toUser.username,
                    description,
                    timestamp: result.fromTransaction.createdAt
                }
            });
            structuredLogger_1.logger.info('Transferencia P2P realizada', {
                fromUserId: userId,
                toUserId: toUser.id,
                toUsername: toUser.username,
                amount,
                commission: parseFloat(commission.toString()),
                description
            });
        }
        catch (error) {
            structuredLogger_1.logger.error('Error en transferencia P2P', error, {
                fromUserId: req.user.userId,
                amount: req.body.amount
            });
            const errorMessage = error instanceof Error ? error.message : 'Error procesando transferencia';
            const statusCode = errorMessage.includes('saldo insuficiente') ||
                errorMessage.includes('Saldo insuficiente') ?
                constants_1.HTTP_STATUS.BAD_REQUEST : constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR;
            res.status(statusCode).json({
                success: false,
                error: errorMessage
            });
        }
    }
    /**
     * Verificar si un username existe (para validación en frontend)
     * GET /api/wallet/verify-username/:username
     */
    async verifyUsername(req, res) {
        try {
            const { username } = req.params;
            const currentUserId = req.user.userId;
            if (!username || username.length < 3) {
                res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    error: 'Username debe tener al menos 3 caracteres'
                });
                return;
            }
            const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
            const prisma = new PrismaClient();
            const user = await prisma.user.findUnique({
                where: { username },
                select: {
                    id: true,
                    username: true,
                    isActive: true,
                    fullName: true
                }
            });
            if (!user) {
                res.json({
                    success: true,
                    data: {
                        exists: false,
                        message: 'Usuario no encontrado'
                    }
                });
                return;
            }
            if (user.id === currentUserId) {
                res.json({
                    success: true,
                    data: {
                        exists: false,
                        message: 'No puedes transferir a ti mismo'
                    }
                });
                return;
            }
            if (!user.isActive) {
                res.json({
                    success: true,
                    data: {
                        exists: false,
                        message: 'Usuario no está activo'
                    }
                });
                return;
            }
            res.json({
                success: true,
                data: {
                    exists: true,
                    username: user.username,
                    fullName: user.fullName,
                    message: 'Usuario válido para transferencias'
                }
            });
        }
        catch (error) {
            structuredLogger_1.logger.error('Error verificando username', error, { username: req.params.username });
            res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: 'Error verificando usuario'
            });
        }
    }
}
exports.WalletController = WalletController;
exports.walletController = new WalletController();
//# sourceMappingURL=walletController.js.map