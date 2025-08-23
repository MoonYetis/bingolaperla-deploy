import { Request, Response } from 'express';
import { AuthRequest } from '@/types/auth';
export declare class WalletController {
    /**
     * Obtener información de la billetera del usuario
     * GET /api/wallet
     */
    getWalletInfo(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Obtener balance actual de Perlas
     * GET /api/wallet/balance
     */
    getBalance(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Obtener historial de transacciones
     * GET /api/wallet/transactions
     */
    getTransactionHistory(req: Request, res: Response): Promise<void>;
    /**
     * Realizar transferencia P2P entre usuarios
     * POST /api/wallet/transfer
     */
    transferPearls(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Verificar si un username existe (para validación en frontend)
     * GET /api/wallet/verify-username/:username
     */
    verifyUsername(req: Request, res: Response): Promise<void>;
}
export declare const walletController: WalletController;
//# sourceMappingURL=walletController.d.ts.map