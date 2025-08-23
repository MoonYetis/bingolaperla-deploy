"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const performanceController_1 = require("../controllers/performanceController");
const auth_1 = require("../middleware/auth");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = (0, express_1.Router)();
// Rate limiting para performance endpoints
const performanceRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 20, // máximo 20 requests por minuto
    message: {
        error: 'Too many performance requests, please try again later'
    }
});
// Middleware de autorización para endpoints sensibles
const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            error: 'Admin access required'
        });
    }
    next();
};
// Health check público (sin autenticación)
router.get('/health', performanceRateLimit, performanceController_1.performanceController.getHealthCheck);
// Aplicar rate limiting y autenticación a las demás rutas
router.use(performanceRateLimit);
router.use(auth_1.authenticateToken);
/**
 * @route GET /api/performance/metrics
 * @desc Obtiene métricas de performance en tiempo real
 * @access Private (Authenticated users)
 */
router.get('/metrics', performanceController_1.performanceController.getCurrentMetrics);
/**
 * @route GET /api/performance/requests
 * @desc Obtiene estadísticas de requests HTTP
 * @query minutes - Minutos hacia atrás (default: 60)
 * @access Private (Authenticated users)
 */
router.get('/requests', performanceController_1.performanceController.getRequestStats);
/**
 * @route GET /api/performance/system
 * @desc Obtiene métricas del sistema operativo
 * @access Admin only
 */
router.get('/system', requireAdmin, performanceController_1.performanceController.getSystemMetrics);
/**
 * @route POST /api/performance/reset
 * @desc Reinicia las estadísticas de performance
 * @access Admin only
 */
router.post('/reset', requireAdmin, performanceController_1.performanceController.resetMetrics);
exports.default = router;
//# sourceMappingURL=performance.js.map