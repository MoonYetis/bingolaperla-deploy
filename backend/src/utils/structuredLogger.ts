import winston from 'winston';
import { createLogger, format, transports } from 'winston';
import { env } from '../config/environment';

// Interfaz para contexto estructurado de logs
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

// Interfaz para eventos de audit trail
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

// Niveles de log personalizados
const customLevels = {
  error: 0,
  warn: 1,
  info: 2,
  audit: 3,
  debug: 4,
  trace: 5
};

const customColors = {
  error: 'red',
  warn: 'yellow', 
  info: 'cyan',
  audit: 'magenta',
  debug: 'green',
  trace: 'gray'
};

winston.addColors(customColors);

// Formato personalizado para logs estructurados
const structuredFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  format.errors({ stack: true }),
  format.json(),
  format.printf(({ timestamp, level, message, ...meta }) => {
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      service: 'bingo-backend',
      environment: env.NODE_ENV,
      ...meta
    };

    // En desarrollo, formato más legible
    if (env.NODE_ENV === 'development') {
      return JSON.stringify(logEntry, null, 2);
    }

    return JSON.stringify(logEntry);
  })
);

// Formato para consola en desarrollo
const consoleFormat = format.combine(
  format.colorize({ all: true }),
  format.timestamp({ format: 'HH:mm:ss' }),
  format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Configuración de transportes
const logTransports: winston.transport[] = [
  // Archivo para todos los logs
  new transports.File({
    filename: 'logs/combined.log',
    format: structuredFormat,
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    tailable: true
  }),

  // Archivo específico para errores
  new transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: structuredFormat,
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    tailable: true
  }),

  // Archivo específico para audit trail
  new transports.File({
    filename: 'logs/audit.log',
    level: 'audit',
    format: structuredFormat,
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 10,
    tailable: true
  }),

  // Archivo para performance y métricas
  new transports.File({
    filename: 'logs/performance.log',
    format: structuredFormat,
    maxsize: 5 * 1024 * 1024, // 5MB
    maxFiles: 3,
    tailable: true
  })
];

// Agregar consola en desarrollo
if (env.NODE_ENV === 'development') {
  logTransports.push(
    new transports.Console({
      format: consoleFormat,
      level: 'debug'
    })
  );
} else {
  // En producción, solo errores y warnings en consola
  logTransports.push(
    new transports.Console({
      format: structuredFormat,
      level: 'warn'
    })
  );
}

// Crear logger principal
const structuredLogger = createLogger({
  levels: customLevels,
  level: env.NODE_ENV === 'development' ? 'trace' : 'info',
  format: structuredFormat,
  transports: logTransports,
  exitOnError: false
});

class AdvancedLogger {
  private logger: winston.Logger;
  private context: LogContext = {};

  constructor(logger: winston.Logger) {
    this.logger = logger;
  }

  /**
   * Establecer contexto global para el logger
   */
  setContext(context: LogContext) {
    this.context = { ...this.context, ...context };
    return this;
  }

  /**
   * Limpiar contexto
   */
  clearContext() {
    this.context = {};
    return this;
  }

  /**
   * Log de error con contexto
   */
  error(message: string, error?: Error | any, context?: LogContext) {
    const logData = {
      ...this.context,
      ...context,
      ...(error && {
        error: {
          message: error.message,
          stack: error.stack,
          code: error.code,
          name: error.name
        }
      })
    };

    this.logger.error(message, logData);
  }

  /**
   * Log de warning con contexto
   */
  warn(message: string, context?: LogContext) {
    this.logger.warn(message, { ...this.context, ...context });
  }

  /**
   * Log de información con contexto
   */
  info(message: string, context?: LogContext) {
    this.logger.info(message, { ...this.context, ...context });
  }

  /**
   * Log de debug con contexto
   */
  debug(message: string, context?: LogContext) {
    this.logger.debug(message, { ...this.context, ...context });
  }

  /**
   * Log de trace (muy detallado) con contexto
   */
  trace(message: string, context?: LogContext) {
    this.logger.log('trace', message, { ...this.context, ...context });
  }

  /**
   * Log de audit trail para acciones críticas
   */
  audit(event: AuditEvent, context?: LogContext) {
    const auditData = {
      ...this.context,
      ...context,
      auditEvent: event,
      timestamp: new Date().toISOString()
    };

    this.logger.log('audit', `AUDIT: ${event.action} on ${event.resource}`, auditData);
  }

  /**
   * Log de métricas de performance
   */
  performance(metric: string, value: number, unit: string, context?: LogContext) {
    const performanceData = {
      ...this.context,
      ...context,
      metric,
      value,
      unit,
      type: 'performance'
    };

    // Log en archivo de performance
    this.logger.info(`PERFORMANCE: ${metric} = ${value}${unit}`, performanceData);
  }

