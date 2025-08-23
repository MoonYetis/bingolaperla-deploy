import winston from 'winston';
interface LogContext {
    userId?: string;
    gameId?: string;
    sessionId?: string;
    requestId?: string;
    userAgent?: string;
    ip?: string;
    action?: string;
    resource?: string;
    [key: string]: any;
}
interface AuditEvent {
    action: string;
    resource: string;
    resourceId?: string;
    userId?: string;
    oldValue?: any;
    newValue?: any;
    success: boolean;
    reason?: string;
    metadata?: Record<string, any>;
}
declare const structuredLogger: winston.Logger;
declare class AdvancedLogger {
    private logger;
    private context;
    constructor(logger: winston.Logger);
    /**
     * Establecer contexto global para el logger
     */
    setContext(context: LogContext): this;
    /**
     * Limpiar contexto
     */
    clearContext(): this;
    /**
     * Log de error con contexto
     */
    error(message: string, error?: Error | any, context?: LogContext): void;
    /**
     * Log de warning con contexto
     */
    warn(message: string, context?: LogContext): void;
    /**
     * Log de información con contexto
     */
    info(message: string, context?: LogContext): void;
    /**
     * Log de debug con contexto
     */
    debug(message: string, context?: LogContext): void;
    /**
     * Log de trace (muy detallado) con contexto
     */
    trace(message: string, context?: LogContext): void;
    /**
     * Log de audit trail para acciones críticas
     */
    audit(event: AuditEvent, context?: LogContext): void;
    /**
     * Log de métricas de performance
     */
    performance(metric: string, value: number, unit: string, context?: LogContext): void;
    /**
     * Log de eventos de negocio (bingo-specific)
     */
    business(event: string, data: any, context?: LogContext): void;
    /**
     * Log de seguridad
     */
    security(event: string, level: 'low' | 'medium' | 'high' | 'critical', context?: LogContext): void;
    /**
     * Crear un child logger con contexto específico
     */
    child(context: LogContext): AdvancedLogger;
    /**
     * Medir tiempo de ejecución de una función
     */
    time<T>(label: string, fn: () => Promise<T>, context?: LogContext): Promise<T>;
    /**
     * Log estructurado para requests HTTP
     */
    request(method: string, url: string, statusCode: number, responseTime: number, context?: LogContext): void;
    /**
     * Log para eventos de Socket.IO
     */
    socket(event: string, data: any, context?: LogContext): void;
    /**
     * Log para eventos de base de datos
     */
    database(operation: string, table: string, duration: number, context?: LogContext): void;
}
export declare const logger: AdvancedLogger;
export declare const authLogger: AdvancedLogger;
export declare const gameLogger: AdvancedLogger;
export declare const analyticsLogger: AdvancedLogger;
export declare const performanceLogger: AdvancedLogger;
export declare const logUtils: {
    /**
     * Log de inicio de sesión
     */
    loginAttempt: (email: string, success: boolean, ip: string, userAgent?: string) => void;
    /**
     * Log de creación de juego
     */
    gameCreated: (gameId: string, userId: string, gameConfig: any) => void;
    /**
     * Log de unión a juego
     */
    playerJoined: (gameId: string, userId: string, playerCount: number) => void;
    /**
     * Log de BINGO ganado
     */
    bingoWon: (gameId: string, userId: string, cardId: string, pattern: string) => void;
    /**
     * Log de error de autenticación
     */
    authError: (error: Error, context: LogContext) => void;
    /**
     * Log de actividad sospechosa
     */
    suspiciousActivity: (activity: string, severity: "low" | "medium" | "high" | "critical", context: LogContext) => void;
};
export { structuredLogger, AdvancedLogger };
export type { LogContext, AuditEvent };
//# sourceMappingURL=structuredLogger.d.ts.map