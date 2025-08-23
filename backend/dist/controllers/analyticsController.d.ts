import { Request, Response } from 'express';
export declare class AnalyticsController {
    /**
     * Obtiene métricas principales de negocio
     * GET /api/analytics/metrics
     */
    getBusinessMetrics(req: Request, res: Response): Promise<void>;
    /**
     * Obtiene analytics de usuarios
     * GET /api/analytics/users?limit=100
     */
    getUserAnalytics(req: Request, res: Response): Promise<void>;
    /**
     * Obtiene analytics de juegos
     * GET /api/analytics/games/:gameId?
     */
    getGameAnalytics(req: Request, res: Response): Promise<void>;
    /**
     * Obtiene métricas en tiempo real
     * GET /api/analytics/realtime?hours=1
     */
    getRealtimeMetrics(req: Request, res: Response): Promise<void>;
    /**
     * Registra métricas en tiempo real
     * POST /api/analytics/realtime
     */
    recordRealtimeMetrics(req: Request, res: Response): Promise<void>;
    /**
     * Genera reporte personalizado
     * POST /api/analytics/reports
     */
    generateCustomReport(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Obtiene tendencias de métricas
     * GET /api/analytics/trends/:metric?days=7
     */
    getTrends(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Dashboard completo con todas las métricas
     * GET /api/analytics/dashboard
     */
    getDashboard(req: Request, res: Response): Promise<void>;
    /**
     * Obtiene KPIs específicos de Bingo
     * GET /api/analytics/kpis
     */
    getBingoKPIs(req: Request, res: Response): Promise<void>;
}
export declare const analyticsController: AnalyticsController;
//# sourceMappingURL=analyticsController.d.ts.map