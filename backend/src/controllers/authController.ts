import { Request, Response } from 'express';
import { UserService } from '@/services/userService';
import { AuthService } from '@/services/authService';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/utils/constants';
import { authLogger, logUtils } from '@/utils/structuredLogger';
import { 
  RegisterInput, 
  LoginInput, 
  ChangePasswordInput,
  UpdateProfileInput 
} from '@/schemas/authSchemas';

export class AuthController {
  // POST /api/auth/register
  static async register(req: Request, res: Response) {
    try {
      const userData: RegisterInput = req.body;

      // Crear usuario
      const newUser = await UserService.createUser({
        email: userData.email,
        username: userData.username,
        password: userData.password,
      });

      // Generar tokens
      const tokens = await AuthService.generateTokens(newUser);

      authLogger.audit({
        action: 'user_registered',
        resource: 'user',
        resourceId: newUser.id,
        userId: newUser.email,
        success: true
      }, { ip: req.ip, userAgent: req.get('User-Agent') });

      res.status(HTTP_STATUS.CREATED).json({
        message: SUCCESS_MESSAGES.USER_CREATED,
        user: newUser,
        tokens,
      });
    } catch (error) {
      authLogger.error('User registration failed', error as Error, {
        email: req.body?.email,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      let message = ERROR_MESSAGES.INTERNAL_ERROR;
      let status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;

      if (error instanceof Error) {
        if (error.message.includes('email ya está registrado')) {
          message = ERROR_MESSAGES.EMAIL_ALREADY_EXISTS;
          status = HTTP_STATUS.CONFLICT;
        } else if (error.message.includes('nombre de usuario ya está en uso')) {
          message = ERROR_MESSAGES.USERNAME_ALREADY_EXISTS;
          status = HTTP_STATUS.CONFLICT;
        }
      }

      return res.status(status).json({ error: message });
    }
  }

  // POST /api/auth/login
  static async login(req: Request, res: Response) {
    try {
      const { identifier, password }: LoginInput = req.body;

      // Buscar usuario por email o username
      const user = await UserService.findUserByIdentifier(identifier);

      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: ERROR_MESSAGES.INVALID_CREDENTIALS,
        });
      }

      // Verificar contraseña
      const isPasswordValid = await UserService.verifyPassword(password, user.password);

      if (!isPasswordValid) {
        logUtils.loginAttempt(identifier, false, req.ip || 'unknown', req.get('User-Agent'));
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: ERROR_MESSAGES.INVALID_CREDENTIALS,
        });
      }

      // Crear usuario sanitizado
      const sanitizedUser = await UserService.findUserById(user.id);
      if (!sanitizedUser) {
        throw new Error('Error al obtener datos del usuario');
      }

      // Generar tokens
      const tokens = await AuthService.generateTokens(sanitizedUser);

      logUtils.loginAttempt(user.email, true, req.ip || 'unknown', req.get('User-Agent'));

      return res.status(HTTP_STATUS.OK).json({
        message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
        user: sanitizedUser,
        tokens,
      });
    } catch (error) {
      authLogger.error('Login error occurred', error as Error, {
        identifier: req.body?.identifier,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  }

  // POST /api/auth/refresh
  static async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Refresh token requerido',
        });
      }

      // Renovar access token
      const tokens = await AuthService.refreshAccessToken(refreshToken);

      return res.status(HTTP_STATUS.OK).json({
        message: SUCCESS_MESSAGES.TOKEN_REFRESHED,
        tokens,
      });
    } catch (error) {
      authLogger.error('Token refresh failed', error as Error, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      let message = 'Error al renovar token';
      if (error instanceof Error) {
        if (error.message.includes('inválido') || error.message.includes('expirado')) {
          message = error.message;
        }
      }

      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: message,
      });
    }
  }

  // POST /api/auth/logout
  static async logout(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: ERROR_MESSAGES.UNAUTHORIZED,
        });
      }

      // Invalidar tokens del usuario
      await AuthService.invalidateTokens(userId);

      authLogger.audit({
        action: 'user_logout',
        resource: 'user_session',
        userId: req.user?.email,
        success: true
      }, { ip: req.ip, userAgent: req.get('User-Agent') });

      return res.status(HTTP_STATUS.OK).json({
        message: SUCCESS_MESSAGES.LOGOUT_SUCCESS,
      });
    } catch (error) {
      authLogger.error('Logout error occurred', error as Error, {
        userId: req.user?.userId,
        ip: req.ip
      });
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  }

  // GET /api/auth/me
  static async getProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: ERROR_MESSAGES.UNAUTHORIZED,
        });
      }

      const user = await UserService.findUserById(userId);

      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          error: ERROR_MESSAGES.USER_NOT_FOUND,
        });
      }

      return res.status(HTTP_STATUS.OK).json({
        user,
      });
    } catch (error) {
      authLogger.error('Get profile error', error as Error, {
        userId: req.user?.userId
      });
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  }

  // PUT /api/auth/profile
  static async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: ERROR_MESSAGES.UNAUTHORIZED,
        });
      }

      const updateData: UpdateProfileInput = req.body;

      const updatedUser = await UserService.updateUserProfile(userId, updateData);

      authLogger.audit({
        action: 'profile_updated',
        resource: 'user',
        resourceId: updatedUser.id,
        userId: updatedUser.email,
        success: true
      }, { ip: req.ip, userAgent: req.get('User-Agent') });

      return res.status(HTTP_STATUS.OK).json({
        message: 'Perfil actualizado exitosamente',
        user: updatedUser,
      });
    } catch (error) {
      authLogger.error('Profile update failed', error as Error, {
        userId: req.user?.userId,
        ip: req.ip
      });

      let message = ERROR_MESSAGES.INTERNAL_ERROR;
      let status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;

      if (error instanceof Error) {
        if (error.message.includes('email ya está en uso')) {
          message = ERROR_MESSAGES.EMAIL_ALREADY_EXISTS;
          status = HTTP_STATUS.CONFLICT;
        } else if (error.message.includes('nombre de usuario ya está en uso')) {
          message = ERROR_MESSAGES.USERNAME_ALREADY_EXISTS;
          status = HTTP_STATUS.CONFLICT;
        } else if (error.message.includes('contraseña actual es incorrecta')) {
          message = 'La contraseña actual es incorrecta';
          status = HTTP_STATUS.BAD_REQUEST;
        } else if (error.message.includes('Usuario no encontrado')) {
          message = ERROR_MESSAGES.USER_NOT_FOUND;
          status = HTTP_STATUS.NOT_FOUND;
        }
      }

      return res.status(status).json({ error: message });
    }
  }

  // POST /api/auth/change-password
  static async changePassword(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: ERROR_MESSAGES.UNAUTHORIZED,
        });
      }

      const passwordData: ChangePasswordInput = req.body;

      await UserService.changePassword(userId, passwordData);

      // Invalidar todas las sesiones del usuario para forzar re-login
      await AuthService.invalidateTokens(userId);

      authLogger.audit({
        action: 'password_changed',
        resource: 'user',
        userId: req.user?.email,
        success: true
      }, { ip: req.ip, userAgent: req.get('User-Agent') });

      return res.status(HTTP_STATUS.OK).json({
        message: 'Contraseña cambiada exitosamente. Por favor, inicia sesión nuevamente.',
      });
    } catch (error) {
      authLogger.error('Password change failed', error as Error, {
        userId: req.user?.userId,
        ip: req.ip
      });

      let message = ERROR_MESSAGES.INTERNAL_ERROR;
      let status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;

      if (error instanceof Error) {
        if (error.message.includes('contraseña actual es incorrecta')) {
          message = 'La contraseña actual es incorrecta';
          status = HTTP_STATUS.BAD_REQUEST;
        } else if (error.message.includes('Usuario no encontrado')) {
          message = ERROR_MESSAGES.USER_NOT_FOUND;
          status = HTTP_STATUS.NOT_FOUND;
        }
      }

      return res.status(status).json({ error: message });
    }
  }

  // POST /api/auth/logout-all
  static async logoutAllDevices(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: ERROR_MESSAGES.UNAUTHORIZED,
        });
      }

      // Invalidar todas las sesiones del usuario
      await AuthService.invalidateTokens(userId);

      authLogger.audit({
        action: 'all_sessions_invalidated',
        resource: 'user_session',
        userId: req.user?.email,
        success: true
      }, { ip: req.ip, userAgent: req.get('User-Agent') });

      res.status(HTTP_STATUS.OK).json({
        message: 'Sesión cerrada en todos los dispositivos exitosamente',
      });
    } catch (error) {
      authLogger.error('Logout all devices failed', error as Error, {
        userId: req.user?.userId,
        ip: req.ip
      });
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  }
}

export default AuthController;