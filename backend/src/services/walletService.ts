import { PrismaClient, Wallet, Transaction } from '@prisma/client';
import { logger } from '@/utils/structuredLogger';

const prisma = new PrismaClient();

export class WalletService {
  /**
   * Obtener billetera por ID de usuario
   */
  async getByUserId(userId: string): Promise<Wallet | null> {
    try {
      const wallet = await prisma.wallet.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              isActive: true
            }
          }
        }
      });

      return wallet;
    } catch (error) {
      logger.error('Error obteniendo billetera', error, { userId });
      throw new Error('Error consultando billetera');
    }
  }

  /**
   * Crear billetera para usuario nuevo
   */
  async createWallet(userId: string, initialBalance = 0.00): Promise<Wallet> {
    try {
      // Verificar que el usuario existe
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Verificar que no tenga billetera ya
      const existingWallet = await this.getByUserId(userId);
      if (existingWallet) {
        throw new Error('El usuario ya tiene una billetera');
      }

      const wallet = await prisma.wallet.create({
        data: {
          userId,
          balance: initialBalance,
          dailyLimit: 1000.00,
          monthlyLimit: 20000.00,
          isActive: true,
          isFrozen: false
        }
      });

      logger.info('Billetera creada', {
        walletId: wallet.id,
        userId,
        initialBalance
      });

      return wallet;
    } catch (error) {
      logger.error('Error creando billetera', error, { userId });
      throw error;
    }
  }

  /**
   * Obtener balance actual de Perlas
   */
  async getBalance(userId: string): Promise<{
    balance: number;
    dailyLimit: number;
    monthlyLimit: number;
    isActive: boolean;
    isFrozen: boolean;
  }> {
    try {
      const wallet = await this.getByUserId(userId);
      
      if (!wallet) {
        throw new Error('Billetera no encontrada');
      }

      return {
        balance: parseFloat(wallet.balance.toString()),
        dailyLimit: parseFloat(wallet.dailyLimit.toString()),
        monthlyLimit: parseFloat(wallet.monthlyLimit.toString()),
        isActive: wallet.isActive,
        isFrozen: wallet.isFrozen
      };
    } catch (error) {
      logger.error('Error obteniendo balance', error, { userId });
      throw error;
    }
  }

  /**
   * Acreditar Perlas a la billetera (por recarga aprobada)
   */
  async creditPearls(
    userId: string, 
    amount: number, 
    description: string,
    referenceId?: string,
    adminId?: string
  ): Promise<{
    wallet: Wallet;
    transaction: Transaction;
    newBalance: number;
  }> {
    try {
      if (amount <= 0) {
        throw new Error('El monto debe ser mayor a 0');
      }

      const result = await prisma.$transaction(async (tx) => {
        // Obtener billetera actual
        const wallet = await tx.wallet.findUnique({
          where: { userId }
        });

        if (!wallet) {
          throw new Error('Billetera no encontrada');
        }

        if (!wallet.isActive || wallet.isFrozen) {
          throw new Error('Billetera no activa o congelada');
        }

        // Actualizar balance
        const newBalance = parseFloat(wallet.balance.toString()) + amount;
        const updatedWallet = await tx.wallet.update({
          where: { userId },
          data: { balance: newBalance }
        });

        // Crear transacción de crédito
        const transaction = await tx.transaction.create({
          data: {
            userId,
            type: 'PEARL_PURCHASE',
            amount: amount,
            pearlsAmount: amount,
            description,
            status: 'COMPLETED',
            referenceId,
            paymentMethod: 'BANK_DEPOSIT'
          }
        });

        return { wallet: updatedWallet, transaction, newBalance };
      });

      // Log de auditoría
      await this.createAuditLog(userId, 'PEARLS_CREDITED', {
        amount,
        newBalance: result.newBalance,
        description,
        adminId,
        transactionId: result.transaction.id
      });

      logger.info('Perlas acreditadas', {
        userId,
        amount,
        newBalance: result.newBalance,
        transactionId: result.transaction.id
      });

      return result;
    } catch (error) {
      logger.error('Error acreditando Perlas', error, { userId, amount });
      throw error;
    }
  }

  /**
   * Debitar Perlas de la billetera (por compra de cartones o retiro)
   */
  async debitPearls(
    userId: string,
    amount: number,
    description: string,
    type: 'CARD_PURCHASE' | 'WITHDRAWAL' | 'PEARL_TRANSFER' = 'CARD_PURCHASE',
    referenceId?: string,
    toUserId?: string
  ): Promise<{
    wallet: Wallet;
    transaction: Transaction;
    newBalance: number;
  }> {
    try {
      if (amount <= 0) {
        throw new Error('El monto debe ser mayor a 0');
      }

      const result = await prisma.$transaction(async (tx) => {
        // Obtener billetera actual
        const wallet = await tx.wallet.findUnique({
          where: { userId }
        });

        if (!wallet) {
          throw new Error('Billetera no encontrada');
        }

        if (!wallet.isActive || wallet.isFrozen) {
          throw new Error('Billetera no activa o congelada');
        }

        const currentBalance = parseFloat(wallet.balance.toString());
        
        if (currentBalance < amount) {
          throw new Error('Saldo insuficiente en Perlas');
        }

        // Actualizar balance
        const newBalance = currentBalance - amount;
        const updatedWallet = await tx.wallet.update({
          where: { userId },
          data: { balance: newBalance }
        });

        // Crear transacción de débito
        const transaction = await tx.transaction.create({
          data: {
            userId,
            type,
            amount: amount,
            pearlsAmount: amount,
            description,
            status: 'COMPLETED',
            referenceId,
            toUserId,
            paymentMethod: 'PEARLS'
          }
        });

        return { wallet: updatedWallet, transaction, newBalance };
      });

      // Log de auditoría
      await this.createAuditLog(userId, 'PEARLS_DEBITED', {
        amount,
        newBalance: result.newBalance,
        description,
        type,
        transactionId: result.transaction.id
      });

      logger.info('Perlas debitadas', {
        userId,
        amount,
        newBalance: result.newBalance,
        type,
        transactionId: result.transaction.id
      });

      return result;
    } catch (error) {
      logger.error('Error debitando Perlas', error, { userId, amount, type });
      throw error;
    }
  }

  /**
   * Transferencia P2P entre usuarios
   */
  async transferPearls(
    fromUserId: string,
    toUserId: string,
    amount: number,
    description: string,
    commission = 2.50
  ): Promise<{
    fromTransaction: Transaction;
    toTransaction: Transaction;
    commissionTransaction?: Transaction;
  }> {
    try {
      if (amount <= 0) {
        throw new Error('El monto debe ser mayor a 0');
      }

      if (fromUserId === toUserId) {
        throw new Error('No puedes transferir Perlas a ti mismo');
      }

      // Verificar que ambos usuarios existen y tienen billeteras
      const [fromWallet, toWallet] = await Promise.all([
        this.getByUserId(fromUserId),
        this.getByUserId(toUserId)
      ]);

      if (!fromWallet || !toWallet) {
        throw new Error('Una o ambas billeteras no existen');
      }

      const totalDebit = amount + commission;
      const currentBalance = parseFloat(fromWallet.balance.toString());

      if (currentBalance < totalDebit) {
        throw new Error(`Saldo insuficiente. Necesitas ${totalDebit} Perlas (${amount} + ${commission} comisión)`);
      }

      const result = await prisma.$transaction(async (tx) => {
        // Debitar del remitente (monto + comisión)
        await tx.wallet.update({
          where: { userId: fromUserId },
          data: { 
            balance: currentBalance - totalDebit
          }
        });

        // Acreditar al destinatario (solo el monto)
        const toBalance = parseFloat(toWallet.balance.toString());
        await tx.wallet.update({
          where: { userId: toUserId },
          data: { 
            balance: toBalance + amount
          }
        });

        // Transacción de débito del remitente
        const fromTransaction = await tx.transaction.create({
          data: {
            userId: fromUserId,
            type: 'PEARL_TRANSFER',
            amount: amount,
            pearlsAmount: amount,
            description: `Transferencia a usuario ${toUserId}: ${description}`,
            status: 'COMPLETED',
            fromUserId,
            toUserId,
            commissionAmount: commission,
            paymentMethod: 'PEARLS'
          }
        });

        // Transacción de crédito del destinatario
        const toTransaction = await tx.transaction.create({
          data: {
            userId: toUserId,
            type: 'PEARL_TRANSFER',
            amount: amount,
            pearlsAmount: amount,
            description: `Recibido de usuario ${fromUserId}: ${description}`,
            status: 'COMPLETED',
            fromUserId,
            toUserId,
            paymentMethod: 'PEARLS'
          }
        });

        // Transacción de comisión (si aplica)
        let commissionTransaction;
        if (commission > 0) {
          commissionTransaction = await tx.transaction.create({
            data: {
              userId: fromUserId,
              type: 'COMMISSION',
              amount: commission,
              pearlsAmount: commission,
              description: `Comisión por transferencia P2P`,
              status: 'COMPLETED',
              paymentMethod: 'PEARLS'
            }
          });
        }

        return { fromTransaction, toTransaction, commissionTransaction };
      });

      // Logs de auditoría
      await Promise.all([
        this.createAuditLog(fromUserId, 'P2P_TRANSFER_SENT', {
          amount,
          commission,
          toUserId,
          description,
          transactionId: result.fromTransaction.id
        }),
        this.createAuditLog(toUserId, 'P2P_TRANSFER_RECEIVED', {
          amount,
          fromUserId,
          description,
          transactionId: result.toTransaction.id
        })
      ]);

      logger.info('Transferencia P2P completada', {
        fromUserId,
        toUserId,
        amount,
        commission,
        fromTransactionId: result.fromTransaction.id,
        toTransactionId: result.toTransaction.id
      });

      return result;
    } catch (error) {
      logger.error('Error en transferencia P2P', error, { fromUserId, toUserId, amount });
      throw error;
    }
  }

  /**
   * Historial de transacciones de la billetera
   */
  async getTransactionHistory(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      type?: string;
      dateFrom?: Date;
      dateTo?: Date;
    }
  ): Promise<Transaction[]> {
    try {
      const whereClause: any = {
        OR: [
          { userId },
          { fromUserId: userId },
          { toUserId: userId }
        ]
      };

      if (options?.type) {
        whereClause.type = options.type;
      }

      if (options?.dateFrom || options?.dateTo) {
        whereClause.createdAt = {};
        if (options.dateFrom) whereClause.createdAt.gte = options.dateFrom;
        if (options.dateTo) whereClause.createdAt.lte = options.dateTo;
      }

      const transactions = await prisma.transaction.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
        include: {
          user: {
            select: { username: true }
          },
          fromUser: {
            select: { username: true }
          },
          toUser: {
            select: { username: true }
          }
        }
      });

      return transactions;
    } catch (error) {
      logger.error('Error obteniendo historial', error, { userId });
      throw new Error('Error consultando historial de transacciones');
    }
  }

  /**
   * Congelar/descongelar billetera (para casos de fraude)
   */
  async freezeWallet(userId: string, adminId: string, reason: string): Promise<Wallet> {
    try {
      const wallet = await prisma.wallet.update({
        where: { userId },
        data: { isFrozen: true }
      });

      await this.createAuditLog(userId, 'WALLET_FROZEN', {
        reason,
        adminId,
        walletId: wallet.id
      });

      logger.warn('Billetera congelada', { userId, adminId, reason });
      return wallet;
    } catch (error) {
      logger.error('Error congelando billetera', error, { userId });
      throw error;
    }
  }

  /**
   * Crear log de auditoría
   */
  private async createAuditLog(
    userId: string,
    action: string,
    details: object
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          entity: 'WALLET',
          entityId: userId,
          description: `Operación de billetera: ${action}`,
          newValue: JSON.stringify(details),
          ipAddress: '127.0.0.1' // TODO: obtener IP real
        }
      });
    } catch (error) {
      logger.error('Error creando log de auditoría', error);
    }
  }
}

export const walletService = new WalletService();