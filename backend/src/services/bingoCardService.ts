import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { BINGO_CONSTANTS, ColumnLetter, CardNumberData, BingoCardData } from '@/types/game';
import { generateMockBingoCard } from '@/utils/mockData';

export class BingoCardService {
  /**
   * Genera un cartón de bingo único con las reglas del bingo 75
   */
  static generateUniqueCard(): CardNumberData[] {
    const numbers: CardNumberData[] = [];
    const usedNumbers: Set<number> = new Set();

    // Generar números para cada columna
    for (let col = 0; col < BINGO_CONSTANTS.GRID_SIZE; col++) {
      const columnLetter = ['B', 'I', 'N', 'G', 'O'][col] as ColumnLetter;
      const columnConfig = BINGO_CONSTANTS.COLUMNS[columnLetter];
      const columnNumbers: number[] = [];

      // Generar 5 números únicos para esta columna
      while (columnNumbers.length < BINGO_CONSTANTS.GRID_SIZE) {
        const randomNum = Math.floor(Math.random() * (columnConfig.max - columnConfig.min + 1)) + columnConfig.min;
        
        if (!usedNumbers.has(randomNum)) {
          columnNumbers.push(randomNum);
          usedNumbers.add(randomNum);
        }
      }

      // Ordenar números de la columna (opcional, más realista)
      columnNumbers.sort((a, b) => a - b);

      // Crear las celdas para esta columna
      for (let row = 0; row < BINGO_CONSTANTS.GRID_SIZE; row++) {
        const position = row * BINGO_CONSTANTS.GRID_SIZE + col;
        const isFreeCell = position === BINGO_CONSTANTS.FREE_CELL_POSITION;

        numbers.push({
          id: '', // Se asignará cuando se guarde en DB
          position,
          column: columnLetter,
          number: isFreeCell ? null : columnNumbers[row],
          isMarked: isFreeCell, // La casilla libre está marcada por defecto
          isFree: isFreeCell,
        });
      }
    }

    return numbers;
  }

  /**
   * Genera múltiples cartones únicos para un usuario
   */
  static async generateMultipleCards(
    userId: string,
    gameId: string,
    count: number = BINGO_CONSTANTS.MAX_CARDS_PER_USER
  ): Promise<BingoCardData[]> {
    if (count > BINGO_CONSTANTS.MAX_CARDS_PER_USER) {
      throw new Error(`Máximo ${BINGO_CONSTANTS.MAX_CARDS_PER_USER} cartones por usuario`);
    }

    try {
      // Verificar que el juego existe y está abierto
      const game = await prisma.game.findUnique({
        where: { id: gameId },
        include: { bingoCards: true }
      });

      if (!game) {
        throw new Error('Juego no encontrado');
      }

      if (game.status !== 'OPEN' && game.status !== 'SCHEDULED') {
        throw new Error('El juego no está disponible para compra de cartones');
      }

      // Verificar si el usuario ya tiene cartones en este juego
      const existingCards = await prisma.bingoCard.count({
        where: { userId, gameId }
      });

      if (existingCards > 0) {
        throw new Error('El usuario ya tiene cartones en este juego');
      }

      // Obtener el próximo número de cartón
      const maxCardNumber = game.bingoCards.length > 0 
        ? Math.max(...game.bingoCards.map(card => card.cardNumber))
        : 0;

      const cards: BingoCardData[] = [];

      // Generar cartones únicos
      for (let i = 0; i < count; i++) {
        const cardNumbers = this.generateUniqueCard();
        
        // Crear el cartón en la base de datos
        const bingoCard = await prisma.bingoCard.create({
          data: {
            userId,
            gameId,
            cardNumber: maxCardNumber + i + 1,
            numbers: {
              create: cardNumbers.map((number, index) => ({
                position: number.position,
                column: number.column,
                number: number.number,
                isMarked: number.isMarked,
                isFree: number.isFree,
              }))
            }
          },
          include: {
            numbers: {
              orderBy: { position: 'asc' }
            }
          }
        });

        // Convertir a formato de respuesta
        const cardData: BingoCardData = {
          id: bingoCard.id,
          cardNumber: bingoCard.cardNumber,
          userId: bingoCard.userId,
          gameId: bingoCard.gameId,
          isActive: bingoCard.isActive,
          markedNumbers: JSON.parse(bingoCard.markedNumbers) as number[],
          isWinner: bingoCard.isWinner,
          winningPattern: bingoCard.winningPattern || undefined,
          numbers: bingoCard.numbers.map(num => ({
            id: num.id,
            position: num.position,
            column: num.column as ColumnLetter,
            number: num.number,
            isMarked: num.isMarked,
            isFree: num.isFree,
          })),
          createdAt: bingoCard.createdAt.toISOString(),
          updatedAt: bingoCard.updatedAt.toISOString(),
        };

        cards.push(cardData);
      }

      logger.info(`Generated ${count} bingo cards for user ${userId} in game ${gameId}`);
      return cards;

    } catch (error) {
      logger.error('Error generating bingo cards:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los cartones de un usuario para un juego específico
   */
  static async getUserCards(userId: string, gameId: string): Promise<BingoCardData[]> {
    try {
      const whereClause: any = { isActive: true };
      if (userId) whereClause.userId = userId;
      if (gameId) whereClause.gameId = gameId;

      const cards = await prisma.bingoCard.findMany({
        where: whereClause,
        include: {
          numbers: {
            orderBy: { position: 'asc' }
          }
        },
        orderBy: { cardNumber: 'asc' }
      });

      return cards.map(card => ({
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
          column: num.column as ColumnLetter,
          number: num.number,
          isMarked: num.isMarked,
          isFree: num.isFree,
        })),
        createdAt: card.createdAt.toISOString(),
        updatedAt: card.updatedAt.toISOString(),
      }));

    } catch (error) {
      logger.error('Error getting user cards:', error);
      throw error;
    }
  }

