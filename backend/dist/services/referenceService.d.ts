import { PaymentReference } from '@prisma/client';
export declare class ReferenceService {
    /**
     * Genera un código de referencia único alfanumérico
     * Formato: BINGO-YYYYMMDD-XXXXX (ej: BINGO-20250108-A7K9M)
     */
    private generateReferenceCode;
    /**
     * Genera referencia SHA-256 para depósitos bancarios
     * Combina: timestamp + userId + amount + secret
     */
    private generateSecureReference;
    /**
     * Crear nueva referencia de pago
     */
    createPaymentReference(data: {
        userId: string;
        amount: number;
        type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER';
        description: string;
        expirationHours?: number;
        metadata?: object;
    }): Promise<PaymentReference>;
    /**
     * Buscar referencia por código
     */
    findByCode(code: string): Promise<PaymentReference | null>;
    /**
     * Marcar referencia como utilizada
     */
    markAsUsed(referenceId: string): Promise<PaymentReference>;
    /**
     * Verificar si una referencia es válida
     */
    isValidReference(code: string): Promise<{
        valid: boolean;
        reason?: string;
        reference?: PaymentReference;
    }>;
    /**
     * Limpiar referencias expiradas (tarea de mantenimiento)
     */
    cleanupExpiredReferences(): Promise<number>;
    /**
     * Obtener referencias por usuario
     */
    getUserReferences(userId: string, options?: {
        type?: string;
        includeExpired?: boolean;
        limit?: number;
    }): Promise<PaymentReference[]>;
    /**
     * Generar referencia bancaria específica para Perú
     * Formato especial para bancos peruanos con validación
     */
    generateBankingReference(data: {
        userId: string;
        amount: number;
        bankCode: string;
        depositRequestId: string;
    }): Promise<{
        code: string;
        displayCode: string;
        validationCode: string;
    }>;
}
export declare const referenceService: ReferenceService;
//# sourceMappingURL=referenceService.d.ts.map