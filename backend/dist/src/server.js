"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const environment_1 = require("@/config/environment");
const logger_1 = require("@/utils/logger");
const constants_1 = require("@/utils/constants");
const rateLimiting_1 = require("@/middleware/rateLimiting");
const database_1 = require("@/config/database");
const redis_1 = require("@/config/redis");
const auth_1 = __importDefault(require("@/routes/auth"));
const game_1 = __importDefault(require("@/routes/game"));
const bingoCard_1 = __importDefault(require("@/routes/bingoCard"));
const app = (0, express_1.default)();
// Middleware de seguridad
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: environment_1.env.FRONTEND_URL,
    credentials: true,
}));
// Rate limiting global
app.use(rateLimiting_1.apiRateLimit);
// Parsing de JSON
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(constants_1.HTTP_STATUS.OK).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'bingo-backend',
        version: '1.0.0',
    });
});
// Rutas de la API
app.use('/api/auth', auth_1.default);
app.use('/api/games', game_1.default);
app.use('/api/cards', bingoCard_1.default);
// Manejo de rutas no encontradas
app.use('*', (req, res) => {
    res.status(constants_1.HTTP_STATUS.NOT_FOUND).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
    });
});
// Middleware global de manejo de errores
app.use((error, req, res, next) => {
    logger_1.logger.error('Unhandled error:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
    });
    res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: constants_1.ERROR_MESSAGES.INTERNAL_ERROR,
        ...(environment_1.env.NODE_ENV === 'development' && {
            details: error.message,
            stack: error.stack
        }),
    });
});
// Manejo de promesas rechazadas
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
// Manejo de excepciones no capturadas
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception thrown:', error);
    process.exit(1);
});
const startServer = async () => {
    try {
        // Crear directorio de logs si no existe
        const fs = await Promise.resolve().then(() => __importStar(require('fs')));
        const path = await Promise.resolve().then(() => __importStar(require('path')));
        const logsDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        // Conectar a las bases de datos
        logger_1.logger.info('🔌 Conectando a las bases de datos...');
        await (0, database_1.connectDatabase)();
        await (0, redis_1.connectRedis)();
        app.listen(environment_1.env.PORT, () => {
            logger_1.logger.info(`🚀 Servidor iniciado en http://localhost:${environment_1.env.PORT}`);
            logger_1.logger.info(`📊 Environment: ${environment_1.env.NODE_ENV}`);
            logger_1.logger.info(`🔗 CORS habilitado para: ${environment_1.env.FRONTEND_URL}`);
            logger_1.logger.info('✅ Todas las conexiones establecidas correctamente');
        });
    }
    catch (error) {
        logger_1.logger.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=server.js.map