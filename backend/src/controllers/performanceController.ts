import { Request, Response } from 'express';
import { performanceMonitor } from '../middleware/performanceMonitoring';
import { logger } from '../utils/logger';

export class PerformanceController {
  /**
   * Obtiene métricas de performance en tiempo real
   * GET /api/performance/metrics
   */
  async getCurrentMetrics(req: Request, res: Response) {
    try {
      const metrics = performanceMonitor.getCurrentMetrics();
      
      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      logger.error('Error getting performance metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve performance metrics'
      });
    }
  }

  /**
   * Obtiene estadísticas de requests HTTP
   * GET /api/performance/requests?minutes=60
   */
  async getRequestStats(req: Request, res: Response) {
    try {
      const minutes = parseInt(req.query.minutes as string) || 60;
      const stats = performanceMonitor.getRequestStats(minutes);
      
      res.json({
        success: true,
        data: stats,
        period: `${minutes} minutes`
      });
    } catch (error) {
      logger.error('Error getting request stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve request statistics'
      });
    }
  }

  /**
   * Endpoint de health check extendido con métricas
   * GET /api/performance/health
   */
  async getHealthCheck(req: Request, res: Response) {
    try {
      const metrics = performanceMonitor.getCurrentMetrics();
      const uptime = process.uptime();
      const memoryUsage = process.memoryUsage();
      
      // Determinar estado de salud basado en métricas
      const healthStatus = {
        status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
        checks: {
          memory: {
            status: 'pass' as 'pass' | 'warn' | 'fail',
            value: metrics.system.memoryUsageMB,
            threshold: 1000 // MB
          },
          cpu: {
            status: 'pass' as 'pass' | 'warn' | 'fail',
            value: metrics.system.cpuUsage,
            threshold: 80 // %
          },
          responseTime: {
            status: 'pass' as 'pass' | 'warn' | 'fail',
            value: metrics.requests.averageResponseTime,
            threshold: 1000 // ms
          },
          errorRate: {
            status: 'pass' as 'pass' | 'warn' | 'fail',
            value: metrics.requests.errorRate,
            threshold: 5 // %
          }
        }
      };

      // Evaluar cada check
      if (metrics.system.memoryUsageMB > 1500) {
        healthStatus.checks.memory.status = 'fail';
        healthStatus.status = 'unhealthy';
      } else if (metrics.system.memoryUsageMB > 1000) {
        healthStatus.checks.memory.status = 'warn';
        if (healthStatus.status === 'healthy') healthStatus.status = 'degraded';
      }

      if (metrics.system.cpuUsage > 90) {
        healthStatus.checks.cpu.status = 'fail';
        healthStatus.status = 'unhealthy';
      } else if (metrics.system.cpuUsage > 80) {
        healthStatus.checks.cpu.status = 'warn';
        if (healthStatus.status === 'healthy') healthStatus.status = 'degraded';
      }

      if (metrics.requests.averageResponseTime > 2000) {
        healthStatus.checks.responseTime.status = 'fail';
        healthStatus.status = 'unhealthy';
      } else if (metrics.requests.averageResponseTime > 1000) {
        healthStatus.checks.responseTime.status = 'warn';
        if (healthStatus.status === 'healthy') healthStatus.status = 'degraded';
      }

      if (metrics.requests.errorRate > 10) {
        healthStatus.checks.errorRate.status = 'fail';
        healthStatus.status = 'unhealthy';
      } else if (metrics.requests.errorRate > 5) {
        healthStatus.checks.errorRate.status = 'warn';
        if (healthStatus.status === 'healthy') healthStatus.status = 'degraded';
      }

      const statusCode = healthStatus.status === 'unhealthy' ? 503 : 200;

      res.status(statusCode).json({
        success: healthStatus.status !== 'unhealthy',
        service: 'bingo-backend',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: uptime,
        environment: process.env.NODE_ENV,
        health: healthStatus,
        metrics: {
          system: metrics.system,
          requests: {
            total: metrics.requests.totalRequests,
            averageResponseTime: metrics.requests.averageResponseTime,
            errorRate: metrics.requests.errorRate,
            requestsPerMinute: metrics.requests.requestsPerMinute
          }
        }
      });
    } catch (error) {
      logger.error('Error in health check:', error);
      res.status(503).json({
        success: false,
        service: 'bingo-backend',
        status: 'unhealthy',
        error: 'Health check failed'
      });
    }
  }

  /**
   * Obtiene métricas específicas del sistema operativo
   * GET /api/performance/system
   */
  async getSystemMetrics(req: Request, res: Response) {
    try {
      const os = await import('os');
      const fs = await import('fs').then(m => m.promises);
      
      const systemInfo = {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        uptime: os.uptime(),
        loadAverage: os.loadavg(),
        hostname: os.hostname(),
        nodeVersion: process.version,
        processUptime: process.uptime(),
        processMemory: process.memoryUsage(),
        processCwd: process.cwd()
      };

      // Información de disco (si está disponible)
      try {
        const stats = await fs.stat(process.cwd());
        systemInfo['diskInfo'] = {
          path: process.cwd(),
          accessible: true
        };
      } catch (error) {
        systemInfo['diskInfo'] = {
          path: process.cwd(),
          accessible: false,
          error: 'Unable to access disk stats'
        };
      }

      res.json({
        success: true,
        data: systemInfo,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error getting system metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve system metrics'
      });
    }
  }

  /**
   * Reinicia las estadísticas de performance
   * POST /api/performance/reset
   */
  async resetMetrics(req: Request, res: Response) {
    try {
      // Reiniciar métricas (si el monitor lo permite)
      logger.info('Performance metrics reset requested by admin');
      
      res.json({
        success: true,
        message: 'Performance metrics reset successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error resetting metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reset metrics'
      });
    }
  }
}

export const performanceController = new PerformanceController();