import { PrismaClient, PaymentReference } from '@prisma/client';
import { logger } from '@/utils/structuredLogger';
import crypto from 'crypto';

const prisma = new PrismaClient();

export class ReferenceService {
  /**
   * Genera un código de referencia único alfanumérico
   * Formato: BINGO-YYYYMMDD-XXXXX (ej: BINGO-20250108-A7K9M)
   */
  private generateReferenceCode(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `BINGO-${dateStr}-${randomStr}`;
  }

  /**
   * Genera referencia SHA-256 para depósitos bancarios
   * Combina: timestamp + userId + amount + secret
   */
  private generateSecureReference(userId: string, amount: number): string {
    const timestamp = Date.now();
    const secret = process.env.JWT_SECRET || 'default-secret';
    const data = `${timestamp}-${userId}-${amount}-${secret}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16).toUpperCase();
  }

  /**
   * Crear nueva referencia de pago
   */
  async createPaymentReference(data: {
    userId: string;
    amount: number;
    type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER';
    description: string;
    expirationHours?: number;
    metadata?: object;
  }): Promise<PaymentReference> {
    try {
      const code = this.generateReferenceCode();
      const secureRef = this.generateSecureReference(data.userId, data.amount);
      
      const expirationHours = data.expirationHours || 24;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expirationHours);

      const reference = await prisma.paymentReference.create({
        data: {
          code,
          type: data.type,
          userId: data.userId,
          amount: data.amount,
          description: data.description,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          expiresAt,
          isUsed: false
        }
      });

      logger.info('Referencia de pago creada', {
        referenceId: reference.id,
        code: reference.code,
        type: data.type,
        userId: data.userId,
        amount: data.amount
      });

      return reference;
    } catch (error) {
      logger.error('Error creando referencia de pago', error, { userId: data.userId });
      throw new Error('Error generando referencia de pago');
    }
  }

  /**
   * Buscar referencia por código
   */
  async findByCode(code: string): Promise<PaymentReference | null> {
    try {
      const reference = await prisma.paymentReference.findUnique({
        where: { code }
      });

      return reference;
    } catch (error) {
      logger.error('Error buscando referencia', error, { code });
      throw new Error('Error buscando referencia de pago');
    }
  }

  /**
   * Marcar referencia como utilizada
   */
  async markAsUsed(referenceId: string): Promise<PaymentReference> {
    try {
      const reference = await prisma.paymentReference.update({
        where: { id: referenceId },
        data: {
          isUsed: true,
          usedAt: new Date()
        }
      });

      logger.info('Referencia marcada como utilizada', {
        referenceId,
        code: reference.code
      });

      return reference;
    } catch (error) {
      logger.error('Error marcando referencia como usada', error, { referenceId });
      throw new Error('Error actualizando referencia');
    }
  }

  /**
   * Verificar si una referencia es válida
   */
  async isValidReference(code: string): Promise<{
    valid: boolean;
    reason?: string;
    reference?: PaymentReference;
  }> {
    try {
      const reference = await this.findByCode(code);

      if (!reference) {
        return { valid: false, reason: 'Referencia no encontrada' };
      }

      if (reference.isUsed) {
        return { valid: false, reason: 'Referencia ya utilizada' };
      }

      if (new Date() > reference.expiresAt) {
        return { valid: false, reason: 'Referencia expirada' };
      }

      return { valid: true, reference };
    } catch (error) {
      logger.error('Error validando referencia', error, { code });
      return { valid: false, reason: 'Error validando referencia' };
    }
  }

  /**
   * Limpiar referencias expiradas (tarea de mantenimiento)
   */
  async cleanupExpiredReferences(): Promise<number> {
    try {
      const result = await prisma.paymentReference.deleteMany({
        where: {
          AND: [
            { expiresAt: { lt: new Date() } },
            { isUsed: false }
          ]
        }
      });

      logger.info('Referencias expiradas limpiadas', {
        deletedCount: result.count
      });

      return result.count;
    } catch (error) {
      logger.error('Error limpiando referencias expiradas', error);
      throw new Error('Error en limpieza de referencias');
    }
  }

  /**
   * Obtener referencias por usuario
   */
  async getUserReferences(userId: string, options?: {
    type?: string;
    includeExpired?: boolean;
    limit?: number;
  }): Promise<PaymentReference[]> {
    try {
      const whereClause: any = { userId };

      if (options?.type) {
        whereClause.type = options.type;
      }

      if (!options?.includeExpired) {
        whereClause.expiresAt = { gt: new Date() };
      }

      const references = await prisma.paymentReference.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50
      });

      return references;
    } catch (error) {
      logger.error('Error obteniendo referencias de usuario', error, { userId });
      throw new Error('Error consultando referencias');
    }
  }

  /**
   * Generar referencia bancaria específica para Perú
   * Formato especial para bancos peruanos con validación
   */
  async generateBankingReference(data: {
    userId: string;
    amount: number;
    bankCode: string;
    depositRequestId: string;
  }): Promise<{
    code: string;
    displayCode: string;
    validationCode: string;
  }> {
    try {
      // Código principal del sistema
      const mainCode = this.generateReferenceCode();
      
      // Código para mostrar al usuario (más simple)
      const timestamp = Date.now().toString().slice(-8);
      const displayCode = `BP${timestamp}`;
      
      // Código de validación interno
      const validationData = `${data.depositRequestId}-${data.bankCode}-${data.amount}`;
      const validationCode = crypto
        .createHash('md5')
        .update(validationData)
        .digest('hex')
        .substring(0, 8)
        .toUpperCase();

      // Crear referencia en base de datos
      await this.createPaymentReference({
        userId: data.userId,
        amount: data.amount,
        type: 'DEPOSIT',
        description: `Depósito bancario ${data.bankCode}`,
        metadata: {
          bankCode: data.bankCode,
          depositRequestId: data.depositRequestId,
          displayCode,
          validationCode
        }
      });

      logger.info('Referencia bancaria generada', {
        mainCode,
        displayCode,
        bankCode: data.bankCode,
        userId: data.userId
      });

      return {
        code: mainCode,
        displayCode,
        validationCode
      };
    } catch (error) {
      logger.error('Error generando referencia bancaria', error, data);
      throw new Error('Error generando referencia bancaria');
    }
  }
}

export const referenceService = new ReferenceService();