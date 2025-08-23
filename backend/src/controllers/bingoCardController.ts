import { Request, Response } from 'express';
import { BingoCardService } from '@/services/bingoCardService';
import { PatternService } from '@/services/patternService';
import { GamePurchaseService } from '@/services/gamePurchaseService';
import { HTTP_STATUS, ERROR_MESSAGES } from '@/utils/constants';
import { logger } from '@/utils/logger';
import { prisma } from '@/config/database';

export class BingoCardController {
  // POST /api/cards/generate
  static async generateCards(req: Request, res: Response) {
    try {
      const { gameId, count = 1 } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: ERROR_MESSAGES.UNAUTHORIZED,
        });
      }

      if (!gameId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'ID del juego es requerido',
        });
      }

      const cardCount = parseInt(count);
      if (cardCount < 1 || cardCount > 50) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'La cantidad de cartones debe ser entre 1 y 50 por compra',
        });
      }

      // INTEGRACIÓN PERLAS: Usar el servicio de compra con Perlas
      const result = await GamePurchaseService.purchaseCardsWithPearls(
        userId,
        gameId,
        cardCount
      );

      return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: `${cardCount} cartón${cardCount > 1 ? 'es' : ''} generado${cardCount > 1 ? 's' : ''} y pagado${cardCount > 1 ? 's' : ''} con ${result.transaction.amount} Perlas`,
        cards: result.cards,
        count: result.cards.length,
        transaction: {
          id: result.transaction.id,
          amount: result.transaction.amount,
          description: result.transaction.description,
          timestamp: result.transaction.timestamp
        },
        wallet: {
          newBalance: result.newBalance,
          pearlsUsed: result.transaction.amount
        },
        game: result.gameInfo
      });
    } catch (error) {
      logger.error('Error generating cards with Pearls:', error);
      
      let message = ERROR_MESSAGES.INTERNAL_ERROR;
      let status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;

      if (error instanceof Error) {
        if (error.message.includes('cantidad de cartones')) {
          message = error.message;
          status = HTTP_STATUS.BAD_REQUEST;
        } else if (error.message.includes('no encontrado')) {
          message = error.message;
          status = HTTP_STATUS.NOT_FOUND;
        } else if (error.message.includes('no está disponible') || 
                   error.message.includes('está lleno')) {
          message = error.message;
          status = HTTP_STATUS.BAD_REQUEST;
        } else if (error.message.includes('Billetera') || 
                   error.message.includes('suspendida') ||
                   error.message.includes('Saldo insuficiente')) {
          message = error.message;
          status = HTTP_STATUS.BAD_REQUEST;
        } else if (error.message.includes('más de 3 cartones')) {
          message = error.message;
          status = HTTP_STATUS.CONFLICT;
        }
      }

      return res.status(status).json({ 
        success: false,
        error: message 
      });
    }
  }

  // GET /api/cards/user/:userId/game/:gameId
  static async getUserCards(req: Request, res: Response) {
    try {
      const { userId, gameId } = req.params;
      const currentUserId = req.user?.userId;
      const isAdmin = req.user?.role === 'ADMIN';

      // Verificar permisos: solo el propio usuario o admin pueden ver los cartones
      if (currentUserId !== userId && !isAdmin) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          error: 'No tienes permisos para ver estos cartones',
        });
      }

      // INTEGRACIÓN PERLAS: Usar el servicio real con información de compras
      const cards = await BingoCardService.getUserCards(userId!, gameId);
      const purchaseHistory = await GamePurchaseService.getUserGamePurchases(userId!, gameId);

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Cartones obtenidos exitosamente',
        cards,
        count: cards.length,
        purchaseHistory: {
          transactions: purchaseHistory.purchases,
          totalSpent: purchaseHistory.purchases.reduce((sum, purchase) => sum + purchase.amount, 0),
          totalTransactions: purchaseHistory.purchases.length
        }
      });
    } catch (error) {
      logger.error('Error getting user cards:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  }

  // GET /api/cards/my/:gameId
  static async getMyCards(req: Request, res: Response) {
    try {
      const { gameId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: ERROR_MESSAGES.UNAUTHORIZED,
        });
      }

      // INTEGRACIÓN PERLAS: Usar el servicio real con información de compras
      const cards = await BingoCardService.getUserCards(userId!, gameId);
      const purchaseHistory = await GamePurchaseService.getUserGamePurchases(userId!, gameId);

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Tus cartones obtenidos exitosamente',
        cards,
        count: cards.length,
        purchaseHistory: {
          transactions: purchaseHistory.purchases,
          totalSpent: purchaseHistory.purchases.reduce((sum, purchase) => sum + purchase.amount, 0),
          totalTransactions: purchaseHistory.purchases.length
        },
        gameInfo: cards.length > 0 ? {
          gameId,
          activeCards: cards.filter(card => card.isActive).length,
          winningCards: cards.filter(card => card.isWinner).length
        } : null
      });
    } catch (error) {
      logger.error('Error getting my cards:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  }

  // GET /api/cards/my-all - Obtener todos mis cartones agrupados por juego
  static async getMyAllCards(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: ERROR_MESSAGES.UNAUTHORIZED,
        });
      }

      // Obtener todos los cartones del usuario
      const allCards = await prisma.bingoCard.findMany({
        where: {
          userId,
          isActive: true
        },
        include: {
          game: {
            select: {
              id: true,
              title: true,
              cardPrice: true,
              status: true,
              scheduledAt: true,
              totalPrize: true,
              maxPlayers: true,
              description: true,
              _count: {
                select: { participants: true }
              }
            }
          },
          numbers: {
            orderBy: {
              position: 'asc'
            }
          }
        }
      });

      // Agrupar cartones por juego
      const cardsGroupedByGame = allCards.reduce((acc, card) => {
        const gameId = card.gameId;
        if (!acc[gameId]) {
          acc[gameId] = {
            game: {
              id: card.game.id,
              title: card.game.title,
              cardPrice: parseFloat(card.game.cardPrice.toString()),
              status: card.game.status,
              scheduledAt: card.game.scheduledAt.toISOString(),
              totalPrize: parseFloat(card.game.totalPrize.toString()),
              participantCount: card.game._count.participants,
              maxPlayers: card.game.maxPlayers,
              description: card.game.description
            },
            userCards: []
          };
        }

        acc[gameId].userCards.push({
          id: card.id,
          cardNumber: card.cardNumber,
          gameId: card.gameId,
          isActive: card.isActive,
          isWinner: card.isWinner,
          winningPattern: card.winningPattern,
          createdAt: card.createdAt.toISOString(),
          numbers: card.numbers
        });

        return acc;
      }, {} as any);

      // Convertir a array y calcular totales
      const gamesWithCards = Object.values(cardsGroupedByGame).map((gameData: any) => ({
        ...gameData.game,
        userCards: gameData.userCards,
        totalCards: gameData.userCards.length
      }));

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Todos tus cartones obtenidos exitosamente',
        games: gamesWithCards,
        totalGames: gamesWithCards.length,
        totalCards: allCards.length
      });
    } catch (error) {
      logger.error('Error getting all my cards:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  }

  // PUT /api/cards/:cardId/mark
  static async markNumber(req: Request, res: Response) {
    try {
      const { cardId } = req.params;
      const { number } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: ERROR_MESSAGES.UNAUTHORIZED,
        });
      }

      if (!number || typeof number !== 'number') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Número válido es requerido',
        });
      }

      if (number < 1 || number > 75) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'El número debe estar entre 1 y 75',
        });
      }

      // Usar métodos mock temporalmente para desarrollo
      const result = await BingoCardService.markNumberMock(cardId!, number);

      // Los patrones ya están incluidos en el resultado mock
      const winningPatterns = result.winningPattern ? [result.winningPattern] : [];
      
      let responseMessage = `Número ${number} marcado exitosamente`;
      if (winningPatterns.length > 0) {
        responseMessage += ` - ¡BINGO! Patrones ganadores: ${winningPatterns.join(', ')}`;
      }

      return res.status(HTTP_STATUS.OK).json({
        message: responseMessage,
        card: result,
        winningPatterns,
        isWinner: result.hasWon,
      });
    } catch (error) {
      logger.error('Error marking number:', error);
      
      let message = ERROR_MESSAGES.INTERNAL_ERROR;
      let status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;

      if (error instanceof Error) {
        if (error.message.includes('no encontrado')) {
          message = 'Cartón no encontrado';
          status = HTTP_STATUS.NOT_FOUND;
        } else if (error.message.includes('inactivo')) {
          message = 'Cartón inactivo';
          status = HTTP_STATUS.BAD_REQUEST;
        } else if (error.message.includes('no está en progreso')) {
          message = 'El juego no está en progreso';
          status = HTTP_STATUS.BAD_REQUEST;
        } else if (error.message.includes('no encontrado en este cartón')) {
          message = 'Número no encontrado en este cartón';
          status = HTTP_STATUS.BAD_REQUEST;
        } else if (error.message.includes('ya marcado')) {
          message = 'Número ya marcado';
          status = HTTP_STATUS.CONFLICT;
        }
      }

      return res.status(status).json({ error: message });
    }
  }

  // GET /api/cards/:cardId/patterns
  static async getCardPatterns(req: Request, res: Response) {
    try {
      const { cardId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: ERROR_MESSAGES.UNAUTHORIZED,
        });
      }

      // Usar métodos mock temporalmente para desarrollo
      const patternsResult = await BingoCardService.getCardPatternsMock(cardId);

      return res.status(HTTP_STATUS.OK).json({
        message: 'Patrones del cartón obtenidos exitosamente',
        ...patternsResult,
        linePatterns: PatternService.getLinePatterns(),
        specialPatterns: PatternService.getSpecialPatterns(),
      });
    } catch (error) {
      logger.error('Error getting card patterns:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  }

  // POST /api/cards/validate
  static async validateCard(req: Request, res: Response) {
    try {
      const { cardNumbers } = req.body;

      if (!cardNumbers || !Array.isArray(cardNumbers)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Números del cartón son requeridos',
        });
      }

      // Usar métodos mock temporalmente para desarrollo
      const validationResult = await BingoCardService.validateCardMock(cardNumbers);

      return res.status(HTTP_STATUS.OK).json({
        message: 'Validación completada',
        ...validationResult,
        details: {
          hasCorrectSize: cardNumbers.length === 25,
          hasValidFreeCell: cardNumbers.some(cell => 
            cell.position === 12 && cell.isFree && cell.number === null
          ),
          hasValidRanges: validationResult.isValid,
          hasUniqueNumbers: validationResult.isValid,
        }
      });
    } catch (error) {
      logger.error('Error validating card:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  }

  // DELETE /api/cards/:cardId
  static async deleteCard(req: Request, res: Response) {
    try {
      const { cardId } = req.params;
      const userId = req.user?.userId;
      const isAdmin = req.user?.role === 'ADMIN';

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: ERROR_MESSAGES.UNAUTHORIZED,
        });
      }

      // Verificar que el cartón existe y pertenece al usuario (o es admin)
      const whereCondition = isAdmin 
        ? { id: cardId, isActive: true } 
        : { id: cardId, userId, isActive: true };

      const card = await prisma.bingoCard.findFirst({
        where: whereCondition
      });

      if (!card) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          error: 'Cartón no encontrado',
        });
      }

      // Desactivar el cartón en lugar de eliminarlo (para mantener historial)
      await prisma.bingoCard.update({
        where: { id: cardId },
        data: { isActive: false }
      });

      return res.status(HTTP_STATUS.OK).json({
        message: 'Cartón eliminado exitosamente',
      });
    } catch (error) {
      logger.error('Error deleting card:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  }
}

export default BingoCardController;