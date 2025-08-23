import { CardNumberData, BingoCardData } from '@/types/game';
export declare class BingoCardService {
    /**
     * Genera un cartón de bingo único con las reglas del bingo 75
     */
    static generateUniqueCard(): CardNumberData[];
    /**
     * Genera múltiples cartones únicos para un usuario
     */
    static generateMultipleCards(userId: string, gameId: string, count?: number): Promise<BingoCardData[]>;
    /**
     * Obtiene todos los cartones de un usuario para un juego específico
     */
    static getUserCards(userId: string, gameId: string): Promise<BingoCardData[]>;
    /**
     * Marca un número en un cartón específico - BINGO TRADICIONAL
     * Permite marcado manual de cualquier número en el cartón, independiente de si fue cantado
     */
    static markNumber(cardId: string, number: number): Promise<BingoCardData>;
    /**
     * Verifica la unicidad de un cartón (para testing)
     */
    static verifyCardUniqueness(card: CardNumberData[]): boolean;
    /**
     * Valida que un cartón cumple las reglas del bingo 75
     */
    static validateCard(card: CardNumberData[]): boolean;
    /**
     * MOCK: Generar cartones para un juego (versión mock)
     */
    static generateCardsMock(gameId: string, userId: string, count?: number): Promise<any[]>;
    /**
     * MOCK: Obtener cartones de usuario para un juego (versión mock)
     */
    static getUserCardsMock(userId: string, gameId: string): Promise<any[]>;
    /**
     * MOCK: Marcar número en cartón (versión mock)
     */
    static markNumberMock(cardId: string, number: number): Promise<{
        cardId: string;
        number: number;
        isMarked: boolean;
        hasWon: boolean;
        winningPattern: string;
    }>;
    /**
     * MOCK: Validar estructura de cartón (versión mock)
     */
    static validateCardMock(cardNumbers: CardNumberData[]): Promise<{
        isValid: boolean;
        errors: string[];
        cardNumbers: CardNumberData[];
    }>;
    /**
     * MOCK: Obtener patrones del cartón (versión mock)
     */
    static getCardPatternsMock(cardId: string): Promise<{
        cardId: string;
        patterns: {
            type: string;
            isComplete: boolean;
            positions: number[];
            progress: number;
        }[];
        totalPatterns: number;
        completedPatterns: number;
    }>;
}
export default BingoCardService;
//# sourceMappingURL=bingoCardService.d.ts.map