import { z } from 'zod';
export declare const createDepositRequestSchema: z.ZodObject<{
    body: z.ZodObject<{
        amount: z.ZodNumber;
        paymentMethod: z.ZodEnum<["BCP", "BBVA", "INTERBANK", "SCOTIABANK", "YAPE", "PLIN"]>;
        bankAccount: z.ZodOptional<z.ZodString>;
        userNotes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        amount?: number;
        paymentMethod?: "BCP" | "BBVA" | "INTERBANK" | "SCOTIABANK" | "YAPE" | "PLIN";
        bankAccount?: string;
        userNotes?: string;
    }, {
        amount?: number;
        paymentMethod?: "BCP" | "BBVA" | "INTERBANK" | "SCOTIABANK" | "YAPE" | "PLIN";
        bankAccount?: string;
        userNotes?: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body?: {
        amount?: number;
        paymentMethod?: "BCP" | "BBVA" | "INTERBANK" | "SCOTIABANK" | "YAPE" | "PLIN";
        bankAccount?: string;
        userNotes?: string;
    };
}, {
    body?: {
        amount?: number;
        paymentMethod?: "BCP" | "BBVA" | "INTERBANK" | "SCOTIABANK" | "YAPE" | "PLIN";
        bankAccount?: string;
        userNotes?: string;
    };
}>;
export declare const createWithdrawalRequestSchema: z.ZodObject<{
    body: z.ZodObject<{
        pearlsAmount: z.ZodNumber;
        bankCode: z.ZodEnum<["BCP", "BBVA", "INTERBANK", "SCOTIABANK"]>;
        accountNumber: z.ZodString;
        accountType: z.ZodEnum<["SAVINGS", "CHECKING"]>;
        accountHolderName: z.ZodString;
        accountHolderDni: z.ZodString;
        userNotes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        pearlsAmount?: number;
        userNotes?: string;
        bankCode?: "BCP" | "BBVA" | "INTERBANK" | "SCOTIABANK";
        accountNumber?: string;
        accountType?: "SAVINGS" | "CHECKING";
        accountHolderName?: string;
        accountHolderDni?: string;
    }, {
        pearlsAmount?: number;
        userNotes?: string;
        bankCode?: "BCP" | "BBVA" | "INTERBANK" | "SCOTIABANK";
        accountNumber?: string;
        accountType?: "SAVINGS" | "CHECKING";
        accountHolderName?: string;
        accountHolderDni?: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body?: {
        pearlsAmount?: number;
        userNotes?: string;
        bankCode?: "BCP" | "BBVA" | "INTERBANK" | "SCOTIABANK";
        accountNumber?: string;
        accountType?: "SAVINGS" | "CHECKING";
        accountHolderName?: string;
        accountHolderDni?: string;
    };
}, {
    body?: {
        pearlsAmount?: number;
        userNotes?: string;
        bankCode?: "BCP" | "BBVA" | "INTERBANK" | "SCOTIABANK";
        accountNumber?: string;
        accountType?: "SAVINGS" | "CHECKING";
        accountHolderName?: string;
        accountHolderDni?: string;
    };
}>;
export declare const createP2PTransferSchema: z.ZodObject<{
    body: z.ZodObject<{
        toUsername: z.ZodString;
        amount: z.ZodNumber;
        description: z.ZodString;
        confirmTransfer: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
    }, "strip", z.ZodTypeAny, {
        description?: string;
        amount?: number;
        toUsername?: string;
        confirmTransfer?: boolean;
    }, {
        description?: string;
        amount?: number;
        toUsername?: string;
        confirmTransfer?: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    body?: {
        description?: string;
        amount?: number;
        toUsername?: string;
        confirmTransfer?: boolean;
    };
}, {
    body?: {
        description?: string;
        amount?: number;
        toUsername?: string;
        confirmTransfer?: boolean;
    };
}>;
export declare const approveDepositSchema: z.ZodObject<{
    body: z.ZodObject<{
        bankReference: z.ZodOptional<z.ZodString>;
        adminNotes: z.ZodOptional<z.ZodString>;
        proofImageUrl: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        bankReference?: string;
        adminNotes?: string;
        proofImageUrl?: string;
    }, {
        bankReference?: string;
        adminNotes?: string;
        proofImageUrl?: string;
    }>;
    params: z.ZodObject<{
        depositRequestId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        depositRequestId?: string;
    }, {
        depositRequestId?: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params?: {
        depositRequestId?: string;
    };
    body?: {
        bankReference?: string;
        adminNotes?: string;
        proofImageUrl?: string;
    };
}, {
    params?: {
        depositRequestId?: string;
    };
    body?: {
        bankReference?: string;
        adminNotes?: string;
        proofImageUrl?: string;
    };
}>;
export declare const rejectDepositSchema: z.ZodObject<{
    body: z.ZodObject<{
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        reason?: string;
    }, {
        reason?: string;
    }>;
    params: z.ZodObject<{
        depositRequestId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        depositRequestId?: string;
    }, {
        depositRequestId?: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params?: {
        depositRequestId?: string;
    };
    body?: {
        reason?: string;
    };
}, {
    params?: {
        depositRequestId?: string;
    };
    body?: {
        reason?: string;
    };
}>;
export declare const approveWithdrawalSchema: z.ZodObject<{
    body: z.ZodObject<{
        bankTransactionId: z.ZodOptional<z.ZodString>;
        adminNotes: z.ZodOptional<z.ZodString>;
        transferProofUrl: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        adminNotes?: string;
        bankTransactionId?: string;
        transferProofUrl?: string;
    }, {
        adminNotes?: string;
        bankTransactionId?: string;
        transferProofUrl?: string;
    }>;
    params: z.ZodObject<{
        withdrawalRequestId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        withdrawalRequestId?: string;
    }, {
        withdrawalRequestId?: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params?: {
        withdrawalRequestId?: string;
    };
    body?: {
        adminNotes?: string;
        bankTransactionId?: string;
        transferProofUrl?: string;
    };
}, {
    params?: {
        withdrawalRequestId?: string;
    };
    body?: {
        adminNotes?: string;
        bankTransactionId?: string;
        transferProofUrl?: string;
    };
}>;
export declare const rejectWithdrawalSchema: z.ZodObject<{
    body: z.ZodObject<{
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        reason?: string;
    }, {
        reason?: string;
    }>;
    params: z.ZodObject<{
        withdrawalRequestId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        withdrawalRequestId?: string;
    }, {
        withdrawalRequestId?: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params?: {
        withdrawalRequestId?: string;
    };
    body?: {
        reason?: string;
    };
}, {
    params?: {
        withdrawalRequestId?: string;
    };
    body?: {
        reason?: string;
    };
}>;
export declare const getTransactionHistorySchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
    offset: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
    type: z.ZodOptional<z.ZodEnum<["CARD_PURCHASE", "PRIZE_PAYOUT", "PEARL_PURCHASE", "PEARL_TRANSFER", "WITHDRAWAL"]>>;
    dateFrom: z.ZodOptional<z.ZodEffects<z.ZodString, Date, string>>;
    dateTo: z.ZodOptional<z.ZodEffects<z.ZodString, Date, string>>;
}, "strip", z.ZodTypeAny, {
    type?: "CARD_PURCHASE" | "PEARL_PURCHASE" | "WITHDRAWAL" | "PEARL_TRANSFER" | "PRIZE_PAYOUT";
    limit?: number;
    offset?: number;
    dateFrom?: Date;
    dateTo?: Date;
}, {
    type?: "CARD_PURCHASE" | "PEARL_PURCHASE" | "WITHDRAWAL" | "PEARL_TRANSFER" | "PRIZE_PAYOUT";
    limit?: string;
    offset?: string;
    dateFrom?: string;
    dateTo?: string;
}>;
export declare const adminListDepositsSchema: z.ZodObject<{
    query: z.ZodObject<{
        status: z.ZodOptional<z.ZodEnum<["PENDING", "APPROVED", "REJECTED", "CANCELLED", "EXPIRED"]>>;
        paymentMethod: z.ZodOptional<z.ZodEnum<["BCP", "BBVA", "INTERBANK", "SCOTIABANK", "YAPE", "PLIN"]>>;
        limit: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        offset: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        dateFrom: z.ZodOptional<z.ZodEffects<z.ZodString, Date, string>>;
        dateTo: z.ZodOptional<z.ZodEffects<z.ZodString, Date, string>>;
    }, "strip", z.ZodTypeAny, {
        status?: "CANCELLED" | "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
        limit?: number;
        paymentMethod?: "BCP" | "BBVA" | "INTERBANK" | "SCOTIABANK" | "YAPE" | "PLIN";
        offset?: number;
        dateFrom?: Date;
        dateTo?: Date;
    }, {
        status?: "CANCELLED" | "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
        limit?: string;
        paymentMethod?: "BCP" | "BBVA" | "INTERBANK" | "SCOTIABANK" | "YAPE" | "PLIN";
        offset?: string;
        dateFrom?: string;
        dateTo?: string;
    }>;
}, "strip", z.ZodTypeAny, {
    query?: {
        status?: "CANCELLED" | "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
        limit?: number;
        paymentMethod?: "BCP" | "BBVA" | "INTERBANK" | "SCOTIABANK" | "YAPE" | "PLIN";
        offset?: number;
        dateFrom?: Date;
        dateTo?: Date;
    };
}, {
    query?: {
        status?: "CANCELLED" | "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
        limit?: string;
        paymentMethod?: "BCP" | "BBVA" | "INTERBANK" | "SCOTIABANK" | "YAPE" | "PLIN";
        offset?: string;
        dateFrom?: string;
        dateTo?: string;
    };
}>;
export declare const updateBankConfigSchema: z.ZodObject<{
    body: z.ZodObject<{
        bankName: z.ZodOptional<z.ZodString>;
        accountNumber: z.ZodOptional<z.ZodString>;
        accountType: z.ZodOptional<z.ZodEnum<["SAVINGS", "CHECKING"]>>;
        accountHolderName: z.ZodOptional<z.ZodString>;
        cci: z.ZodOptional<z.ZodString>;
        isActive: z.ZodOptional<z.ZodBoolean>;
        minDeposit: z.ZodOptional<z.ZodNumber>;
        maxDeposit: z.ZodOptional<z.ZodNumber>;
        depositCommission: z.ZodOptional<z.ZodNumber>;
        instructions: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        isActive?: boolean;
        accountNumber?: string;
        accountType?: "SAVINGS" | "CHECKING";
        accountHolderName?: string;
        bankName?: string;
        cci?: string;
        minDeposit?: number;
        maxDeposit?: number;
        depositCommission?: number;
        instructions?: string;
    }, {
        isActive?: boolean;
        accountNumber?: string;
        accountType?: "SAVINGS" | "CHECKING";
        accountHolderName?: string;
        bankName?: string;
        cci?: string;
        minDeposit?: number;
        maxDeposit?: number;
        depositCommission?: number;
        instructions?: string;
    }>;
    params: z.ZodObject<{
        bankCode: z.ZodEnum<["BCP", "BBVA", "INTERBANK", "SCOTIABANK"]>;
    }, "strip", z.ZodTypeAny, {
        bankCode?: "BCP" | "BBVA" | "INTERBANK" | "SCOTIABANK";
    }, {
        bankCode?: "BCP" | "BBVA" | "INTERBANK" | "SCOTIABANK";
    }>;
}, "strip", z.ZodTypeAny, {
    params?: {
        bankCode?: "BCP" | "BBVA" | "INTERBANK" | "SCOTIABANK";
    };
    body?: {
        isActive?: boolean;
        accountNumber?: string;
        accountType?: "SAVINGS" | "CHECKING";
        accountHolderName?: string;
        bankName?: string;
        cci?: string;
        minDeposit?: number;
        maxDeposit?: number;
        depositCommission?: number;
        instructions?: string;
    };
}, {
    params?: {
        bankCode?: "BCP" | "BBVA" | "INTERBANK" | "SCOTIABANK";
    };
    body?: {
        isActive?: boolean;
        accountNumber?: string;
        accountType?: "SAVINGS" | "CHECKING";
        accountHolderName?: string;
        bankName?: string;
        cci?: string;
        minDeposit?: number;
        maxDeposit?: number;
        depositCommission?: number;
        instructions?: string;
    };
}>;
export declare const updateWalletLimitsSchema: z.ZodObject<{
    body: z.ZodObject<{
        dailyLimit: z.ZodOptional<z.ZodNumber>;
        monthlyLimit: z.ZodOptional<z.ZodNumber>;
        isFrozen: z.ZodOptional<z.ZodBoolean>;
        adminNotes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        dailyLimit?: number;
        monthlyLimit?: number;
        isFrozen?: boolean;
        adminNotes?: string;
    }, {
        dailyLimit?: number;
        monthlyLimit?: number;
        isFrozen?: boolean;
        adminNotes?: string;
    }>;
    params: z.ZodObject<{
        userId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        userId?: string;
    }, {
        userId?: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params?: {
        userId?: string;
    };
    body?: {
        dailyLimit?: number;
        monthlyLimit?: number;
        isFrozen?: boolean;
        adminNotes?: string;
    };
}, {
    params?: {
        userId?: string;
    };
    body?: {
        dailyLimit?: number;
        monthlyLimit?: number;
        isFrozen?: boolean;
        adminNotes?: string;
    };
}>;
export declare const uploadProofSchema: z.ZodObject<{
    body: z.ZodObject<{
        depositRequestId: z.ZodString;
        proofType: z.ZodDefault<z.ZodOptional<z.ZodEnum<["USER_PROOF", "ADMIN_PROOF"]>>>;
    }, "strip", z.ZodTypeAny, {
        depositRequestId?: string;
        proofType?: "USER_PROOF" | "ADMIN_PROOF";
    }, {
        depositRequestId?: string;
        proofType?: "USER_PROOF" | "ADMIN_PROOF";
    }>;
}, "strip", z.ZodTypeAny, {
    body?: {
        depositRequestId?: string;
        proofType?: "USER_PROOF" | "ADMIN_PROOF";
    };
}, {
    body?: {
        depositRequestId?: string;
        proofType?: "USER_PROOF" | "ADMIN_PROOF";
    };
}>;
export type CreateDepositRequestInput = z.infer<typeof createDepositRequestSchema>['body'];
export type CreateWithdrawalRequestInput = z.infer<typeof createWithdrawalRequestSchema>['body'];
export type CreateP2PTransferInput = z.infer<typeof createP2PTransferSchema>['body'];
export type ApproveDepositInput = z.infer<typeof approveDepositSchema>['body'];
export type RejectDepositInput = z.infer<typeof rejectDepositSchema>['body'];
//# sourceMappingURL=paymentSchemas.d.ts.map