import { PrismaClient, DepositRequest, WithdrawalRequest, BankConfiguration } from '@prisma/client';
import { logger } from '@/utils/structuredLogger';
import { referenceService } from './referenceService';
import { walletService } from './walletService';

const prisma = new PrismaClient();

export class PaymentService {
  /**
   * Obtener configuraciones bancarias activas
   */
  async getActiveBankConfigurations(): Promise<BankConfiguration[]> {
    try {
      const banks = await prisma.bankConfiguration.findMany({
        where: { isActive: true },
        orderBy: { bankName: 'asc' }
      });

      return banks;
    } catch (error) {
      logger.error('Error obteniendo configuraciones bancarias', error);
      throw new Error('Error consultando bancos disponibles');
    }
  }

  /**
   * Crear solicitud de depósito (recarga de Perlas)
   */
  async createDepositRequest(data: {
    userId: string;
    amount: number;
    paymentMethod: string; // BCP, BBVA, INTERBANK, SCOTIABANK, YAPE, PLIN
    bankAccount?: string;
  }): Promise<{
    depositRequest: DepositRequest;
    referenceCode: string;
    bankInstructions: object;
  }> {
    try {
      if (data.amount < 10.00 || data.amount > 5000.00) {
        throw new Error('Monto debe estar entre S/ 10.00 y S/ 5,000.00');
      }

      // Obtener configuración bancaria
      let bankConfig = null;
      if (['BCP', 'BBVA', 'INTERBANK', 'SCOTIABANK'].includes(data.paymentMethod)) {
        bankConfig = await prisma.bankConfiguration.findUnique({
          where: { bankCode: data.paymentMethod }
        });

        if (!bankConfig || !bankConfig.isActive) {
          throw new Error(`Banco ${data.paymentMethod} no disponible`);
        }
      }

      const result = await prisma.$transaction(async (tx) => {
        // Crear solicitud de depósito
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // Expira en 24 horas

        const depositRequest = await tx.depositRequest.create({
          data: {
            userId: data.userId,
            amount: data.amount,
            pearlsAmount: data.amount, // 1:1 ratio
            currency: 'PEN',
            paymentMethod: data.paymentMethod,
            bankAccount: bankConfig?.accountNumber || null,
            bankAccountName: bankConfig?.accountHolderName || null,
            referenceCode: '', // Se actualizará después
            status: 'PENDING',
            expiresAt
          }
        });

        // Generar referencia única
        const references = await referenceService.generateBankingReference({
          userId: data.userId,
          amount: data.amount,
          bankCode: data.paymentMethod,
          depositRequestId: depositRequest.id
        });

        // Actualizar solicitud con código de referencia
        const updatedDepositRequest = await tx.depositRequest.update({
          where: { id: depositRequest.id },
          data: { referenceCode: references.displayCode }
        });

        return { depositRequest: updatedDepositRequest, references, bankConfig };
      });

      // Preparar instrucciones para el usuario
      const bankInstructions = this.prepareBankInstructions(
        data.paymentMethod,
        result.bankConfig,
        result.references.displayCode,
        data.amount
      );

      logger.info('Solicitud de depósito creada', {
        depositRequestId: result.depositRequest.id,
        userId: data.userId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        referenceCode: result.references.displayCode
      });

      return {
        depositRequest: result.depositRequest,
        referenceCode: result.references.displayCode,
        bankInstructions
      };
    } catch (error) {
      logger.error('Error creando solicitud de depósito', error, data);
      throw error;
    }
  }

