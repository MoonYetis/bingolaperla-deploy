"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceMiddleware = exports.performanceMonitor = void 0;
const analyticsService_1 = require("../services/analyticsService");
const structuredLogger_1 = require("../utils/structuredLogger");
class PerformanceMonitor {
    constructor() {
        this.requestMetrics = [];
        this.systemMetricsInterval = null;
        this.lastCpuUsage = process.cpuUsage();
        this.metricsCollectionInterval = 30000; // 30 segundos
        /**
         * Middleware para capturar métricas de requests HTTP
         */
        this.requestTrackingMiddleware = (req, res, next) => {
            const startTime = Date.now();
            const startMemory = process.memoryUsage();
            // Capturar cuando la respuesta termine
            const originalSend = res.send;
            res.send = function (data) {
                const endTime = Date.now();
                const responseTime = endTime - startTime;
                const endMemory = process.memoryUsage();
                // Crear métrica del request
                const requestMetric = {
                    method: req.method,
                    route: req.route?.path || req.path,
                    statusCode: res.statusCode,
                    responseTime,
                    userAgent: req.get('User-Agent'),
                    ip: req.ip || req.socket.remoteAddress || 'unknown',
                    timestamp: new Date(startTime)
                };
                // Almacenar métrica
                exports.performanceMonitor.addRequestMetric(requestMetric);
                // Log para requests lentos (>1000ms)
                if (responseTime > 1000) {
                    structuredLogger_1.performanceLogger.warn('Slow request detected', {
                        method: req.method,
                        route: req.route?.path || req.path,
                        responseTime,
                        memoryIncrease: endMemory.heapUsed - startMemory.heapUsed,
                        userAgent: req.get('User-Agent'),
                        ip: req.ip
                    });
                }
                // Log de performance estructurado
                structuredLogger_1.logger.request(req.method, req.route?.path || req.path, res.statusCode, responseTime, {
                    userAgent: req.get('User-Agent'),
                    ip: req.ip
                });
                return originalSend.call(this, data);
            };
            next();
        };
        this.startSystemMetricsCollection();
    }
    /**
     * Añadir métrica de request
     */
    addRequestMetric(metric) {
        this.requestMetrics.push(metric);
        // Mantener solo las últimas 1000 métricas en memoria
        if (this.requestMetrics.length > 1000) {
            this.requestMetrics = this.requestMetrics.slice(-1000);
        }
        // Log errores 5xx con contexto adicional
        if (metric.statusCode >= 500) {
            structuredLogger_1.performanceLogger.error('Server error response', new Error(`HTTP ${metric.statusCode}`), {
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
            }
            catch (error) {
                structuredLogger_1.performanceLogger.error('Error collecting system metrics', error);
            }
        }, this.metricsCollectionInterval);
        structuredLogger_1.performanceLogger.info('System metrics collection started', {
            interval: this.metricsCollectionInterval
        });
    }
    /**
     * Obtener métricas del sistema
     */
    getSystemMetrics() {
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
    calculateCpuUsage() {
        const currentCpuUsage = process.cpuUsage(this.lastCpuUsage);
        this.lastCpuUsage = process.cpuUsage();
        const totalUsage = currentCpuUsage.user + currentCpuUsage.system;
        const totalTime = this.metricsCollectionInterval * 1000; // microseconds
        return (totalUsage / totalTime) * 100;
    }
    /**
     * Obtener número de conexiones activas (aproximado)
     */
    getActiveConnections() {
        // En un entorno real, esto se obtendría del load balancer o Nginx
        // Por ahora usamos una aproximación basada en Socket.IO
        const io = global.socketIO;
        return io ? io.sockets.sockets.size : 0;
    }
    /**
     * Registrar métricas del sistema en analytics
     */
    async recordSystemMetrics(metrics) {
        try {
            const realtimeMetrics = {
                activeUsers: this.getActiveUsers(),
                activeGames: await this.getActiveGames(),
                memoryUsage: this.bytesToMB(metrics.memoryUsage.heapUsed),
                cpuUsage: metrics.cpuUsage,
                dbConnections: await this.getDbConnections(),
                socketConnections: metrics.activeConnections
            };
            await analyticsService_1.analyticsService.recordRealtimeMetrics(realtimeMetrics);
        }
        catch (error) {
            structuredLogger_1.performanceLogger.error('Error recording system metrics', error);
        }
    }
    /**
     * Obtener usuarios activos (últimos 30 minutos)
     */
    getActiveUsers() {
        const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
        return this.requestMetrics.filter(metric => metric.timestamp.getTime() > thirtyMinutesAgo).length;
    }
    /**
     * Obtener juegos activos
     */
    async getActiveGames() {
        try {
            // Esto requeriría acceso a Prisma, se implementaría según la arquitectura
            return 0; // Placeholder
        }
        catch (error) {
            return 0;
        }
    }
    /**
     * Obtener conexiones de base de datos activas
     */
    async getDbConnections() {
        try {
            // En un entorno real se obtendría de Prisma o el pool de conexiones
            return 5; // Placeholder
        }
        catch (error) {
            return 0;
        }
    }
    /**
     * Convertir bytes a MB
     */
    bytesToMB(bytes) {
        return Math.round((bytes / 1024 / 1024) * 100) / 100;
    }
    /**
     * Obtener estadísticas de performance de requests
     */
    getRequestStats(minutes = 60) {
        const cutoff = Date.now() - (minutes * 60 * 1000);
        const recentRequests = this.requestMetrics.filter(metric => metric.timestamp.getTime() > cutoff);
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
    getStatusCodeDistribution(requests) {
        const distribution = {};
        requests.forEach(request => {
            distribution[request.statusCode] = (distribution[request.statusCode] || 0) + 1;
        });
        return distribution;
    }
    /**
     * Obtener rutas más utilizadas
     */
    getTopRoutes(requests) {
        const routeCount = {};
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
    getSlowestRequests(requests) {
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
            structuredLogger_1.performanceLogger.info('System metrics collection stopped');
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
exports.performanceMonitor = new PerformanceMonitor();
// Export middleware
exports.performanceMiddleware = exports.performanceMonitor.requestTrackingMiddleware;
//# sourceMappingURL=performanceMonitoring.js.map