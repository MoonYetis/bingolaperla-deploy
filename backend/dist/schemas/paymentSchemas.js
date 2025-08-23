"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadProofSchema = exports.updateWalletLimitsSchema = exports.updateBankConfigSchema = exports.adminListDepositsSchema = exports.getTransactionHistorySchema = exports.rejectWithdrawalSchema = exports.approveWithdrawalSchema = exports.rejectDepositSchema = exports.approveDepositSchema = exports.createP2PTransferSchema = exports.createWithdrawalRequestSchema = exports.createDepositRequestSchema = void 0;
const zod_1 = require("zod");
// Validaciones para solicitudes de depósito
exports.createDepositRequestSchema = zod_1.z.object({
    body: zod_1.z.object({
        amount: zod_1.z.number()
            .min(10, 'Monto mínimo: S/ 10.00')
            .max(5000, 'Monto máximo: S/ 5,000.00')
            .multipleOf(0.01, 'Monto debe tener máximo 2 decimales'),
        paymentMethod: zod_1.z.enum(['BCP', 'BBVA', 'INTERBANK', 'SCOTIABANK', 'YAPE', 'PLIN'], {
            errorMap: () => ({ message: 'Método de pago no válido' })
        }),
        bankAccount: zod_1.z.string().optional(),
        userNotes: zod_1.z.string()
            .max(500, 'Notas no pueden exceder 500 caracteres')
            .optional()
    })
});
// Validaciones para solicitudes de retiro
exports.createWithdrawalRequestSchema = zod_1.z.object({
    body: zod_1.z.object({
        pearlsAmount: zod_1.z.number()
            .min(50, 'Monto mínimo de retiro: 50 Perlas')
            .max(10000, 'Monto máximo de retiro: 10,000 Perlas')
            .multipleOf(0.01, 'Monto debe tener máximo 2 decimales'),
        bankCode: zod_1.z.enum(['BCP', 'BBVA', 'INTERBANK', 'SCOTIABANK'], {
            errorMap: () => ({ message: 'Banco no válido para retiros' })
        }),
        accountNumber: zod_1.z.string()
            .min(10, 'Número de cuenta muy corto')
            .max(20, 'Número de cuenta muy largo')
            .regex(/^[0-9]+$/, 'Número de cuenta solo puede contener dígitos'),
        accountType: zod_1.z.enum(['SAVINGS', 'CHECKING'], {
            errorMap: () => ({ message: 'Tipo de cuenta debe ser SAVINGS o CHECKING' })
        }),
        accountHolderName: zod_1.z.string()
            .min(3, 'Nombre del titular muy corto')
            .max(100, 'Nombre del titular muy largo')
            .regex(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/, 'Nombre solo puede contener letras y espacios'),
        accountHolderDni: zod_1.z.string()
            .length(8, 'DNI debe tener exactamente 8 dígitos')
            .regex(/^[0-9]+$/, 'DNI solo puede contener dígitos'),
        userNotes: zod_1.z.string()
            .max(500, 'Notas no pueden exceder 500 caracteres')
            .optional()
    })
});
// Validaciones para transferencias P2P
exports.createP2PTransferSchema = zod_1.z.object({
    body: zod_1.z.object({
        toUsername: zod_1.z.string()
            .min(3, 'Username del destinatario muy corto')
            .max(50, 'Username del destinatario muy largo'),
        amount: zod_1.z.number()
            .min(1, 'Monto mínimo de transferencia: 1 Perla')
            .max(1000, 'Monto máximo de transferencia: 1,000 Perlas')
            .multipleOf(0.01, 'Monto debe tener máximo 2 decimales'),
        description: zod_1.z.string()
            .min(5, 'Descripción muy corta')
            .max(200, 'Descripción muy larga'),
        confirmTransfer: zod_1.z.boolean()
            .refine(val => val === true, 'Debes confirmar la transferencia')
    })
});
// Validaciones para aprobación de depósito (Admin)
exports.approveDepositSchema = zod_1.z.object({
    body: zod_1.z.object({
        bankReference: zod_1.z.string()
            .min(3, 'Referencia bancaria muy corta')
            .max(50, 'Referencia bancaria muy larga')
            .optional(),
        adminNotes: zod_1.z.string()
            .max(1000, 'Notas de admin no pueden exceder 1000 caracteres')
            .optional(),
        proofImageUrl: zod_1.z.string()
            .url('URL de comprobante no válida')
            .optional()
    }),
    params: zod_1.z.object({
        depositRequestId: zod_1.z.string().uuid('ID de solicitud no válido')
    })
});
// Validaciones para rechazo de depósito (Admin)
exports.rejectDepositSchema = zod_1.z.object({
    body: zod_1.z.object({
        reason: zod_1.z.string()
            .min(10, 'Razón de rechazo muy corta')
            .max(500, 'Razón de rechazo muy larga')
    }),
    params: zod_1.z.object({
        depositRequestId: zod_1.z.string().uuid('ID de solicitud no válido')
    })
});
// Validaciones para aprobación de retiro (Admin)
exports.approveWithdrawalSchema = zod_1.z.object({
    body: zod_1.z.object({
        bankTransactionId: zod_1.z.string()
            .min(5, 'ID de transacción bancaria muy corto')
            .max(100, 'ID de transacción bancaria muy largo')
            .optional(),
        adminNotes: zod_1.z.string()
            .max(1000, 'Notas de admin no pueden exceder 1000 caracteres')
            .optional(),
        transferProofUrl: zod_1.z.string()
            .url('URL de comprobante de transferencia no válida')
            .optional()
    }),
    params: zod_1.z.object({
        withdrawalRequestId: zod_1.z.string().uuid('ID de solicitud no válido')
    })
});
// Validaciones para rechazo de retiro (Admin)
exports.rejectWithdrawalSchema = zod_1.z.object({
    body: zod_1.z.object({
        reason: zod_1.z.string()
            .min(10, 'Razón de rechazo muy corta')
            .max(500, 'Razón de rechazo muy larga')
    }),
    params: zod_1.z.object({
        withdrawalRequestId: zod_1.z.string().uuid('ID de solicitud no válido')
    })
});
// Validaciones para consultas de historial
exports.getTransactionHistorySchema = zod_1.z.object({
    limit: zod_1.z.string()
        .transform(val => parseInt(val))
        .pipe(zod_1.z.number().min(1).max(100))
        .optional()
        .default('50'),
    offset: zod_1.z.string()
        .transform(val => parseInt(val))
        .pipe(zod_1.z.number().min(0))
        .optional()
        .default('0'),
    type: zod_1.z.enum([
        'CARD_PURCHASE',
        'PRIZE_PAYOUT',
        'PEARL_PURCHASE',
        'PEARL_TRANSFER',
        'WITHDRAWAL'
    ]).optional(),
    dateFrom: zod_1.z.string()
        .datetime('Fecha desde no válida')
        .transform(val => new Date(val))
        .optional(),
    dateTo: zod_1.z.string()
        .datetime('Fecha hasta no válida')
        .transform(val => new Date(val))
        .optional()
});
// Validaciones para consultas administrativas
exports.adminListDepositsSchema = zod_1.z.object({
    query: zod_1.z.object({
        status: zod_1.z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED'])
            .optional(),
        paymentMethod: zod_1.z.enum(['BCP', 'BBVA', 'INTERBANK', 'SCOTIABANK', 'YAPE', 'PLIN'])
            .optional(),
        limit: zod_1.z.string()
            .transform(val => parseInt(val))
            .pipe(zod_1.z.number().min(1).max(100))
            .optional()
            .default('50'),
        offset: zod_1.z.string()
            .transform(val => parseInt(val))
            .pipe(zod_1.z.number().min(0))
            .optional()
            .default('0'),
        dateFrom: zod_1.z.string()
            .datetime('Fecha desde no válida')
            .transform(val => new Date(val))
            .optional(),
        dateTo: zod_1.z.string()
            .datetime('Fecha hasta no válida')
            .transform(val => new Date(val))
            .optional()
    })
});
// Validaciones para configuración bancaria (Admin)
exports.updateBankConfigSchema = zod_1.z.object({
    body: zod_1.z.object({
        bankName: zod_1.z.string().min(3).max(100).optional(),
        accountNumber: zod_1.z.string().min(10).max(20).optional(),
        accountType: zod_1.z.enum(['SAVINGS', 'CHECKING']).optional(),
        accountHolderName: zod_1.z.string().min(3).max(100).optional(),
        cci: zod_1.z.string().min(15).max(25).optional(),
        isActive: zod_1.z.boolean().optional(),
        minDeposit: zod_1.z.number().min(1).optional(),
        maxDeposit: zod_1.z.number().min(10).optional(),
        depositCommission: zod_1.z.number().min(0).optional(),
        instructions: zod_1.z.string().max(1000).optional()
    }),
    params: zod_1.z.object({
        bankCode: zod_1.z.enum(['BCP', 'BBVA', 'INTERBANK', 'SCOTIABANK'])
    })
});
// Validaciones para limites de billetera (Admin)
exports.updateWalletLimitsSchema = zod_1.z.object({
    body: zod_1.z.object({
        dailyLimit: zod_1.z.number()
            .min(100, 'Límite diario mínimo: 100 Perlas')
            .max(50000, 'Límite diario máximo: 50,000 Perlas')
            .optional(),
        monthlyLimit: zod_1.z.number()
            .min(1000, 'Límite mensual mínimo: 1,000 Perlas')
            .max(500000, 'Límite mensual máximo: 500,000 Perlas')
            .optional(),
        isFrozen: zod_1.z.boolean().optional(),
        adminNotes: zod_1.z.string()
            .max(500, 'Notas no pueden exceder 500 caracteres')
            .optional()
    }),
    params: zod_1.z.object({
        userId: zod_1.z.string().uuid('ID de usuario no válido')
    })
});
// Validación para subida de comprobantes
exports.uploadProofSchema = zod_1.z.object({
    body: zod_1.z.object({
        depositRequestId: zod_1.z.string().uuid('ID de solicitud no válido'),
        proofType: zod_1.z.enum(['USER_PROOF', 'ADMIN_PROOF']).optional().default('USER_PROOF')
    })
});
//# sourceMappingURL=paymentSchemas.js.map