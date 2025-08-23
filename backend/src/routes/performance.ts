import { Router } from 'express';
import { performanceController } from '../controllers/performanceController';
import { authenticateToken } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting para performance endpoints
const performanceRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 20, // máximo 20 requests por minuto
  message: {
    error: 'Too many performance requests, please try again later'
  }
});

// Middleware de autorización para endpoints sensibles
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  next();
};

// Health check público (sin autenticación)
router.get('/health', performanceRateLimit, performanceController.getHealthCheck);

// Aplicar rate limiting y autenticación a las demás rutas
router.use(performanceRateLimit);
router.use(authenticateToken);

/**
 * @route GET /api/performance/metrics
 * @desc Obtiene métricas de performance en tiempo real
 * @access Private (Authenticated users)
 */
router.get('/metrics', performanceController.getCurrentMetrics);

/**
 * @route GET /api/performance/requests
 * @desc Obtiene estadísticas de requests HTTP
 * @query minutes - Minutos hacia atrás (default: 60)
 * @access Private (Authenticated users)
 */
router.get('/requests', performanceController.getRequestStats);

/**
 * @route GET /api/performance/system
 * @desc Obtiene métricas del sistema operativo
 * @access Admin only
 */
router.get('/system', requireAdmin, performanceController.getSystemMetrics);

/**
 * @route POST /api/performance/reset
 * @desc Reinicia las estadísticas de performance
 * @access Admin only
 */
router.post('/reset', requireAdmin, performanceController.resetMetrics);

export default router;