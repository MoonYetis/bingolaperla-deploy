"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOKEN_TYPES = exports.USER_ROLES = exports.SUCCESS_MESSAGES = exports.ERROR_MESSAGES = exports.HTTP_STATUS = void 0;
exports.HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    NOT_IMPLEMENTED: 501,
};
exports.ERROR_MESSAGES = {
    INVALID_CREDENTIALS: 'Credenciales inválidas',
    USER_NOT_FOUND: 'Usuario no encontrado',
    EMAIL_ALREADY_EXISTS: 'El email ya está registrado',
    USERNAME_ALREADY_EXISTS: 'El nombre de usuario ya está en uso',
    UNAUTHORIZED: 'No autorizado',
    TOKEN_EXPIRED: 'Token expirado',
    INVALID_TOKEN: 'Token inválido',
    VALIDATION_ERROR: 'Error de validación',
    INTERNAL_ERROR: 'Error interno del servidor',
    RATE_LIMIT_EXCEEDED: 'Demasiadas solicitudes, intenta más tarde',
};
exports.SUCCESS_MESSAGES = {
    USER_CREATED: 'Usuario creado exitosamente',
    LOGIN_SUCCESS: 'Inicio de sesión exitoso',
    LOGOUT_SUCCESS: 'Cierre de sesión exitoso',
    TOKEN_REFRESHED: 'Token actualizado exitosamente',
};
exports.USER_ROLES = {
    ADMIN: 'ADMIN',
    USER: 'USER',
};
exports.TOKEN_TYPES = {
    ACCESS: 'access',
    REFRESH: 'refresh',
};
//# sourceMappingURL=constants.js.map