import { Request, Response } from 'express';
export declare class PerformanceController {
    /**
     * Obtiene métricas de performance en tiempo real
     * GET /api/performance/metrics
     */
    getCurrentMetrics(req: Request, res: Response): Promise<void>;
    /**
     * Obtiene estadísticas de requests HTTP
     * GET /api/performance/requests?minutes=60
     */
    getRequestStats(req: Request, res: Response): Promise<void>;
    /**
     * Endpoint de health check extendido con métricas
     * GET /api/performance/health
     */
    getHealthCheck(req: Request, res: Response): Promise<void>;
    /**
     * Obtiene métricas específicas del sistema operativo
     * GET /api/performance/system
     */
    getSystemMetrics(req: Request, res: Response): Promise<void>;
    /**
     * Reinicia las estadísticas de performance
     * POST /api/performance/reset
     */
    resetMetrics(req: Request, res: Response): Promise<void>;
}
export declare const performanceController: PerformanceController;
//# sourceMappingURL=performanceController.d.ts.map