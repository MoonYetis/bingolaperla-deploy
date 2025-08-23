import { Request, Response } from 'express';
export declare class ReportController {
    /**
     * GET /api/reports/daily
     * Obtiene el reporte diario
     */
    static getDailyReport(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/reports/weekly
     * Obtiene el reporte semanal
     */
    static getWeeklyReport(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/reports/monthly
     * Obtiene el reporte mensual
     */
    static getMonthlyReport(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/reports/kpi-alerts
     * Obtiene las alertas de KPIs
     */
    static getKPIAlerts(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/reports/summary
     * Obtiene un resumen de todos los reports
     */
    static getReportsSummary(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/reports/schedule
     * Programa la generación automática de reports
     */
    static scheduleReports(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/reports/export/:type
     * Exporta un report en diferentes formatos
     */
    static exportReport(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * GET /api/reports/scheduler/status
     * Obtiene el estado del scheduler de reports
     */
    static getSchedulerStatus(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/reports/scheduler/run/:taskId
     * Ejecuta una tarea del scheduler manualmente
     */
    static runScheduledTask(req: Request, res: Response): Promise<void>;
    /**
     * PUT /api/reports/scheduler/toggle/:taskId
     * Habilita/deshabilita una tarea del scheduler
     */
    static toggleScheduledTask(req: Request, res: Response): Promise<void>;
    /**
     * Convertir datos a formato CSV (método auxiliar)
     */
    private static convertToCSV;
}
export declare const reportController: ReportController;
//# sourceMappingURL=reportController.d.ts.map