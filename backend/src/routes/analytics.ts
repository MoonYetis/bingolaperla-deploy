import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController';
import { authenticateToken } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting para analytics - más permisivo para dashboards
const analyticsRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // máximo 30 requests por minuto para analytics
  message: {
    error: 'Too many analytics requests, please try again later'
  }
});

// Middleware de autenticación y autorización para analytics
const requireAdmin = (req: any, res: any, next: any) => {
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
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @route GET /api/analytics/metrics
 * @desc Obtiene métricas principales de negocio
 * @access Admin
 */
router.get('/metrics', analyticsController.getBusinessMetrics);

/**
 * @route GET /api/analytics/dashboard
 * @desc Obtiene dashboard completo con todas las métricas
 * @access Admin
 */
router.get('/dashboard', analyticsController.getDashboard);

/**
 * @route GET /api/analytics/kpis
 * @desc Obtiene KPIs específicos de Bingo
 * @access Admin
 */
router.get('/kpis', analyticsController.getBingoKPIs);

/**
 * @route GET /api/analytics/users
 * @desc Obtiene analytics de usuarios
 * @query limit - Límite de usuarios a retornar (default: 100)
 * @access Admin
 */
router.get('/users', analyticsController.getUserAnalytics);

/**
 * @route GET /api/analytics/games
 * @route GET /api/analytics/games/:gameId
 * @desc Obtiene analytics de juegos (todos o específico)
 * @access Admin
 */
router.get('/games', analyticsController.getGameAnalytics);
router.get('/games/:gameId', analyticsController.getGameAnalytics);

/**
 * @route GET /api/analytics/realtime
 * @desc Obtiene métricas en tiempo real
 * @query hours - Horas hacia atrás (default: 1)
 * @access Admin
 */
router.get('/realtime', analyticsController.getRealtimeMetrics);

/**
 * @route POST /api/analytics/realtime
 * @desc Registra métricas en tiempo real
 * @access Admin (o sistema interno)
 */
router.post('/realtime', analyticsController.recordRealtimeMetrics);

/**
 * @route GET /api/analytics/trends/:metric
 * @desc Obtiene tendencias de métricas
 * @param metric - Tipo de métrica (users, games, revenue)
 * @query days - Días hacia atrás (default: 7)
 * @access Admin
 */
router.get('/trends/:metric', analyticsController.getTrends);

/**
 * @route POST /api/analytics/reports
 * @desc Genera reporte personalizado
 * @body startDate, endDate, metrics[]
 * @access Admin
 */
router.post('/reports', analyticsController.generateCustomReport);

export default router;