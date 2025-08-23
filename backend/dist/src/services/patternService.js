"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatternService = void 0;
const game_1 = require("../../../shared/types/game");
const logger_1 = require("@/utils/logger");
class PatternService {
    /**
     * Verifica si un cartón tiene algún patrón ganador
     */
    static checkWinningPatterns(card) {
        const winningPatterns = [];
        // Obtener posiciones marcadas (incluyendo la casilla libre)
        const markedPositions = new Set();
        card.numbers.forEach(number => {
            if (number.isMarked) {
                markedPositions.add(number.position);
            }
        });
        // Verificar cada patrón
        Object.entries(game_1.WINNING_PATTERNS).forEach(([patternName, positions]) => {
            if (this.isPatternComplete(positions, markedPositions)) {
                winningPatterns.push(patternName);
            }
        });
        return winningPatterns;
    }
    /**
     * Verifica si un patrón específico está completo
     */
    static isPatternComplete(patternPositions, markedPositions) {
        return patternPositions.every(position => markedPositions.has(position));
    }
    /**
     * Verifica si un cartón específico es ganador con un patrón dado
     */
    static isWinningCard(card, pattern) {
        const markedPositions = new Set();
        card.numbers.forEach(number => {
            if (number.isMarked) {
                markedPositions.add(number.position);
            }
        });
        const patternPositions = game_1.WINNING_PATTERNS[pattern];
        return this.isPatternComplete(patternPositions, markedPositions);
    }
    /**
     * Obtiene todas las líneas disponibles (horizontales, verticales, diagonales)
     */
    static getLinePatterns() {
        return [
            game_1.WinningPattern.LINE_HORIZONTAL_1,
            game_1.WinningPattern.LINE_HORIZONTAL_2,
            game_1.WinningPattern.LINE_HORIZONTAL_3,
            game_1.WinningPattern.LINE_HORIZONTAL_4,
            game_1.WinningPattern.LINE_HORIZONTAL_5,
            game_1.WinningPattern.LINE_VERTICAL_B,
            game_1.WinningPattern.LINE_VERTICAL_I,
            game_1.WinningPattern.LINE_VERTICAL_N,
            game_1.WinningPattern.LINE_VERTICAL_G,
            game_1.WinningPattern.LINE_VERTICAL_O,
            game_1.WinningPattern.DIAGONAL_TOP_LEFT,
            game_1.WinningPattern.DIAGONAL_TOP_RIGHT,
        ];
    }
    /**
     * Obtiene patrones especiales (no líneas básicas)
     */
    static getSpecialPatterns() {
        return [
            game_1.WinningPattern.FOUR_CORNERS,
            game_1.WinningPattern.PATTERN_X,
            game_1.WinningPattern.PATTERN_T,
            game_1.WinningPattern.PATTERN_L,
        ];
    }
    /**
     * Verifica si hay ganadores después de que se canta un número
     */
    static checkForWinners(cards) {
        const winners = [];
        const lineWinners = [];
        const fullCardWinners = [];
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
                const hasLines = winningPatterns.some(pattern => this.getLinePatterns().includes(pattern));
                const hasFullCard = winningPatterns.includes(game_1.WinningPattern.FULL_CARD);
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
    static calculatePatternProgress(card, pattern) {
        const markedPositions = new Set();
        card.numbers.forEach(number => {
            if (number.isMarked) {
                markedPositions.add(number.position);
            }
        });
        const patternPositions = game_1.WINNING_PATTERNS[pattern];
        const markedInPattern = patternPositions.filter(position => markedPositions.has(position)).length;
        return (markedInPattern / patternPositions.length) * 100;
    }
    /**
     * Obtiene el progreso de todos los patrones para un cartón
     */
    static getAllPatternProgress(card) {
        const progress = {};
        Object.values(game_1.WinningPattern).forEach(pattern => {
            progress[pattern] = this.calculatePatternProgress(card, pattern);
        });
        return progress;
    }
    /**
     * Encuentra el patrón más cercano a completar
     */
    static getClosestPattern(card) {
        let closestPattern = null;
        let highestProgress = 0;
        let closestPatternPositions = [];
        // Obtener posiciones marcadas
        const markedPositions = new Set();
        card.numbers.forEach(number => {
            if (number.isMarked) {
                markedPositions.add(number.position);
            }
        });
        // Buscar el patrón con mayor progreso (que no esté completo)
        Object.entries(game_1.WINNING_PATTERNS).forEach(([patternName, positions]) => {
            const progress = this.calculatePatternProgress(card, patternName);
            if (progress > highestProgress && progress < 100) {
                highestProgress = progress;
                closestPattern = patternName;
                closestPatternPositions = positions;
            }
        });
        if (!closestPattern) {
            return null;
        }
        // Obtener números que faltan para completar el patrón
        const numbersNeeded = [];
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
    static isValidPosition(position) {
        return position >= 0 && position < game_1.BINGO_CONSTANTS.TOTAL_CELLS;
    }
    /**
     * Obtiene las posiciones de un patrón específico
     */
    static getPatternPositions(pattern) {
        return game_1.WINNING_PATTERNS[pattern];
    }
    /**
     * Verifica si un conjunto de posiciones forman un patrón válido
     */
    static validatePattern(positions) {
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
    static logWinningPatterns(gameId, winners) {
        if (winners.length > 0) {
            logger_1.logger.info(`Winners found in game ${gameId}:`, {
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
exports.PatternService = PatternService;
exports.default = PatternService;
//# sourceMappingURL=patternService.js.map