"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analyticsController_1 = require("../controllers/analyticsController");
const auth_1 = require("../middleware/auth");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = (0, express_1.Router)();
// Rate limiting para analytics - más permisivo para dashboards
const analyticsRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 30, // máximo 30 requests por minuto para analytics
    message: {
        error: 'Too many analytics requests, please try again later'
    }
});
// Middleware de autenticación y autorización para analytics
const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            error: 'Admin access required'
        });
    }
    next();
};
// Aplicar rate limiting y autenticación a todas las rutas
router.use(analyticsRateLimit);
router.use(auth_1.authenticateToken);
router.use(requireAdmin);
/**
 * @route GET /api/analytics/metrics
 * @desc Obtiene métricas principales de negocio
 * @access Admin
 */
router.get('/metrics', analyticsController_1.analyticsController.getBusinessMetrics);
/**
 * @route GET /api/analytics/dashboard
 * @desc Obtiene dashboard completo con todas las métricas
 * @access Admin
 */
router.get('/dashboard', analyticsController_1.analyticsController.getDashboard);
/**
 * @route GET /api/analytics/kpis
 * @desc Obtiene KPIs específicos de Bingo
 * @access Admin
 */
router.get('/kpis', analyticsController_1.analyticsController.getBingoKPIs);
/**
 * @route GET /api/analytics/users
 * @desc Obtiene analytics de usuarios
 * @query limit - Límite de usuarios a retornar (default: 100)
 * @access Admin
 */
router.get('/users', analyticsController_1.analyticsController.getUserAnalytics);
/**
 * @route GET /api/analytics/games
 * @route GET /api/analytics/games/:gameId
 * @desc Obtiene analytics de juegos (todos o específico)
 * @access Admin
 */
router.get('/games', analyticsController_1.analyticsController.getGameAnalytics);
router.get('/games/:gameId', analyticsController_1.analyticsController.getGameAnalytics);
/**
 * @route GET /api/analytics/realtime
 * @desc Obtiene métricas en tiempo real
 * @query hours - Horas hacia atrás (default: 1)
 * @access Admin
 */
router.get('/realtime', analyticsController_1.analyticsController.getRealtimeMetrics);
/**
 * @route POST /api/analytics/realtime
 * @desc Registra métricas en tiempo real
 * @access Admin (o sistema interno)
 */
router.post('/realtime', analyticsController_1.analyticsController.recordRealtimeMetrics);
/**
 * @route GET /api/analytics/trends/:metric
 * @desc Obtiene tendencias de métricas
 * @param metric - Tipo de métrica (users, games, revenue)
 * @query days - Días hacia atrás (default: 7)
 * @access Admin
 */
router.get('/trends/:metric', analyticsController_1.analyticsController.getTrends);
/**
 * @route POST /api/analytics/reports
 * @desc Genera reporte personalizado
 * @body startDate, endDate, metrics[]
 * @access Admin
 */
router.post('/reports', analyticsController_1.analyticsController.generateCustomReport);
exports.default = router;
//# sourceMappingURL=analytics.js.map