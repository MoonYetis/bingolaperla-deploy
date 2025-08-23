import { z } from 'zod';

// Validaciones para solicitudes de depósito
export const createDepositRequestSchema = z.object({
  body: z.object({
    amount: z.number()
      .min(10, 'Monto mínimo: S/ 10.00')
      .max(5000, 'Monto máximo: S/ 5,000.00')
      .multipleOf(0.01, 'Monto debe tener máximo 2 decimales'),
    
    paymentMethod: z.enum(['BCP', 'BBVA', 'INTERBANK', 'SCOTIABANK', 'YAPE', 'PLIN'], {
      errorMap: () => ({ message: 'Método de pago no válido' })
    }),
    
    bankAccount: z.string().optional(),
    
    userNotes: z.string()
      .max(500, 'Notas no pueden exceder 500 caracteres')
      .optional()
  })
});

// Validaciones para solicitudes de retiro
export const createWithdrawalRequestSchema = z.object({
  body: z.object({
    pearlsAmount: z.number()
      .min(50, 'Monto mínimo de retiro: 50 Perlas')
      .max(10000, 'Monto máximo de retiro: 10,000 Perlas')
      .multipleOf(0.01, 'Monto debe tener máximo 2 decimales'),
    
    bankCode: z.enum(['BCP', 'BBVA', 'INTERBANK', 'SCOTIABANK'], {
      errorMap: () => ({ message: 'Banco no válido para retiros' })
    }),
    
    accountNumber: z.string()
      .min(10, 'Número de cuenta muy corto')
      .max(20, 'Número de cuenta muy largo')
      .regex(/^[0-9]+$/, 'Número de cuenta solo puede contener dígitos'),
    
    accountType: z.enum(['SAVINGS', 'CHECKING'], {
      errorMap: () => ({ message: 'Tipo de cuenta debe ser SAVINGS o CHECKING' })
    }),
    
    accountHolderName: z.string()
      .min(3, 'Nombre del titular muy corto')
      .max(100, 'Nombre del titular muy largo')
      .regex(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/, 'Nombre solo puede contener letras y espacios'),
    
    accountHolderDni: z.string()
      .length(8, 'DNI debe tener exactamente 8 dígitos')
      .regex(/^[0-9]+$/, 'DNI solo puede contener dígitos'),
    
    userNotes: z.string()
      .max(500, 'Notas no pueden exceder 500 caracteres')
      .optional()
  })
});

// Validaciones para transferencias P2P
export const createP2PTransferSchema = z.object({
  body: z.object({
    toUsername: z.string()
      .min(3, 'Username del destinatario muy corto')
      .max(50, 'Username del destinatario muy largo'),
    
    amount: z.number()
      .min(1, 'Monto mínimo de transferencia: 1 Perla')
      .max(1000, 'Monto máximo de transferencia: 1,000 Perlas')
      .multipleOf(0.01, 'Monto debe tener máximo 2 decimales'),
    
    description: z.string()
      .min(5, 'Descripción muy corta')
      .max(200, 'Descripción muy larga'),
    
    confirmTransfer: z.boolean()
      .refine(val => val === true, 'Debes confirmar la transferencia')
  })
});

// Validaciones para aprobación de depósito (Admin)
export const approveDepositSchema = z.object({
  body: z.object({
    bankReference: z.string()
      .min(3, 'Referencia bancaria muy corta')
      .max(50, 'Referencia bancaria muy larga')
      .optional(),
    
    adminNotes: z.string()
      .max(1000, 'Notas de admin no pueden exceder 1000 caracteres')
      .optional(),
    
    proofImageUrl: z.string()
      .url('URL de comprobante no válida')
      .optional()
  }),
  
  params: z.object({
    depositRequestId: z.string().uuid('ID de solicitud no válido')
  })
});

// Validaciones para rechazo de depósito (Admin)
export const rejectDepositSchema = z.object({
  body: z.object({
    reason: z.string()
      .min(10, 'Razón de rechazo muy corta')
      .max(500, 'Razón de rechazo muy larga')
  }),
  
  params: z.object({
    depositRequestId: z.string().uuid('ID de solicitud no válido')
  })
});

// Validaciones para aprobación de retiro (Admin)
export const approveWithdrawalSchema = z.object({
  body: z.object({
    bankTransactionId: z.string()
      .min(5, 'ID de transacción bancaria muy corto')
      .max(100, 'ID de transacción bancaria muy largo')
      .optional(),
    
    adminNotes: z.string()
      .max(1000, 'Notas de admin no pueden exceder 1000 caracteres')
      .optional(),
    
    transferProofUrl: z.string()
      .url('URL de comprobante de transferencia no válida')
      .optional()
  }),
  
  params: z.object({
    withdrawalRequestId: z.string().uuid('ID de solicitud no válido')
  })
});

