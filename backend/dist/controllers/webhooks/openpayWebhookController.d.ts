import { Request, Response } from 'express';
export declare class OpenpayWebhookController {
    private openpayService;
    private notificationService;
    constructor();
    /**
     * Handle Openpay webhook notifications
     */
    handleWebhook(req: Request, res: Response): Promise<void>;
    /**
     * Process specific webhook event types
     */
    private processWebhookEvent;
    /**
     * Handle successful charge
     */
    private handleChargeSucceeded;
    /**
     * Handle failed charge
     */
    private handleChargeFailed;
    /**
     * Handle cancelled charge
     */
    private handleChargeCancelled;
    /**
     * Handle charge created (for bank transfers or OXXO payments)
     */
    private handleChargeCreated;
    /**
     * Handle charge refunded
     */
    private handleChargeRefunded;
    /**
     * Handle payout created (for withdrawals)
     */
    private handlePayoutCreated;
    /**
     * Handle payout succeeded
     */
    private handlePayoutSucceeded;
    /**
     * Handle payout failed
     */
    private handlePayoutFailed;
}
export default OpenpayWebhookController;
//# sourceMappingURL=openpayWebhookController.d.ts.map