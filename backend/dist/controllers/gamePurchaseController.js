"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamePurchaseController = void 0;
const gamePurchaseService_1 = require("@/services/gamePurchaseService");
const walletService_1 = require("@/services/walletService");
const constants_1 = require("@/utils/constants");
const structuredLogger_1 = require("@/utils/structuredLogger");
class GamePurchaseController {
    /**
     * Comprar cartones de bingo usando Perlas
     * POST /api/game-purchase/cards
     */
    static async purchaseCards(req, res) {
        try {
            const { gameId, cardCount = 1 } = req.body;
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
                    error: constants_1.ERROR_MESSAGES.UNAUTHORIZED
                });
            }
            if (!gameId) {
                return res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                    error: 'ID del juego es requerido'
                });
            }
            if (!cardCount || cardCount < 1 || cardCount > 3) {
                return res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                    error: 'La cantidad de cartones debe ser entre 1 y 3'
                });
            }
            // Realizar la compra usando el servicio
            const result = await gamePurchaseService_1.GamePurchaseService.purchaseCardsWithPearls(userId, gameId, parseInt(cardCount));
            structuredLogger_1.logger.info('Compra de cartones exitosa', {
                userId,
                gameId,
                cardCount,
                totalAmount: result.transaction.amount,
                newBalance: result.newBalance,
                transactionId: result.transaction.id
            });
            return res.status(constants_1.HTTP_STATUS.OK).json({
                success: true,
                message: `¡Compra exitosa! ${cardCount} cartón${cardCount > 1 ? 'es' : ''} adquirido${cardCount > 1 ? 's' : ''} con Perlas`,
                data: {
                    purchase: {
                        transactionId: result.transaction.id,
                        amount: result.transaction.amount,
                        description: result.transaction.description,
                        timestamp: result.transaction.timestamp,
                        cardsPurchased: cardCount
                    },
                    cards: result.cards,
                    wallet: {
                        newBalance: result.newBalance,
                        pearlsUsed: result.transaction.amount
                    },
                    game: result.gameInfo
                }
            });
        }
        catch (error) {
            structuredLogger_1.logger.error('Error comprando cartones con Perlas', error, {
                userId: req.user?.userId,
                gameId: req.body.gameId,
                cardCount: req.body.cardCount
            });
            let message = constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
            let status = constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR;
            if (error instanceof Error) {
                if (error.message.includes('cantidad de cartones')) {
                    message = error.message;
                    status = constants_1.HTTP_STATUS.BAD_REQUEST;
                }
                else if (error.message.includes('no encontrado')) {
                    message = error.message;
                    status = constants_1.HTTP_STATUS.NOT_FOUND;
                }
                else if (error.message.includes('no está disponible') ||
                    error.message.includes('está lleno')) {
                    message = error.message;
                    status = constants_1.HTTP_STATUS.BAD_REQUEST;
                }
                else if (error.message.includes('Billetera') ||
                    error.message.includes('suspendida') ||
                    error.message.includes('Saldo insuficiente')) {
                    message = error.message;
                    status = constants_1.HTTP_STATUS.BAD_REQUEST;
                }
                else if (error.message.includes('más de 3 cartones')) {
                    message = error.message;
                    status = constants_1.HTTP_STATUS.CONFLICT;
                }
            }
            return res.status(status).json({
                success: false,
                error: message
            });
        }
    }
    /**
     * Validar si el usuario puede comprar cartones
     * GET /api/game-purchase/validate/:gameId/:cardCount?
     */
    static async validatePurchase(req, res) {
        try {
            const { gameId, cardCount = '1' } = req.params;
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
                    error: constants_1.ERROR_MESSAGES.UNAUTHORIZED
                });
            }
            const cardCountNum = parseInt(cardCount);
            if (cardCountNum < 1 || cardCountNum > 3) {
                return res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                    error: 'La cantidad de cartones debe ser entre 1 y 3'
                });
            }
            const validation = await gamePurchaseService_1.GamePurchaseService.validatePurchaseCapability(userId, gameId, cardCountNum);
            return res.status(constants_1.HTTP_STATUS.OK).json({
                success: true,
                message: 'Validación de compra completada',
                data: {
                    canPurchase: validation.canPurchase,
                    currentBalance: validation.currentBalance,
                    requiredAmount: validation.requiredAmount,
                    message: validation.message,
                    cardCount: cardCountNum,
                    gameId
                }
            });
        }
        catch (error) {
            structuredLogger_1.logger.error('Error validando compra', error, {
                userId: req.user?.userId,
                gameId: req.params.gameId,
                cardCount: req.params.cardCount
            });
            return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: constants_1.ERROR_MESSAGES.INTERNAL_ERROR
            });
        }
    }
    /**
     * Obtener historial de compras de cartones del usuario
     * GET /api/game-purchase/history/:gameId?
     */
    static async getPurchaseHistory(req, res) {
        try {
            const { gameId } = req.params;
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
                    error: constants_1.ERROR_MESSAGES.UNAUTHORIZED
                });
            }
            if (gameId) {
                // Historial específico de un juego
                const history = await gamePurchaseService_1.GamePurchaseService.getUserGamePurchases(userId, gameId);
                return res.status(constants_1.HTTP_STATUS.OK).json({
                    success: true,
                    message: 'Historial de compras del juego obtenido',
                    data: {
                        gameId,
                        purchases: history.purchases,
                        cards: history.cards,
                        totalPurchases: history.purchases.length,
                        totalCards: history.cards.length
                    }
                });
            }
            else {
                // Historial general del usuario
                const transactions = await walletService_1.walletService.getTransactionHistory(userId, {
                    type: 'GAME_PURCHASE',
                    limit: 50
                });
                return res.status(constants_1.HTTP_STATUS.OK).json({
                    success: true,
                    message: 'Historial general de compras obtenido',
                    data: {
                        transactions: transactions.map(tx => ({
                            id: tx.id,
                            gameId: tx.gameId,
                            amount: parseFloat(tx.amount.toString()),
                            pearlsAmount: tx.pearlsAmount ? parseFloat(tx.pearlsAmount.toString()) : null,
                            description: tx.description,
                            status: tx.status,
                            createdAt: tx.createdAt.toISOString()
                        })),
                        totalTransactions: transactions.length
                    }
                });
            }
        }
        catch (error) {
            structuredLogger_1.logger.error('Error obteniendo historial de compras', error, {
                userId: req.user?.userId,
                gameId: req.params.gameId
            });
            return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: constants_1.ERROR_MESSAGES.INTERNAL_ERROR
            });
        }
    }
    /**
     * Procesar premio en Perlas para ganadores
     * POST /api/game-purchase/award-prize
     */
    static async awardPrize(req, res) {
        try {
            const { userId, gameId, prizeAmount, winningPattern } = req.body;
            const adminUserId = req.user?.userId;
            const isAdmin = req.user?.role === 'ADMIN';
            if (!isAdmin) {
                return res.status(constants_1.HTTP_STATUS.FORBIDDEN).json({
                    error: 'Solo los administradores pueden acreditar premios'
                });
            }
            if (!userId || !gameId || !prizeAmount || !winningPattern) {
                return res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                    error: 'userId, gameId, prizeAmount y winningPattern son requeridos'
                });
            }
            if (prizeAmount <= 0) {
                return res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                    error: 'El monto del premio debe ser mayor a 0'
                });
            }
            const result = await gamePurchaseService_1.GamePurchaseService.awardPrizeInPearls(userId, gameId, parseFloat(prizeAmount), winningPattern);
            structuredLogger_1.logger.info('Premio acreditado exitosamente', {
                userId,
                gameId,
                prizeAmount,
                winningPattern,
                adminUserId,
                transactionId: result.transaction.id,
                newBalance: result.newBalance
            });
            return res.status(constants_1.HTTP_STATUS.OK).json({
                success: true,
                message: `¡Premio acreditado! ${prizeAmount} Perlas por ${winningPattern}`,
                data: {
                    prize: {
                        transactionId: result.transaction.id,
                        amount: prizeAmount,
                        description: result.transaction.description,
                        winningPattern,
                        recipientUserId: userId
                    },
                    wallet: {
                        newBalance: result.newBalance,
                        pearlsAwarded: prizeAmount
                    },
                    game: result.gameInfo,
                    awardedBy: adminUserId,
                    awardedAt: new Date().toISOString()
                }
            });
        }
        catch (error) {
            structuredLogger_1.logger.error('Error acreditando premio', error, {
                userId: req.body.userId,
                gameId: req.body.gameId,
                prizeAmount: req.body.prizeAmount,
                adminUserId: req.user?.userId
            });
            let message = constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
            let status = constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR;
            if (error instanceof Error) {
                if (error.message.includes('no encontrado')) {
                    message = error.message;
                    status = constants_1.HTTP_STATUS.NOT_FOUND;
                }
                else if (error.message.includes('inactiva')) {
                    message = error.message;
                    status = constants_1.HTTP_STATUS.BAD_REQUEST;
                }
                else if (error.message.includes('mayor a 0')) {
                    message = error.message;
                    status = constants_1.HTTP_STATUS.BAD_REQUEST;
                }
            }
            return res.status(status).json({
                success: false,
                error: message
            });
        }
    }
}
exports.GamePurchaseController = GamePurchaseController;
exports.default = GamePurchaseController;
//# sourceMappingURL=gamePurchaseController.js.map