// Validaciones para rechazo de retiro (Admin)
export const rejectWithdrawalSchema = z.object({
  body: z.object({
    reason: z.string()
      .min(10, 'Razón de rechazo muy corta')
      .max(500, 'Razón de rechazo muy larga')
  }),
  
  params: z.object({
    withdrawalRequestId: z.string().uuid('ID de solicitud no válido')
  })
});

// Validaciones para consultas de historial
export const getTransactionHistorySchema = z.object({
  limit: z.string()
    .transform(val => parseInt(val))
    .pipe(z.number().min(1).max(100))
    .optional()
    .default('50'),
  
  offset: z.string()
    .transform(val => parseInt(val))
    .pipe(z.number().min(0))
    .optional()
    .default('0'),
  
  type: z.enum([
    'CARD_PURCHASE', 
    'PRIZE_PAYOUT', 
    'PEARL_PURCHASE', 
    'PEARL_TRANSFER', 
    'WITHDRAWAL'
  ]).optional(),
  
  dateFrom: z.string()
    .datetime('Fecha desde no válida')
    .transform(val => new Date(val))
    .optional(),
  
  dateTo: z.string()
    .datetime('Fecha hasta no válida')
    .transform(val => new Date(val))
    .optional()
});

// Validaciones para consultas administrativas
export const adminListDepositsSchema = z.object({
  query: z.object({
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED'])
      .optional(),
    
    paymentMethod: z.enum(['BCP', 'BBVA', 'INTERBANK', 'SCOTIABANK', 'YAPE', 'PLIN'])
      .optional(),
    
    limit: z.string()
      .transform(val => parseInt(val))
      .pipe(z.number().min(1).max(100))
      .optional()
      .default('50'),
    
    offset: z.string()
      .transform(val => parseInt(val))
      .pipe(z.number().min(0))
      .optional()
      .default('0'),
    
    dateFrom: z.string()
      .datetime('Fecha desde no válida')
      .transform(val => new Date(val))
      .optional(),
    
    dateTo: z.string()
      .datetime('Fecha hasta no válida')
      .transform(val => new Date(val))
      .optional()
  })
});

// Validaciones para configuración bancaria (Admin)
export const updateBankConfigSchema = z.object({
  body: z.object({
    bankName: z.string().min(3).max(100).optional(),
    accountNumber: z.string().min(10).max(20).optional(),
    accountType: z.enum(['SAVINGS', 'CHECKING']).optional(),
    accountHolderName: z.string().min(3).max(100).optional(),
    cci: z.string().min(15).max(25).optional(),
    isActive: z.boolean().optional(),
    minDeposit: z.number().min(1).optional(),
    maxDeposit: z.number().min(10).optional(),
    depositCommission: z.number().min(0).optional(),
    instructions: z.string().max(1000).optional()
  }),
  
  params: z.object({
    bankCode: z.enum(['BCP', 'BBVA', 'INTERBANK', 'SCOTIABANK'])
  })
});

// Validaciones para limites de billetera (Admin)
export const updateWalletLimitsSchema = z.object({
  body: z.object({
    dailyLimit: z.number()
      .min(100, 'Límite diario mínimo: 100 Perlas')
      .max(50000, 'Límite diario máximo: 50,000 Perlas')
      .optional(),
    
    monthlyLimit: z.number()
      .min(1000, 'Límite mensual mínimo: 1,000 Perlas')
      .max(500000, 'Límite mensual máximo: 500,000 Perlas')
      .optional(),
    
    isFrozen: z.boolean().optional(),
    
    adminNotes: z.string()
      .max(500, 'Notas no pueden exceder 500 caracteres')
      .optional()
  }),
  
  params: z.object({
    userId: z.string().uuid('ID de usuario no válido')
  })
});

// Validación para subida de comprobantes
export const uploadProofSchema = z.object({
  body: z.object({
    depositRequestId: z.string().uuid('ID de solicitud no válido'),
    proofType: z.enum(['USER_PROOF', 'ADMIN_PROOF']).optional().default('USER_PROOF')
  })
});

// Tipo derivado para TypeScript
export type CreateDepositRequestInput = z.infer<typeof createDepositRequestSchema>['body'];
export type CreateWithdrawalRequestInput = z.infer<typeof createWithdrawalRequestSchema>['body'];
export type CreateP2PTransferInput = z.infer<typeof createP2PTransferSchema>['body'];
export type ApproveDepositInput = z.infer<typeof approveDepositSchema>['body'];
export type RejectDepositInput = z.infer<typeof rejectDepositSchema>['body'];