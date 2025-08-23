export interface CardPaymentData {
    userId: string;
    amount: number;
    token: string;
    deviceSessionId: string;
    customerEmail: string;
    customerName: string;
    customerPhone?: string;
}
export interface BankTransferData {
    userId: string;
    amount: number;
    customerEmail: string;
    customerName: string;
}
export interface OpenpayTransactionResult {
    success: boolean;
    transactionId?: string;
    openpayChargeId?: string;
    status?: string;
    authorizationCode?: string;
    paymentInstructions?: {
        bankName?: string;
        accountNumber?: string;
        reference?: string;
        expirationDate?: string;
    };
    errorMessage?: string;
    errorCode?: string;
}
export declare class OpenpayService {
    private openpay;
    private notificationService;
    private walletService;
    constructor();
    /**
     * Process credit/debit card payment
     */
    processCardPayment(paymentData: CardPaymentData): Promise<OpenpayTransactionResult>;
    /**
     * Process bank transfer payment
     */
    processBankTransfer(paymentData: BankTransferData): Promise<OpenpayTransactionResult>;
    /**
     * Ensure Openpay customer exists
     */
    private ensureOpenpayCustomer;
    /**
     * Create deposit request
     */
    private createDepositRequest;
    /**
     * Save Openpay transaction
     */
    private saveOpenpayTransaction;
    /**
     * Auto-approve deposit and add Perlas to user account
     */
    autoApproveDeposit(depositRequestId: string, openpayTransactionId: string): Promise<void>;
    /**
     * Generate unique reference code
     */
    private generateReferenceCode;
    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(signature: string, payload: any): boolean;
    /**
     * Get transaction by Openpay charge ID
     */
    getTransactionByChargeId(chargeId: string): Promise<{
        depositRequest: {
            user: {
                role: string;
                username: string;
                password: string;
                id: string;
                email: string;
                balance: import("@prisma/client/runtime/library").Decimal;
                pearlsBalance: import("@prisma/client/runtime/library").Decimal;
                createdAt: Date;
                updatedAt: Date;
                isActive: boolean;
                isVerified: boolean;
                fullName: string | null;
                phone: string | null;
                dni: string | null;
                birthDate: Date | null;
            };
        } & {
            status: string;
            userId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            pearlsAmount: import("@prisma/client/runtime/library").Decimal;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            paymentMethod: string;
            transactionId: string | null;
            bankAccount: string | null;
            bankReference: string | null;
            adminNotes: string | null;
            expiresAt: Date;
            currency: string;
            referenceCode: string;
            bankAccountName: string | null;
            validatedBy: string | null;
            validatedAt: Date | null;
            proofImage: string | null;
            proofImageAdmin: string | null;
            integrationMethod: string;
            openpayTransactionId: string | null;
            autoApprovalEligible: boolean;
            processingFee: number;
        };
    } & {
        userAgent: string | null;
        amount: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        paymentMethod: string;
        ipAddress: string | null;
        depositRequestId: string;
        expiresAt: Date | null;
        currency: string;
        openpayTransactionId: string;
        customerId: string;
        deviceSessionId: string | null;
        openpayChargeId: string | null;
        paymentMethodDetails: string | null;
        openpayStatus: string;
        openpayErrorCode: string | null;
        openpayErrorMessage: string | null;
        customerEmail: string;
        customerPhone: string | null;
        authorizationCode: string | null;
        operationType: string | null;
        riskScore: number | null;
        fraudIndicators: string | null;
        chargedAt: Date | null;
    }>;
    /**
     * Update transaction status
     */
    updateTransactionStatus(transactionId: string, status: string, additionalData?: any): Promise<{
        userAgent: string | null;
        amount: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        paymentMethod: string;
        ipAddress: string | null;
        depositRequestId: string;
        expiresAt: Date | null;
        currency: string;
        openpayTransactionId: string;
        customerId: string;
        deviceSessionId: string | null;
        openpayChargeId: string | null;
        paymentMethodDetails: string | null;
        openpayStatus: string;
        openpayErrorCode: string | null;
        openpayErrorMessage: string | null;
        customerEmail: string;
        customerPhone: string | null;
        authorizationCode: string | null;
        operationType: string | null;
        riskScore: number | null;
        fraudIndicators: string | null;
        chargedAt: Date | null;
    }>;
    /**
     * Get user's Openpay customer record
     */
    getUserCustomer(userId: string): Promise<{
        userId: string;
        name: string;
        id: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        openpayCustomerId: string;
    }>;
    /**
     * Get customer's payment methods
     */
    getCustomerPaymentMethods(customerId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        customerId: string;
        openpayCardId: string | null;
        cardType: string | null;
        cardBrand: string | null;
        cardNumberMasked: string | null;
        cardHolderName: string | null;
        expirationMonth: string | null;
        expirationYear: string | null;
        isDefault: boolean;
    }[]>;
    /**
     * Get transaction by ID (for specific user)
     */
    getTransaction(transactionId: string, userId: string): Promise<{
        depositRequest: {
            status: string;
            userId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            pearlsAmount: import("@prisma/client/runtime/library").Decimal;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            paymentMethod: string;
            transactionId: string | null;
            bankAccount: string | null;
            bankReference: string | null;
            adminNotes: string | null;
            expiresAt: Date;
            currency: string;
            referenceCode: string;
            bankAccountName: string | null;
            validatedBy: string | null;
            validatedAt: Date | null;
            proofImage: string | null;
            proofImageAdmin: string | null;
            integrationMethod: string;
            openpayTransactionId: string | null;
            autoApprovalEligible: boolean;
            processingFee: number;
        };
    } & {
        userAgent: string | null;
        amount: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        paymentMethod: string;
        ipAddress: string | null;
        depositRequestId: string;
        expiresAt: Date | null;
        currency: string;
        openpayTransactionId: string;
        customerId: string;
        deviceSessionId: string | null;
        openpayChargeId: string | null;
        paymentMethodDetails: string | null;
        openpayStatus: string;
        openpayErrorCode: string | null;
        openpayErrorMessage: string | null;
        customerEmail: string;
        customerPhone: string | null;
        authorizationCode: string | null;
        operationType: string | null;
        riskScore: number | null;
        fraudIndicators: string | null;
        chargedAt: Date | null;
    }>;
    /**
     * Get user's transaction history
     */
    getTransactionHistory(userId: string, page?: number, limit?: number): Promise<{
        transactions: ({
            depositRequest: {
                status: string;
                userId: string;
                amount: import("@prisma/client/runtime/library").Decimal;
                pearlsAmount: import("@prisma/client/runtime/library").Decimal;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                paymentMethod: string;
                transactionId: string | null;
                bankAccount: string | null;
                bankReference: string | null;
                adminNotes: string | null;
                expiresAt: Date;
                currency: string;
                referenceCode: string;
                bankAccountName: string | null;
                validatedBy: string | null;
                validatedAt: Date | null;
                proofImage: string | null;
                proofImageAdmin: string | null;
                integrationMethod: string;
                openpayTransactionId: string | null;
                autoApprovalEligible: boolean;
                processingFee: number;
            };
        } & {
            userAgent: string | null;
            amount: number;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            paymentMethod: string;
            ipAddress: string | null;
            depositRequestId: string;
            expiresAt: Date | null;
            currency: string;
            openpayTransactionId: string;
            customerId: string;
            deviceSessionId: string | null;
            openpayChargeId: string | null;
            paymentMethodDetails: string | null;
            openpayStatus: string;
            openpayErrorCode: string | null;
            openpayErrorMessage: string | null;
            customerEmail: string;
            customerPhone: string | null;
            authorizationCode: string | null;
            operationType: string | null;
            riskScore: number | null;
            fraudIndicators: string | null;
            chargedAt: Date | null;
        })[];
        total: number;
    }>;
}
export default OpenpayService;
//# sourceMappingURL=openpayService.d.ts.map