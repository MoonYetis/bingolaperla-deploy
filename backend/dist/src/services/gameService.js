"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameService = void 0;
const database_1 = require("@/config/database");
const logger_1 = require("@/utils/logger");
const game_1 = require("../../../shared/types/game");
const patternService_1 = require("./patternService");
const bingoCardService_1 = require("./bingoCardService");
class GameService {
    /**
     * Obtiene todos los juegos disponibles
     */
    static async getAllGames(status) {
        try {
            const games = await database_1.prisma.game.findMany({
                where: status ? { status } : undefined,
                include: {
                    _count: {
                        select: {
                            participants: true,
                        }
                    }
                },
                orderBy: { scheduledAt: 'asc' }
            });
            return games.map(game => ({
                id: game.id,
                title: game.title,
                description: game.description ?? undefined,
                maxPlayers: game.maxPlayers,
                cardPrice: parseFloat(game.cardPrice.toString()),
                totalPrize: parseFloat(game.totalPrize.toString()),
                status: game.status,
                scheduledAt: game.scheduledAt.toISOString(),
                startedAt: game.startedAt?.toISOString(),
                endedAt: game.endedAt?.toISOString(),
                ballsDrawn: game.ballsDrawn,
                currentBall: game.currentBall || undefined,
                winningCards: game.winningCards,
                participantCount: game._count?.participants || 0,
                createdAt: game.createdAt.toISOString(),
                updatedAt: game.updatedAt.toISOString(),
            }));
        }
        catch (error) {
            logger_1.logger.error('Error getting games:', error);
            throw error;
        }
    }
    /**
     * Obtiene un juego específico por ID
     */
    static async getGameById(gameId) {
        try {
            const game = await database_1.prisma.game.findUnique({
                where: { id: gameId },
                include: {
                    _count: {
                        select: {
                            participants: true,
                        }
                    }
                }
            });
            if (!game) {
                return null;
            }
            return {
                id: game.id,
                title: game.title,
                description: game.description ?? undefined,
                maxPlayers: game.maxPlayers,
                cardPrice: parseFloat(game.cardPrice.toString()),
                totalPrize: parseFloat(game.totalPrize.toString()),
                status: game.status,
                scheduledAt: game.scheduledAt.toISOString(),
                startedAt: game.startedAt?.toISOString(),
                endedAt: game.endedAt?.toISOString(),
                ballsDrawn: game.ballsDrawn,
                currentBall: game.currentBall || undefined,
                winningCards: game.winningCards,
                participantCount: game._count?.participants || 0,
                createdAt: game.createdAt.toISOString(),
                updatedAt: game.updatedAt.toISOString(),
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting game by ID:', error);
            throw error;
        }
    }
    /**
     * Crea un nuevo juego
     */
    static async createGame(gameData) {
        try {
            const game = await database_1.prisma.game.create({
                data: {
                    title: gameData.title,
                    description: gameData.description,
                    maxPlayers: gameData.maxPlayers,
                    cardPrice: gameData.cardPrice,
                    scheduledAt: gameData.scheduledAt,
                    status: game_1.GameStatus.SCHEDULED,
                    totalPrize: 0, // Se calculará basado en las ventas
                },
                include: {
                    _count: {
                        select: {
                            participants: true,
                        }
                    }
                }
            });
            logger_1.logger.info(`New game created: ${game.title} (${game.id})`);
            return {
                id: game.id,
                title: game.title,
                description: game.description ?? undefined,
                maxPlayers: game.maxPlayers,
                cardPrice: parseFloat(game.cardPrice.toString()),
                totalPrize: parseFloat(game.totalPrize.toString()),
                status: game.status,
                scheduledAt: game.scheduledAt.toISOString(),
                startedAt: game.startedAt?.toISOString(),
                endedAt: game.endedAt?.toISOString(),
                ballsDrawn: game.ballsDrawn,
                currentBall: game.currentBall || undefined,
                winningCards: game.winningCards,
                participantCount: game._count?.participants || 0,
                createdAt: game.createdAt.toISOString(),
                updatedAt: game.updatedAt.toISOString(),
            };
        }
        catch (error) {
            logger_1.logger.error('Error creating game:', error);
            throw error;
        }
    }
    /**
     * Inscribe un usuario en un juego
     */
    static async joinGame(userId, gameId) {
        try {
            // Verificar que el juego existe y está disponible
            const game = await this.getGameById(gameId);
            if (!game) {
                throw new Error('Juego no encontrado');
            }
            if (game.status !== game_1.GameStatus.OPEN && game.status !== game_1.GameStatus.SCHEDULED) {
                throw new Error('El juego no está disponible para inscripciones');
            }
            if (game.participantCount >= game.maxPlayers) {
                throw new Error('El juego está lleno');
            }
            // Verificar si el usuario ya está inscrito
            const existingParticipant = await database_1.prisma.gameParticipant.findUnique({
                where: {
                    userId_gameId: {
                        userId,
                        gameId
                    }
                }
            });
            if (existingParticipant) {
                throw new Error('El usuario ya está inscrito en este juego');
            }
            // Inscribir al usuario
            await database_1.prisma.gameParticipant.create({
                data: {
                    userId,
                    gameId,
                    cardsCount: 0,
                    totalSpent: 0,
                }
            });
            logger_1.logger.info(`User ${userId} joined game ${gameId}`);
        }
        catch (error) {
            logger_1.logger.error('Error joining game:', error);
            throw error;
        }
    }
    /**
     * Inicia un juego
     */
    static async startGame(gameId) {
        try {
            const game = await database_1.prisma.game.findUnique({
                where: { id: gameId }
            });
            if (!game) {
                throw new Error('Juego no encontrado');
            }
            if (game.status !== game_1.GameStatus.OPEN && game.status !== game_1.GameStatus.SCHEDULED) {
                throw new Error('El juego no puede ser iniciado');
            }
            const updatedGame = await database_1.prisma.game.update({
                where: { id: gameId },
                data: {
                    status: game_1.GameStatus.IN_PROGRESS,
                    startedAt: new Date(),
                },
                include: {
                    _count: {
                        select: {
                            participants: true,
                        }
                    }
                }
            });
            logger_1.logger.info(`Game started: ${gameId}`);
            return {
                id: updatedGame.id,
                title: updatedGame.title,
                description: updatedGame.description || undefined,
                maxPlayers: updatedGame.maxPlayers,
                cardPrice: parseFloat(updatedGame.cardPrice.toString()),
                totalPrize: parseFloat(updatedGame.totalPrize.toString()),
                status: updatedGame.status,
                scheduledAt: updatedGame.scheduledAt.toISOString(),
                startedAt: updatedGame.startedAt?.toISOString(),
                endedAt: updatedGame.endedAt?.toISOString(),
                ballsDrawn: updatedGame.ballsDrawn,
                currentBall: updatedGame.currentBall || undefined,
                winningCards: updatedGame.winningCards,
                participantCount: updatedGame._count?.participants || 0,
                createdAt: updatedGame.createdAt.toISOString(),
                updatedAt: updatedGame.updatedAt.toISOString(),
            };
        }
        catch (error) {
            logger_1.logger.error('Error starting game:', error);
            throw error;
        }
    }
    /**
     * Sortea una bola en el juego
     */
    static async drawBall(gameId) {
        try {
            const game = await database_1.prisma.game.findUnique({
                where: { id: gameId },
                include: {
                    bingoCards: {
                        include: {
                            numbers: {
                                orderBy: { position: 'asc' }
                            }
                        }
                    }
                }
            });
            if (!game) {
                throw new Error('Juego no encontrado');
            }
            if (game.status !== game_1.GameStatus.IN_PROGRESS) {
                throw new Error('El juego no está en progreso');
            }
            // Obtener números disponibles para sortear (1-75 menos los ya sorteados)
            const currentBallsDrawn = game.ballsDrawn || [];
            const availableNumbers = Array.from({ length: 75 }, (_, i) => i + 1)
                .filter(num => !currentBallsDrawn.includes(num));
            if (availableNumbers.length === 0) {
                throw new Error('Todas las bolas ya han sido sorteadas');
            }
            // Sortear un número aleatorio
            const randomIndex = Math.floor(Math.random() * availableNumbers.length);
            const drawnBall = availableNumbers[randomIndex];
            // Actualizar el juego con la nueva bola
            const updatedBallsDrawn = [...currentBallsDrawn, drawnBall];
            const updatedGame = await database_1.prisma.game.update({
                where: { id: gameId },
                data: {
                    ballsDrawn: updatedBallsDrawn,
                    currentBall: drawnBall,
                },
                include: {
                    _count: {
                        select: {
                            participants: true,
                        }
                    }
                }
            });
            // Marcar automáticamente el número en todos los cartones que lo tengan
            await this.autoMarkNumber(gameId, drawnBall);
            // Verificar ganadores después del marcado automático
            const updatedCards = await bingoCardService_1.BingoCardService.getUserCards('', gameId); // Obtener todos los cartones
            const allCards = await database_1.prisma.bingoCard.findMany({
                where: { gameId, isActive: true },
                include: {
                    numbers: {
                        orderBy: { position: 'asc' }
                    }
                }
            });
            const bingoCards = allCards.map(card => ({
                id: card.id,
                cardNumber: card.cardNumber,
                userId: card.userId,
                gameId: card.gameId,
                isActive: card.isActive,
                markedNumbers: card.markedNumbers,
                isWinner: card.isWinner,
                winningPattern: card.winningPattern ?? undefined,
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
            }));
            const { winners } = patternService_1.PatternService.checkForWinners(bingoCards);
            logger_1.logger.info(`Ball ${drawnBall} drawn in game ${gameId}`, {
                gameId,
                ball: drawnBall,
                winnersCount: winners.length
            });
            const gameData = {
                id: updatedGame.id,
                title: updatedGame.title,
                description: updatedGame.description || undefined,
                maxPlayers: updatedGame.maxPlayers,
                cardPrice: parseFloat(updatedGame.cardPrice.toString()),
                totalPrize: parseFloat(updatedGame.totalPrize.toString()),
                status: updatedGame.status,
                scheduledAt: updatedGame.scheduledAt.toISOString(),
                startedAt: updatedGame.startedAt?.toISOString(),
                endedAt: updatedGame.endedAt?.toISOString(),
                ballsDrawn: updatedGame.ballsDrawn,
                currentBall: updatedGame.currentBall || undefined,
                winningCards: updatedGame.winningCards,
                participantCount: updatedGame._count?.participants || 0,
                createdAt: updatedGame.createdAt.toISOString(),
                updatedAt: updatedGame.updatedAt.toISOString(),
            };
            return {
                ball: drawnBall,
                gameData,
                winners: winners.length > 0 ? winners : undefined
            };
        }
        catch (error) {
            logger_1.logger.error('Error drawing ball:', error);
            throw error;
        }
    }
    /**
     * Marca automáticamente un número en todos los cartones activos del juego
     */
    static async autoMarkNumber(gameId, number) {
        try {
            // Obtener todos los números de cartones que coincidan con el número sorteado
            const cardNumbers = await database_1.prisma.cardNumber.findMany({
                where: {
                    number: number,
                    isMarked: false,
                    card: {
                        gameId: gameId,
                        isActive: true
                    }
                },
                include: {
                    card: true
                }
            });
            // Marcar todos los números encontrados
            for (const cardNumber of cardNumbers) {
                await database_1.prisma.cardNumber.update({
                    where: { id: cardNumber.id },
                    data: { isMarked: true }
                });
                // Actualizar el array de números marcados en el cartón
                const currentMarkedNumbers = cardNumber.card.markedNumbers;
                const updatedMarkedNumbers = [...currentMarkedNumbers, number];
                await database_1.prisma.bingoCard.update({
                    where: { id: cardNumber.card.id },
                    data: { markedNumbers: updatedMarkedNumbers }
                });
            }
            logger_1.logger.info(`Auto-marked number ${number} on ${cardNumbers.length} cards in game ${gameId}`);
        }
        catch (error) {
            logger_1.logger.error('Error auto-marking number:', error);
            throw error;
        }
    }
    /**
     * Finaliza un juego
     */
    static async endGame(gameId) {
        try {
            const updatedGame = await database_1.prisma.game.update({
                where: { id: gameId },
                data: {
                    status: game_1.GameStatus.COMPLETED,
                    endedAt: new Date(),
                },
                include: {
                    _count: {
                        select: {
                            participants: true,
                        }
                    }
                }
            });
            logger_1.logger.info(`Game ended: ${gameId}`);
            return {
                id: updatedGame.id,
                title: updatedGame.title,
                description: updatedGame.description || undefined,
                maxPlayers: updatedGame.maxPlayers,
                cardPrice: parseFloat(updatedGame.cardPrice.toString()),
                totalPrize: parseFloat(updatedGame.totalPrize.toString()),
                status: updatedGame.status,
                scheduledAt: updatedGame.scheduledAt.toISOString(),
                startedAt: updatedGame.startedAt?.toISOString(),
                endedAt: updatedGame.endedAt?.toISOString(),
                ballsDrawn: updatedGame.ballsDrawn,
                currentBall: updatedGame.currentBall || undefined,
                winningCards: updatedGame.winningCards,
                participantCount: updatedGame._count?.participants || 0,
                createdAt: updatedGame.createdAt.toISOString(),
                updatedAt: updatedGame.updatedAt.toISOString(),
            };
        }
        catch (error) {
            logger_1.logger.error('Error ending game:', error);
            throw error;
        }
    }
}
exports.GameService = GameService;
exports.default = GameService;
//# sourceMappingURL=gameService.js.map