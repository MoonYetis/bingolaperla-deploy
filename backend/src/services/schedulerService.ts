import { reportService } from './reportService';
import { analyticsLogger } from '../utils/structuredLogger';

export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly';
export type ReportType = 'daily' | 'weekly' | 'monthly' | 'kpi-alerts';

interface ScheduledTask {
  id: string;
  type: ReportType;
  frequency: ScheduleFrequency;
  enabled: boolean;
  lastRun?: Date;
  nextRun: Date;
  emails: string[];
  timer?: NodeJS.Timeout;
}

class SchedulerService {
  private tasks: Map<string, ScheduledTask> = new Map();
  private isRunning = false;

  /**
   * Inicializar el scheduler con tareas por defecto
   */
  async initialize() {
    try {
      analyticsLogger.info('Initializing scheduler service');

      // Programar verificación de KPIs cada hora
      this.scheduleTask({
        id: 'kpi-alerts-hourly',
        type: 'kpi-alerts',
        frequency: 'daily',
        enabled: false, // Temporalmente deshabilitado para troubleshooting
        nextRun: this.getNextHourlyRun(),
        emails: ['admin@bingo-la-perla.com']
      });

      // Programar reporte diario automático a las 8:00 AM
      this.scheduleTask({
        id: 'daily-report-auto',
        type: 'daily',
        frequency: 'daily',
        enabled: false, // Temporalmente deshabilitado para troubleshooting
        nextRun: this.getNextDailyRun(8), // 8:00 AM
        emails: ['admin@bingo-la-perla.com', 'manager@bingo-la-perla.com']
      });

      // Programar reporte semanal los lunes a las 9:00 AM
      this.scheduleTask({
        id: 'weekly-report-auto',
        type: 'weekly',
        frequency: 'weekly',
        enabled: false, // Temporalmente deshabilitado para troubleshooting
        nextRun: this.getNextWeeklyRun(1, 9), // Lunes, 9:00 AM
        emails: ['admin@bingo-la-perla.com', 'manager@bingo-la-perla.com']
      });

      // Programar reporte mensual el día 1 de cada mes a las 10:00 AM
      this.scheduleTask({
        id: 'monthly-report-auto',
        type: 'monthly',
        frequency: 'monthly',
        enabled: false, // Temporalmente deshabilitado para troubleshooting
        nextRun: this.getNextMonthlyRun(1, 10), // Día 1, 10:00 AM
        emails: ['admin@bingo-la-perla.com', 'ceo@bingo-la-perla.com']
      });

      this.isRunning = true;
      analyticsLogger.info('Scheduler service initialized successfully', {
        tasksCount: this.tasks.size
      });

    } catch (error) {
      analyticsLogger.error('Error initializing scheduler service', error as Error);
      throw error;
    }
  }

  /**
   * Programar una nueva tarea
   */
  scheduleTask(task: Omit<ScheduledTask, 'timer'>) {
    try {
      const existingTask = this.tasks.get(task.id);
      if (existingTask?.timer) {
        clearTimeout(existingTask.timer);
      }

      const timeUntilNextRun = task.nextRun.getTime() - Date.now();
      
      if (timeUntilNextRun <= 0) {
        // Si la fecha ya pasó, ejecutar inmediatamente y reprogramar
        this.executeTask(task.id, task.type);
        task.nextRun = this.getNextRunDate(task.type, task.frequency);
      }

      // Limitar el timeout a un máximo razonable (24 horas = 86400000 ms)
      const maxTimeout = 24 * 60 * 60 * 1000; // 24 horas
      const safeTimeout = Math.min(Math.max(timeUntilNextRun, 1000), maxTimeout);

      const timer = setTimeout(() => {
        this.executeTask(task.id, task.type);
      }, safeTimeout);

      const scheduledTask: ScheduledTask = {
        ...task,
        timer
      };

      this.tasks.set(task.id, scheduledTask);

      analyticsLogger.info('Task scheduled successfully', {
        taskId: task.id,
        type: task.type,
        frequency: task.frequency,
        nextRun: task.nextRun.toISOString(),
        timeUntilRun: timeUntilNextRun
      });

    } catch (error) {
      analyticsLogger.error('Error scheduling task', error as Error, { taskId: task.id });
      throw error;
    }
  }

