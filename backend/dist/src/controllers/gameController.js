"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameController = void 0;
const gameService_1 = require("@/services/gameService");
const constants_1 = require("@/utils/constants");
const logger_1 = require("@/utils/logger");
class GameController {
    // GET /api/games
    static async getAllGames(req, res) {
        try {
            const { status } = req.query;
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
            await gameService_1.GameService.joinGame(userId, gameId);
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
}
exports.GameController = GameController;
exports.default = GameController;
//# sourceMappingURL=gameController.js.map