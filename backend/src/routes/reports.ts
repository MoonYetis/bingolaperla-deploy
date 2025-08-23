import { Router } from 'express';
import { ReportController } from '../controllers/reportController';
import { authenticateToken } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting para endpoints de reports
const reportsRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 20, // máximo 20 requests por 5 minutos
  message: {
    error: 'Too many report requests, please try again later'
  }
});

// Rate limiting más estricto para exports
const exportRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 5, // máximo 5 exports por 10 minutos
  message: {
    error: 'Too many export requests, please try again later'
  }
});

// Middleware de autorización para reports (solo admins y usuarios autorizados)
const requireReportsAccess = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'ADMIN' && req.user?.permissions?.includes('reports')) {
    return res.status(403).json({
      success: false,
      error: 'Reports access required'
    });
  }
  next();
};

// Aplicar autenticación y rate limiting a todas las rutas
router.use(authenticateToken);
router.use(reportsRateLimit);
router.use(requireReportsAccess);

/**
 * @route GET /api/reports/daily
 * @desc Obtiene el reporte diario
 * @query date - Fecha específica (opcional, formato YYYY-MM-DD)
 * @access Admin/Reports Access
 */
router.get('/daily', ReportController.getDailyReport);

/**
 * @route GET /api/reports/weekly  
 * @desc Obtiene el reporte semanal
 * @query weekStart - Fecha de inicio de semana (opcional, formato YYYY-MM-DD)
 * @access Admin/Reports Access
 */
router.get('/weekly', ReportController.getWeeklyReport);

/**
 * @route GET /api/reports/monthly
 * @desc Obtiene el reporte mensual
 * @query month - Mes (1-12, opcional)
 * @query year - Año (opcional)
 * @access Admin/Reports Access
 */
router.get('/monthly', ReportController.getMonthlyReport);

/**
 * @route GET /api/reports/kpi-alerts
 * @desc Obtiene las alertas de KPIs actuales
 * @access Admin/Reports Access
 */
router.get('/kpi-alerts', ReportController.getKPIAlerts);

/**
 * @route GET /api/reports/summary
 * @desc Obtiene un resumen de todos los reports
 * @access Admin/Reports Access
 */
router.get('/summary', ReportController.getReportsSummary);

/**
 * @route POST /api/reports/schedule
 * @desc Programa la generación automática de reports
 * @body type - Tipo de report (daily/weekly/monthly)
 * @body frequency - Frecuencia (daily/weekly/monthly)
 * @body email - Email para envío automático
 * @access Admin Only
 */
router.post('/schedule', (req: any, res: any, next: any) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  next();
}, ReportController.scheduleReports);

/**
 * @route GET /api/reports/export/:type
 * @desc Exporta un report en diferentes formatos
 * @param type - Tipo de report (daily/weekly/monthly)
 * @query format - Formato de export (json/csv)
 * @query date - Fecha específica (opcional)
 * @access Admin/Reports Access
 */
router.get('/export/:type', exportRateLimit, ReportController.exportReport);

/**
 * @route GET /api/reports/scheduler/status
 * @desc Obtiene el estado del scheduler de reports
 * @access Admin Only
 */
router.get('/scheduler/status', (req: any, res: any, next: any) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  next();
}, ReportController.getSchedulerStatus);

/**
 * @route POST /api/reports/scheduler/run/:taskId
 * @desc Ejecuta una tarea del scheduler manualmente
 * @param taskId - ID de la tarea a ejecutar
 * @access Admin Only
 */
router.post('/scheduler/run/:taskId', (req: any, res: any, next: any) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  next();
}, ReportController.runScheduledTask);

/**
 * @route PUT /api/reports/scheduler/toggle/:taskId
 * @desc Habilita/deshabilita una tarea del scheduler
 * @param taskId - ID de la tarea a modificar
 * @body enabled - Estado (true/false)
 * @access Admin Only
 */
router.put('/scheduler/toggle/:taskId', (req: any, res: any, next: any) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  next();
}, ReportController.toggleScheduledTask);

export default router;