  /**
   * Log de eventos de negocio (bingo-specific)
   */
  business(event: string, data: any, context?: LogContext) {
    const businessData = {
      ...this.context,
      ...context,
      businessEvent: event,
      businessData: data,
      type: 'business'
    };

    this.logger.info(`BUSINESS: ${event}`, businessData);
  }

  /**
   * Log de seguridad
   */
  security(event: string, level: 'low' | 'medium' | 'high' | 'critical', context?: LogContext) {
    const securityData = {
      ...this.context,
      ...context,
      securityEvent: event,
      securityLevel: level,
      type: 'security'
    };

    const logLevel = level === 'critical' || level === 'high' ? 'error' : 'warn';
    this.logger[logLevel](`SECURITY: ${event}`, securityData);
  }

  /**
   * Crear un child logger con contexto específico
   */
  child(context: LogContext) {
    const childLogger = new AdvancedLogger(this.logger);
    childLogger.setContext({ ...this.context, ...context });
    return childLogger;
  }

  /**
   * Medir tiempo de ejecución de una función
   */
  async time<T>(label: string, fn: () => Promise<T>, context?: LogContext): Promise<T> {
    const start = Date.now();
    this.debug(`Starting: ${label}`, context);
    
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.performance(label, duration, 'ms', context);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`Failed: ${label} (after ${duration}ms)`, error, context);
      throw error;
    }
  }

  /**
   * Log estructurado para requests HTTP
   */
  request(method: string, url: string, statusCode: number, responseTime: number, context?: LogContext) {
    const requestData = {
      ...this.context,
      ...context,
      httpRequest: {
        method,
        url,
        statusCode,
        responseTime
      },
      type: 'http'
    };

    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    this.logger[level](`HTTP ${method} ${url} ${statusCode} ${responseTime}ms`, requestData);
  }

  /**
   * Log para eventos de Socket.IO
   */
  socket(event: string, data: any, context?: LogContext) {
    const socketData = {
      ...this.context,
      ...context,
      socketEvent: event,
      socketData: data,
      type: 'socket'
    };

    this.logger.info(`SOCKET: ${event}`, socketData);
  }

  /**
   * Log para eventos de base de datos
   */
  database(operation: string, table: string, duration: number, context?: LogContext) {
    const dbData = {
      ...this.context,
      ...context,
      dbOperation: operation,
      dbTable: table,
      dbDuration: duration,
      type: 'database'
    };

    const level = duration > 1000 ? 'warn' : 'debug';
    this.logger[level](`DB: ${operation} ${table} ${duration}ms`, dbData);
  }
}

// Instancia principal del logger
export const logger = new AdvancedLogger(structuredLogger);

// Logger específico para diferentes módulos
export const authLogger = logger.child({ module: 'auth' });
export const gameLogger = logger.child({ module: 'game' });
export const analyticsLogger = logger.child({ module: 'analytics' });
export const performanceLogger = logger.child({ module: 'performance' });

// Utilidades para logs comunes
export const logUtils = {
  /**
   * Log de inicio de sesión
   */
  loginAttempt: (email: string, success: boolean, ip: string, userAgent?: string) => {
    authLogger.audit({
      action: 'login_attempt',
      resource: 'user_session',
      userId: email,
      success,
      reason: success ? 'valid_credentials' : 'invalid_credentials'
    }, { ip, userAgent });
  },

  /**
   * Log de creación de juego
   */
  gameCreated: (gameId: string, userId: string, gameConfig: any) => {
    gameLogger.business('game_created', { gameId, gameConfig }, { userId });
  },

  /**
   * Log de unión a juego
   */
  playerJoined: (gameId: string, userId: string, playerCount: number) => {
    gameLogger.business('player_joined', { gameId, playerCount }, { userId });
  },

  /**
   * Log de BINGO ganado
   */
  bingoWon: (gameId: string, userId: string, cardId: string, pattern: string) => {
    gameLogger.business('bingo_won', { gameId, cardId, pattern }, { userId });
  },

  /**
   * Log de error de autenticación
   */
  authError: (error: Error, context: LogContext) => {
    authLogger.security('authentication_error', 'medium', context);
    authLogger.error('Authentication failed', error, context);
  },

  /**
   * Log de actividad sospechosa
   */
  suspiciousActivity: (activity: string, severity: 'low' | 'medium' | 'high' | 'critical', context: LogContext) => {
    logger.security(`suspicious_activity: ${activity}`, severity, context);
  }
};

export { structuredLogger, AdvancedLogger };
export type { LogContext, AuditEvent };