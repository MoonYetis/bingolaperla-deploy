import { Request, Response } from 'express';
import { logger } from '@/utils/structuredLogger';
import { HTTP_STATUS } from '@/utils/constants';
import { walletService } from '@/services/walletService';
import { getTransactionHistorySchema, createP2PTransferSchema } from '@/schemas/paymentSchemas';
import { AuthRequest } from '@/types/auth';

export class WalletController {
  /**
   * Obtener información de la billetera del usuario
   * GET /api/wallet
   */
  async getWalletInfo(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;

      // Obtener o crear billetera
      let wallet = await walletService.getByUserId(userId);
      
      if (!wallet) {
        wallet = await walletService.createWallet(userId);
      }

      const balance = await walletService.getBalance(userId);

      res.json({
        success: true,
        data: {
          id: wallet.id,
          userId: wallet.userId,
          balance: balance.balance,
          dailyLimit: balance.dailyLimit,
          monthlyLimit: balance.monthlyLimit,
          isActive: balance.isActive,
          isFrozen: balance.isFrozen,
          createdAt: wallet.createdAt,
          updatedAt: wallet.updatedAt
        }
      });

      logger.info('Información de billetera consultada', {
        userId,
        balance: balance.balance
      });
    } catch (error) {
      logger.error('Error obteniendo información de billetera', error, { userId: req.user.userId });
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Error consultando información de billetera'
      });
    }
  }

  /**
   * Obtener balance actual de Perlas
   * GET /api/wallet/balance
   */
  async getBalance(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      const balance = await walletService.getBalance(userId);

      res.json({
        success: true,
        data: {
          balance: balance.balance,
          dailyLimit: balance.dailyLimit,
          monthlyLimit: balance.monthlyLimit,
          isActive: balance.isActive,
          isFrozen: balance.isFrozen
        }
      });

      logger.info('Balance consultado', {
        userId,
        balance: balance.balance
      });
    } catch (error) {
      logger.error('Error obteniendo balance', error, { userId: req.user.userId });
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error consultando balance'
      });
    }
  }

  /**
   * Obtener historial de transacciones
   * GET /api/wallet/transactions
   */
  async getTransactionHistory(req: Request, res: Response): Promise<void> {
    try {
      // Parameters are already validated by middleware
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const type = req.query.type as string | undefined;
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;
      
      const userId = (req as AuthRequest).user.userId;

      const transactions = await walletService.getTransactionHistory(userId, {
        limit,
        offset,
        type,
        dateFrom,
        dateTo
      });

      // Formatear transacciones para el frontend
      const formattedTransactions = transactions.map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: parseFloat(tx.amount.toString()),
        pearlsAmount: tx.pearlsAmount ? parseFloat(tx.pearlsAmount.toString()) : null,
        description: tx.description,
        status: tx.status,
        paymentMethod: tx.paymentMethod,
        commissionAmount: tx.commissionAmount ? parseFloat(tx.commissionAmount.toString()) : null,
        referenceId: tx.referenceId,
        createdAt: tx.createdAt,
        fromUser: tx.fromUserId ? { id: tx.fromUserId } : null,
        toUser: tx.toUserId ? { id: tx.toUserId } : null,
        // Determinar si es entrada o salida de dinero
        isCredit: tx.userId === userId && ['PEARL_PURCHASE', 'PRIZE_PAYOUT'].includes(tx.type) ||
                 tx.toUserId === userId && tx.type === 'PEARL_TRANSFER',
        isDebit: tx.userId === userId && ['CARD_PURCHASE', 'WITHDRAWAL', 'COMMISSION'].includes(tx.type) ||
                tx.fromUserId === userId && tx.type === 'PEARL_TRANSFER'
      }));

      res.json({
        success: true,
        data: {
          transactions: formattedTransactions,
          pagination: {
            limit,
            offset,
            total: formattedTransactions.length
          }
        }
      });

      logger.info('Historial de transacciones consultado', {
        userId,
        limit,
        offset,
        type,
        resultCount: formattedTransactions.length
      });
    } catch (error) {
      logger.error('Error obteniendo historial', error, { userId: (req as AuthRequest).user.userId });
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Error consultando historial de transacciones'
      });
    }
  }

  /**
   * Realizar transferencia P2P entre usuarios
   * POST /api/wallet/transfer
   */
  async transferPearls(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      
      const validation = createP2PTransferSchema.safeParse({ body: req.body });
      
      if (!validation.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'Datos de transferencia inválidos',
          details: validation.error.errors
        });
        return;
      }

      const { toUsername, amount, description } = validation.data.body;
      const fromUserId = userId;

      // Buscar usuario destinatario
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      const toUser = await prisma.user.findUnique({
        where: { username: toUsername },
        select: { id: true, username: true, isActive: true }
      });

      if (!toUser) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: 'Usuario destinatario no encontrado'
        });
        return;
      }

      if (!toUser.isActive) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'Usuario destinatario no está activo'
        });
        return;
      }

      if (userId === toUser.id) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'No puedes transferir Perlas a ti mismo'
        });
        return;
      }

      // Obtener configuración de comisión
      const paymentConfig = await prisma.paymentConfiguration.findFirst();
      const commission = paymentConfig?.p2pTransferCommission || 2.50;

      // Realizar transferencia
      const result = await walletService.transferPearls(
        userId,
        toUser.id,
        amount,
        description,
        parseFloat(commission.toString())
      );

      res.json({
        success: true,
        message: 'Transferencia P2P realizada exitosamente',
        data: {
          fromTransactionId: result.fromTransaction.id,
          toTransactionId: result.toTransaction.id,
          amount,
          commission: parseFloat(commission.toString()),
          totalDebit: amount + parseFloat(commission.toString()),
          toUsername: toUser.username,
          description,
          timestamp: result.fromTransaction.createdAt
        }
      });

      logger.info('Transferencia P2P realizada', {
        fromUserId: userId,
        toUserId: toUser.id,
        toUsername: toUser.username,
        amount,
        commission: parseFloat(commission.toString()),
        description
      });

    } catch (error) {
      logger.error('Error en transferencia P2P', error, { 
        fromUserId: req.user.userId,
        amount: req.body.amount 
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Error procesando transferencia';
      const statusCode = errorMessage.includes('saldo insuficiente') || 
                        errorMessage.includes('Saldo insuficiente') ? 
                        HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR;

      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  }

  /**
   * Verificar si un username existe (para validación en frontend)
   * GET /api/wallet/verify-username/:username
   */
  async verifyUsername(req: Request, res: Response): Promise<void> {
    try {
      const { username } = req.params;
      const currentUserId = (req as AuthRequest).user.userId;

      if (!username || username.length < 3) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'Username debe tener al menos 3 caracteres'
        });
        return;
      }

      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      const user = await prisma.user.findUnique({
        where: { username },
        select: { 
          id: true, 
          username: true, 
          isActive: true,
          fullName: true 
        }
      });

      if (!user) {
        res.json({
          success: true,
          data: {
            exists: false,
            message: 'Usuario no encontrado'
          }
        });
        return;
      }

      if (user.id === currentUserId) {
        res.json({
          success: true,
          data: {
            exists: false,
            message: 'No puedes transferir a ti mismo'
          }
        });
        return;
      }

      if (!user.isActive) {
        res.json({
          success: true,
          data: {
            exists: false,
            message: 'Usuario no está activo'
          }
        });
        return;
      }

      res.json({
        success: true,
        data: {
          exists: true,
          username: user.username,
          fullName: user.fullName,
          message: 'Usuario válido para transferencias'
        }
      });

    } catch (error) {
      logger.error('Error verificando username', error, { username: req.params.username });
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Error verificando usuario'
      });
    }
  }
}

export const walletController = new WalletController();