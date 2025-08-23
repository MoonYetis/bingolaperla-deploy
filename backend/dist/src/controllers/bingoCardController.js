"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BingoCardController = void 0;
const bingoCardService_1 = require("@/services/bingoCardService");
const patternService_1 = require("@/services/patternService");
const constants_1 = require("@/utils/constants");
const logger_1 = require("@/utils/logger");
const database_1 = require("@/config/database");
class BingoCardController {
    // POST /api/cards/generate
    static async generateCards(req, res) {
        try {
            const { gameId, count = 3 } = req.body;
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
                    error: constants_1.ERROR_MESSAGES.UNAUTHORIZED,
                });
            }
            if (!gameId) {
                return res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                    error: 'ID del juego es requerido',
                });
            }
            const cards = await bingoCardService_1.BingoCardService.generateMultipleCards(userId, gameId, parseInt(count));
            return res.status(constants_1.HTTP_STATUS.CREATED).json({
                message: `${cards.length} cartones generados exitosamente`,
                cards,
                count: cards.length,
            });
        }
        catch (error) {
            logger_1.logger.error('Error generating cards:', error);
            let message = constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
            let status = constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR;
            if (error instanceof Error) {
                if (error.message.includes('Máximo')) {
                    message = error.message;
                    status = constants_1.HTTP_STATUS.BAD_REQUEST;
                }
                else if (error.message.includes('no encontrado')) {
                    message = 'Juego no encontrado';
                    status = constants_1.HTTP_STATUS.NOT_FOUND;
                }
                else if (error.message.includes('no está disponible')) {
                    message = 'El juego no está disponible para compra de cartones';
                    status = constants_1.HTTP_STATUS.BAD_REQUEST;
                }
                else if (error.message.includes('ya tiene cartones')) {
                    message = 'Ya tienes cartones en este juego';
                    status = constants_1.HTTP_STATUS.CONFLICT;
                }
            }
            return res.status(status).json({ error: message });
        }
    }
    // GET /api/cards/user/:userId/game/:gameId
    static async getUserCards(req, res) {
        try {
            const { userId, gameId } = req.params;
            const currentUserId = req.user?.userId;
            const isAdmin = req.user?.role === 'ADMIN';
            // Verificar permisos: solo el propio usuario o admin pueden ver los cartones
            if (currentUserId !== userId && !isAdmin) {
                return res.status(constants_1.HTTP_STATUS.FORBIDDEN).json({
                    error: 'No tienes permisos para ver estos cartones',
                });
            }
            const cards = await bingoCardService_1.BingoCardService.getUserCards(userId, gameId);
            return res.status(constants_1.HTTP_STATUS.OK).json({
                message: 'Cartones obtenidos exitosamente',
                cards,
                count: cards.length,
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting user cards:', error);
            return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                error: constants_1.ERROR_MESSAGES.INTERNAL_ERROR,
            });
        }
    }
    // GET /api/cards/my/:gameId
    static async getMyCards(req, res) {
        try {
            const { gameId } = req.params;
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
                    error: constants_1.ERROR_MESSAGES.UNAUTHORIZED,
                });
            }
            const cards = await bingoCardService_1.BingoCardService.getUserCards(userId, gameId);
            return res.status(constants_1.HTTP_STATUS.OK).json({
                message: 'Tus cartones obtenidos exitosamente',
                cards,
                count: cards.length,
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting my cards:', error);
            return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                error: constants_1.ERROR_MESSAGES.INTERNAL_ERROR,
            });
        }
    }
    // PUT /api/cards/:cardId/mark
    static async markNumber(req, res) {
        try {
            const { cardId } = req.params;
            const { number } = req.body;
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
                    error: constants_1.ERROR_MESSAGES.UNAUTHORIZED,
                });
            }
            if (!number || typeof number !== 'number') {
                return res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                    error: 'Número válido es requerido',
                });
            }
            if (number < 1 || number > 75) {
                return res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                    error: 'El número debe estar entre 1 y 75',
                });
            }
            const updatedCard = await bingoCardService_1.BingoCardService.markNumber(cardId, number);
            // Verificar si el cartón es ganador después del marcado
            const winningPatterns = patternService_1.PatternService.checkWinningPatterns(updatedCard);
            let responseMessage = `Número ${number} marcado exitosamente`;
            if (winningPatterns.length > 0) {
                responseMessage += ` - ¡BINGO! Patrones ganadores: ${winningPatterns.join(', ')}`;
            }
            return res.status(constants_1.HTTP_STATUS.OK).json({
                message: responseMessage,
                card: updatedCard,
                winningPatterns,
                isWinner: winningPatterns.length > 0,
            });
        }
        catch (error) {
            logger_1.logger.error('Error marking number:', error);
            let message = constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
            let status = constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR;
            if (error instanceof Error) {
                if (error.message.includes('no encontrado')) {
                    message = 'Cartón no encontrado';
                    status = constants_1.HTTP_STATUS.NOT_FOUND;
                }
                else if (error.message.includes('inactivo')) {
                    message = 'Cartón inactivo';
                    status = constants_1.HTTP_STATUS.BAD_REQUEST;
                }
                else if (error.message.includes('no está en progreso')) {
                    message = 'El juego no está en progreso';
                    status = constants_1.HTTP_STATUS.BAD_REQUEST;
                }
                else if (error.message.includes('no encontrado en este cartón')) {
                    message = 'Número no encontrado en este cartón';
                    status = constants_1.HTTP_STATUS.BAD_REQUEST;
                }
                else if (error.message.includes('ya marcado')) {
                    message = 'Número ya marcado';
                    status = constants_1.HTTP_STATUS.CONFLICT;
                }
            }
            return res.status(status).json({ error: message });
        }
    }
    // GET /api/cards/:cardId/patterns
    static async getCardPatterns(req, res) {
        try {
            const { cardId } = req.params;
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
                    error: constants_1.ERROR_MESSAGES.UNAUTHORIZED,
                });
            }
            // Obtener el cartón específico y verificar que pertenece al usuario
            const card = await database_1.prisma.bingoCard.findFirst({
                where: {
                    id: cardId,
                    userId: userId,
                    isActive: true
                },
                include: {
                    numbers: {
                        orderBy: { position: 'asc' }
                    }
                }
            });
            if (!card) {
                return res.status(constants_1.HTTP_STATUS.NOT_FOUND).json({
                    error: 'Cartón no encontrado',
                });
            }
            // Convertir a formato BingoCardData
            const cardData = {
                id: card.id,
                cardNumber: card.cardNumber,
                userId: card.userId,
                gameId: card.gameId,
                isActive: card.isActive,
                markedNumbers: card.markedNumbers,
                isWinner: card.isWinner,
                winningPattern: card.winningPattern || undefined,
                numbers: card.numbers.map(num => ({
                    id: num.id,
                    position: num.position,
                    column: num.column,
                    number: num.number,
                    isMarked: num.isMarked,
                    isFree: num.isFree,
                })),
                createdAt: card.createdAt.toISOString(),
                updatedAt: card.updatedAt.toISOString(),
            };
            // Verificar patrones ganadores
            const winningPatterns = patternService_1.PatternService.checkWinningPatterns(cardData);
            // Obtener progreso de todos los patrones
            const allProgress = patternService_1.PatternService.getAllPatternProgress(cardData);
            // Obtener el patrón más cercano a completar
            const closestPattern = patternService_1.PatternService.getClosestPattern(cardData);
            return res.status(constants_1.HTTP_STATUS.OK).json({
                message: 'Patrones del cartón obtenidos exitosamente',
                cardId,
                winningPatterns,
                isWinner: winningPatterns.length > 0,
                allProgress,
                closestPattern,
                linePatterns: patternService_1.PatternService.getLinePatterns(),
                specialPatterns: patternService_1.PatternService.getSpecialPatterns(),
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting card patterns:', error);
            return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                error: constants_1.ERROR_MESSAGES.INTERNAL_ERROR,
            });
        }
    }
    // POST /api/cards/validate
    static async validateCard(req, res) {
        try {
            const { cardNumbers } = req.body;
            if (!cardNumbers || !Array.isArray(cardNumbers)) {
                return res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                    error: 'Números del cartón son requeridos',
                });
            }
            const isValid = bingoCardService_1.BingoCardService.validateCard(cardNumbers);
            const isUnique = bingoCardService_1.BingoCardService.verifyCardUniqueness(cardNumbers);
            return res.status(constants_1.HTTP_STATUS.OK).json({
                message: 'Validación completada',
                isValid,
                isUnique,
                details: {
                    hasCorrectSize: cardNumbers.length === 25,
                    hasValidFreeCell: cardNumbers.some(cell => cell.position === 12 && cell.isFree && cell.number === null),
                    hasValidRanges: isValid,
                    hasUniqueNumbers: isUnique,
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error validating card:', error);
            return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                error: constants_1.ERROR_MESSAGES.INTERNAL_ERROR,
            });
        }
    }
    // DELETE /api/cards/:cardId
    static async deleteCard(req, res) {
        try {
            const { cardId } = req.params;
            const userId = req.user?.userId;
            const isAdmin = req.user?.role === 'ADMIN';
            if (!userId) {
                return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
                    error: constants_1.ERROR_MESSAGES.UNAUTHORIZED,
                });
            }
            // Verificar que el cartón existe y pertenece al usuario (o es admin)
            const whereCondition = isAdmin
                ? { id: cardId, isActive: true }
                : { id: cardId, userId, isActive: true };
            const card = await database_1.prisma.bingoCard.findFirst({
                where: whereCondition
            });
            if (!card) {
                return res.status(constants_1.HTTP_STATUS.NOT_FOUND).json({
                    error: 'Cartón no encontrado',
                });
            }
            // Desactivar el cartón en lugar de eliminarlo (para mantener historial)
            await database_1.prisma.bingoCard.update({
                where: { id: cardId },
                data: { isActive: false }
            });
            return res.status(constants_1.HTTP_STATUS.OK).json({
                message: 'Cartón eliminado exitosamente',
            });
        }
        catch (error) {
            logger_1.logger.error('Error deleting card:', error);
            return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                error: constants_1.ERROR_MESSAGES.INTERNAL_ERROR,
            });
        }
    }
}
exports.BingoCardController = BingoCardController;
exports.default = BingoCardController;
//# sourceMappingURL=bingoCardController.js.map