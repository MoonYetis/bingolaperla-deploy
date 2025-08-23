"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const environment_1 = require("@/config/environment");
const redis_1 = require("@/config/redis");
const logger_1 = require("@/utils/logger");
const constants_1 = require("@/utils/constants");
class AuthService {
    // Generar JWT access token
    static generateAccessToken(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            type: constants_1.TOKEN_TYPES.ACCESS,
        };
        const options = {
            expiresIn: environment_1.env.JWT_EXPIRES_IN,
            issuer: 'bingo-backend',
            audience: 'bingo-frontend',
        };
        return jsonwebtoken_1.default.sign(payload, environment_1.env.JWT_SECRET, options);
    }
    // Generar JWT refresh token
    static generateRefreshToken(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            type: constants_1.TOKEN_TYPES.REFRESH,
        };
        const options = {
            expiresIn: environment_1.env.JWT_REFRESH_EXPIRES_IN,
            issuer: 'bingo-backend',
            audience: 'bingo-frontend',
        };
        return jsonwebtoken_1.default.sign(payload, environment_1.env.JWT_REFRESH_SECRET, options);
    }
    // Generar ambos tokens
    static async generateTokens(user) {
        try {
            const accessToken = this.generateAccessToken(user);
            const refreshToken = this.generateRefreshToken(user);
            // Guardar refresh token en Redis con TTL
            const refreshTokenKey = `refresh_token:${user.id}`;
            await redis_1.cacheService.set(refreshTokenKey, refreshToken, 7 * 24 * 60 * 60); // 7 días
            // Guardar información de sesión en Redis
            const sessionKey = `session:${user.id}`;
            await redis_1.cacheService.set(sessionKey, {
                userId: user.id,
                email: user.email,
                username: user.username,
                role: user.role,
                lastActivity: new Date().toISOString(),
            }, 24 * 60 * 60); // 24 horas
            logger_1.logger.info(`Tokens generados para usuario: ${user.email}`);
            return {
                accessToken,
                refreshToken,
                expiresIn: environment_1.env.JWT_EXPIRES_IN,
            };
        }
        catch (error) {
            logger_1.logger.error('Error al generar tokens:', error);
            throw new Error('Error al generar tokens de autenticación');
        }
    }
    // Verificar access token
    static verifyAccessToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, environment_1.env.JWT_SECRET, {
                issuer: 'bingo-backend',
                audience: 'bingo-frontend',
            });
            if (decoded.type !== constants_1.TOKEN_TYPES.ACCESS) {
                throw new Error('Tipo de token inválido');
            }
            return decoded;
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new Error('Token inválido');
            }
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new Error('Token expirado');
            }
            throw error;
        }
    }
    // Verificar refresh token
    static verifyRefreshToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, environment_1.env.JWT_REFRESH_SECRET, {
                issuer: 'bingo-backend',
                audience: 'bingo-frontend',
            });
            if (decoded.type !== constants_1.TOKEN_TYPES.REFRESH) {
                throw new Error('Tipo de token inválido');
            }
            return decoded;
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new Error('Refresh token inválido');
            }
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new Error('Refresh token expirado');
            }
            throw error;
        }
    }
    // Renovar access token usando refresh token
    static async refreshAccessToken(refreshToken) {
        try {
            // Verificar refresh token
            const decoded = this.verifyRefreshToken(refreshToken);
            // Verificar que el refresh token existe en Redis
            const refreshTokenKey = `refresh_token:${decoded.userId}`;
            const storedRefreshToken = await redis_1.cacheService.get(refreshTokenKey);
            if (!storedRefreshToken || storedRefreshToken !== refreshToken) {
                throw new Error('Refresh token inválido o expirado');
            }
            // Crear nuevo payload para access token
            const user = {
                id: decoded.userId,
                email: decoded.email,
                username: decoded.username,
                role: decoded.role,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            // Generar nuevo access token
            const newAccessToken = this.generateAccessToken(user);
            // Actualizar sesión en Redis
            const sessionKey = `session:${decoded.userId}`;
            await redis_1.cacheService.set(sessionKey, {
                userId: decoded.userId,
                email: decoded.email,
                username: decoded.username,
                role: decoded.role,
                lastActivity: new Date().toISOString(),
            }, 24 * 60 * 60);
            logger_1.logger.info(`Access token renovado para usuario: ${decoded.email}`);
            return {
                accessToken: newAccessToken,
                refreshToken, // El refresh token sigue siendo el mismo
                expiresIn: environment_1.env.JWT_EXPIRES_IN,
            };
        }
        catch (error) {
            logger_1.logger.error('Error al renovar access token:', error);
            throw error;
        }
    }
    // Invalidar tokens (logout)
    static async invalidateTokens(userId) {
        try {
            // Eliminar refresh token de Redis
            const refreshTokenKey = `refresh_token:${userId}`;
            await redis_1.cacheService.del(refreshTokenKey);
            // Eliminar sesión de Redis
            const sessionKey = `session:${userId}`;
            await redis_1.cacheService.del(sessionKey);
            // Eliminar todas las sesiones activas del usuario
            await redis_1.cacheService.delPattern(`session:${userId}:*`);
            logger_1.logger.info(`Tokens invalidados para usuario: ${userId}`);
        }
        catch (error) {
            logger_1.logger.error('Error al invalidar tokens:', error);
            throw error;
        }
    }
    // Verificar si un token ha sido invalidado (blacklist)
    static async isTokenBlacklisted(token) {
        try {
            const blacklistKey = `blacklist_token:${token}`;
            return await redis_1.cacheService.exists(blacklistKey);
        }
        catch (error) {
            logger_1.logger.error('Error al verificar blacklist de token:', error);
            return false;
        }
    }
    // Agregar token a blacklist
    static async blacklistToken(token, expiresIn = 24 * 60 * 60) {
        try {
            const blacklistKey = `blacklist_token:${token}`;
            await redis_1.cacheService.set(blacklistKey, true, expiresIn);
            logger_1.logger.info('Token agregado a blacklist');
        }
        catch (error) {
            logger_1.logger.error('Error al agregar token a blacklist:', error);
            throw error;
        }
    }
    // Verificar si una sesión es válida
    static async isSessionValid(userId) {
        try {
            const sessionKey = `session:${userId}`;
            const session = await redis_1.cacheService.get(sessionKey);
            return session !== null;
        }
        catch (error) {
            logger_1.logger.error('Error al verificar sesión:', error);
            return false;
        }
    }
    // Actualizar última actividad de la sesión
    static async updateSessionActivity(userId) {
        try {
            const sessionKey = `session:${userId}`;
            const session = await redis_1.cacheService.get(sessionKey);
            if (session) {
                session.lastActivity = new Date().toISOString();
                await redis_1.cacheService.set(sessionKey, session, 24 * 60 * 60);
            }
        }
        catch (error) {
            logger_1.logger.error('Error al actualizar actividad de sesión:', error);
        }
    }
    // Limpiar sesiones expiradas
    static async cleanupExpiredSessions() {
        try {
            // Esta función podría ejecutarse periódicamente con un cron job
            logger_1.logger.info('Limpieza de sesiones expiradas completada');
        }
        catch (error) {
            logger_1.logger.error('Error al limpiar sesiones expiradas:', error);
        }
    }
}
exports.AuthService = AuthService;
exports.default = AuthService;
//# sourceMappingURL=authService.js.map