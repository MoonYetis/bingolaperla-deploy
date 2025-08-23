import { WINNING_PATTERNS, WinningPattern, BingoCardData, BINGO_CONSTANTS } from '@/types/game';
import { logger } from '@/utils/logger';

export class PatternService {
  /**
   * Verifica si un cartón tiene algún patrón ganador
   */
  static checkWinningPatterns(card: BingoCardData): WinningPattern[] {
    const winningPatterns: WinningPattern[] = [];
    
    // Obtener posiciones marcadas (incluyendo la casilla libre)
    const markedPositions = new Set<number>();
    
    card.numbers.forEach(number => {
      if (number.isMarked) {
        markedPositions.add(number.position);
      }
    });

    // Verificar cada patrón
    Object.entries(WINNING_PATTERNS).forEach(([patternName, positions]) => {
      if (this.isPatternComplete(positions, markedPositions)) {
        winningPatterns.push(patternName as WinningPattern);
      }
    });

    return winningPatterns;
  }

  /**
   * Verifica si un patrón específico está completo
   */
  private static isPatternComplete(
    patternPositions: readonly number[], 
    markedPositions: Set<number>
  ): boolean {
    return patternPositions.every(position => markedPositions.has(position));
  }

  /**
   * Verifica si un cartón específico es ganador con un patrón dado
   */
  static isWinningCard(card: BingoCardData, pattern: WinningPattern): boolean {
    const markedPositions = new Set<number>();
    
    card.numbers.forEach(number => {
      if (number.isMarked) {
        markedPositions.add(number.position);
      }
    });

    const patternPositions = WINNING_PATTERNS[pattern];
    return this.isPatternComplete(patternPositions, markedPositions);
  }

  /**
   * Obtiene todas las líneas disponibles (horizontales, verticales, diagonales)
   */
  static getLinePatterns(): WinningPattern[] {
    return [
      WinningPattern.LINE_HORIZONTAL_1,
      WinningPattern.LINE_HORIZONTAL_2,
      WinningPattern.LINE_HORIZONTAL_3,
      WinningPattern.LINE_HORIZONTAL_4,
      WinningPattern.LINE_HORIZONTAL_5,
      WinningPattern.LINE_VERTICAL_B,
      WinningPattern.LINE_VERTICAL_I,
      WinningPattern.LINE_VERTICAL_N,
      WinningPattern.LINE_VERTICAL_G,
      WinningPattern.LINE_VERTICAL_O,
      WinningPattern.DIAGONAL_TOP_LEFT,
      WinningPattern.DIAGONAL_TOP_RIGHT,
    ];
  }

  /**
   * Obtiene patrones especiales (no líneas básicas)
   */
  static getSpecialPatterns(): WinningPattern[] {
    return [
      WinningPattern.FOUR_CORNERS,
      WinningPattern.PATTERN_X,
      WinningPattern.PATTERN_T,
      WinningPattern.PATTERN_L,
    ];
  }

  /**
   * Verifica si hay ganadores después de que se canta un número
   */
  static checkForWinners(cards: BingoCardData[]): {
    winners: { cardId: string; userId: string; patterns: WinningPattern[] }[];
    lineWinners: { cardId: string; userId: string; patterns: WinningPattern[] }[];
    fullCardWinners: { cardId: string; userId: string }[];
  } {
    const winners: { cardId: string; userId: string; patterns: WinningPattern[] }[] = [];
    const lineWinners: { cardId: string; userId: string; patterns: WinningPattern[] }[] = [];
    const fullCardWinners: { cardId: string; userId: string }[] = [];

    cards.forEach(card => {
      const winningPatterns = this.checkWinningPatterns(card);
      
      if (winningPatterns.length > 0) {
        const cardWinner = {
          cardId: card.id,
          userId: card.userId,
          patterns: winningPatterns
        };

        winners.push(cardWinner);

        // Categorizar tipos de ganadores
        const hasLines = winningPatterns.some(pattern => 
          this.getLinePatterns().includes(pattern)
        );
        
        const hasFullCard = winningPatterns.includes(WinningPattern.FULL_CARD);

        if (hasLines) {
          lineWinners.push(cardWinner);
        }

        if (hasFullCard) {
          fullCardWinners.push({
            cardId: card.id,
            userId: card.userId
          });
        }
      }
    });

    return { winners, lineWinners, fullCardWinners };
  }