  /**
   * Crear solicitud de retiro
   */
  async createWithdrawalRequest(data: {
    userId: string;
    pearlsAmount: number;
    bankCode: string;
    accountNumber: string;
    accountType: 'SAVINGS' | 'CHECKING';
    accountHolderName: string;
    accountHolderDni: string;
  }): Promise<WithdrawalRequest> {
    try {
      if (data.pearlsAmount < 50.00) {
        throw new Error('Monto mínimo de retiro: 50 Perlas');
      }

      // Verificar saldo suficiente
      const balance = await walletService.getBalance(data.userId);
      if (balance.balance < data.pearlsAmount) {
        throw new Error('Saldo insuficiente en Perlas');
      }

      // Calcular comisión (2% mínimo S/ 5.00)
      const commissionRate = 0.02;
      const calculatedCommission = data.pearlsAmount * commissionRate;
      const commission = Math.max(calculatedCommission, 5.00);
      const netAmount = data.pearlsAmount - commission;

      if (netAmount <= 0) {
        throw new Error('Monto neto después de comisión debe ser positivo');
      }

      const result = await prisma.$transaction(async (tx) => {
        // Generar referencia única
        const reference = await referenceService.createPaymentReference({
          userId: data.userId,
          amount: data.pearlsAmount,
          type: 'WITHDRAWAL',
          description: `Retiro de ${data.pearlsAmount} Perlas`
        });

        // Crear solicitud de retiro
        const withdrawalRequest = await tx.withdrawalRequest.create({
          data: {
            userId: data.userId,
            pearlsAmount: data.pearlsAmount,
            amountInSoles: data.pearlsAmount, // 1:1 ratio
            commission,
            netAmount,
            bankCode: data.bankCode,
            accountNumber: data.accountNumber,
            accountType: data.accountType,
            accountHolderName: data.accountHolderName,
            accountHolderDni: data.accountHolderDni,
            referenceCode: reference.code,
            status: 'PENDING'
          }
        });

        // Congelar las Perlas (crear transacción pendiente)
        await tx.transaction.create({
          data: {
            userId: data.userId,
            type: 'WITHDRAWAL',
            amount: data.pearlsAmount,
            pearlsAmount: data.pearlsAmount,
            description: `Solicitud de retiro - ${reference.code}`,
            status: 'PENDING',
            referenceId: reference.id,
            paymentMethod: 'BANK_TRANSFER'
          }
        });

        return withdrawalRequest;
      });

      logger.info('Solicitud de retiro creada', {
        withdrawalRequestId: result.id,
        userId: data.userId,
        pearlsAmount: data.pearlsAmount,
        netAmount,
        commission
      });

      return result;
    } catch (error) {
      logger.error('Error creando solicitud de retiro', error, data);
      throw error;
    }
  }

  /**
   * Aprobar solicitud de depósito (Admin)
   */
  async approveDeposit(
    depositRequestId: string,
    adminId: string,
    bankReference?: string,
    adminNotes?: string
  ): Promise<{
    depositRequest: DepositRequest;
    creditResult: any;
  }> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Obtener solicitud de depósito
        const depositRequest = await tx.depositRequest.findUnique({
          where: { id: depositRequestId },
          include: { user: true }
        });

        if (!depositRequest) {
          throw new Error('Solicitud de depósito no encontrada');
        }

        if (depositRequest.status !== 'PENDING') {
          throw new Error('Solicitud ya procesada');
        }

        if (new Date() > depositRequest.expiresAt) {
          throw new Error('Solicitud de depósito expirada');
        }

        // Actualizar solicitud como aprobada
        const updatedDepositRequest = await tx.depositRequest.update({
          where: { id: depositRequestId },
          data: {
            status: 'APPROVED',
            validatedBy: adminId,
            validatedAt: new Date(),
            bankReference,
            adminNotes: adminNotes || 'Depósito aprobado por admin'
          }
        });

