import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '@/config/environment';
import { cacheService } from '@/config/redis';
import { logger } from '@/utils/logger';
import { UserResponse } from '@/schemas/authSchemas';
import { TOKEN_TYPES } from '@/utils/constants';

export interface TokenPayload {
  userId: string;
  email: string;
  username: string;
  role: string;
  type: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export class AuthService {
  // Generar JWT access token
  static generateAccessToken(user: UserResponse): string {
    const payload: TokenPayload = {
      userId: user.id as string,
      email: user.email as string,
      username: user.username as string,
      role: user.role as string,
      type: TOKEN_TYPES.ACCESS,
    };

    const options: any = {
      expiresIn: env.JWT_EXPIRES_IN,
      issuer: 'bingo-backend',
      audience: 'bingo-frontend',
    };

    return jwt.sign(payload, env.JWT_SECRET as string, options);
  }

  // Generar JWT refresh token
  static generateRefreshToken(user: UserResponse): string {
    const payload: TokenPayload = {
      userId: user.id as string,
      email: user.email as string,
      username: user.username as string,
      role: user.role as string,
      type: TOKEN_TYPES.REFRESH,
    };

    const options: any = {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
      issuer: 'bingo-backend',
      audience: 'bingo-frontend',  
    };

    return jwt.sign(payload, env.JWT_REFRESH_SECRET as string, options);
  }

  // Generar ambos tokens
  static async generateTokens(user: UserResponse): Promise<AuthTokens> {
    try {
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Guardar refresh token en Redis con TTL
      const refreshTokenKey = `refresh_token:${user.id}`;
      await cacheService.set(refreshTokenKey, refreshToken, 7 * 24 * 60 * 60); // 7 días

      // Guardar información de sesión en Redis
      const sessionKey = `session:${user.id}`;
      await cacheService.set(sessionKey, {
        userId: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        lastActivity: new Date().toISOString(),
      }, 24 * 60 * 60); // 24 horas

      logger.info(`Tokens generados para usuario: ${user.email}`);

      return {
        accessToken,
        refreshToken,
        expiresIn: env.JWT_EXPIRES_IN,
      };
    } catch (error) {
      logger.error('Error al generar tokens:', error);
      throw new Error('Error al generar tokens de autenticación');
    }
  }

  // Verificar access token
  static verifyAccessToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET as string, {
        issuer: 'bingo-backend',
        audience: 'bingo-frontend',
      }) as TokenPayload;

      if (decoded.type !== TOKEN_TYPES.ACCESS) {
        throw new Error('Tipo de token inválido');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Token inválido');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expirado');
      }
      throw error;
    }
  }

  // Verificar refresh token
  static verifyRefreshToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET as string, {
        issuer: 'bingo-backend',
        audience: 'bingo-frontend',
      }) as TokenPayload;

      if (decoded.type !== TOKEN_TYPES.REFRESH) {
        throw new Error('Tipo de token inválido');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Refresh token inválido');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expirado');
      }
      throw error;
    }
  }

  // Renovar access token usando refresh token
  static async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verificar refresh token
      const decoded = this.verifyRefreshToken(refreshToken);

      // Verificar que el refresh token existe en Redis
      const refreshTokenKey = `refresh_token:${decoded.userId}`;
      const storedRefreshToken = await cacheService.get(refreshTokenKey);

      if (!storedRefreshToken || storedRefreshToken !== refreshToken) {
        throw new Error('Refresh token inválido o expirado');
      }

      // Crear nuevo payload para access token
      const user: UserResponse = {
        id: decoded.userId,
        email: decoded.email,
        username: decoded.username,
        role: decoded.role as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Generar nuevo access token
      const newAccessToken = this.generateAccessToken(user);

      // Actualizar sesión en Redis
      const sessionKey = `session:${decoded.userId}`;
      await cacheService.set(sessionKey, {
        userId: decoded.userId,
        email: decoded.email,
        username: decoded.username,
        role: decoded.role,
        lastActivity: new Date().toISOString(),
      }, 24 * 60 * 60);

      logger.info(`Access token renovado para usuario: ${decoded.email}`);

      return {
        accessToken: newAccessToken,
        refreshToken, // El refresh token sigue siendo el mismo
        expiresIn: env.JWT_EXPIRES_IN,
      };
    } catch (error) {
      logger.error('Error al renovar access token:', error);
      throw error;
    }
  }

  // Invalidar tokens (logout)
  static async invalidateTokens(userId: string): Promise<void> {
    try {
      // Eliminar refresh token de Redis
      const refreshTokenKey = `refresh_token:${userId}`;
      await cacheService.del(refreshTokenKey);

      // Eliminar sesión de Redis
      const sessionKey = `session:${userId}`;
      await cacheService.del(sessionKey);

      // Eliminar todas las sesiones activas del usuario
      await cacheService.delPattern(`session:${userId}:*`);

      logger.info(`Tokens invalidados para usuario: ${userId}`);
    } catch (error) {
      logger.error('Error al invalidar tokens:', error);
      throw error;
    }
  }

  // Verificar si un token ha sido invalidado (blacklist)
  static async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const blacklistKey = `blacklist_token:${token}`;
      return await cacheService.exists(blacklistKey);
    } catch (error) {
      logger.error('Error al verificar blacklist de token:', error);
      return false;
    }
  }

  // Agregar token a blacklist
  static async blacklistToken(token: string, expiresIn: number = 24 * 60 * 60): Promise<void> {
    try {
      const blacklistKey = `blacklist_token:${token}`;
      await cacheService.set(blacklistKey, true, expiresIn);
      logger.info('Token agregado a blacklist');
    } catch (error) {
      logger.error('Error al agregar token a blacklist:', error);
      throw error;
    }
  }

  // Verificar si una sesión es válida
  static async isSessionValid(userId: string): Promise<boolean> {
    try {
      const sessionKey = `session:${userId}`;
      const session = await cacheService.get(sessionKey);
      return session !== null;
    } catch (error) {
      logger.error('Error al verificar sesión:', error);
      return false;
    }
  }

  // Actualizar última actividad de la sesión
  static async updateSessionActivity(userId: string): Promise<void> {
    try {
      const sessionKey = `session:${userId}`;
      const session = await cacheService.get(sessionKey);
      
      if (session) {
        session.lastActivity = new Date().toISOString();
        await cacheService.set(sessionKey, session, 24 * 60 * 60);
      }
    } catch (error) {
      logger.error('Error al actualizar actividad de sesión:', error);
    }
  }

  // Limpiar sesiones expiradas
  static async cleanupExpiredSessions(): Promise<void> {
    try {
      // Esta función podría ejecutarse periódicamente con un cron job
      logger.info('Limpieza de sesiones expiradas completada');
    } catch (error) {
      logger.error('Error al limpiar sesiones expiradas:', error);
    }
  }
}

export default AuthService;