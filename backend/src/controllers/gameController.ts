import { Request, Response } from 'express';
import { GameService } from '@/services/gameService';
import { GamePurchaseService } from '@/services/gamePurchaseService';
import { HTTP_STATUS, ERROR_MESSAGES } from '@/utils/constants';
import { logger } from '@/utils/logger';

export class GameController {
  // GET /api/games
  static async getAllGames(req: Request, res: Response) {
    try {
      const { status } = req.query;
      // Usar métodos reales de base de datos
      const games = await GameService.getAllGames(status as any);

      return res.status(HTTP_STATUS.OK).json({
        message: 'Juegos obtenidos exitosamente',
        games,
        total: games.length,
      });
    } catch (error) {
      logger.error('Error getting games:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  }

  // GET /api/games/:gameId
  static async getGameById(req: Request, res: Response) {
    try {
      const { gameId } = req.params;

      // Usar métodos reales de base de datos
      const game = await GameService.getGameById(gameId);

      if (!game) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          error: 'Juego no encontrado',
        });
      }

      return res.status(HTTP_STATUS.OK).json({
        message: 'Juego obtenido exitosamente',
        game,
      });
    } catch (error) {
      logger.error('Error getting game by ID:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  }

  // POST /api/games
  static async createGame(req: Request, res: Response) {
    try {
      const { title, description, maxPlayers, cardPrice, scheduledAt } = req.body;

      // Solo administradores pueden crear juegos
      if (req.user?.role !== 'ADMIN') {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          error: 'Solo los administradores pueden crear juegos',
        });
      }

      // Usar método real para crear en base de datos  
      const game = await GameService.createGame({
        title,
        description,
        maxPlayers: parseInt(maxPlayers),
        cardPrice: parseFloat(cardPrice),
        scheduledAt: new Date(scheduledAt),
      });

      return res.status(HTTP_STATUS.CREATED).json({
        message: 'Juego creado exitosamente',
        game,
      });
    } catch (error) {
      logger.error('Error creating game:', error);
      
      let message = ERROR_MESSAGES.INTERNAL_ERROR;
      let status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;

      if (error instanceof Error) {
        if (error.message.includes('validation')) {
          message = 'Datos de juego inválidos';
          status = HTTP_STATUS.BAD_REQUEST;
        }
      }

      return res.status(status).json({ error: message });
    }
  }

  // POST /api/games/:gameId/join
  static async joinGame(req: Request, res: Response) {
    try {
      const { gameId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: ERROR_MESSAGES.UNAUTHORIZED,
        });
      }

      // Usar métodos mock temporalmente para desarrollo
      await GameService.joinGameMock(userId, gameId);

      return res.status(HTTP_STATUS.OK).json({
        message: 'Te has unido al juego exitosamente',
      });
    } catch (error) {
      logger.error('Error joining game:', error);
      
      let message = ERROR_MESSAGES.INTERNAL_ERROR;
      let status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;

      if (error instanceof Error) {
        if (error.message.includes('no encontrado')) {
          message = 'Juego no encontrado';
          status = HTTP_STATUS.NOT_FOUND;
        } else if (error.message.includes('no está disponible')) {
          message = 'El juego no está disponible para inscripciones';
          status = HTTP_STATUS.BAD_REQUEST;
        } else if (error.message.includes('está lleno')) {
          message = 'El juego está lleno';
          status = HTTP_STATUS.CONFLICT;
        } else if (error.message.includes('ya está inscrito')) {
          message = 'Ya estás inscrito en este juego';
          status = HTTP_STATUS.CONFLICT;
        }
      }

      return res.status(status).json({ error: message });
    }
  }

  // POST /api/games/:gameId/start
  static async startGame(req: Request, res: Response) {
    try {
      const { gameId } = req.params;

      // Solo administradores pueden iniciar juegos
      if (req.user?.role !== 'ADMIN') {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          error: 'Solo los administradores pueden iniciar juegos',
        });
      }

      const game = await GameService.startGame(gameId);

      return res.status(HTTP_STATUS.OK).json({
        message: 'Juego iniciado exitosamente',
        game,
      });
    } catch (error) {
      logger.error('Error starting game:', error);
      
      let message = ERROR_MESSAGES.INTERNAL_ERROR;
      let status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;

      if (error instanceof Error) {
        if (error.message.includes('no encontrado')) {
          message = 'Juego no encontrado';
          status = HTTP_STATUS.NOT_FOUND;
        } else if (error.message.includes('no puede ser iniciado')) {
          message = 'El juego no puede ser iniciado en su estado actual';
          status = HTTP_STATUS.BAD_REQUEST;
        }
      }

      return res.status(status).json({ error: message });
    }
  }

  // POST /api/games/:gameId/draw-ball
  static async drawBall(req: Request, res: Response) {
    try {
      const { gameId } = req.params;

      // Solo administradores pueden sortear bolas
      if (req.user?.role !== 'ADMIN') {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          error: 'Solo los administradores pueden sortear bolas',
        });
      }

      const result = await GameService.drawBall(gameId);

      return res.status(HTTP_STATUS.OK).json({
        message: `Bola ${result.ball} sorteada`,
        ball: result.ball,
        game: result.gameData,
        winners: result.winners,
      });
    } catch (error) {
      logger.error('Error drawing ball:', error);
      
      let message = ERROR_MESSAGES.INTERNAL_ERROR;
      let status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;

      if (error instanceof Error) {
        if (error.message.includes('no encontrado')) {
          message = 'Juego no encontrado';
          status = HTTP_STATUS.NOT_FOUND;
        } else if (error.message.includes('no está en progreso')) {
          message = 'El juego no está en progreso';
          status = HTTP_STATUS.BAD_REQUEST;
        } else if (error.message.includes('ya han sido sorteadas')) {
          message = 'Todas las bolas ya han sido sorteadas';
          status = HTTP_STATUS.BAD_REQUEST;
        }
      }

      return res.status(status).json({ error: message });
    }
  }

  // POST /api/games/:gameId/end
  static async endGame(req: Request, res: Response) {
    try {
      const { gameId } = req.params;

      // Solo administradores pueden finalizar juegos
      if (req.user?.role !== 'ADMIN') {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          error: 'Solo los administradores pueden finalizar juegos',
        });
      }

      const game = await GameService.endGame(gameId);

      return res.status(HTTP_STATUS.OK).json({
        message: 'Juego finalizado exitosamente',
        game,
      });
    } catch (error) {
      logger.error('Error ending game:', error);
      
      let message = ERROR_MESSAGES.INTERNAL_ERROR;
      let status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;

      if (error instanceof Error) {
        if (error.message.includes('no encontrado')) {
          message = 'Juego no encontrado';
          status = HTTP_STATUS.NOT_FOUND;
        }
      }

      return res.status(status).json({ error: message });
    }
  }

  // GET /api/games/dashboard/stats - Obtener estadísticas del dashboard
  static async getDashboardStats(req: Request, res: Response) {
    try {
      const stats = await GameService.getDashboardStatsMock();

      return res.status(HTTP_STATUS.OK).json({
        message: 'Estadísticas obtenidas exitosamente',
        ...stats,
      });
    } catch (error) {
      logger.error('Error getting dashboard stats:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  }

  // POST /api/games/:gameId/start-demo
  static async startDemo(req: Request, res: Response) {
    try {
      const { gameId } = req.params;

      logger.info(`🎮 Iniciando demo automático para juego ${gameId}`);

      // Usar método mock para iniciar demo
      const result = await GameService.startDemoMock(gameId);

      return res.status(HTTP_STATUS.OK).json({
        message: 'Demo iniciado exitosamente',
        ...result,
      });
    } catch (error) {
      logger.error('Error starting demo:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  }

  // POST /api/games/:gameId/stop-demo
  static async stopDemo(req: Request, res: Response) {
    try {
      const { gameId } = req.params;

      logger.info(`🛑 Deteniendo demo automático para juego ${gameId}`);

      // Usar método mock para detener demo
      const result = await GameService.stopDemoMock(gameId);

      return res.status(HTTP_STATUS.OK).json({
        message: 'Demo detenido exitosamente',
        ...result,
      });
    } catch (error) {
      logger.error('Error stopping demo:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  }

  // POST /api/games/:gameId/announce-bingo
  static async announceBingo(req: Request, res: Response) {
    try {
      const { gameId } = req.params;
      const { cardId } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: ERROR_MESSAGES.UNAUTHORIZED,
        });
      }

      if (!cardId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'ID del cartón es requerido',
        });
      }

      logger.info(`🎉 Usuario ${userId} anuncia BINGO en cartón ${cardId} para juego ${gameId}`);

      // Validar BINGO
      const bingoResult = await GameService.announceBingo(gameId, cardId, userId);

      if (!bingoResult.isValid) {
        return res.status(HTTP_STATUS.OK).json({
          success: false,
          message: bingoResult.message,
          isValid: false,
          card: bingoResult.card,
        });
      }

      // BINGO VÁLIDO - Calcular y otorgar premio en Perlas
      try {
        const game = await GameService.getGameById(gameId);
        if (!game) {
          throw new Error('Juego no encontrado para calcular premio');
        }

        // Calcular premio basado en el patrón y pozo del juego
        const prizeAmount = GameController.calculatePrizeAmount(
          bingoResult.winningPattern!,
          game.totalPrize,
          game.cardPrice
        );

        logger.info(`💰 Calculando premio: patrón=${bingoResult.winningPattern}, monto=${prizeAmount} Perlas`);

        // Otorgar premio en Perlas
        const prizeResult = await GamePurchaseService.awardPrizeInPearls(
          userId,
          gameId,
          prizeAmount,
          bingoResult.winningPattern!
        );

        // Emitir notificación Socket.IO para actualización de balance
        try {
          const io = (global as any).socketIO;
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

            logger.info('Socket.IO notifications sent', { userId, prizeAmount, newBalance: prizeResult.newBalance });
          }
        } catch (socketError) {
          logger.warn('Error sending Socket.IO notifications', socketError);
        }

        return res.status(HTTP_STATUS.OK).json({
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

      } catch (prizeError) {
        logger.error('Error otorgando premio en Perlas', prizeError as Error, {
          userId,
          gameId,
          cardId,
          pattern: bingoResult.winningPattern
        });

        // BINGO válido pero error en premio - informar al usuario
        return res.status(HTTP_STATUS.OK).json({
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

    } catch (error) {
      logger.error('Error processing BINGO announcement:', error);
      
      let message = ERROR_MESSAGES.INTERNAL_ERROR;
      let status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;

      if (error instanceof Error) {
        if (error.message.includes('no encontrado')) {
          message = error.message;
          status = HTTP_STATUS.NOT_FOUND;
        } else if (error.message.includes('no está en progreso')) {
          message = 'El juego no está en progreso';
          status = HTTP_STATUS.BAD_REQUEST;
        } else if (error.message.includes('no pertenece')) {
          message = 'El cartón no pertenece al usuario';
          status = HTTP_STATUS.FORBIDDEN;
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
  private static calculatePrizeAmount(
    pattern: string,
    totalPrize: number,
    cardPrice: number
  ): number {
    // Multiplicadores por tipo de patrón
    const patternMultipliers: { [key: string]: number } = {
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

export default GameController;