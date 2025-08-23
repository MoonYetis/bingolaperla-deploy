import { CardNumberData, BingoCardData } from '../../../shared/types/game';
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
     * Marca un número en un cartón específico
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
}
export default BingoCardService;
//# sourceMappingURL=bingoCardService.d.ts.map