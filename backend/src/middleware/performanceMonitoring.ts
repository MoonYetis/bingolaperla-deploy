import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analyticsService';
import { performanceLogger, logger } from '../utils/structuredLogger';

// Interface para métricas de performance de requests
interface RequestMetrics {
  method: string;
  route: string;
  statusCode: number;
  responseTime: number;
  userAgent?: string;
  ip: string;
  timestamp: Date;
}

// Interface para métricas del sistema
interface SystemMetrics {
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: number;
  uptime: number;
  activeConnections: number;
  timestamp: Date;
}

class PerformanceMonitor {
  private requestMetrics: RequestMetrics[] = [];
  private systemMetricsInterval: NodeJS.Timeout | null = null;
  private lastCpuUsage = process.cpuUsage();
  private metricsCollectionInterval = 30000; // 30 segundos

  constructor() {
    this.startSystemMetricsCollection();
  }

  /**
   * Middleware para capturar métricas de requests HTTP
   */
  requestTrackingMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    // Capturar cuando la respuesta termine
    const originalSend = res.send;
    res.send = function(data) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      const endMemory = process.memoryUsage();

      // Crear métrica del request
      const requestMetric: RequestMetrics = {
        method: req.method,
        route: req.route?.path || req.path,
        statusCode: res.statusCode,
        responseTime,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.socket.remoteAddress || 'unknown',
        timestamp: new Date(startTime)
      };

      // Almacenar métrica
      performanceMonitor.addRequestMetric(requestMetric);

      // Log para requests lentos (>1000ms)
      if (responseTime > 1000) {
        performanceLogger.warn('Slow request detected', {
          method: req.method,
          route: req.route?.path || req.path,
          responseTime,
          memoryIncrease: endMemory.heapUsed - startMemory.heapUsed,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        });
      }

      // Log de performance estructurado
      logger.request(req.method, req.route?.path || req.path, res.statusCode, responseTime, {
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });

