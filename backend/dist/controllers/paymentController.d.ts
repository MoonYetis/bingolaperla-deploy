import { Request, Response } from 'express';
import { AuthRequest } from '@/types/auth';
export declare class PaymentController {
    /**
     * Obtener métodos de pago disponibles
     * GET /api/payment/methods
     */
    getPaymentMethods(req: Request, res: Response): Promise<void>;
    /**
     * Crear solicitud de depósito (recarga de Perlas)
     * POST /api/payment/deposit
     */
    createDepositRequest(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Crear solicitud de retiro
     * POST /api/payment/withdrawal
     */
    createWithdrawalRequest(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Obtener solicitudes de depósito del usuario
     * GET /api/payment/deposits
     */
    getUserDepositRequests(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Obtener solicitudes de retiro del usuario
     * GET /api/payment/withdrawals
     */
    getUserWithdrawalRequests(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Cancelar solicitud de depósito (solo si está pendiente)
     * DELETE /api/payment/deposits/:depositRequestId
     */
    cancelDepositRequest(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Obtener configuración del sistema de pagos
     * GET /api/payment/config
     */
    getPaymentConfiguration(req: Request, res: Response): Promise<void>;
    /**
     * Obtener tiempo estimado de procesamiento según estado
     */
    private getProcessingTimeByStatus;
}
export declare const paymentController: PaymentController;
//# sourceMappingURL=paymentController.d.ts.map