  /**
   * Marca un número en un cartón específico - BINGO TRADICIONAL
   * Permite marcado manual de cualquier número en el cartón, independiente de si fue cantado
   */
  static async markNumber(cardId: string, number: number): Promise<BingoCardData> {
    try {
      // Buscar el cartón y verificar que el número existe
      const card = await prisma.bingoCard.findUnique({
        where: { id: cardId },
        include: {
          numbers: true,
          game: true
        }
      });

      if (!card) {
        throw new Error('Cartón no encontrado');
      }

      if (!card.isActive) {
        throw new Error('Cartón inactivo');
      }

      // Verificar que el juego esté en progreso
      if (card.game.status !== 'IN_PROGRESS') {
        throw new Error('El juego no está en progreso');
      }

      // Buscar el número en el cartón
      const cardNumber = card.numbers.find(num => num.number === number);
      if (!cardNumber) {
        throw new Error('Número no encontrado en este cartón');
      }

      if (cardNumber.isMarked) {
        throw new Error('Número ya marcado');
      }

      // Marcar el número
      await prisma.cardNumber.update({
        where: { id: cardNumber.id },
        data: { isMarked: true }
      });

      // Actualizar el array de números marcados en el cartón
      const currentMarkedNumbers = JSON.parse(card.markedNumbers) as number[];
      const updatedMarkedNumbers = [...currentMarkedNumbers, number];
      await prisma.bingoCard.update({
        where: { id: cardId },
        data: { markedNumbers: JSON.stringify(updatedMarkedNumbers) }
      });

      // Obtener el cartón actualizado
      const updatedCard = await prisma.bingoCard.findUnique({
        where: { id: cardId },
        include: {
          numbers: {
            orderBy: { position: 'asc' }
          }
        }
      });

      if (!updatedCard) {
        throw new Error('Error al obtener cartón actualizado');
      }

      logger.info(`Number ${number} marked on card ${cardId}`);

      return {
        id: updatedCard.id,
        cardNumber: updatedCard.cardNumber,
        userId: updatedCard.userId,
        gameId: updatedCard.gameId,
        isActive: updatedCard.isActive,
        markedNumbers: JSON.parse(updatedCard.markedNumbers) as number[],
        isWinner: updatedCard.isWinner,
        winningPattern: updatedCard.winningPattern ?? undefined,
        numbers: updatedCard.numbers.map(num => ({
          id: num.id,
          position: num.position,
          column: num.column as ColumnLetter,
          number: num.number,
          isMarked: num.isMarked,
          isFree: num.isFree,
        })),
        createdAt: updatedCard.createdAt.toISOString(),
        updatedAt: updatedCard.updatedAt.toISOString(),
      };

    } catch (error) {
      logger.error('Error marking number:', error);
      throw error;
    }
  }

  /**
   * Verifica la unicidad de un cartón (para testing)
   */
  static verifyCardUniqueness(card: CardNumberData[]): boolean {
    const numbers = card
      .filter(cell => !cell.isFree)
      .map(cell => cell.number)
      .filter(num => num !== null) as number[];

    return new Set(numbers).size === numbers.length;
  }

