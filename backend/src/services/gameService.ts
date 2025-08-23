import { prisma } from '@/config/database';
import { gameLogger, logUtils } from '@/utils/structuredLogger';
import { GameData, GameStatus, BingoCardData } from '@/types/game';
import { PatternService } from './patternService';
import { BingoCardService } from './bingoCardService';
import { mockGames, mockDashboardStats } from '@/utils/mockData';

export class GameService {
  /**
   * Obtiene todos los juegos disponibles
   */
  static async getAllGames(status?: GameStatus): Promise<GameData[]> {
    try {
      const games = await prisma.game.findMany({
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
        status: game.status as GameStatus,
        scheduledAt: game.scheduledAt.toISOString(),
        startedAt: game.startedAt?.toISOString(),
        endedAt: game.endedAt?.toISOString(),
        ballsDrawn: JSON.parse(game.ballsDrawn),
        currentBall: game.currentBall || undefined,
        winningCards: JSON.parse(game.winningCards),
        participantCount: game._count?.participants || 0,
        createdAt: game.createdAt.toISOString(),
        updatedAt: game.updatedAt.toISOString(),
      }));

    } catch (error) {
      gameLogger.error('Error getting games', error as Error, { status });
      throw error;
    }
  }

  /**
   * Obtiene un juego específico por ID
   */
  static async getGameById(gameId: string): Promise<GameData | null> {
    try {
      const game = await prisma.game.findUnique({
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
        status: game.status as GameStatus,
        scheduledAt: game.scheduledAt.toISOString(),
        startedAt: game.startedAt?.toISOString(),
        endedAt: game.endedAt?.toISOString(),
        ballsDrawn: JSON.parse(game.ballsDrawn),
        currentBall: game.currentBall || undefined,
        winningCards: JSON.parse(game.winningCards),
        participantCount: game._count?.participants || 0,
        createdAt: game.createdAt.toISOString(),
        updatedAt: game.updatedAt.toISOString(),
      };

    } catch (error) {
      gameLogger.error('Error getting game by ID', error as Error, { gameId });
      throw error;
    }
  }

  /**
   * Crea un nuevo juego
   */
  static async createGame(gameData: {
    title: string;
    description?: string;
    maxPlayers: number;
    cardPrice: number;
    scheduledAt: Date;
  }): Promise<GameData> {
    try {
      const game = await prisma.game.create({
        data: {
          title: gameData.title,
          description: gameData.description,
          maxPlayers: gameData.maxPlayers,
          cardPrice: gameData.cardPrice,
          scheduledAt: gameData.scheduledAt,
          status: GameStatus.SCHEDULED,
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

      logUtils.gameCreated(game.id, 'system', {
        title: game.title,
        maxPlayers: game.maxPlayers,
        cardPrice: game.cardPrice,
        scheduledAt: game.scheduledAt
      });

      return {
        id: game.id,
        title: game.title,
        description: game.description ?? undefined,
        maxPlayers: game.maxPlayers,
        cardPrice: parseFloat(game.cardPrice.toString()),
        totalPrize: parseFloat(game.totalPrize.toString()),
        status: game.status as GameStatus,
        scheduledAt: game.scheduledAt.toISOString(),
        startedAt: game.startedAt?.toISOString(),
        endedAt: game.endedAt?.toISOString(),
        ballsDrawn: JSON.parse(game.ballsDrawn),
        currentBall: game.currentBall || undefined,
        winningCards: JSON.parse(game.winningCards),
        participantCount: game._count?.participants || 0,
        createdAt: game.createdAt.toISOString(),
        updatedAt: game.updatedAt.toISOString(),
      };

    } catch (error) {
      gameLogger.error('Error creating game', error as Error, gameData);
      throw error;
    }
  }

  /**
   * Inscribe un usuario en un juego
   */
  static async joinGame(userId: string, gameId: string): Promise<void> {
    try {
      // Verificar que el juego existe y está disponible
      const game = await this.getGameById(gameId);
      if (!game) {
        throw new Error('Juego no encontrado');
      }

      if (game.status !== GameStatus.OPEN && game.status !== GameStatus.SCHEDULED) {
        throw new Error('El juego no está disponible para inscripciones');
      }

      if (game.participantCount! >= game.maxPlayers) {
        throw new Error('El juego está lleno');
      }

      // Verificar si el usuario ya está inscrito
      const existingParticipant = await prisma.gameParticipant.findUnique({
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
      await prisma.gameParticipant.create({
        data: {
          userId,
          gameId,
          cardsCount: 0,
          totalSpent: 0,
        }
      });

      // Obtener conteo actualizado de participantes
      const participantCount = await prisma.gameParticipant.count({
        where: { gameId }
      });
      logUtils.playerJoined(gameId, userId, participantCount);

    } catch (error) {
      gameLogger.error('Error joining game', error as Error, { gameId, userId });
      throw error;
    }
  }

  /**
   * Inicia un juego
   */
  static async startGame(gameId: string): Promise<GameData> {
    try {
      const game = await prisma.game.findUnique({
        where: { id: gameId }
      });

      if (!game) {
        throw new Error('Juego no encontrado');
      }

      if (game.status !== GameStatus.OPEN && game.status !== GameStatus.SCHEDULED) {
        throw new Error('El juego no puede ser iniciado');
      }

      const updatedGame = await prisma.game.update({
        where: { id: gameId },
        data: {
          status: GameStatus.IN_PROGRESS,
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

      gameLogger.business('game_started', { gameId, participantCount: updatedGame._count?.participants || 0 }, { gameId });

      return {
        id: updatedGame.id,
        title: updatedGame.title,
        description: updatedGame.description || undefined,
        maxPlayers: updatedGame.maxPlayers,
        cardPrice: parseFloat(updatedGame.cardPrice.toString()),
        totalPrize: parseFloat(updatedGame.totalPrize.toString()),
        status: updatedGame.status as GameStatus,
        scheduledAt: updatedGame.scheduledAt.toISOString(),
        startedAt: updatedGame.startedAt?.toISOString(),
        endedAt: updatedGame.endedAt?.toISOString(),
        ballsDrawn: JSON.parse(updatedGame.ballsDrawn) as number[],
        currentBall: updatedGame.currentBall || undefined,
        winningCards: JSON.parse(updatedGame.winningCards) as string[],
        participantCount: updatedGame._count?.participants || 0,
        createdAt: updatedGame.createdAt.toISOString(),
        updatedAt: updatedGame.updatedAt.toISOString(),
      };

    } catch (error) {
      gameLogger.error('Error starting game', error as Error, { gameId });
      throw error;
    }
  }

  /**
   * Sortea una bola en el juego
   */
  static async drawBall(gameId: string): Promise<{
    ball: number;
    gameData: GameData;
    winners?: { cardId: string; userId: string; patterns: string[] }[];
  }> {
    try {
      const game = await prisma.game.findUnique({
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

      if (game.status !== GameStatus.IN_PROGRESS) {
        throw new Error('El juego no está en progreso');
      }

      // Obtener números disponibles para sortear (1-75 menos los ya sorteados)
      const currentBallsDrawn = JSON.parse(game.ballsDrawn) as number[];
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
      
      const updatedGame = await prisma.game.update({
        where: { id: gameId },
        data: {
          ballsDrawn: JSON.stringify(updatedBallsDrawn),
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

      // BINGO TRADICIONAL: NO hay marcado automático
      // Los jugadores deben marcar manualmente sus cartones
      // La verificación de ganadores se hace solo cuando alguien anuncia BINGO

      const winners: { cardId: string; userId: string; patterns: string[] }[] = [];

      gameLogger.business('ball_drawn', {
        ball: drawnBall,
        winnersCount: winners.length
      }, { gameId });

      const gameData: GameData = {
        id: updatedGame.id,
        title: updatedGame.title,
        description: updatedGame.description || undefined,
        maxPlayers: updatedGame.maxPlayers,
        cardPrice: parseFloat(updatedGame.cardPrice.toString()),
        totalPrize: parseFloat(updatedGame.totalPrize.toString()),
        status: updatedGame.status as GameStatus,
        scheduledAt: updatedGame.scheduledAt.toISOString(),
        startedAt: updatedGame.startedAt?.toISOString(),
        endedAt: updatedGame.endedAt?.toISOString(),
        ballsDrawn: JSON.parse(updatedGame.ballsDrawn) as number[],
        currentBall: updatedGame.currentBall || undefined,
        winningCards: JSON.parse(updatedGame.winningCards) as string[],
        participantCount: updatedGame._count?.participants || 0,
        createdAt: updatedGame.createdAt.toISOString(),
        updatedAt: updatedGame.updatedAt.toISOString(),
      };

      return {
        ball: drawnBall,
        gameData,
        winners: winners.length > 0 ? winners : undefined
      };

    } catch (error) {
      gameLogger.error('Error drawing ball', error as Error, { gameId });
      throw error;
    }
  }

  /**
   * DEPRECATED: Marca automáticamente un número en todos los cartones activos del juego
   * Ya no se usa en el modo BINGO TRADICIONAL - mantenido solo como referencia
   */
  private static async autoMarkNumber(gameId: string, number: number): Promise<void> {
    try {
      // Obtener todos los números de cartones que coincidan con el número sorteado
      const cardNumbers = await prisma.cardNumber.findMany({
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
        await prisma.cardNumber.update({
          where: { id: cardNumber.id },
          data: { isMarked: true }
        });

        // Actualizar el array de números marcados en el cartón
        const currentMarkedNumbers = JSON.parse(cardNumber.card.markedNumbers) as number[];
        const updatedMarkedNumbers = [...currentMarkedNumbers, number];
        
        await prisma.bingoCard.update({
          where: { id: cardNumber.card.id },
          data: { markedNumbers: JSON.stringify(updatedMarkedNumbers) }
        });
      }

      gameLogger.business('auto_mark_numbers', {
        number,
        cardsMarked: cardNumbers.length
      }, { gameId });

    } catch (error) {
      gameLogger.error('Error auto-marking number', error as Error, { gameId, number });
      throw error;
    }
  }

  /**
   * Verifica y procesa un anuncio de BINGO manual
   */
  static async announceBingo(gameId: string, cardId: string, userId: string): Promise<{
    isValid: boolean;
    message: string;
    card?: BingoCardData;
    winningPattern?: string;
  }> {
    try {
      // Verificar que el juego está en progreso
      const game = await prisma.game.findUnique({
        where: { id: gameId }
      });

      if (!game) {
        throw new Error('Juego no encontrado');
      }

      if (game.status !== GameStatus.IN_PROGRESS) {
        throw new Error('El juego no está en progreso');
      }

      // Obtener el cartón del usuario
      const card = await prisma.bingoCard.findFirst({
        where: {
          id: cardId,
          userId: userId,
          gameId: gameId,
          isActive: true
        },
        include: {
          numbers: {
            orderBy: { position: 'asc' }
          }
        }
      });

      if (!card) {
        throw new Error('Cartón no encontrado o no pertenece al usuario');
      }

      // Convertir a formato de servicio
      const cardData: BingoCardData = {
        id: card.id,
        cardNumber: card.cardNumber,
        userId: card.userId,
        gameId: card.gameId,
        isActive: card.isActive,
        markedNumbers: JSON.parse(card.markedNumbers) as number[],
        isWinner: card.isWinner,
        winningPattern: card.winningPattern ?? undefined,
        numbers: card.numbers.map(num => ({
          id: num.id,
          position: num.position,
          column: num.column as 'B' | 'I' | 'N' | 'G' | 'O',
          number: num.number,
          isMarked: num.isMarked,
          isFree: num.isFree,
        })),
        createdAt: card.createdAt.toISOString(),
        updatedAt: card.updatedAt.toISOString(),
      };

      // Verificar patrones ganadores
      const { winners } = PatternService.checkForWinners([cardData]);
      
      if (winners.length > 0 && winners[0].patterns.length > 0) {
        // BINGO VÁLIDO! Marcar cartón como ganador
        const winningPattern = winners[0].patterns[0]; // Tomar el primer patrón ganador
        
        await prisma.bingoCard.update({
          where: { id: cardId },
          data: {
            isWinner: true,
            winningPattern: winningPattern
          }
        });

        // Agregar a la lista de cartones ganadores del juego
        const currentWinningCards = JSON.parse(game.winningCards) as string[];
        if (!currentWinningCards.includes(cardId)) {
          await prisma.game.update({
            where: { id: gameId },
            data: {
              winningCards: JSON.stringify([...currentWinningCards, cardId])
            }
          });
        }

        gameLogger.business('bingo_announced_valid', {
          cardId,
          userId,
          pattern: winningPattern
        }, { gameId });

        return {
          isValid: true,
          message: '¡BINGO VÁLIDO! ¡Felicitaciones!',
          card: cardData,
          winningPattern
        };

      } else {
        // BINGO INVÁLIDO - penalizar (opcional)
        gameLogger.business('bingo_announced_invalid', {
          cardId,
          userId
        }, { gameId });

        return {
          isValid: false,
          message: 'BINGO inválido. El cartón no tiene un patrón ganador completo.',
          card: cardData
        };
      }

    } catch (error) {
      gameLogger.error('Error processing BINGO announcement', error as Error, { gameId, cardId, userId });
      throw error;
    }
  }

  /**
   * Finaliza un juego
   */
  static async endGame(gameId: string): Promise<GameData> {
    try {
      const updatedGame = await prisma.game.update({
        where: { id: gameId },
        data: {
          status: GameStatus.COMPLETED,
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

      gameLogger.business('game_ended', {
        totalBallsDrawn: updatedGame.ballsDrawn ? JSON.parse(updatedGame.ballsDrawn).length : 0,
        winningCardsCount: updatedGame.winningCards ? JSON.parse(updatedGame.winningCards).length : 0
      }, { gameId });

      return {
        id: updatedGame.id,
        title: updatedGame.title,
        description: updatedGame.description || undefined,
        maxPlayers: updatedGame.maxPlayers,
        cardPrice: parseFloat(updatedGame.cardPrice.toString()),
        totalPrize: parseFloat(updatedGame.totalPrize.toString()),
        status: updatedGame.status as GameStatus,
        scheduledAt: updatedGame.scheduledAt.toISOString(),
        startedAt: updatedGame.startedAt?.toISOString(),
        endedAt: updatedGame.endedAt?.toISOString(),
        ballsDrawn: JSON.parse(updatedGame.ballsDrawn) as number[],
        currentBall: updatedGame.currentBall || undefined,
        winningCards: JSON.parse(updatedGame.winningCards) as string[],
        participantCount: updatedGame._count?.participants || 0,
        createdAt: updatedGame.createdAt.toISOString(),
        updatedAt: updatedGame.updatedAt.toISOString(),
      };

    } catch (error) {
      gameLogger.error('Error ending game', error as Error, { gameId });
      throw error;
    }
  }

  // ============================================================================
  // MÉTODOS MOCK TEMPORALES PARA DESARROLLO SIN BASE DE DATOS
  // ============================================================================
  
  /**
   * MOCK: Obtiene todos los juegos disponibles (versión mock)
   */
  static async getAllGamesMock(status?: GameStatus): Promise<GameData[]> {
    try {
      gameLogger.info('Using mock data for getAllGames', { status });
      
      let filteredGames = mockGames;
      
      if (status) {
        filteredGames = mockGames.filter(game => game.status === status);
      }
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 200));
      
      return filteredGames;
    } catch (error) {
      gameLogger.error('Error getting mock games', error as Error, { status });
      throw error;
    }
  }

  /**
   * MOCK: Obtiene un juego específico por ID (versión mock)
   */
  static async getGameByIdMock(gameId: string): Promise<GameData | null> {
    try {
      gameLogger.info('Using mock data for getGameById', { gameId });
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const game = mockGames.find(g => g.id === gameId);
      return game || null;
    } catch (error) {
      gameLogger.error('Error getting mock game by ID', error as Error, { gameId });
      throw error;
    }
  }

  /**
   * MOCK: Obtiene estadísticas del dashboard
   */
  static async getDashboardStatsMock() {
    try {
      gameLogger.info('Using mock data for dashboard stats');
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return mockDashboardStats;
    } catch (error) {
      gameLogger.error('Error getting mock dashboard stats', error as Error);
      throw error;
    }
  }

  /**
   * MOCK: Crear nuevo juego (versión mock)
   */
  static async createGameMock(gameData: {
    title: string;
    description?: string;
    maxPlayers: number;
    cardPrice: number;
    scheduledAt: Date;
  }): Promise<GameData> {
    try {
      gameLogger.info('Creating mock game', { title: gameData.title });
      
      const newGame: GameData = {
        id: `game-mock-${Date.now()}`,
        title: gameData.title,
        description: gameData.description,
        maxPlayers: gameData.maxPlayers,
        cardPrice: gameData.cardPrice,
        totalPrize: gameData.cardPrice * gameData.maxPlayers,
        status: GameStatus.SCHEDULED,
        scheduledAt: gameData.scheduledAt.toISOString(),
        ballsDrawn: [],
        winningCards: [],
        participantCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Añadir a la lista mock (solo en memoria)
      mockGames.unshift(newGame);
      
      return newGame;
    } catch (error) {
      gameLogger.error('Error creating mock game', error as Error);
      throw error;
    }
  }

  /**
   * MOCK: Unirse a un juego (versión mock)
   */
  static async joinGameMock(userId: string, gameId: string): Promise<void> {
    try {
      gameLogger.info('User joining mock game', { userId, gameId });
      
      const game = mockGames.find(g => g.id === gameId);
      if (!game) {
        throw new Error('Juego no encontrado');
      }

      if (game.status !== GameStatus.OPEN && game.status !== GameStatus.SCHEDULED) {
        throw new Error('El juego no está disponible para inscripciones');
      }

      if (game.participantCount >= game.maxPlayers) {
        throw new Error('El juego está lleno');
      }

      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Incrementar participantes (solo en memoria)
      game.participantCount = (game.participantCount || 0) + 1;
      game.updatedAt = new Date().toISOString();
      
      gameLogger.info('User joined successfully', { participantCount: game.participantCount });
    } catch (error) {
      gameLogger.error('Error joining mock game', error as Error);
      throw error;
    }
  }

  // ============================================================================
  // SISTEMA DE DEMO AUTOMÁTICO CON SOCKET.IO
  // ============================================================================

  // Mapa para almacenar los timers activos de cada juego
  private static demoTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * MOCK: Iniciar demo automático con sorteo de bolas cada 4 segundos
   */
  static async startDemoMock(gameId: string) {
    try {
      gameLogger.info('Starting automatic demo for game', { gameId });

      // Detener demo anterior si existe
      if (this.demoTimers.has(gameId)) {
        clearInterval(this.demoTimers.get(gameId)!);
        this.demoTimers.delete(gameId);
      }

      // Obtener el juego
      const game = mockGames.find(g => g.id === gameId);
      if (!game) {
        throw new Error('Juego no encontrado');
      }

      // Cambiar estado a EN_PROGRESO
      game.status = 'IN_PROGRESS' as any;
      game.ballsDrawn = [];
      game.currentBall = undefined;

      // Números disponibles para sortear (1-75)
      const allNumbers = Array.from({ length: 75 }, (_, i) => i + 1);
      let availableNumbers = [...allNumbers];

      // Función para sortear una bola
      const drawBall = () => {
        if (availableNumbers.length === 0) {
          gameLogger.info('Game completed - all balls drawn', { gameId });
          this.stopDemoMock(gameId);
          return;
        }

        // Sortear número aleatorio
        const randomIndex = Math.floor(Math.random() * availableNumbers.length);
        const drawnBall = availableNumbers[randomIndex];
        
        // Remover de números disponibles
        availableNumbers = availableNumbers.filter(n => n !== drawnBall);
        
        // Actualizar juego
        game.ballsDrawn!.push(drawnBall);
        game.currentBall = drawnBall;

        gameLogger.info('Ball drawn in demo', { gameId, drawnBall, ballsDrawn: game.ballsDrawn!.length });

        // Emitir evento Socket.IO a todos los clientes conectados a este juego
        try {
          // Obtener instancia global de io si está disponible
          const globalThis = require('global');
          const io = globalThis.socketIO;
          
          if (io) {
            io.to(`game-${gameId}`).emit('new-ball-drawn', {
              gameId,
              ball: drawnBall,
              ballsDrawn: game.ballsDrawn,
              timestamp: new Date().toISOString(),
            });

            // Actualizar estado del juego
            io.to(`game-${gameId}`).emit('game-status-updated', {
              gameId,
              status: game.status,
              playerCount: game.participantCount,
              timestamp: new Date().toISOString(),
            });
          }

          // Simular verificación de BINGO (5% de probabilidad por bola)
          if (Math.random() < 0.05 && game.ballsDrawn!.length > 10) {
            const mockWinner = {
              cardId: `card-${gameId}-user-1`,
              gameId,
              pattern: 'LINE_HORIZONTAL_1',
              userId: 'demo-user-1',
            };

            gameLogger.info('BINGO simulated in demo', { gameId });

            if (io) {
              io.to(`game-${gameId}`).emit('bingo-winner', {
                ...mockWinner,
                timestamp: new Date().toISOString(),
              });
            }
          }
        } catch (error) {
          gameLogger.warn('Socket.IO not available for demo', { error });
        }
      };

      // Iniciar timer para sortear bolas cada 4 segundos
      const timer = setInterval(drawBall, 4000);
      this.demoTimers.set(gameId, timer);

      // Sortear primera bola inmediatamente
      setTimeout(drawBall, 1000);

      return {
        gameId,
        status: 'IN_PROGRESS',
        demoStarted: true,
        ballInterval: 4000,
        message: 'Demo iniciado - sorteo automático cada 4 segundos',
      };

    } catch (error) {
      gameLogger.error('Error starting demo:', error);
      throw error;
    }
  }

  /**
   * MOCK: Detener demo automático
   */
  static async stopDemoMock(gameId: string) {
    try {
      gameLogger.info('Stopping automatic demo for game', { gameId });

      // Detener timer si existe
      if (this.demoTimers.has(gameId)) {
        clearInterval(this.demoTimers.get(gameId)!);
        this.demoTimers.delete(gameId);
        gameLogger.info('Timer stopped for game', { gameId });
      }

      // Obtener el juego y cambiar estado
      const game = mockGames.find(g => g.id === gameId);
      if (game) {
        game.status = 'COMPLETED' as any;
        
        // Emitir evento de finalización
        try {
          const globalThis = require('global');
          const io = globalThis.socketIO;
          if (io) {
            io.to(`game-${gameId}`).emit('game-status-updated', {
              gameId,
              status: 'COMPLETED',
              playerCount: game.participantCount,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (error) {
          gameLogger.warn('Socket.IO not available to end demo', { error });
        }
      }

      return {
        gameId,
        status: 'COMPLETED',
        demoStopped: true,
        ballsDrawn: game?.ballsDrawn?.length || 0,
        message: 'Demo detenido exitosamente',
      };

    } catch (error) {
      gameLogger.error('Error stopping demo:', error);
      throw error;
    }
  }

  /**
   * Limpiar todos los demos al reiniciar servidor
   */
  static cleanupAllDemos() {
    gameLogger.info('Cleaning up all active demos');
    this.demoTimers.forEach((timer, gameId) => {
      clearInterval(timer);
      gameLogger.info('Demo stopped', { gameId });
    });
    this.demoTimers.clear();
  }
}

export default GameService;