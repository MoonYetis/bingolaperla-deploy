import { Request, Response } from 'express';
import { AuthRequest } from '@/types/auth';
export declare class PaymentAdminController {
    /**
     * Obtener dashboard de estadísticas de pagos
     * GET /api/admin/payment/dashboard
     */
    getPaymentDashboard(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Obtener lista de depósitos pendientes
     * GET /api/admin/payment/deposits/pending
     */
    getPendingDeposits(req: Request, res: Response): Promise<void>;
    /**
     * Aprobar solicitud de depósito
     * POST /api/admin/payment/deposits/:depositRequestId/approve
     */
    approveDeposit(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Rechazar solicitud de depósito
     * POST /api/admin/payment/deposits/:depositRequestId/reject
     */
    rejectDeposit(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Obtener lista de retiros pendientes
     * GET /api/admin/payment/withdrawals/pending
     */
    getPendingWithdrawals(req: Request, res: Response): Promise<void>;
    /**
     * Obtener estadísticas financieras detalladas
     * GET /api/admin/payment/statistics
     */
    getFinancialStatistics(req: Request, res: Response): Promise<void>;
    /**
     * Calcular tiempo restante hasta expiración
     */
    private getTimeRemaining;
}
export declare const paymentAdminController: PaymentAdminController;
//# sourceMappingURL=paymentAdminController.d.ts.map