  /**
   * Calcula el progreso de un patrón (porcentaje completado)
   */
  static calculatePatternProgress(card: BingoCardData, pattern: WinningPattern): number {
    const markedPositions = new Set<number>();
    
    card.numbers.forEach(number => {
      if (number.isMarked) {
        markedPositions.add(number.position);
      }
    });

    const patternPositions = WINNING_PATTERNS[pattern];
    const markedInPattern = patternPositions.filter(position => 
      markedPositions.has(position)
    ).length;

    return (markedInPattern / patternPositions.length) * 100;
  }

  /**
   * Obtiene el progreso de todos los patrones para un cartón
   */
  static getAllPatternProgress(card: BingoCardData): Record<WinningPattern, number> {
    const progress = {} as Record<WinningPattern, number>;

    Object.values(WinningPattern).forEach(pattern => {
      progress[pattern] = this.calculatePatternProgress(card, pattern);
    });

    return progress;
  }

  /**
   * Encuentra el patrón más cercano a completar
   */
  static getClosestPattern(card: BingoCardData): {
    pattern: WinningPattern;
    progress: number;
    numbersNeeded: number[];
  } | null {
    let closestPattern: WinningPattern | null = null;
    let highestProgress = 0;
    let closestPatternPositions: readonly number[] = [];

    // Obtener posiciones marcadas
    const markedPositions = new Set<number>();
    card.numbers.forEach(number => {
      if (number.isMarked) {
        markedPositions.add(number.position);
      }
    });

    // Buscar el patrón con mayor progreso (que no esté completo)
    Object.entries(WINNING_PATTERNS).forEach(([patternName, positions]) => {
      const progress = this.calculatePatternProgress(card, patternName as WinningPattern);
      
      if (progress > highestProgress && progress < 100) {
        highestProgress = progress;
        closestPattern = patternName as WinningPattern;
        closestPatternPositions = positions;
      }
    });

    if (!closestPattern) {
      return null;
    }

    // Obtener números que faltan para completar el patrón
    const numbersNeeded: number[] = [];
    closestPatternPositions.forEach(position => {
      if (!markedPositions.has(position)) {
        const cellNumber = card.numbers.find(num => num.position === position);
        if (cellNumber && cellNumber.number !== null) {
          numbersNeeded.push(cellNumber.number);
        }
      }
    });

    return {
      pattern: closestPattern,
      progress: highestProgress,
      numbersNeeded
    };
  }

  /**
   * Valida si una posición es válida en el grid de bingo
   */
  static isValidPosition(position: number): boolean {
    return position >= 0 && position < BINGO_CONSTANTS.TOTAL_CELLS;
  }

  /**
   * Obtiene las posiciones de un patrón específico
   */
  static getPatternPositions(pattern: WinningPattern): readonly number[] {
    return WINNING_PATTERNS[pattern];
  }

  /**
   * Verifica si un conjunto de posiciones forman un patrón válido
   */
  static validatePattern(positions: number[]): boolean {
    // Verificar que todas las posiciones sean válidas
    if (!positions.every(pos => this.isValidPosition(pos))) {
      return false;
    }

    // Verificar que no haya duplicados
    const uniquePositions = new Set(positions);
    if (uniquePositions.size !== positions.length) {
      return false;
    }

    // Verificar que tenga al menos 2 posiciones (línea mínima)
    return positions.length >= 2;
  }

  /**
   * Log de información sobre patrones ganadores
   */
  static logWinningPatterns(
    gameId: string,
    winners: { cardId: string; userId: string; patterns: WinningPattern[] }[]
  ): void {
    if (winners.length > 0) {
      logger.info(`Winners found in game ${gameId}:`, {
        gameId,
        winnersCount: winners.length,
        winners: winners.map(w => ({
          cardId: w.cardId,
          userId: w.userId,
          patterns: w.patterns
        }))
      });
    }
  }
}

export default PatternService;