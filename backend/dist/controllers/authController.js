"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const userService_1 = require("@/services/userService");
const authService_1 = require("@/services/authService");
const constants_1 = require("@/utils/constants");
const structuredLogger_1 = require("@/utils/structuredLogger");
class AuthController {
    // POST /api/auth/register
    static async register(req, res) {
        try {
            const userData = req.body;
            // Crear usuario
            const newUser = await userService_1.UserService.createUser({
                email: userData.email,
                username: userData.username,
                password: userData.password,
            });
            // Generar tokens
            const tokens = await authService_1.AuthService.generateTokens(newUser);
            structuredLogger_1.authLogger.audit({
                action: 'user_registered',
                resource: 'user',
                resourceId: newUser.id,
                userId: newUser.email,
                success: true
            }, { ip: req.ip, userAgent: req.get('User-Agent') });
            res.status(constants_1.HTTP_STATUS.CREATED).json({
                message: constants_1.SUCCESS_MESSAGES.USER_CREATED,
                user: newUser,
                tokens,
            });
        }
        catch (error) {
            structuredLogger_1.authLogger.error('User registration failed', error, {
                email: req.body?.email,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            let message = constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
            let status = constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR;
            if (error instanceof Error) {
                if (error.message.includes('email ya está registrado')) {
                    message = constants_1.ERROR_MESSAGES.EMAIL_ALREADY_EXISTS;
                    status = constants_1.HTTP_STATUS.CONFLICT;
                }
                else if (error.message.includes('nombre de usuario ya está en uso')) {
                    message = constants_1.ERROR_MESSAGES.USERNAME_ALREADY_EXISTS;
                    status = constants_1.HTTP_STATUS.CONFLICT;
                }
            }
            return res.status(status).json({ error: message });
        }
    }
    // POST /api/auth/login
    static async login(req, res) {
        try {
            const { identifier, password } = req.body;
            // Buscar usuario por email o username
            const user = await userService_1.UserService.findUserByIdentifier(identifier);
            if (!user) {
                return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
                    error: constants_1.ERROR_MESSAGES.INVALID_CREDENTIALS,
                });
            }
            // Verificar contraseña
            const isPasswordValid = await userService_1.UserService.verifyPassword(password, user.password);
            if (!isPasswordValid) {
                structuredLogger_1.logUtils.loginAttempt(identifier, false, req.ip || 'unknown', req.get('User-Agent'));
                return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
                    error: constants_1.ERROR_MESSAGES.INVALID_CREDENTIALS,
                });
            }
            // Crear usuario sanitizado
            const sanitizedUser = await userService_1.UserService.findUserById(user.id);
            if (!sanitizedUser) {
                throw new Error('Error al obtener datos del usuario');
            }
            // Generar tokens
            const tokens = await authService_1.AuthService.generateTokens(sanitizedUser);
            structuredLogger_1.logUtils.loginAttempt(user.email, true, req.ip || 'unknown', req.get('User-Agent'));
            return res.status(constants_1.HTTP_STATUS.OK).json({
                message: constants_1.SUCCESS_MESSAGES.LOGIN_SUCCESS,
                user: sanitizedUser,
                tokens,
            });
        }
        catch (error) {
            structuredLogger_1.authLogger.error('Login error occurred', error, {
                identifier: req.body?.identifier,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                error: constants_1.ERROR_MESSAGES.INTERNAL_ERROR,
            });
        }
    }
    // POST /api/auth/refresh
    static async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                    error: 'Refresh token requerido',
                });
            }
            // Renovar access token
            const tokens = await authService_1.AuthService.refreshAccessToken(refreshToken);
            return res.status(constants_1.HTTP_STATUS.OK).json({
                message: constants_1.SUCCESS_MESSAGES.TOKEN_REFRESHED,
                tokens,
            });
        }
        catch (error) {
            structuredLogger_1.authLogger.error('Token refresh failed', error, {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            let message = 'Error al renovar token';
            if (error instanceof Error) {
                if (error.message.includes('inválido') || error.message.includes('expirado')) {
                    message = error.message;
                }
            }
            return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
                error: message,
            });
        }
    }
    // POST /api/auth/logout
    static async logout(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
                    error: constants_1.ERROR_MESSAGES.UNAUTHORIZED,
                });
            }
            // Invalidar tokens del usuario
            await authService_1.AuthService.invalidateTokens(userId);
            structuredLogger_1.authLogger.audit({
                action: 'user_logout',
                resource: 'user_session',
                userId: req.user?.email,
                success: true
            }, { ip: req.ip, userAgent: req.get('User-Agent') });
            return res.status(constants_1.HTTP_STATUS.OK).json({
                message: constants_1.SUCCESS_MESSAGES.LOGOUT_SUCCESS,
            });
        }
        catch (error) {
            structuredLogger_1.authLogger.error('Logout error occurred', error, {
                userId: req.user?.userId,
                ip: req.ip
            });
            return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                error: constants_1.ERROR_MESSAGES.INTERNAL_ERROR,
            });
        }
    }
    // GET /api/auth/me
    static async getProfile(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
                    error: constants_1.ERROR_MESSAGES.UNAUTHORIZED,
                });
            }
            const user = await userService_1.UserService.findUserById(userId);
            if (!user) {
                return res.status(constants_1.HTTP_STATUS.NOT_FOUND).json({
                    error: constants_1.ERROR_MESSAGES.USER_NOT_FOUND,
                });
            }
            return res.status(constants_1.HTTP_STATUS.OK).json({
                user,
            });
        }
        catch (error) {
            structuredLogger_1.authLogger.error('Get profile error', error, {
                userId: req.user?.userId
            });
            return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                error: constants_1.ERROR_MESSAGES.INTERNAL_ERROR,
            });
        }
    }
    // PUT /api/auth/profile
    static async updateProfile(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
                    error: constants_1.ERROR_MESSAGES.UNAUTHORIZED,
                });
            }
            const updateData = req.body;
            const updatedUser = await userService_1.UserService.updateUserProfile(userId, updateData);
            structuredLogger_1.authLogger.audit({
                action: 'profile_updated',
                resource: 'user',
                resourceId: updatedUser.id,
                userId: updatedUser.email,
                success: true
            }, { ip: req.ip, userAgent: req.get('User-Agent') });
            return res.status(constants_1.HTTP_STATUS.OK).json({
                message: 'Perfil actualizado exitosamente',
                user: updatedUser,
            });
        }
        catch (error) {
            structuredLogger_1.authLogger.error('Profile update failed', error, {
                userId: req.user?.userId,
                ip: req.ip
            });
            let message = constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
            let status = constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR;
            if (error instanceof Error) {
                if (error.message.includes('email ya está en uso')) {
                    message = constants_1.ERROR_MESSAGES.EMAIL_ALREADY_EXISTS;
                    status = constants_1.HTTP_STATUS.CONFLICT;
                }
                else if (error.message.includes('nombre de usuario ya está en uso')) {
                    message = constants_1.ERROR_MESSAGES.USERNAME_ALREADY_EXISTS;
                    status = constants_1.HTTP_STATUS.CONFLICT;
                }
                else if (error.message.includes('contraseña actual es incorrecta')) {
                    message = 'La contraseña actual es incorrecta';
                    status = constants_1.HTTP_STATUS.BAD_REQUEST;
                }
                else if (error.message.includes('Usuario no encontrado')) {
                    message = constants_1.ERROR_MESSAGES.USER_NOT_FOUND;
                    status = constants_1.HTTP_STATUS.NOT_FOUND;
                }
            }
            return res.status(status).json({ error: message });
        }
    }
    // POST /api/auth/change-password
    static async changePassword(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
                    error: constants_1.ERROR_MESSAGES.UNAUTHORIZED,
                });
            }
            const passwordData = req.body;
            await userService_1.UserService.changePassword(userId, passwordData);
            // Invalidar todas las sesiones del usuario para forzar re-login
            await authService_1.AuthService.invalidateTokens(userId);
            structuredLogger_1.authLogger.audit({
                action: 'password_changed',
                resource: 'user',
                userId: req.user?.email,
                success: true
            }, { ip: req.ip, userAgent: req.get('User-Agent') });
            return res.status(constants_1.HTTP_STATUS.OK).json({
                message: 'Contraseña cambiada exitosamente. Por favor, inicia sesión nuevamente.',
            });
        }
        catch (error) {
            structuredLogger_1.authLogger.error('Password change failed', error, {
                userId: req.user?.userId,
                ip: req.ip
            });
            let message = constants_1.ERROR_MESSAGES.INTERNAL_ERROR;
            let status = constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR;
            if (error instanceof Error) {
                if (error.message.includes('contraseña actual es incorrecta')) {
                    message = 'La contraseña actual es incorrecta';
                    status = constants_1.HTTP_STATUS.BAD_REQUEST;
                }
                else if (error.message.includes('Usuario no encontrado')) {
                    message = constants_1.ERROR_MESSAGES.USER_NOT_FOUND;
                    status = constants_1.HTTP_STATUS.NOT_FOUND;
                }
            }
            return res.status(status).json({ error: message });
        }
    }
    // POST /api/auth/logout-all
    static async logoutAllDevices(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
                    error: constants_1.ERROR_MESSAGES.UNAUTHORIZED,
                });
            }
            // Invalidar todas las sesiones del usuario
            await authService_1.AuthService.invalidateTokens(userId);
            structuredLogger_1.authLogger.audit({
                action: 'all_sessions_invalidated',
                resource: 'user_session',
                userId: req.user?.email,
                success: true
            }, { ip: req.ip, userAgent: req.get('User-Agent') });
            res.status(constants_1.HTTP_STATUS.OK).json({
                message: 'Sesión cerrada en todos los dispositivos exitosamente',
            });
        }
        catch (error) {
            structuredLogger_1.authLogger.error('Logout all devices failed', error, {
                userId: req.user?.userId,
                ip: req.ip
            });
            return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                error: constants_1.ERROR_MESSAGES.INTERNAL_ERROR,
            });
        }
    }
}
exports.AuthController = AuthController;
exports.default = AuthController;
//# sourceMappingURL=authController.js.map