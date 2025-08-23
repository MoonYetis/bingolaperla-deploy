import { WinningPattern, BingoCardData } from '../../../shared/types/game';
export declare class PatternService {
    /**
     * Verifica si un cartón tiene algún patrón ganador
     */
    static checkWinningPatterns(card: BingoCardData): WinningPattern[];
    /**
     * Verifica si un patrón específico está completo
     */
    private static isPatternComplete;
    /**
     * Verifica si un cartón específico es ganador con un patrón dado
     */
    static isWinningCard(card: BingoCardData, pattern: WinningPattern): boolean;
    /**
     * Obtiene todas las líneas disponibles (horizontales, verticales, diagonales)
     */
    static getLinePatterns(): WinningPattern[];
    /**
     * Obtiene patrones especiales (no líneas básicas)
     */
    static getSpecialPatterns(): WinningPattern[];
    /**
     * Verifica si hay ganadores después de que se canta un número
     */
    static checkForWinners(cards: BingoCardData[]): {
        winners: {
            cardId: string;
            userId: string;
            patterns: WinningPattern[];
        }[];
        lineWinners: {
            cardId: string;
            userId: string;
            patterns: WinningPattern[];
        }[];
        fullCardWinners: {
            cardId: string;
            userId: string;
        }[];
    };
    /**
     * Calcula el progreso de un patrón (porcentaje completado)
     */
    static calculatePatternProgress(card: BingoCardData, pattern: WinningPattern): number;
    /**
     * Obtiene el progreso de todos los patrones para un cartón
     */
    static getAllPatternProgress(card: BingoCardData): Record<WinningPattern, number>;
    /**
     * Encuentra el patrón más cercano a completar
     */
    static getClosestPattern(card: BingoCardData): {
        pattern: WinningPattern;
        progress: number;
        numbersNeeded: number[];
    } | null;
    /**
     * Valida si una posición es válida en el grid de bingo
     */
    static isValidPosition(position: number): boolean;
    /**
     * Obtiene las posiciones de un patrón específico
     */
    static getPatternPositions(pattern: WinningPattern): readonly number[];
    /**
     * Verifica si un conjunto de posiciones forman un patrón válido
     */
    static validatePattern(positions: number[]): boolean;
    /**
     * Log de información sobre patrones ganadores
     */
    static logWinningPatterns(gameId: string, winners: {
        cardId: string;
        userId: string;
        patterns: WinningPattern[];
    }[]): void;
}
export default PatternService;
//# sourceMappingURL=patternService.d.ts.map