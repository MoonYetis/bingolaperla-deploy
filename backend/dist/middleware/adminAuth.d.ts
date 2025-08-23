import { Response, NextFunction } from 'express';
import { AuthRequest } from '@/types/auth';
/**
 * Middleware para verificar que el usuario tenga permisos de administrador
 */
export declare const requireAdmin: (req: AuthRequest, res: Response, next: NextFunction) => void;
/**
 * Middleware combinado: autenticación + admin
 * Usa este cuando necesites ambos en una sola línea
 */
export declare const authenticateAdmin: ((req: AuthRequest, res: Response, next: NextFunction) => void)[];
export declare const adminAuth: (req: AuthRequest, res: Response, next: NextFunction) => void;
/**
 * Crear log de auditoría para acciones administrativas
 */
export declare const createAdminAuditLog: (adminId: string, action: string, entity: string, entityId: string, details: object, ipAddress?: string) => Promise<void>;
/**
 * Decorator para acciones que requieren auditoría
 */
export declare const withAdminAudit: (action: string, entity?: string) => (target: any, propertyName: string, descriptor: PropertyDescriptor) => void;
//# sourceMappingURL=adminAuth.d.ts.map