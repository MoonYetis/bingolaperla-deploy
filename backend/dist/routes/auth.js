"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("@/controllers/authController");
const auth_1 = require("@/middleware/auth");
const rateLimiting_1 = require("@/middleware/rateLimiting");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Public
 */
router.post('/register', rateLimiting_1.registerRateLimit, // Rate limiting más restrictivo para registro
/* validateRequest({ body: registerSchema }), */
authController_1.AuthController.register);
/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión
 * @access  Public
 */
router.post('/login', rateLimiting_1.authRateLimit, // Rate limiting para intentos de login
/* validateRequest({ body: loginSchema }), */
authController_1.AuthController.login);
/**
 * @route   POST /api/auth/refresh
 * @desc    Renovar access token usando refresh token
 * @access  Public
 */
router.post('/refresh', rateLimiting_1.authRateLimit, authController_1.AuthController.refreshToken);
/**
 * @route   POST /api/auth/logout
 * @desc    Cerrar sesión (invalidar tokens)
 * @access  Private
 */
router.post('/logout', auth_1.authenticate, authController_1.AuthController.logout);
/**
 * @route   POST /api/auth/logout-all
 * @desc    Cerrar sesión en todos los dispositivos
 * @access  Private
 */
router.post('/logout-all', auth_1.fullAuthentication, authController_1.AuthController.logoutAllDevices);
/**
 * @route   GET /api/auth/me
 * @desc    Obtener perfil del usuario autenticado
 * @access  Private
 */
router.get('/me', auth_1.fullAuthentication, authController_1.AuthController.getProfile);
/**
 * @route   PUT /api/auth/profile
 * @desc    Actualizar perfil del usuario
 * @access  Private
 */
router.put('/profile', auth_1.fullAuthentication, 
/* validateRequest({ body: updateProfileSchema }), */
authController_1.AuthController.updateProfile);
/**
 * @route   POST /api/auth/change-password
 * @desc    Cambiar contraseña del usuario
 * @access  Private
 */
router.post('/change-password', auth_1.fullAuthentication, 
/* validateRequest({ body: changePasswordSchema }), */
authController_1.AuthController.changePassword);
exports.default = router;
//# sourceMappingURL=auth.js.map