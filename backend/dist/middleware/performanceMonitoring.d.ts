import { Request, Response, NextFunction } from 'express';
interface RequestMetrics {
    method: string;
    route: string;
    statusCode: number;
    responseTime: number;
    userAgent?: string;
    ip: string;
    timestamp: Date;
}
interface SystemMetrics {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: number;
    uptime: number;
    activeConnections: number;
    timestamp: Date;
}
declare class PerformanceMonitor {
    private requestMetrics;
    private systemMetricsInterval;
    private lastCpuUsage;
    private metricsCollectionInterval;
    constructor();
    /**
     * Middleware para capturar métricas de requests HTTP
     */
    requestTrackingMiddleware: (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Añadir métrica de request
     */
    addRequestMetric(metric: RequestMetrics): void;
    /**
     * Iniciar recolección de métricas del sistema
     */
    startSystemMetricsCollection(): void;
    /**
     * Obtener métricas del sistema
     */
    getSystemMetrics(): SystemMetrics;
    /**
     * Calcular uso de CPU
     */
    private calculateCpuUsage;
    /**
     * Obtener número de conexiones activas (aproximado)
     */
    private getActiveConnections;
    /**
     * Registrar métricas del sistema en analytics
     */
    private recordSystemMetrics;
    /**
     * Obtener usuarios activos (últimos 30 minutos)
     */
    private getActiveUsers;
    /**
     * Obtener juegos activos
     */
    private getActiveGames;
    /**
     * Obtener conexiones de base de datos activas
     */
    private getDbConnections;
    /**
     * Convertir bytes a MB
     */
    private bytesToMB;
    /**
     * Obtener estadísticas de performance de requests
     */
    getRequestStats(minutes?: number): {
        totalRequests: number;
        averageResponseTime: number;
        errorRate: number;
        requestsPerMinute: number;
        statusCodes?: undefined;
        topRoutes?: undefined;
        slowestRequests?: undefined;
    } | {
        totalRequests: number;
        averageResponseTime: number;
        errorRate: number;
        requestsPerMinute: number;
        statusCodes: {
            [code: number]: number;
        };
        topRoutes: {
            route: string;
            count: number;
        }[];
        slowestRequests: {
            route: string;
            responseTime: number;
            timestamp: Date;
        }[];
    };
    /**
     * Obtener distribución de códigos de estado
     */
    private getStatusCodeDistribution;
    /**
     * Obtener rutas más utilizadas
     */
    private getTopRoutes;
    /**
     * Obtener requests más lentos
     */
    private getSlowestRequests;
    /**
     * Detener recolección de métricas
     */
    stop(): void;
    /**
     * Obtener métricas actuales del sistema
     */
    getCurrentMetrics(): {
        system: {
            memoryUsageMB: number;
            memoryTotalMB: number;
            cpuUsage: number;
            uptime: number;
            activeConnections: number;
        };
        requests: {
            totalRequests: number;
            averageResponseTime: number;
            errorRate: number;
            requestsPerMinute: number;
            statusCodes?: undefined;
            topRoutes?: undefined;
            slowestRequests?: undefined;
        } | {
            totalRequests: number;
            averageResponseTime: number;
            errorRate: number;
            requestsPerMinute: number;
            statusCodes: {
                [code: number]: number;
            };
            topRoutes: {
                route: string;
                count: number;
            }[];
            slowestRequests: {
                route: string;
                responseTime: number;
                timestamp: Date;
            }[];
        };
        timestamp: Date;
    };
}
export declare const performanceMonitor: PerformanceMonitor;
export declare const performanceMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=performanceMonitoring.d.ts.map