  /**
   * Ejecutar una tarea específica
   */
  private async executeTask(taskId: string, type: ReportType) {
    try {
      const task = this.tasks.get(taskId);
      if (!task || !task.enabled) {
        return;
      }

      analyticsLogger.info('Executing scheduled task', { taskId, type });

      let result: any;
      let subject: string;

      switch (type) {
        case 'daily':
          result = await reportService.generateDailyReport();
          subject = `Daily Report - ${new Date().toISOString().split('T')[0]}`;
          break;

        case 'weekly':
          result = await reportService.generateWeeklyReport();
          subject = `Weekly Report - Week of ${result.weekStart}`;
          break;

        case 'monthly':
          result = await reportService.generateMonthlyReport();
          subject = `Monthly Report - ${result.month} ${result.year}`;
          break;

        case 'kpi-alerts':
          result = await reportService.checkKPIsAndGenerateAlerts();
          if (result.length > 0) {
            subject = `KPI Alerts - ${result.length} alerts detected`;
          } else {
            // No hay alertas, no enviar email
            this.rescheduleTask(taskId);
            return;
          }
          break;

        default:
          analyticsLogger.warn('Unknown task type', { taskId, type });
          return;
      }

      // Simular envío de email (aquí se integraría con servicio de email real)
      await this.sendReportEmail(task.emails, subject, result, type);

      // Actualizar última ejecución y reprogramar
      task.lastRun = new Date();
      this.rescheduleTask(taskId);

      analyticsLogger.info('Scheduled task executed successfully', {
        taskId,
        type,
        emailsSent: task.emails.length,
        lastRun: task.lastRun.toISOString()
      });

    } catch (error) {
      analyticsLogger.error('Error executing scheduled task', error as Error, { taskId, type });
      
      // Reprogramar incluso si hay error
      this.rescheduleTask(taskId);
    }
  }

  /**
   * Reprogramar una tarea después de su ejecución
   */
  private rescheduleTask(taskId: string) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    // Calcular próxima ejecución
    task.nextRun = this.getNextRunDate(task.type, task.frequency);

    // Limpiar timer anterior
    if (task.timer) {
      clearTimeout(task.timer);
    }

    // Programar siguiente ejecución
    const timeUntilNextRun = task.nextRun.getTime() - Date.now();
    // Limitar el timeout a un máximo razonable (24 horas)
    const maxTimeout = 24 * 60 * 60 * 1000;
    const safeTimeout = Math.min(Math.max(timeUntilNextRun, 1000), maxTimeout);
    
    task.timer = setTimeout(() => {
      this.executeTask(taskId, task.type);
    }, safeTimeout);

