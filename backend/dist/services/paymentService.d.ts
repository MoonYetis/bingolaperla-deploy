import { DepositRequest, WithdrawalRequest, BankConfiguration } from '@prisma/client';
export declare class PaymentService {
    /**
     * Obtener configuraciones bancarias activas
     */
    getActiveBankConfigurations(): Promise<BankConfiguration[]>;
    /**
     * Crear solicitud de depósito (recarga de Perlas)
     */
    createDepositRequest(data: {
        userId: string;
        amount: number;
        paymentMethod: string;
        bankAccount?: string;
    }): Promise<{
        depositRequest: DepositRequest;
        referenceCode: string;
        bankInstructions: object;
    }>;
    /**
     * Crear solicitud de retiro
     */
    createWithdrawalRequest(data: {
        userId: string;
        pearlsAmount: number;
        bankCode: string;
        accountNumber: string;
        accountType: 'SAVINGS' | 'CHECKING';
        accountHolderName: string;
        accountHolderDni: string;
    }): Promise<WithdrawalRequest>;
    /**
     * Aprobar solicitud de depósito (Admin)
     */
    approveDeposit(depositRequestId: string, adminId: string, bankReference?: string, adminNotes?: string): Promise<{
        depositRequest: DepositRequest;
        creditResult: any;
    }>;
    /**
     * Rechazar solicitud de depósito (Admin)
     */
    rejectDeposit(depositRequestId: string, adminId: string, reason: string): Promise<DepositRequest>;
    /**
     * Obtener solicitudes de depósito pendientes (Admin)
     */
    getPendingDeposits(options?: {
        limit?: number;
        offset?: number;
        paymentMethod?: string;
    }): Promise<DepositRequest[]>;
    /**
     * Obtener solicitudes de retiro pendientes (Admin)
     */
    getPendingWithdrawals(options?: {
        limit?: number;
        offset?: number;
    }): Promise<WithdrawalRequest[]>;
    /**
     * Preparar instrucciones bancarias para el usuario
     */
    private prepareBankInstructions;
    /**
     * Crear log de auditoría
     */
    private createAuditLog;
}
export declare const paymentService: PaymentService;
//# sourceMappingURL=paymentService.d.ts.map