        return { depositRequest: updatedDepositRequest };
      });

      // Acreditar Perlas a la billetera del usuario
      const creditResult = await walletService.creditPearls(
        result.depositRequest.userId,
        parseFloat(result.depositRequest.pearlsAmount.toString()),
        `Recarga aprobada - Ref: ${result.depositRequest.referenceCode}`,
        result.depositRequest.referenceCode,
        adminId
      );

      // Marcar referencia como utilizada
      const referenceValidation = await referenceService.isValidReference(
        result.depositRequest.referenceCode
      );
      if (referenceValidation.valid && referenceValidation.reference) {
        await referenceService.markAsUsed(referenceValidation.reference.id);
      }

      // Log de auditoría
      await this.createAuditLog(adminId, 'DEPOSIT_APPROVED', {
        depositRequestId,
        userId: result.depositRequest.userId,
        amount: result.depositRequest.amount,
        pearlsAmount: result.depositRequest.pearlsAmount,
        bankReference,
        adminNotes
      });

      logger.info('Depósito aprobado', {
        depositRequestId,
        userId: result.depositRequest.userId,
        amount: result.depositRequest.amount,
        adminId,
        bankReference
      });

      return { depositRequest: result.depositRequest, creditResult };
    } catch (error) {
      logger.error('Error aprobando depósito', error, { depositRequestId, adminId });
      throw error;
    }
  }

  /**
   * Rechazar solicitud de depósito (Admin)
   */
  async rejectDeposit(
    depositRequestId: string,
    adminId: string,
    reason: string
  ): Promise<DepositRequest> {
    try {
      const depositRequest = await prisma.depositRequest.update({
        where: { id: depositRequestId },
        data: {
          status: 'REJECTED',
          validatedBy: adminId,
          validatedAt: new Date(),
          adminNotes: reason
        }
      });

      // Log de auditoría
      await this.createAuditLog(adminId, 'DEPOSIT_REJECTED', {
        depositRequestId,
        userId: depositRequest.userId,
        amount: depositRequest.amount,
        reason
      });

      logger.info('Depósito rechazado', {
        depositRequestId,
        userId: depositRequest.userId,
        adminId,
        reason
      });

      return depositRequest;
    } catch (error) {
      logger.error('Error rechazando depósito', error, { depositRequestId, adminId });
      throw error;
    }
  }

  /**
   * Obtener solicitudes de depósito pendientes (Admin)
   */
  async getPendingDeposits(options?: {
    limit?: number;
    offset?: number;
    paymentMethod?: string;
  }): Promise<DepositRequest[]> {
    try {
      const whereClause: any = { status: 'PENDING' };

      if (options?.paymentMethod) {
        whereClause.paymentMethod = options.paymentMethod;
      }

      const deposits = await prisma.depositRequest.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              fullName: true
            }
          }
        },
        orderBy: { createdAt: 'asc' },
        take: options?.limit || 50,
        skip: options?.offset || 0
      });

      return deposits;
    } catch (error) {
      logger.error('Error obteniendo depósitos pendientes', error);
      throw new Error('Error consultando depósitos pendientes');
    }
  }

  /**
   * Obtener solicitudes de retiro pendientes (Admin)
   */
  async getPendingWithdrawals(options?: {
    limit?: number;
    offset?: number;
  }): Promise<WithdrawalRequest[]> {
    try {
      const withdrawals = await prisma.withdrawalRequest.findMany({
        where: { status: 'PENDING' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              fullName: true
            }
          }
        },
        orderBy: { createdAt: 'asc' },
        take: options?.limit || 50,
        skip: options?.offset || 0
      });

      return withdrawals;
    } catch (error) {
      logger.error('Error obteniendo retiros pendientes', error);
      throw new Error('Error consultando retiros pendientes');
    }
  }

  /**
   * Preparar instrucciones bancarias para el usuario
   */
  private prepareBankInstructions(
    paymentMethod: string,
    bankConfig: BankConfiguration | null,
    referenceCode: string,
    amount: number
  ): object {
    if (!bankConfig) {
      // Para Yape/Plin
      return {
        method: paymentMethod,
        instructions: [
          `Usar ${paymentMethod} para transferir S/ ${amount}`,
          'Número de destino: 999888777', // TODO: configurar número real
          `Incluir en concepto: ${referenceCode}`,
          'Tomar captura de pantalla del comprobante',
          'Subir evidencia en la aplicación'
        ],
        referenceCode,
        amount,
        timeLimit: '24 horas'
      };
    }

    return {
      method: paymentMethod,
      bankName: bankConfig.bankName,
      accountNumber: bankConfig.accountNumber,
      accountType: bankConfig.accountType === 'SAVINGS' ? 'Ahorros' : 'Corriente',
      accountHolderName: bankConfig.accountHolderName,
      cci: bankConfig.cci,
      instructions: [
        `Depositar/transferir S/ ${amount} a cuenta ${bankConfig.accountType === 'SAVINGS' ? 'de ahorros' : 'corriente'}`,
        `Banco: ${bankConfig.bankName}`,
        `Cuenta: ${bankConfig.accountNumber}`,
        `Titular: ${bankConfig.accountHolderName}`,
        `CCI (para interbancarias): ${bankConfig.cci}`,
        `**IMPORTANTE: Incluir código de referencia: ${referenceCode}**`,
        'Tomar foto clara del comprobante',
        'Subir evidencia antes de 24 horas'
      ],
      referenceCode,
      amount,
      timeLimit: '24 horas',
      additionalNotes: bankConfig.instructions || ''
    };
  }

  /**
   * Crear log de auditoría
   */
  private async createAuditLog(
    adminId: string,
    action: string,
    details: object
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          adminId,
          action,
          entity: 'PAYMENT',
          entityId: 'payment-operation',
          description: `Operación de pago: ${action}`,
          newValue: JSON.stringify(details),
          ipAddress: '127.0.0.1' // TODO: obtener IP real
        }
      });
    } catch (error) {
      logger.error('Error creando log de auditoría', error);
    }
  }
}

export const paymentService = new PaymentService();