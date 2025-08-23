import { Request, Response } from 'express';
export declare class GamePurchaseController {
    /**
     * Comprar cartones de bingo usando Perlas
     * POST /api/game-purchase/cards
     */
    static purchaseCards(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Validar si el usuario puede comprar cartones
     * GET /api/game-purchase/validate/:gameId/:cardCount?
     */
    static validatePurchase(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Obtener historial de compras de cartones del usuario
     * GET /api/game-purchase/history/:gameId?
     */
    static getPurchaseHistory(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Procesar premio en Perlas para ganadores
     * POST /api/game-purchase/award-prize
     */
    static awardPrize(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
export default GamePurchaseController;
//# sourceMappingURL=gamePurchaseController.d.ts.map