    analyticsLogger.info('Task rescheduled', {
      taskId,
      nextRun: task.nextRun.toISOString(),
      timeUntilRun: timeUntilNextRun
    });
  }

  /**
   * Simular envío de email con reporte
   */
  private async sendReportEmail(emails: string[], subject: string, data: any, type: ReportType) {
    try {
      // Aquí se integraría con un servicio de email real (SendGrid, AWS SES, etc.)
      analyticsLogger.info('Report email sent (simulated)', {
        emails,
        subject,
        type,
        dataSize: JSON.stringify(data).length
      });

      // Simular delay de envío
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      analyticsLogger.error('Error sending report email', error as Error, { emails, subject });
    }
  }

  /**
   * Obtener próxima fecha de ejecución basada en tipo y frecuencia
   */
  private getNextRunDate(type: ReportType, frequency: ScheduleFrequency): Date {
    const now = new Date();

    switch (type) {
      case 'kpi-alerts':
        return this.getNextHourlyRun();
      
      case 'daily':
        return this.getNextDailyRun(8); // 8:00 AM
      
      case 'weekly':
        return this.getNextWeeklyRun(1, 9); // Lunes 9:00 AM
      
      case 'monthly':
        return this.getNextMonthlyRun(1, 10); // Día 1, 10:00 AM
      
      default:
        // Default: próxima hora
        return new Date(now.getTime() + 60 * 60 * 1000);
    }
  }

  /**
   * Calcular próxima ejecución cada hora
   */
  private getNextHourlyRun(): Date {
    const next = new Date();
    next.setHours(next.getHours() + 1, 0, 0, 0);
    return next;
  }

  /**
   * Calcular próxima ejecución diaria
   */
  private getNextDailyRun(hour: number = 8): Date {
    const next = new Date();
    next.setHours(hour, 0, 0, 0);
    
    // Si ya pasó la hora de hoy, programar para mañana
    if (next <= new Date()) {
      next.setDate(next.getDate() + 1);
    }
    
    return next;
  }

  /**
   * Calcular próxima ejecución semanal
   */
  private getNextWeeklyRun(dayOfWeek: number = 1, hour: number = 9): Date {
    const next = new Date();
    next.setHours(hour, 0, 0, 0);
    
    const daysUntilTarget = (dayOfWeek - next.getDay() + 7) % 7;
    if (daysUntilTarget === 0 && next <= new Date()) {
      // Si es el mismo día pero ya pasó la hora, programar para la próxima semana
      next.setDate(next.getDate() + 7);
    } else {
      next.setDate(next.getDate() + daysUntilTarget);
    }
    
    return next;
  }

  /**
   * Calcular próxima ejecución mensual
   */
  private getNextMonthlyRun(day: number = 1, hour: number = 10): Date {
    const now = new Date();
    const next = new Date();
    next.setDate(day);
    next.setHours(hour, 0, 0, 0);
    
    // Si la fecha ya pasó este mes, programar para el próximo mes
    if (next <= now) {
      next.setMonth(next.getMonth() + 1);
      // Asegurar que no excedemos el último día del mes
      if (next.getDate() !== day) {
        next.setDate(0); // Último día del mes anterior
      }
    }
    
    return next;
  }

  /**
   * Obtener estado de todas las tareas programadas
   */
  getScheduledTasks() {
    const tasks = Array.from(this.tasks.values()).map(task => ({
      id: task.id,
      type: task.type,
      frequency: task.frequency,
      enabled: task.enabled,
      lastRun: task.lastRun?.toISOString(),
      nextRun: task.nextRun.toISOString(),
      emails: task.emails,
      timeUntilNext: task.nextRun.getTime() - Date.now()
    }));

    return {
      isRunning: this.isRunning,
      tasksCount: tasks.length,
      tasks
    };
  }

  /**
   * Habilitar/deshabilitar una tarea
   */
  toggleTask(taskId: string, enabled: boolean) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.enabled = enabled;

    if (enabled && !task.timer) {
      // Reprogramar si se habilitó
      this.rescheduleTask(taskId);
    } else if (!enabled && task.timer) {
      // Cancelar si se deshabilitó
      clearTimeout(task.timer);
      task.timer = undefined;
    }

    analyticsLogger.info('Task toggled', { taskId, enabled });
  }

  /**
   * Detener el scheduler
   */
  stop() {
    try {
      this.tasks.forEach((task, taskId) => {
        if (task.timer) {
          clearTimeout(task.timer);
        }
      });

      this.tasks.clear();
      this.isRunning = false;

      analyticsLogger.info('Scheduler service stopped');
    } catch (error) {
      analyticsLogger.error('Error stopping scheduler service', error as Error);
    }
  }

  /**
   * Ejecutar una tarea manualmente
   */
  async runTaskNow(taskId: string) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    analyticsLogger.info('Manual task execution requested', { taskId });
    await this.executeTask(taskId, task.type);
  }
}

export const schedulerService = new SchedulerService();