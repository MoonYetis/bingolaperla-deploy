"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameController = void 0;
const gameService_1 = require("@/services/gameService");
const gamePurchaseService_1 = require("@/services/gamePurchaseService");
const constants_1 = require("@/utils/constants");
const logger_1 = require("@/utils/logger");
class GameController {
    // GET /api/games
    static async getAllGames(req, res) {
        try {
            const { status } = req.query;
            // Usar métodos reales de base de datos
            const games = await gameService_1.GameService.getAllGames(status);
            return res.status(constants_1.HTTP_STATUS.OK).json({
                message: 'Juegos obtenidos exitosamente',
                games,
                total: games.length,
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting games:', error);
            return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                error: constants_1.ERROR_MESSAGES.INTERNAL_ERROR,
            });
        }
    }
    // GET /api/games/:gameId
    static async getGameById(req, res) {
        try {
            const { gameId } = req.params;
            // Usar métodos reales de base de datos
            const game = await gameService_1.GameService.getGameById(gameId);
            if (!game) {
                return res.status(constants_1.HTTP_STATUS.NOT_FOUND).json({
                    error: 'Juego no encontrado',
                });
            }
            return res.status(constants_1.HTTP_STATUS.OK).json({
                message: 'Juego obtenido exitosamente',
                game,
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting game by ID:', error);
            return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                error: constants_1.ERROR_MESSAGES.INTERNAL_ERROR,
            });
        }
    }
    // POST /api/games
    static async createGame(req, res) {
        try {
            const { title, description, maxPlayers, cardPrice, scheduledAt } = req.body;
            // Solo administradores pueden crear juegos
            if (req.user?.role !== 'ADMIN') {
                return res.status(constants_1.HTTP_STATUS.FORBIDDEN).json({
                    error: 'Solo los administradores pueden crear juegos',
                });
            }
            // Usar método real para crear en base de datos  
            const game = await gameService_1.GameService.createGame({
                title,
                description,
                maxPlayers: parseInt(maxPlayers),
                cardPrice: parseFloat(cardPrice),
                scheduledAt: new Date(scheduledAt),
            });
            return res.status(constants_1.HTTP_STATUS.CREATED).json({
                message: 'Juego creado exitosamente',
                game,
            });
        }
        catch (error) {
            logger_1.logger.error('Error creating game:', error);
            let message = constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
            let status = constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR;
            if (error instanceof Error) {
                if (error.message.includes('validation')) {
                    message = 'Datos de juego inválidos';
                    status = constants_1.HTTP_STATUS.BAD_REQUEST;
                }
            }
            return res.status(status).json({ error: message });
        }
    }
    // POST /api/games/:gameId/join
    static async joinGame(req, res) {
        try {
            const { gameId } = req.params;
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
                    error: constants_1.ERROR_MESSAGES.UNAUTHORIZED,
                });
            }
            // Usar métodos mock temporalmente para desarrollo
            await gameService_1.GameService.joinGameMock(userId, gameId);
            return res.status(constants_1.HTTP_STATUS.OK).json({
                message: 'Te has unido al juego exitosamente',
            });
        }
        catch (error) {
            logger_1.logger.error('Error joining game:', error);
            let message = constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
            let status = constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR;
            if (error instanceof Error) {
                if (error.message.includes('no encontrado')) {
                    message = 'Juego no encontrado';
                    status = constants_1.HTTP_STATUS.NOT_FOUND;
                }
                else if (error.message.includes('no está disponible')) {
                    message = 'El juego no está disponible para inscripciones';
                    status = constants_1.HTTP_STATUS.BAD_REQUEST;
                }
                else if (error.message.includes('está lleno')) {
                    message = 'El juego está lleno';
                    status = constants_1.HTTP_STATUS.CONFLICT;
                }
                else if (error.message.includes('ya está inscrito')) {
                    message = 'Ya estás inscrito en este juego';
                    status = constants_1.HTTP_STATUS.CONFLICT;
                }
            }
            return res.status(status).json({ error: message });
        }
    }
    // POST /api/games/:gameId/start
    static async startGame(req, res) {
        try {
            const { gameId } = req.params;
            // Solo administradores pueden iniciar juegos
            if (req.user?.role !== 'ADMIN') {
                return res.status(constants_1.HTTP_STATUS.FORBIDDEN).json({
                    error: 'Solo los administradores pueden iniciar juegos',
                });
            }
            const game = await gameService_1.GameService.startGame(gameId);
            return res.status(constants_1.HTTP_STATUS.OK).json({
                message: 'Juego iniciado exitosamente',
                game,
            });
        }
        catch (error) {
            logger_1.logger.error('Error starting game:', error);
            let message = constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
            let status = constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR;
            if (error instanceof Error) {
                if (error.message.includes('no encontrado')) {
                    message = 'Juego no encontrado';
                    status = constants_1.HTTP_STATUS.NOT_FOUND;
                }
                else if (error.message.includes('no puede ser iniciado')) {
                    message = 'El juego no puede ser iniciado en su estado actual';
                    status = constants_1.HTTP_STATUS.BAD_REQUEST;
                }
            }
            return res.status(status).json({ error: message });
        }
    }
    // POST /api/games/:gameId/draw-ball
    static async drawBall(req, res) {
        try {
            const { gameId } = req.params;
            // Solo administradores pueden sortear bolas
            if (req.user?.role !== 'ADMIN') {
                return res.status(constants_1.HTTP_STATUS.FORBIDDEN).json({
                    error: 'Solo los administradores pueden sortear bolas',
                });
            }
            const result = await gameService_1.GameService.drawBall(gameId);
            return res.status(constants_1.HTTP_STATUS.OK).json({
                message: `Bola ${result.ball} sorteada`,
                ball: result.ball,
                game: result.gameData,
                winners: result.winners,
            });
        }
        catch (error) {
            logger_1.logger.error('Error drawing ball:', error);
            let message = constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
            let status = constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR;
            if (error instanceof Error) {
                if (error.message.includes('no encontrado')) {
                    message = 'Juego no encontrado';
                    status = constants_1.HTTP_STATUS.NOT_FOUND;
                }
                else if (error.message.includes('no está en progreso')) {
                    message = 'El juego no está en progreso';
                    status = constants_1.HTTP_STATUS.BAD_REQUEST;
                }
                else if (error.message.includes('ya han sido sorteadas')) {
                    message = 'Todas las bolas ya han sido sorteadas';
                    status = constants_1.HTTP_STATUS.BAD_REQUEST;
                }
            }
            return res.status(status).json({ error: message });
        }
    }
    // POST /api/games/:gameId/end
    static async endGame(req, res) {
        try {
            const { gameId } = req.params;
            // Solo administradores pueden finalizar juegos
            if (req.user?.role !== 'ADMIN') {
                return res.status(constants_1.HTTP_STATUS.FORBIDDEN).json({
                    error: 'Solo los administradores pueden finalizar juegos',
                });
            }
            const game = await gameService_1.GameService.endGame(gameId);
            return res.status(constants_1.HTTP_STATUS.OK).json({
                message: 'Juego finalizado exitosamente',
                game,
            });
        }
        catch (error) {
            logger_1.logger.error('Error ending game:', error);
            let message = constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
            let status = constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR;
            if (error instanceof Error) {
                if (error.message.includes('no encontrado')) {
                    message = 'Juego no encontrado';
                    status = constants_1.HTTP_STATUS.NOT_FOUND;
                }
            }
            return res.status(status).json({ error: message });
        }
    }
    // GET /api/games/dashboard/stats - Obtener estadísticas del dashboard
    static async getDashboardStats(req, res) {
        try {
            const stats = await gameService_1.GameService.getDashboardStatsMock();
            return res.status(constants_1.HTTP_STATUS.OK).json({
                message: 'Estadísticas obtenidas exitosamente',
                ...stats,
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting dashboard stats:', error);
            return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                error: constants_1.ERROR_MESSAGES.INTERNAL_ERROR,
            });
        }
    }
    // POST /api/games/:gameId/start-demo
    static async startDemo(req, res) {
        try {
            const { gameId } = req.params;
            logger_1.logger.info(`🎮 Iniciando demo automático para juego ${gameId}`);
            // Usar método mock para iniciar demo
            const result = await gameService_1.GameService.startDemoMock(gameId);
            return res.status(constants_1.HTTP_STATUS.OK).json({
                message: 'Demo iniciado exitosamente',
                ...result,
            });
        }
        catch (error) {
            logger_1.logger.error('Error starting demo:', error);
            return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                error: constants_1.ERROR_MESSAGES.INTERNAL_ERROR,
            });
        }
    }
    // POST /api/games/:gameId/stop-demo
    static async stopDemo(req, res) {
        try {
            const { gameId } = req.params;
            logger_1.logger.info(`🛑 Deteniendo demo automático para juego ${gameId}`);
            // Usar método mock para detener demo
            const result = await gameService_1.GameService.stopDemoMock(gameId);
            return res.status(constants_1.HTTP_STATUS.OK).json({
                message: 'Demo detenido exitosamente',
                ...result,
            });
        }
        catch (error) {
            logger_1.logger.error('Error stopping demo:', error);
            return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                error: constants_1.ERROR_MESSAGES.INTERNAL_ERROR,
            });
        }
    }
    // POST /api/games/:gameId/announce-bingo
    static async announceBingo(req, res) {
        try {
            const { gameId } = req.params;
            const { cardId } = req.body;
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
                    error: constants_1.ERROR_MESSAGES.UNAUTHORIZED,
                });
            }
            if (!cardId) {
                return res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                    error: 'ID del cartón es requerido',
                });
            }
            logger_1.logger.info(`🎉 Usuario ${userId} anuncia BINGO en cartón ${cardId} para juego ${gameId}`);
            // Validar BINGO
            const bingoResult = await gameService_1.GameService.announceBingo(gameId, cardId, userId);
            if (!bingoResult.isValid) {
                return res.status(constants_1.HTTP_STATUS.OK).json({
                    success: false,
                    message: bingoResult.message,
                    isValid: false,
                    card: bingoResult.card,
                });
            }
            // BINGO VÁLIDO - Calcular y otorgar premio en Perlas
            try {
                const game = await gameService_1.GameService.getGameById(gameId);
                if (!game) {
                    throw new Error('Juego no encontrado para calcular premio');
                }
                // Calcular premio basado en el patrón y pozo del juego
                const prizeAmount = GameController.calculatePrizeAmount(bingoResult.winningPattern, game.totalPrize, game.cardPrice);
                logger_1.logger.info(`💰 Calculando premio: patrón=${bingoResult.winningPattern}, monto=${prizeAmount} Perlas`);
                // Otorgar premio en Perlas
                const prizeResult = await gamePurchaseService_1.GamePurchaseService.awardPrizeInPearls(userId, gameId, prizeAmount, bingoResult.winningPattern);
                // Emitir notificación Socket.IO para actualización de balance
                try {
                    const io = global.socketIO;
                    if (io) {
                        // Notificar al ganador
                        io.to(`game-${gameId}`).emit('bingo-winner', {
                            userId,
                            cardId,
                            gameId,
                            pattern: bingoResult.winningPattern,
                            prizeAmount,
                            newBalance: prizeResult.newBalance,
                            timestamp: new Date().toISOString(),
                        });
                        // Notificar actualización de balance específicamente al usuario
                        io.emit('pearl-balance-updated', {
                            userId,
                            newBalance: prizeResult.newBalance,
                            pearlsEarned: prizeAmount,
                            reason: 'BINGO_PRIZE',
                            gameId,
                            pattern: bingoResult.winningPattern,
                            timestamp: new Date().toISOString(),
                        });
                        logger_1.logger.info('Socket.IO notifications sent', { userId, prizeAmount, newBalance: prizeResult.newBalance });
                    }
                }
                catch (socketError) {
                    logger_1.logger.warn('Error sending Socket.IO notifications', socketError);
                }
                return res.status(constants_1.HTTP_STATUS.OK).json({
                    success: true,
                    message: `¡BINGO VÁLIDO! Has ganado ${prizeAmount.toFixed(2)} Perlas`,
                    isValid: true,
                    card: bingoResult.card,
                    winningPattern: bingoResult.winningPattern,
                    prize: {
                        amount: prizeAmount,
                        currency: 'PERLAS',
                        transactionId: prizeResult.transaction.id,
                        newBalance: prizeResult.newBalance,
                        description: prizeResult.transaction.description,
                        timestamp: prizeResult.transaction.createdAt,
                    },
                });
            }
            catch (prizeError) {
                logger_1.logger.error('Error otorgando premio en Perlas', prizeError, {
                    userId,
                    gameId,
                    cardId,
                    pattern: bingoResult.winningPattern
                });
                // BINGO válido pero error en premio - informar al usuario
                return res.status(constants_1.HTTP_STATUS.OK).json({
                    success: true,
                    message: '¡BINGO VÁLIDO! Premio en proceso de acreditación.',
                    isValid: true,
                    card: bingoResult.card,
                    winningPattern: bingoResult.winningPattern,
                    prize: {
                        status: 'PENDING',
                        message: 'Premio será acreditado en breve'
                    },
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Error processing BINGO announcement:', error);
            let message = constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
            let status = constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR;
            if (error instanceof Error) {
                if (error.message.includes('no encontrado')) {
                    message = error.message;
                    status = constants_1.HTTP_STATUS.NOT_FOUND;
                }
                else if (error.message.includes('no está en progreso')) {
                    message = 'El juego no está en progreso';
                    status = constants_1.HTTP_STATUS.BAD_REQUEST;
                }
                else if (error.message.includes('no pertenece')) {
                    message = 'El cartón no pertenece al usuario';
                    status = constants_1.HTTP_STATUS.FORBIDDEN;
                }
            }
            return res.status(status).json({
                success: false,
                error: message
            });
        }
    }
    /**
     * Calcula el monto del premio basado en el patrón ganador
     */
    static calculatePrizeAmount(pattern, totalPrize, cardPrice) {
        // Multiplicadores por tipo de patrón
        const patternMultipliers = {
            // Líneas horizontales
            'LINE_HORIZONTAL_1': 1.0,
            'LINE_HORIZONTAL_2': 1.0,
            'LINE_HORIZONTAL_3': 1.0,
            'LINE_HORIZONTAL_4': 1.0,
            'LINE_HORIZONTAL_5': 1.0,
            // Líneas verticales  
            'LINE_VERTICAL_B': 1.0,
            'LINE_VERTICAL_I': 1.0,
            'LINE_VERTICAL_N': 1.0,
            'LINE_VERTICAL_G': 1.0,
            'LINE_VERTICAL_O': 1.0,
            // Diagonales
            'DIAGONAL_1': 1.5,
            'DIAGONAL_2': 1.5,
            // Patrones especiales
            'FOUR_CORNERS': 2.0,
            'SMALL_DIAMOND': 2.5,
            'BIG_DIAMOND': 3.0,
            'FULL_CARD': 5.0,
            // Por defecto
            'DEFAULT': 1.0,
        };
        const multiplier = patternMultipliers[pattern] || patternMultipliers['DEFAULT'];
        // Base del premio: mayor entre el pozo total dividido por 10 o 5 veces el precio del cartón
        const basePrize = Math.max(totalPrize * 0.1, cardPrice * 5);
        // Aplicar multiplicador
        const finalPrize = basePrize * multiplier;
        // Mínimo 1 Perla, máximo el 50% del pozo total
        return Math.max(1.0, Math.min(finalPrize, totalPrize * 0.5));
    }
}
exports.GameController = GameController;
exports.default = GameController;
//# sourceMappingURL=gameController.js.map