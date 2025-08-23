import { Wallet, Transaction } from '@prisma/client';
export declare class WalletService {
    /**
     * Obtener billetera por ID de usuario
     */
    getByUserId(userId: string): Promise<Wallet | null>;
    /**
     * Crear billetera para usuario nuevo
     */
    createWallet(userId: string, initialBalance?: number): Promise<Wallet>;
    /**
     * Obtener balance actual de Perlas
     */
    getBalance(userId: string): Promise<{
        balance: number;
        dailyLimit: number;
        monthlyLimit: number;
        isActive: boolean;
        isFrozen: boolean;
    }>;
    /**
     * Acreditar Perlas a la billetera (por recarga aprobada)
     */
    creditPearls(userId: string, amount: number, description: string, referenceId?: string, adminId?: string): Promise<{
        wallet: Wallet;
        transaction: Transaction;
        newBalance: number;
    }>;
    /**
     * Debitar Perlas de la billetera (por compra de cartones o retiro)
     */
    debitPearls(userId: string, amount: number, description: string, type?: 'CARD_PURCHASE' | 'WITHDRAWAL' | 'PEARL_TRANSFER', referenceId?: string, toUserId?: string): Promise<{
        wallet: Wallet;
        transaction: Transaction;
        newBalance: number;
    }>;
    /**
     * Transferencia P2P entre usuarios
     */
    transferPearls(fromUserId: string, toUserId: string, amount: number, description: string, commission?: number): Promise<{
        fromTransaction: Transaction;
        toTransaction: Transaction;
        commissionTransaction?: Transaction;
    }>;
    /**
     * Historial de transacciones de la billetera
     */
    getTransactionHistory(userId: string, options?: {
        limit?: number;
        offset?: number;
        type?: string;
        dateFrom?: Date;
        dateTo?: Date;
    }): Promise<Transaction[]>;
    /**
     * Congelar/descongelar billetera (para casos de fraude)
     */
    freezeWallet(userId: string, adminId: string, reason: string): Promise<Wallet>;
    /**
     * Crear log de auditoría
     */
    private createAuditLog;
}
export declare const walletService: WalletService;
//# sourceMappingURL=walletService.d.ts.map