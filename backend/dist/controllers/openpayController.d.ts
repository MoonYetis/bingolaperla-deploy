import { Request, Response } from 'express';
export declare class OpenpayController {
    private openpayService;
    constructor();
    /**
     * Process credit/debit card payment
     */
    processCardPayment(req: Request, res: Response): Promise<void>;
    /**
     * Process bank transfer payment
     */
    processBankTransfer(req: Request, res: Response): Promise<void>;
    /**
     * Process cash payment (convenience stores)
     */
    processCashPayment(req: Request, res: Response): Promise<void>;
    /**
     * Get available Openpay payment methods
     */
    getPaymentMethods(req: Request, res: Response): Promise<void>;
    /**
     * Get transaction status
     */
    getTransactionStatus(req: Request, res: Response): Promise<void>;
    /**
     * Get user's Openpay transaction history
     */
    getTransactionHistory(req: Request, res: Response): Promise<void>;
}
export default OpenpayController;
//# sourceMappingURL=openpayController.d.ts.map