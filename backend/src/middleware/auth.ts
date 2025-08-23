import { Request, Response, NextFunction } from 'express';
import { AuthService, TokenPayload } from '@/services/authService';
import { UserService } from '@/services/userService';
import { HTTP_STATUS, ERROR_MESSAGES, USER_ROLES } from '@/utils/constants';
import { authLogger, logUtils } from '@/utils/structuredLogger';

// Los tipos globales están definidos en @/types/auth
import '@/types/auth';

// Middleware para verificar autenticación
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: ERROR_MESSAGES.UNAUTHORIZED,
        message: 'Token de acceso requerido'
      });
    }

    const token = authHeader.substring(7); // Remover 'Bearer '

    // Verificar si el token está en la blacklist
    const isBlacklisted = await AuthService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: ERROR_MESSAGES.UNAUTHORIZED,
        message: 'Token inválido'
      });
    }

    // Verificar y decodificar el token
    const decoded = AuthService.verifyAccessToken(token);

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
  } catch (error) {
    logUtils.authError(error as Error, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path
    });
    
    let message = 'Token inválido';
    if (error instanceof Error) {
      if (error.message === 'Token expirado') {
        message = 'Token expirado';
      } else if (error.message === 'Token inválido') {
        message = 'Token inválido';
      }
    }

    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      error: ERROR_MESSAGES.UNAUTHORIZED,
      message
    });
  }
};

// Middleware para verificar autenticación opcional (el usuario puede o no estar autenticado)
export const optionalAuthenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continuar sin usuario autenticado
    }

    const token = authHeader.substring(7);

    // Verificar si el token está en la blacklist
    const isBlacklisted = await AuthService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return next(); // Continuar sin usuario autenticado
    }

    try {
      const decoded = AuthService.verifyAccessToken(token);
      const isSessionValid = await AuthService.isSessionValid(decoded.userId);
      
      if (isSessionValid) {
        await AuthService.updateSessionActivity(decoded.userId);
        req.user = decoded;
      }
    } catch (error) {
      // Token inválido o expirado, continuar sin usuario autenticado
    }

    next();
  } catch (error) {
    authLogger.error('Optional authentication middleware error', error as Error, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path
    });
    next(); // Continuar sin usuario autenticado
  }
};

// Middleware para verificar que el usuario es administrador
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: ERROR_MESSAGES.UNAUTHORIZED,
        message: 'Autenticación requerida'
      });
    }

    if (req.user.role !== USER_ROLES.ADMIN) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        error: ERROR_MESSAGES.UNAUTHORIZED,
        message: 'Permisos de administrador requeridos'
      });
    }

    next();
  } catch (error) {
    authLogger.error('Admin middleware error', error as Error, {
      userId: req.user?.userId,
      endpoint: req.path
    });
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: ERROR_MESSAGES.INTERNAL_ERROR
    });
  }
};

// Middleware para verificar que el usuario es el propietario del recurso o admin
export const requireOwnershipOrAdmin = (userIdParam: string = 'id') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: ERROR_MESSAGES.UNAUTHORIZED,
          message: 'Autenticación requerida'
        });
      }

      const resourceUserId = req.params[userIdParam];
      const currentUserId = req.user.userId;
      const isAdmin = req.user.role === USER_ROLES.ADMIN;

      if (currentUserId !== resourceUserId && !isAdmin) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          error: ERROR_MESSAGES.UNAUTHORIZED,
          message: 'No tienes permisos para acceder a este recurso'
        });
      }

      next();
    } catch (error) {
      authLogger.error('Ownership middleware error', error as Error, {
        userId: req.user?.userId,
        endpoint: req.path,
        resourceUserId: req.params[userIdParam]
      });
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };
};

// Middleware para verificar que el usuario existe en la base de datos
export const verifyUserExists = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: ERROR_MESSAGES.UNAUTHORIZED,
        message: 'Autenticación requerida'
      });
    }

    const user = await UserService.findUserById(req.user.userId);
    
    if (!user) {
      // Usuario no existe en la base de datos, invalidar token
      await AuthService.invalidateTokens(req.user.userId);
      
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: ERROR_MESSAGES.UNAUTHORIZED,
        message: 'Usuario no encontrado'
      });
    }

    next();
  } catch (error) {
    authLogger.error('User verification error', error as Error, {
      userId: req.user?.userId,
      endpoint: req.path
    });
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: ERROR_MESSAGES.INTERNAL_ERROR
    });
  }
};

// Middleware combinado para autenticación completa
export const fullAuthentication = [authenticate, verifyUserExists];

// Middleware combinado para autenticación de admin
export const adminAuthentication = [authenticate, verifyUserExists, requireAdmin];

// Crear alias para compatibilidad con rutas existentes
export const authenticateToken = authenticate;

// Función helper para obtener el usuario actual desde el token
export const getCurrentUser = async (req: Request): Promise<any> => {
  if (!req.user) {
    return null;
  }

  try {
    return await UserService.findUserById(req.user.userId);
  } catch (error) {
    authLogger.error('Get current user error', error as Error, {
      userId: req.user?.userId
    });
    return null;
  }
};

// Export authMiddleware as function that returns authenticate middleware
export const authMiddleware = (options?: any) => authenticate;