      return originalSend.call(this, data);
    };

    next();
  };

  /**
   * Añadir métrica de request
   */
  addRequestMetric(metric: RequestMetrics) {
    this.requestMetrics.push(metric);
    
    // Mantener solo las últimas 1000 métricas en memoria
    if (this.requestMetrics.length > 1000) {
      this.requestMetrics = this.requestMetrics.slice(-1000);
    }

    // Log errores 5xx con contexto adicional
    if (metric.statusCode >= 500) {
      performanceLogger.error('Server error response', new Error(`HTTP ${metric.statusCode}`), {
        method: metric.method,
        route: metric.route,
        responseTime: metric.responseTime,
        ip: metric.ip,
        userAgent: metric.userAgent
      });
    }
  }

  /**
   * Iniciar recolección de métricas del sistema
   */
  startSystemMetricsCollection() {
    this.systemMetricsInterval = setInterval(async () => {
      try {
        const systemMetrics = this.getSystemMetrics();
        await this.recordSystemMetrics(systemMetrics);
      } catch (error) {
        performanceLogger.error('Error collecting system metrics', error as Error);
      }
    }, this.metricsCollectionInterval);

    performanceLogger.info('System metrics collection started', {
      interval: this.metricsCollectionInterval
    });
  }

  /**
   * Obtener métricas del sistema
   */
  getSystemMetrics(): SystemMetrics {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = this.calculateCpuUsage();
    
    return {
      memoryUsage,
      cpuUsage,
      uptime: process.uptime(),
      activeConnections: this.getActiveConnections(),
      timestamp: new Date()
    };
  }

  /**
   * Calcular uso de CPU
   */
  private calculateCpuUsage(): number {
    const currentCpuUsage = process.cpuUsage(this.lastCpuUsage);
    this.lastCpuUsage = process.cpuUsage();
    
    const totalUsage = currentCpuUsage.user + currentCpuUsage.system;
    const totalTime = this.metricsCollectionInterval * 1000; // microseconds
    
    return (totalUsage / totalTime) * 100;
  }

  /**
   * Obtener número de conexiones activas (aproximado)
   */
  private getActiveConnections(): number {
    // En un entorno real, esto se obtendría del load balancer o Nginx
    // Por ahora usamos una aproximación basada en Socket.IO
    const io = (global as any).socketIO;
    return io ? io.sockets.sockets.size : 0;
  }

  /**
   * Registrar métricas del sistema en analytics
   */
  private async recordSystemMetrics(metrics: SystemMetrics) {
    try {
      const realtimeMetrics = {
        activeUsers: this.getActiveUsers(),
        activeGames: await this.getActiveGames(),
        memoryUsage: this.bytesToMB(metrics.memoryUsage.heapUsed),
        cpuUsage: metrics.cpuUsage,
        dbConnections: await this.getDbConnections(),
        socketConnections: metrics.activeConnections
      };

      await analyticsService.recordRealtimeMetrics(realtimeMetrics);
    } catch (error) {
      performanceLogger.error('Error recording system metrics', error as Error);
    }
  }

  /**
   * Obtener usuarios activos (últimos 30 minutos)
   */
  private getActiveUsers(): number {
    const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
    return this.requestMetrics.filter(metric => 
      metric.timestamp.getTime() > thirtyMinutesAgo
    ).length;
  }

  /**
   * Obtener juegos activos
   */
  private async getActiveGames(): Promise<number> {
    try {
      // Esto requeriría acceso a Prisma, se implementaría según la arquitectura
      return 0; // Placeholder
    } catch (error) {
      return 0;
    }
  }

  /**
   * Obtener conexiones de base de datos activas
   */
  private async getDbConnections(): Promise<number> {
    try {
      // En un entorno real se obtendría de Prisma o el pool de conexiones
      return 5; // Placeholder
    } catch (error) {
      return 0;
    }
  }

  /**
   * Convertir bytes a MB
   */
  private bytesToMB(bytes: number): number {
    return Math.round((bytes / 1024 / 1024) * 100) / 100;
  }

  /**
   * Obtener estadísticas de performance de requests
   */
  getRequestStats(minutes: number = 60) {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    const recentRequests = this.requestMetrics.filter(
      metric => metric.timestamp.getTime() > cutoff
    );

    if (recentRequests.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        requestsPerMinute: 0
      };
    }

    const totalRequests = recentRequests.length;
    const totalResponseTime = recentRequests.reduce((sum, metric) => sum + metric.responseTime, 0);
    const errorRequests = recentRequests.filter(metric => metric.statusCode >= 400).length;

    return {
      totalRequests,
      averageResponseTime: Math.round(totalResponseTime / totalRequests),
      errorRate: (errorRequests / totalRequests) * 100,
      requestsPerMinute: Math.round(totalRequests / minutes),
      statusCodes: this.getStatusCodeDistribution(recentRequests),
      topRoutes: this.getTopRoutes(recentRequests),
      slowestRequests: this.getSlowestRequests(recentRequests)
    };
  }

  /**
   * Obtener distribución de códigos de estado
   */
  private getStatusCodeDistribution(requests: RequestMetrics[]) {
    const distribution: { [code: number]: number } = {};
    
    requests.forEach(request => {
      distribution[request.statusCode] = (distribution[request.statusCode] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Obtener rutas más utilizadas
   */
  private getTopRoutes(requests: RequestMetrics[]) {
    const routeCount: { [route: string]: number } = {};
    
    requests.forEach(request => {
      const key = `${request.method} ${request.route}`;
      routeCount[key] = (routeCount[key] || 0) + 1;
    });

    return Object.entries(routeCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([route, count]) => ({ route, count }));
  }

  /**
   * Obtener requests más lentos
   */
  private getSlowestRequests(requests: RequestMetrics[]) {
    return requests
      .sort((a, b) => b.responseTime - a.responseTime)
      .slice(0, 10)
      .map(request => ({
        route: `${request.method} ${request.route}`,
        responseTime: request.responseTime,
        timestamp: request.timestamp
      }));
  }

  /**
   * Detener recolección de métricas
   */
  stop() {
    if (this.systemMetricsInterval) {
      clearInterval(this.systemMetricsInterval);
      this.systemMetricsInterval = null;
      performanceLogger.info('System metrics collection stopped');
    }
  }

  /**
   * Obtener métricas actuales del sistema
   */
  getCurrentMetrics() {
    const systemMetrics = this.getSystemMetrics();
    const requestStats = this.getRequestStats(60);

    return {
      system: {
        memoryUsageMB: this.bytesToMB(systemMetrics.memoryUsage.heapUsed),
        memoryTotalMB: this.bytesToMB(systemMetrics.memoryUsage.heapTotal),
        cpuUsage: systemMetrics.cpuUsage,
        uptime: systemMetrics.uptime,
        activeConnections: systemMetrics.activeConnections
      },
      requests: requestStats,
      timestamp: new Date()
    };
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export middleware
export const performanceMiddleware = performanceMonitor.requestTrackingMiddleware;