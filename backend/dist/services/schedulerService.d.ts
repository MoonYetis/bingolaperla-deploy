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
declare class SchedulerService {
    private tasks;
    private isRunning;
    /**
     * Inicializar el scheduler con tareas por defecto
     */
    initialize(): Promise<void>;
    /**
     * Programar una nueva tarea
     */
    scheduleTask(task: Omit<ScheduledTask, 'timer'>): void;
    /**
     * Ejecutar una tarea específica
     */
    private executeTask;
    /**
     * Reprogramar una tarea después de su ejecución
     */
    private rescheduleTask;
    /**
     * Simular envío de email con reporte
     */
    private sendReportEmail;
    /**
     * Obtener próxima fecha de ejecución basada en tipo y frecuencia
     */
    private getNextRunDate;
    /**
     * Calcular próxima ejecución cada hora
     */
    private getNextHourlyRun;
    /**
     * Calcular próxima ejecución diaria
     */
    private getNextDailyRun;
    /**
     * Calcular próxima ejecución semanal
     */
    private getNextWeeklyRun;
    /**
     * Calcular próxima ejecución mensual
     */
    private getNextMonthlyRun;
    /**
     * Obtener estado de todas las tareas programadas
     */
    getScheduledTasks(): {
        isRunning: boolean;
        tasksCount: number;
        tasks: {
            id: string;
            type: ReportType;
            frequency: ScheduleFrequency;
            enabled: boolean;
            lastRun: string;
            nextRun: string;
            emails: string[];
            timeUntilNext: number;
        }[];
    };
    /**
     * Habilitar/deshabilitar una tarea
     */
    toggleTask(taskId: string, enabled: boolean): void;
    /**
     * Detener el scheduler
     */
    stop(): void;
    /**
     * Ejecutar una tarea manualmente
     */
    runTaskNow(taskId: string): Promise<void>;
}
export declare const schedulerService: SchedulerService;
export {};
//# sourceMappingURL=schedulerService.d.ts.map