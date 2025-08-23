export interface DepositNotification {
    amount: number;
    pearlsAmount: number;
    method: string;
    instant: boolean;
    referenceCode: string;
}
export declare class NotificationService {
    sendDepositConfirmation(userId: string, data: DepositNotification): Promise<void>;
    sendPaymentFailureNotification(userId: string, data: {
        amount: number;
        method: string;
        errorMessage: string;
        errorCode: string;
    }): Promise<void>;
}
export default NotificationService;
//# sourceMappingURL=notificationService.d.ts.map