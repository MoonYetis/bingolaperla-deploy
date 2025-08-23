"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reportController_1 = require("../controllers/reportController");
const auth_1 = require("../middleware/auth");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = (0, express_1.Router)();
// Rate limiting para endpoints de reports
const reportsRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 20, // máximo 20 requests por 5 minutos
    message: {
        error: 'Too many report requests, please try again later'
    }
});
// Rate limiting más estricto para exports
const exportRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 10 * 60 * 1000, // 10 minutos
    max: 5, // máximo 5 exports por 10 minutos
    message: {
        error: 'Too many export requests, please try again later'
    }
});
// Middleware de autorización para reports (solo admins y usuarios autorizados)
const requireReportsAccess = (req, res, next) => {
    if (req.user?.role !== 'ADMIN' && req.user?.permissions?.includes('reports')) {
        return res.status(403).json({
            success: false,
            error: 'Reports access required'
        });
    }
    next();
};
// Aplicar autenticación y rate limiting a todas las rutas
router.use(auth_1.authenticateToken);
router.use(reportsRateLimit);
router.use(requireReportsAccess);
/**
 * @route GET /api/reports/daily
 * @desc Obtiene el reporte diario
 * @query date - Fecha específica (opcional, formato YYYY-MM-DD)
 * @access Admin/Reports Access
 */
router.get('/daily', reportController_1.ReportController.getDailyReport);
/**
 * @route GET /api/reports/weekly
 * @desc Obtiene el reporte semanal
 * @query weekStart - Fecha de inicio de semana (opcional, formato YYYY-MM-DD)
 * @access Admin/Reports Access
 */
router.get('/weekly', reportController_1.ReportController.getWeeklyReport);
/**
 * @route GET /api/reports/monthly
 * @desc Obtiene el reporte mensual
 * @query month - Mes (1-12, opcional)
 * @query year - Año (opcional)
 * @access Admin/Reports Access
 */
router.get('/monthly', reportController_1.ReportController.getMonthlyReport);
/**
 * @route GET /api/reports/kpi-alerts
 * @desc Obtiene las alertas de KPIs actuales
 * @access Admin/Reports Access
 */
router.get('/kpi-alerts', reportController_1.ReportController.getKPIAlerts);
/**
 * @route GET /api/reports/summary
 * @desc Obtiene un resumen de todos los reports
 * @access Admin/Reports Access
 */
router.get('/summary', reportController_1.ReportController.getReportsSummary);
/**
 * @route POST /api/reports/schedule
 * @desc Programa la generación automática de reports
 * @body type - Tipo de report (daily/weekly/monthly)
 * @body frequency - Frecuencia (daily/weekly/monthly)
 * @body email - Email para envío automático
 * @access Admin Only
 */
router.post('/schedule', (req, res, next) => {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            error: 'Admin access required'
        });
    }
    next();
}, reportController_1.ReportController.scheduleReports);
/**
 * @route GET /api/reports/export/:type
 * @desc Exporta un report en diferentes formatos
 * @param type - Tipo de report (daily/weekly/monthly)
 * @query format - Formato de export (json/csv)
 * @query date - Fecha específica (opcional)
 * @access Admin/Reports Access
 */
router.get('/export/:type', exportRateLimit, reportController_1.ReportController.exportReport);
/**
 * @route GET /api/reports/scheduler/status
 * @desc Obtiene el estado del scheduler de reports
 * @access Admin Only
 */
router.get('/scheduler/status', (req, res, next) => {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            error: 'Admin access required'
        });
    }
    next();
}, reportController_1.ReportController.getSchedulerStatus);
/**
 * @route POST /api/reports/scheduler/run/:taskId
 * @desc Ejecuta una tarea del scheduler manualmente
 * @param taskId - ID de la tarea a ejecutar
 * @access Admin Only
 */
router.post('/scheduler/run/:taskId', (req, res, next) => {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            error: 'Admin access required'
        });
    }
    next();
}, reportController_1.ReportController.runScheduledTask);
/**
 * @route PUT /api/reports/scheduler/toggle/:taskId
 * @desc Habilita/deshabilita una tarea del scheduler
 * @param taskId - ID de la tarea a modificar
 * @body enabled - Estado (true/false)
 * @access Admin Only
 */
router.put('/scheduler/toggle/:taskId', (req, res, next) => {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            error: 'Admin access required'
        });
    }
    next();
}, reportController_1.ReportController.toggleScheduledTask);
exports.default = router;
//# sourceMappingURL=reports.js.map