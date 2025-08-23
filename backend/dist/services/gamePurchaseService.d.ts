export interface GamePurchaseResult {
    transaction: {
        id: string;
        amount: number;
        description: string;
        timestamp: string;
    };
    cards: Array<{
        id: string;
        cardNumber: number;
        numbers: any[];
    }>;
    newBalance: number;
    gameInfo: {
        id: string;
        title: string;
        cardPrice: number;
    };
}
export declare class GamePurchaseService {
    /**
     * Compra cartones de bingo usando Perlas
     */
    static purchaseCardsWithPearls(userId: string, gameId: string, cardCount?: number): Promise<GamePurchaseResult>;
    /**
     * Acreditar premio en Perlas cuando un usuario gana
     */
    static awardPrizeInPearls(userId: string, gameId: string, prizeAmount: number, winningPattern: string): Promise<{
        transaction: any;
        newBalance: number;
        gameInfo: any;
    }>;
    /**
     * Obtener información de compras de cartones de un usuario para un juego específico
     */
    static getUserGamePurchases(userId: string, gameId: string): Promise<{
        purchases: {
            id: string;
            amount: number;
            description: string;
            createdAt: string;
        }[];
        cards: {
            id: string;
            cardNumber: number;
            isActive: boolean;
            isWinner: boolean;
            winningPattern: string;
            numbers: {
                number: number | null;
                id: string;
                cardId: string;
                position: number;
                column: string;
                isMarked: boolean;
                isFree: boolean;
            }[];
        }[];
    }>;
    /**
     * Validar si un usuario tiene balance suficiente para comprar cartones
     */
    static validatePurchaseCapability(userId: string, gameId: string, cardCount?: number): Promise<{
        canPurchase: boolean;
        currentBalance: number;
        requiredAmount: number;
        message: string;
    }>;
}
export declare const gamePurchaseService: typeof GamePurchaseService;
//# sourceMappingURL=gamePurchaseService.d.ts.map