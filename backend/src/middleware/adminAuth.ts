import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS } from '@/utils/constants';
import { logger } from '@/utils/structuredLogger';
import { AuthRequest } from '@/types/auth';

/**
 * Middleware para verificar que el usuario tenga permisos de administrador
 */
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    // Verificar que el usuario esté autenticado
    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Acceso no autorizado - usuario no autenticado'
      });
      return;
    }

    // Verificar que tenga rol de admin
    if (req.user.role !== 'ADMIN') {
      logger.warn('Intento de acceso no autorizado a endpoint admin', {
        userId: req.user.userId,
        username: req.user.username,
        role: req.user.role,
        endpoint: req.originalUrl,
        method: req.method,
        ip: req.ip
      });

      res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'Acceso denegado - permisos de administrador requeridos'
      });
      return;
    }

    // Log de acceso autorizado
    logger.info('Acceso admin autorizado', {
      adminId: req.user.userId,
      username: req.user.username,
      endpoint: req.originalUrl,
      method: req.method,
      ip: req.ip
    });

    next();
  } catch (error) {
    logger.error('Error en middleware de autenticación admin', error, {
      userId: req.user?.userId,
      endpoint: req.originalUrl
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

/**
 * Middleware combinado: autenticación + admin
 * Usa este cuando necesites ambos en una sola línea
 */
export const authenticateAdmin = [
  // Aquí deberías importar y usar tu middleware de authenticate existente
  // Por ahora asumo que ya está aplicado antes de este middleware
  requireAdmin
];

// Alias for compatibility
export const adminAuth = requireAdmin;

/**
 * Crear log de auditoría para acciones administrativas
 */
export const createAdminAuditLog = async (
  adminId: string,
  action: string,
  entity: string,
  entityId: string,
  details: object,
  ipAddress?: string
): Promise<void> => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        entity,
        entityId,
        description: `Acción administrativa: ${action}`,
        newValue: JSON.stringify(details),
        ipAddress: ipAddress || '127.0.0.1'
      }
    });

    logger.info('Log de auditoría admin creado', {
      adminId,
      action,
      entity,
      entityId
    });
  } catch (error) {
    logger.error('Error creando log de auditoría admin', error, {
      adminId,
      action
    });
  }
};

/**
 * Decorator para acciones que requieren auditoría
 */
export const withAdminAudit = (
  action: string,
  entity: string = 'UNKNOWN'
) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value;

    descriptor.value = async function (req: AuthRequest, res: Response, ...args: any[]) {
      const result = await method.apply(this, [req, res, ...args]);
      
      // Crear log de auditoría después de la acción
      try {
        await createAdminAuditLog(
          req.user.userId,
          action,
          entity,
          req.params?.id || req.body?.id || 'unknown',
          {
            endpoint: req.originalUrl,
            method: req.method,
            body: req.body,
            params: req.params
          },
          req.ip
        );
      } catch (error) {
        logger.error('Error en auditoría decorada', error);
      }

      return result;
    };
  };
};