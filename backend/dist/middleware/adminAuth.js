"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAdminAudit = exports.createAdminAuditLog = exports.adminAuth = exports.authenticateAdmin = exports.requireAdmin = void 0;
const constants_1 = require("@/utils/constants");
const structuredLogger_1 = require("@/utils/structuredLogger");
/**
 * Middleware para verificar que el usuario tenga permisos de administrador
 */
const requireAdmin = (req, res, next) => {
    try {
        // Verificar que el usuario esté autenticado
        if (!req.user) {
            res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                error: 'Acceso no autorizado - usuario no autenticado'
            });
            return;
        }
        // Verificar que tenga rol de admin
        if (req.user.role !== 'ADMIN') {
            structuredLogger_1.logger.warn('Intento de acceso no autorizado a endpoint admin', {
                userId: req.user.userId,
                username: req.user.username,
                role: req.user.role,
                endpoint: req.originalUrl,
                method: req.method,
                ip: req.ip
            });
            res.status(constants_1.HTTP_STATUS.FORBIDDEN).json({
                success: false,
                error: 'Acceso denegado - permisos de administrador requeridos'
            });
            return;
        }
        // Log de acceso autorizado
        structuredLogger_1.logger.info('Acceso admin autorizado', {
            adminId: req.user.userId,
            username: req.user.username,
            endpoint: req.originalUrl,
            method: req.method,
            ip: req.ip
        });
        next();
    }
    catch (error) {
        structuredLogger_1.logger.error('Error en middleware de autenticación admin', error, {
            userId: req.user?.userId,
            endpoint: req.originalUrl
        });
        res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
};
exports.requireAdmin = requireAdmin;
/**
 * Middleware combinado: autenticación + admin
 * Usa este cuando necesites ambos en una sola línea
 */
exports.authenticateAdmin = [
    // Aquí deberías importar y usar tu middleware de authenticate existente
    // Por ahora asumo que ya está aplicado antes de este middleware
    exports.requireAdmin
];
// Alias for compatibility
exports.adminAuth = exports.requireAdmin;
/**
 * Crear log de auditoría para acciones administrativas
 */
const createAdminAuditLog = async (adminId, action, entity, entityId, details, ipAddress) => {
    try {
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
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
        structuredLogger_1.logger.info('Log de auditoría admin creado', {
            adminId,
            action,
            entity,
            entityId
        });
    }
    catch (error) {
        structuredLogger_1.logger.error('Error creando log de auditoría admin', error, {
            adminId,
            action
        });
    }
};
exports.createAdminAuditLog = createAdminAuditLog;
/**
 * Decorator para acciones que requieren auditoría
 */
const withAdminAudit = (action, entity = 'UNKNOWN') => {
    return (target, propertyName, descriptor) => {
        const method = descriptor.value;
        descriptor.value = async function (req, res, ...args) {
            const result = await method.apply(this, [req, res, ...args]);
            // Crear log de auditoría después de la acción
            try {
                await (0, exports.createAdminAuditLog)(req.user.userId, action, entity, req.params?.id || req.body?.id || 'unknown', {
                    endpoint: req.originalUrl,
                    method: req.method,
                    body: req.body,
                    params: req.params
                }, req.ip);
            }
            catch (error) {
                structuredLogger_1.logger.error('Error en auditoría decorada', error);
            }
            return result;
        };
    };
};
exports.withAdminAudit = withAdminAudit;
//# sourceMappingURL=adminAuth.js.map