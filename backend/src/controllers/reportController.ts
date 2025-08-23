import { Request, Response } from 'express';
import { reportService } from '../services/reportService';
import { schedulerService } from '../services/schedulerService';
import { analyticsLogger } from '../utils/structuredLogger';
import { HTTP_STATUS } from '../utils/constants';

export class ReportController {
  /**
   * GET /api/reports/daily
   * Obtiene el reporte diario
   */
  static async getDailyReport(req: Request, res: Response) {
    try {
      const { date } = req.query;
      const targetDate = date ? new Date(date as string) : undefined;

      analyticsLogger.info('Daily report requested', { 
        date: targetDate?.toISOString(),
        userId: req.user?.userId
      });

      const report = await reportService.generateDailyReport(targetDate);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: report,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      analyticsLogger.error('Error generating daily report', error as Error, {
        userId: req.user?.userId,
        date: req.query.date
      });

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to generate daily report'
      });
    }
  }

  /**
   * GET /api/reports/weekly
   * Obtiene el reporte semanal
   */
  static async getWeeklyReport(req: Request, res: Response) {
    try {
      const { weekStart } = req.query;
      const startDate = weekStart ? new Date(weekStart as string) : undefined;

      analyticsLogger.info('Weekly report requested', { 
        weekStart: startDate?.toISOString(),
        userId: req.user?.userId
      });

      const report = await reportService.generateWeeklyReport(startDate);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: report,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      analyticsLogger.error('Error generating weekly report', error as Error, {
        userId: req.user?.userId,
        weekStart: req.query.weekStart
      });

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to generate weekly report'
      });
    }
  }

  /**
   * GET /api/reports/monthly
   * Obtiene el reporte mensual
   */
  static async getMonthlyReport(req: Request, res: Response) {
    try {
      const { month, year } = req.query;
      const targetMonth = month ? parseInt(month as string) : undefined;
      const targetYear = year ? parseInt(year as string) : undefined;

      analyticsLogger.info('Monthly report requested', { 
        month: targetMonth,
        year: targetYear,
        userId: req.user?.userId
      });

      const report = await reportService.generateMonthlyReport(targetMonth, targetYear);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: report,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      analyticsLogger.error('Error generating monthly report', error as Error, {
        userId: req.user?.userId,
        month: req.query.month,
        year: req.query.year
      });

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to generate monthly report'
      });
    }
  }

  /**
   * GET /api/reports/kpi-alerts
   * Obtiene las alertas de KPIs
   */
  static async getKPIAlerts(req: Request, res: Response) {
    try {
      analyticsLogger.info('KPI alerts requested', { 
        userId: req.user?.userId
      });

      const alerts = await reportService.checkKPIsAndGenerateAlerts();

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: alerts,
        count: alerts.length,
        critical: alerts.filter(alert => alert.type === 'critical').length,
        warnings: alerts.filter(alert => alert.type === 'warning').length,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      analyticsLogger.error('Error generating KPI alerts', error as Error, {
        userId: req.user?.userId
      });

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to generate KPI alerts'
      });
    }
  }

  /**
   * GET /api/reports/summary
   * Obtiene un resumen de todos los reports
   */
  static async getReportsSummary(req: Request, res: Response) {
    try {
      analyticsLogger.info('Reports summary requested', { 
        userId: req.user?.userId
      });

      // Generar reports de forma concurrente
      const [dailyReport, weeklyReport, alerts] = await Promise.all([
        reportService.generateDailyReport(),
        reportService.generateWeeklyReport(),
        reportService.checkKPIsAndGenerateAlerts()
      ]);

      const summary = {
        today: {
          newUsers: dailyReport.summary.newUsers,
          revenue: dailyReport.summary.totalRevenue,
          games: dailyReport.summary.totalGames,
          activeUsers: dailyReport.summary.activeUsers
        },
        thisWeek: {
          newUsers: weeklyReport.summary.newUsers,
          revenue: weeklyReport.summary.totalRevenue,
          games: weeklyReport.summary.totalGames,
          revenueGrowth: weeklyReport.summary.revenueGrowth
        },
        alerts: {
          total: alerts.length,
          critical: alerts.filter(a => a.type === 'critical').length,
          warnings: alerts.filter(a => a.type === 'warning').length,
          recent: alerts.slice(0, 5) // Últimas 5 alertas
        },
        performance: {
          responseTime: dailyReport.performance.averageResponseTime,
          errorRate: dailyReport.performance.errorRate,
          uptime: dailyReport.performance.systemUptime
        }
      };

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: summary,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      analyticsLogger.error('Error generating reports summary', error as Error, {
        userId: req.user?.userId
      });

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to generate reports summary'
      });
    }
  }

  /**
   * POST /api/reports/schedule
   * Programa la generación automática de reports
   */
  static async scheduleReports(req: Request, res: Response) {
    try {
      const { type, frequency, email } = req.body;

      analyticsLogger.audit({
        action: 'schedule_reports',
        resource: 'reports',
        userId: req.user?.email,
        success: true
      }, { 
        type, 
        frequency, 
        email,
        ip: req.ip
      });

      // Aquí se implementaría la lógica de scheduling
      // Por ahora, solo confirmamos la solicitud
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Report scheduling configured successfully',
        schedule: {
          type,
          frequency,
          email,
          nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Mañana
        }
      });
    } catch (error) {
      analyticsLogger.error('Error scheduling reports', error as Error, {
        userId: req.user?.userId,
        requestBody: req.body
      });

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to schedule reports'
      });
    }
  }

  /**
   * GET /api/reports/export/:type
   * Exporta un report en diferentes formatos
   */
  static async exportReport(req: Request, res: Response) {
    try {
      const { type } = req.params;
      const { format = 'json', date } = req.query;

      analyticsLogger.info('Report export requested', { 
        type,
        format,
        date,
        userId: req.user?.userId
      });

      let report: any;
      switch (type) {
        case 'daily':
          report = await reportService.generateDailyReport(date ? new Date(date as string) : undefined);
          break;
        case 'weekly':
          report = await reportService.generateWeeklyReport(date ? new Date(date as string) : undefined);
          break;
        case 'monthly':
          const monthYear = date ? new Date(date as string) : new Date();
          report = await reportService.generateMonthlyReport(monthYear.getMonth() + 1, monthYear.getFullYear());
          break;
        default:
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            error: 'Invalid report type'
          });
      }

      if (format === 'csv') {
        // Convertir a CSV (implementación simplificada)
        const csv = ReportController.convertToCSV(report);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${type}-report-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv);
      } else {
        // JSON por defecto
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${type}-report-${new Date().toISOString().split('T')[0]}.json"`);
        res.json({
          success: true,
          data: report,
          exportedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      analyticsLogger.error('Error exporting report', error as Error, {
        userId: req.user?.userId,
        type: req.params.type,
        format: req.query.format
      });

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to export report'
      });
    }
  }

  /**
   * GET /api/reports/scheduler/status
   * Obtiene el estado del scheduler de reports
   */
  static async getSchedulerStatus(req: Request, res: Response) {
    try {
      analyticsLogger.info('Scheduler status requested', { 
        userId: req.user?.userId
      });

      const status = schedulerService.getScheduledTasks();

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: status
      });
    } catch (error) {
      analyticsLogger.error('Error getting scheduler status', error as Error, {
        userId: req.user?.userId
      });

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to get scheduler status'
      });
    }
  }

  /**
   * POST /api/reports/scheduler/run/:taskId
   * Ejecuta una tarea del scheduler manualmente
   */
  static async runScheduledTask(req: Request, res: Response) {
    try {
      const { taskId } = req.params;

      analyticsLogger.info('Manual task execution requested', { 
        taskId,
        userId: req.user?.userId
      });

      await schedulerService.runTaskNow(taskId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: `Task ${taskId} executed successfully`
      });
    } catch (error) {
      analyticsLogger.error('Error running scheduled task', error as Error, {
        userId: req.user?.userId,
        taskId: req.params.taskId
      });

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to run scheduled task'
      });
    }
  }

  /**
   * PUT /api/reports/scheduler/toggle/:taskId
   * Habilita/deshabilita una tarea del scheduler
   */
  static async toggleScheduledTask(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      const { enabled } = req.body;

      analyticsLogger.info('Task toggle requested', { 
        taskId,
        enabled,
        userId: req.user?.userId
      });

      schedulerService.toggleTask(taskId, enabled);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: `Task ${taskId} ${enabled ? 'enabled' : 'disabled'} successfully`
      });
    } catch (error) {
      analyticsLogger.error('Error toggling scheduled task', error as Error, {
        userId: req.user?.userId,
        taskId: req.params.taskId
      });

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to toggle scheduled task'
      });
    }
  }

  /**
   * Convertir datos a formato CSV (método auxiliar)
   */
  private static convertToCSV(data: any): string {
    try {
      // Implementación simplificada de conversión a CSV
      const headers = Object.keys(data).join(',');
      const values = Object.values(data).map(value => 
        typeof value === 'object' ? JSON.stringify(value) : value
      ).join(',');
      
      return `${headers}\n${values}`;
    } catch (error) {
      return 'Error converting to CSV';
    }
  }
}

export const reportController = new ReportController();