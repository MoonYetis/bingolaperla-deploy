"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = exports.getCurrentUser = exports.authenticateToken = exports.adminAuthentication = exports.fullAuthentication = exports.verifyUserExists = exports.requireOwnershipOrAdmin = exports.requireAdmin = exports.optionalAuthenticate = exports.authenticate = void 0;
const authService_1 = require("@/services/authService");
const userService_1 = require("@/services/userService");
const constants_1 = require("@/utils/constants");
const structuredLogger_1 = require("@/utils/structuredLogger");
// Los tipos globales están definidos en @/types/auth
require("@/types/auth");
// Middleware para verificar autenticación
const authenticate = async (req, res, next) => {
    try {
        // Obtener token del header Authorization
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
                error: constants_1.ERROR_MESSAGES.UNAUTHORIZED,
                message: 'Token de acceso requerido'
            });
        }
        const token = authHeader.substring(7); // Remover 'Bearer '
        // Verificar si el token está en la blacklist
        const isBlacklisted = await authService_1.AuthService.isTokenBlacklisted(token);
        if (isBlacklisted) {
            return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
                error: constants_1.ERROR_MESSAGES.UNAUTHORIZED,
                message: 'Token inválido'
            });
        }
        // Verificar y decodificar el token
        const decoded = authService_1.AuthService.verifyAccessToken(token);
        // TODO: Temporalmente deshabilitado para desarrollo
        // Verificar que la sesión siga siendo válida
        // const isSessionValid = await AuthService.isSessionValid(decoded.userId);
        // if (!isSessionValid) {
        //   return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        //     error: ERROR_MESSAGES.UNAUTHORIZED,
        //     message: 'Sesión expirada'
        //   });
        // }
        // Actualizar última actividad de la sesión
        // await AuthService.updateSessionActivity(decoded.userId);
        // Agregar información del usuario a la request
        req.user = decoded;
        next();
    }
    catch (error) {
        structuredLogger_1.logUtils.authError(error, {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            endpoint: req.path
        });
        let message = 'Token inválido';
        if (error instanceof Error) {
            if (error.message === 'Token expirado') {
                message = 'Token expirado';
            }
            else if (error.message === 'Token inválido') {
                message = 'Token inválido';
            }
        }
        return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
            error: constants_1.ERROR_MESSAGES.UNAUTHORIZED,
            message
        });
    }
};
exports.authenticate = authenticate;
// Middleware para verificar autenticación opcional (el usuario puede o no estar autenticado)
const optionalAuthenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(); // Continuar sin usuario autenticado
        }
        const token = authHeader.substring(7);
        // Verificar si el token está en la blacklist
        const isBlacklisted = await authService_1.AuthService.isTokenBlacklisted(token);
        if (isBlacklisted) {
            return next(); // Continuar sin usuario autenticado
        }
        try {
            const decoded = authService_1.AuthService.verifyAccessToken(token);
            const isSessionValid = await authService_1.AuthService.isSessionValid(decoded.userId);
            if (isSessionValid) {
                await authService_1.AuthService.updateSessionActivity(decoded.userId);
                req.user = decoded;
            }
        }
        catch (error) {
            // Token inválido o expirado, continuar sin usuario autenticado
        }
        next();
    }
    catch (error) {
        structuredLogger_1.authLogger.error('Optional authentication middleware error', error, {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            endpoint: req.path
        });
        next(); // Continuar sin usuario autenticado
    }
};
exports.optionalAuthenticate = optionalAuthenticate;
// Middleware para verificar que el usuario es administrador
const requireAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
                error: constants_1.ERROR_MESSAGES.UNAUTHORIZED,
                message: 'Autenticación requerida'
            });
        }
        if (req.user.role !== constants_1.USER_ROLES.ADMIN) {
            return res.status(constants_1.HTTP_STATUS.FORBIDDEN).json({
                error: constants_1.ERROR_MESSAGES.UNAUTHORIZED,
                message: 'Permisos de administrador requeridos'
            });
        }
        next();
    }
    catch (error) {
        structuredLogger_1.authLogger.error('Admin middleware error', error, {
            userId: req.user?.userId,
            endpoint: req.path
        });
        return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: constants_1.ERROR_MESSAGES.INTERNAL_ERROR
        });
    }
};
exports.requireAdmin = requireAdmin;
// Middleware para verificar que el usuario es el propietario del recurso o admin
const requireOwnershipOrAdmin = (userIdParam = 'id') => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
                    error: constants_1.ERROR_MESSAGES.UNAUTHORIZED,
                    message: 'Autenticación requerida'
                });
            }
            const resourceUserId = req.params[userIdParam];
            const currentUserId = req.user.userId;
            const isAdmin = req.user.role === constants_1.USER_ROLES.ADMIN;
            if (currentUserId !== resourceUserId && !isAdmin) {
                return res.status(constants_1.HTTP_STATUS.FORBIDDEN).json({
                    error: constants_1.ERROR_MESSAGES.UNAUTHORIZED,
                    message: 'No tienes permisos para acceder a este recurso'
                });
            }
            next();
        }
        catch (error) {
            structuredLogger_1.authLogger.error('Ownership middleware error', error, {
                userId: req.user?.userId,
                endpoint: req.path,
                resourceUserId: req.params[userIdParam]
            });
            return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                error: constants_1.ERROR_MESSAGES.INTERNAL_ERROR
            });
        }
    };
};
exports.requireOwnershipOrAdmin = requireOwnershipOrAdmin;
// Middleware para verificar que el usuario existe en la base de datos
const verifyUserExists = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
                error: constants_1.ERROR_MESSAGES.UNAUTHORIZED,
                message: 'Autenticación requerida'
            });
        }
        const user = await userService_1.UserService.findUserById(req.user.userId);
        if (!user) {
            // Usuario no existe en la base de datos, invalidar token
            await authService_1.AuthService.invalidateTokens(req.user.userId);
            return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
                error: constants_1.ERROR_MESSAGES.UNAUTHORIZED,
                message: 'Usuario no encontrado'
            });
        }
        next();
    }
    catch (error) {
        structuredLogger_1.authLogger.error('User verification error', error, {
            userId: req.user?.userId,
            endpoint: req.path
        });
        return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: constants_1.ERROR_MESSAGES.INTERNAL_ERROR
        });
    }
};
exports.verifyUserExists = verifyUserExists;
// Middleware combinado para autenticación completa
exports.fullAuthentication = [exports.authenticate, exports.verifyUserExists];
// Middleware combinado para autenticación de admin
exports.adminAuthentication = [exports.authenticate, exports.verifyUserExists, exports.requireAdmin];
// Crear alias para compatibilidad con rutas existentes
exports.authenticateToken = exports.authenticate;
// Función helper para obtener el usuario actual desde el token
const getCurrentUser = async (req) => {
    if (!req.user) {
        return null;
    }
    try {
        return await userService_1.UserService.findUserById(req.user.userId);
    }
    catch (error) {
        structuredLogger_1.authLogger.error('Get current user error', error, {
            userId: req.user?.userId
        });
        return null;
    }
};
exports.getCurrentUser = getCurrentUser;
// Export authMiddleware as function that returns authenticate middleware
const authMiddleware = (options) => exports.authenticate;
exports.authMiddleware = authMiddleware;
//# sourceMappingURL=auth.js.map