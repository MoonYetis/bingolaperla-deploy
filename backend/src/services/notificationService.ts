import { logger } from '@/utils/structuredLogger';

export interface DepositNotification {
  amount: number;
  pearlsAmount: number;
  method: string;
  instant: boolean;
  referenceCode: string;
}

export class NotificationService {
  
  async sendDepositConfirmation(userId: string, data: DepositNotification): Promise<void> {
    try {
      logger.info('Sending deposit confirmation notification', {
        userId,
        amount: data.amount,
        method: data.method,
        referenceCode: data.referenceCode
      });

      // Send WebSocket notification if socket.io is available
      if (global.socketIO) {
        global.socketIO.to(`user-${userId}`).emit('deposit_confirmed', {
          type: 'DEPOSIT_CONFIRMED',
          data: {
            amount: data.amount,
            pearlsAmount: data.pearlsAmount,
            method: data.method,
            instant: data.instant,
            referenceCode: data.referenceCode,
            timestamp: new Date().toISOString()
          }
        });
      }

      // TODO: Add email notification if configured
      // await this.sendEmailNotification(userId, data);

      // TODO: Add SMS notification if configured  
      // await this.sendSMSNotification(userId, data);

    } catch (error) {
      logger.error('Failed to send deposit confirmation notification', error, { userId });
    }
  }

  async sendPaymentFailureNotification(userId: string, data: {
    amount: number;
    method: string;
    errorMessage: string;
    errorCode: string;
  }): Promise<void> {
    try {
      logger.info('Sending payment failure notification', {
        userId,
        amount: data.amount,
        method: data.method,
        errorCode: data.errorCode
      });

      // Send WebSocket notification
      if (global.socketIO) {
        global.socketIO.to(`user-${userId}`).emit('payment_failed', {
          type: 'PAYMENT_FAILED',
          data: {
            amount: data.amount,
            method: data.method,
            errorMessage: data.errorMessage,
            errorCode: data.errorCode,
            timestamp: new Date().toISOString()
          }
        });
      }

    } catch (error) {
      logger.error('Failed to send payment failure notification', error, { userId });
    }
  }
}

export default NotificationService;