"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedLogger = exports.structuredLogger = exports.logUtils = exports.performanceLogger = exports.analyticsLogger = exports.gameLogger = exports.authLogger = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const winston_2 = require("winston");
const environment_1 = require("../config/environment");
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
winston_1.default.addColors(customColors);
// Formato personalizado para logs estructurados
const structuredFormat = winston_2.format.combine(winston_2.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }), winston_2.format.errors({ stack: true }), winston_2.format.json(), winston_2.format.printf(({ timestamp, level, message, ...meta }) => {
    const logEntry = {
        timestamp,
        level: level.toUpperCase(),
        message,
        service: 'bingo-backend',
        environment: environment_1.env.NODE_ENV,
        ...meta
    };
    // En desarrollo, formato más legible
    if (environment_1.env.NODE_ENV === 'development') {
        return JSON.stringify(logEntry, null, 2);
    }
    return JSON.stringify(logEntry);
}));
// Formato para consola en desarrollo
const consoleFormat = winston_2.format.combine(winston_2.format.colorize({ all: true }), winston_2.format.timestamp({ format: 'HH:mm:ss' }), winston_2.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `${timestamp} [${level}]: ${message}${metaStr}`;
}));
// Configuración de transportes
const logTransports = [
    // Archivo para todos los logs
    new winston_2.transports.File({
        filename: 'logs/combined.log',
        format: structuredFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        tailable: true
    }),
    // Archivo específico para errores
    new winston_2.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: structuredFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        tailable: true
    }),
    // Archivo específico para audit trail
    new winston_2.transports.File({
        filename: 'logs/audit.log',
        level: 'audit',
        format: structuredFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 10,
        tailable: true
    }),
    // Archivo para performance y métricas
    new winston_2.transports.File({
        filename: 'logs/performance.log',
        format: structuredFormat,
        maxsize: 5 * 1024 * 1024, // 5MB
        maxFiles: 3,
        tailable: true
    })
];
// Agregar consola en desarrollo
if (environment_1.env.NODE_ENV === 'development') {
    logTransports.push(new winston_2.transports.Console({
        format: consoleFormat,
        level: 'debug'
    }));
}
else {
    // En producción, solo errores y warnings en consola
    logTransports.push(new winston_2.transports.Console({
        format: structuredFormat,
        level: 'warn'
    }));
}
// Crear logger principal
const structuredLogger = (0, winston_2.createLogger)({
    levels: customLevels,
    level: environment_1.env.NODE_ENV === 'development' ? 'trace' : 'info',
    format: structuredFormat,
    transports: logTransports,
    exitOnError: false
});
exports.structuredLogger = structuredLogger;
class AdvancedLogger {
    constructor(logger) {
        this.context = {};
        this.logger = logger;
    }
    /**
     * Establecer contexto global para el logger
     */
    setContext(context) {
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
    error(message, error, context) {
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
    warn(message, context) {
        this.logger.warn(message, { ...this.context, ...context });
    }
    /**
     * Log de información con contexto
     */
    info(message, context) {
        this.logger.info(message, { ...this.context, ...context });
    }
    /**
     * Log de debug con contexto
     */
    debug(message, context) {
        this.logger.debug(message, { ...this.context, ...context });
    }
    /**
     * Log de trace (muy detallado) con contexto
     */
    trace(message, context) {
        this.logger.log('trace', message, { ...this.context, ...context });
    }
    /**
     * Log de audit trail para acciones críticas
     */
    audit(event, context) {
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
    performance(metric, value, unit, context) {
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
    business(event, data, context) {
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
    security(event, level, context) {
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
    child(context) {
        const childLogger = new AdvancedLogger(this.logger);
        childLogger.setContext({ ...this.context, ...context });
        return childLogger;
    }
    /**
     * Medir tiempo de ejecución de una función
     */
    async time(label, fn, context) {
        const start = Date.now();
        this.debug(`Starting: ${label}`, context);
        try {
            const result = await fn();
            const duration = Date.now() - start;
            this.performance(label, duration, 'ms', context);
            return result;
        }
        catch (error) {
            const duration = Date.now() - start;
            this.error(`Failed: ${label} (after ${duration}ms)`, error, context);
            throw error;
        }
    }
    /**
     * Log estructurado para requests HTTP
     */
    request(method, url, statusCode, responseTime, context) {
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
    socket(event, data, context) {
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
    database(operation, table, duration, context) {
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
exports.AdvancedLogger = AdvancedLogger;
// Instancia principal del logger
exports.logger = new AdvancedLogger(structuredLogger);
// Logger específico para diferentes módulos
exports.authLogger = exports.logger.child({ module: 'auth' });
exports.gameLogger = exports.logger.child({ module: 'game' });
exports.analyticsLogger = exports.logger.child({ module: 'analytics' });
exports.performanceLogger = exports.logger.child({ module: 'performance' });
// Utilidades para logs comunes
exports.logUtils = {
    /**
     * Log de inicio de sesión
     */
    loginAttempt: (email, success, ip, userAgent) => {
        exports.authLogger.audit({
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
    gameCreated: (gameId, userId, gameConfig) => {
        exports.gameLogger.business('game_created', { gameId, gameConfig }, { userId });
    },
    /**
     * Log de unión a juego
     */
    playerJoined: (gameId, userId, playerCount) => {
        exports.gameLogger.business('player_joined', { gameId, playerCount }, { userId });
    },
    /**
     * Log de BINGO ganado
     */
    bingoWon: (gameId, userId, cardId, pattern) => {
        exports.gameLogger.business('bingo_won', { gameId, cardId, pattern }, { userId });
    },
    /**
     * Log de error de autenticación
     */
    authError: (error, context) => {
        exports.authLogger.security('authentication_error', 'medium', context);
        exports.authLogger.error('Authentication failed', error, context);
    },
    /**
     * Log de actividad sospechosa
     */
    suspiciousActivity: (activity, severity, context) => {
        exports.logger.security(`suspicious_activity: ${activity}`, severity, context);
    }
};
//# sourceMappingURL=structuredLogger.js.map