  /**
   * Valida que un cartón cumple las reglas del bingo 75
   */
  static validateCard(card: CardNumberData[]): boolean {
    if (card.length !== BINGO_CONSTANTS.TOTAL_CELLS) {
      return false;
    }

    // Verificar casilla libre
    const freeCell = card.find(cell => cell.position === BINGO_CONSTANTS.FREE_CELL_POSITION);
    if (!freeCell || !freeCell.isFree || freeCell.number !== null) {
      return false;
    }

    // Verificar rangos por columna
    for (let col = 0; col < BINGO_CONSTANTS.GRID_SIZE; col++) {
      const columnLetter = ['B', 'I', 'N', 'G', 'O'][col] as ColumnLetter;
      const columnConfig = BINGO_CONSTANTS.COLUMNS[columnLetter];
      
      const columnCells = card.filter(cell => 
        cell.column === columnLetter && !cell.isFree
      );

      for (const cell of columnCells) {
        if (cell.number === null || 
            cell.number < columnConfig.min || 
            cell.number > columnConfig.max) {
          return false;
        }
      }
    }

    return this.verifyCardUniqueness(card);
  }

  // ============================================================================
  // MÉTODOS MOCK TEMPORALES PARA DESARROLLO SIN BASE DE DATOS
  // ============================================================================

  /**
   * MOCK: Generar cartones para un juego (versión mock)
   */
  static async generateCardsMock(gameId: string, userId: string, count: number = 3) {
    try {
      logger.info(`🎫 Generando ${count} cartones mock para juego ${gameId}, usuario ${userId}`);
      
      const cards = [];
      
      for (let i = 0; i < count; i++) {
        const cardId = `card-${gameId}-${userId}-${i + 1}`;
        const card = generateMockBingoCard(cardId, gameId, userId);
        cards.push(card);
      }

      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 250));
      
      logger.info(`✅ ${count} cartones generados exitosamente`);
      return cards;
    } catch (error) {
      logger.error('Error generating mock cards:', error);
      throw error;
    }
  }

  /**
   * MOCK: Obtener cartones de usuario para un juego (versión mock)
   */
  static async getUserCardsMock(userId: string, gameId: string) {
    try {
      logger.info(`🎫 Obteniendo cartones mock para usuario ${userId}, juego ${gameId}`);
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Generar 3 cartones de ejemplo
      const cards = await this.generateCardsMock(gameId, userId, 3);
      
      return cards;
    } catch (error) {
      logger.error('Error getting mock user cards:', error);
      throw error;
    }
  }

  /**
   * MOCK: Marcar número en cartón (versión mock)
   */
  static async markNumberMock(cardId: string, number: number) {
    try {
      logger.info(`🎯 Marcando número ${number} en cartón mock ${cardId}`);
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Simular respuesta exitosa
      const result = {
        cardId,
        number,
        isMarked: true,
        hasWon: Math.random() < 0.05, // 5% de probabilidad de ganar (mock)
        winningPattern: Math.random() < 0.05 ? 'LINE_HORIZONTAL_1' : null,
      };
      
      logger.info(`✅ Número marcado. ¿Ganador? ${result.hasWon}`);
      return result;
    } catch (error) {
      logger.error('Error marking mock number:', error);
      throw error;
    }
  }

  /**
   * MOCK: Validar estructura de cartón (versión mock)
   */
  static async validateCardMock(cardNumbers: CardNumberData[]) {
    try {
      logger.info('🔍 Validando estructura de cartón mock');
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Validaciones básicas mock
      const isValid = cardNumbers.length === 25 && 
                     cardNumbers.filter(cell => cell.isFree).length === 1;
      
      return {
        isValid,
        errors: isValid ? [] : ['Estructura de cartón inválida'],
        cardNumbers,
      };
    } catch (error) {
      logger.error('Error validating mock card:', error);
      throw error;
    }
  }

  /**
   * MOCK: Obtener patrones del cartón (versión mock)
   */
  static async getCardPatternsMock(cardId: string) {
    try {
      logger.info(`🏁 Obteniendo patrones mock para cartón ${cardId}`);
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Simular algunos patrones detectados
      const patterns = [
        {
          type: 'LINE_HORIZONTAL_1',
          isComplete: Math.random() < 0.3,
          positions: [0, 1, 2, 3, 4],
          progress: Math.floor(Math.random() * 5) + 1,
        },
        {
          type: 'LINE_VERTICAL_B',
          isComplete: Math.random() < 0.2,
          positions: [0, 5, 10, 15, 20],
          progress: Math.floor(Math.random() * 5) + 1,
        },
        {
          type: 'DIAGONAL_1',
          isComplete: Math.random() < 0.1,
          positions: [0, 6, 12, 18, 24],
          progress: Math.floor(Math.random() * 5) + 1,
        }
      ];
      
      return {
        cardId,
        patterns,
        totalPatterns: patterns.length,
        completedPatterns: patterns.filter(p => p.isComplete).length,
      };
    } catch (error) {
      logger.error('Error getting mock card patterns:', error);
      throw error;
    }
  }
}

export default BingoCardService;