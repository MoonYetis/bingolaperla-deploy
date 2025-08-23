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
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const environment_1 = require("@/config/environment");
const structuredLogger_1 = require("@/utils/structuredLogger");
const constants_1 = require("@/utils/constants");
const rateLimiting_1 = require("@/middleware/rateLimiting");
const database_1 = require("@/config/database");
const redis_1 = require("@/config/redis");
const schedulerService_1 = require("@/services/schedulerService");
const auth_1 = __importDefault(require("@/routes/auth"));
const game_1 = __importDefault(require("@/routes/game"));
const bingoCard_1 = __importDefault(require("@/routes/bingoCard"));
const analytics_1 = __importDefault(require("@/routes/analytics"));
const performance_1 = __importDefault(require("@/routes/performance"));
const reports_1 = __importDefault(require("@/routes/reports"));
const performanceMonitoring_1 = require("@/middleware/performanceMonitoring");
const app = (0, express_1.default)();
// Crear servidor HTTP para Socket.IO
const server = (0, http_1.createServer)(app);
// Configurar Socket.IO
const io = new socket_io_1.Server(server, {
    cors: {
        origin: environment_1.env.FRONTEND_URL,
        methods: ['GET', 'POST'],
        credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
});
exports.io = io;
// Hacer io disponible globalmente para GameService
global.socketIO = io;
// Eventos de Socket.IO para tiempo real
io.on('connection', (socket) => {
    structuredLogger_1.logger.socket('client_connected', { socketId: socket.id });
    // Evento: Cliente se une a una sala de juego
    socket.on('join-game-room', (gameId) => {
        socket.join(`game-${gameId}`);
        const roomSize = io.sockets.adapter.rooms.get(`game-${gameId}`)?.size || 1;
        structuredLogger_1.logUtils.playerJoined(gameId, socket.id, roomSize);
        // Notificar a otros jugadores en la sala
        socket.to(`game-${gameId}`).emit('player-joined', {
            playerId: socket.id,
            timestamp: new Date().toISOString(),
        });
        // Confirmar unión al cliente
        socket.emit('joined-game-room', {
            gameId,
            roomSize,
        });
    });
    // Evento: Cliente abandona una sala de juego
    socket.on('leave-game-room', (gameId) => {
        socket.leave(`game-${gameId}`);
        structuredLogger_1.logger.socket('player_left_room', { gameId, socketId: socket.id });
        socket.to(`game-${gameId}`).emit('player-left', {
            playerId: socket.id,
            timestamp: new Date().toISOString(),
        });
    });
    // Evento: Sorteo de bola en tiempo real
    socket.on('ball-drawn', (data) => {
        structuredLogger_1.logger.business('ball_drawn', { ball: data.ball, ballsDrawn: data.ballsDrawn }, { gameId: data.gameId });
        // Emitir a todos los jugadores en la sala del juego
        io.to(`game-${data.gameId}`).emit('new-ball-drawn', {
            gameId: data.gameId,
            ball: data.ball,
            ballsDrawn: data.ballsDrawn,
            timestamp: new Date().toISOString(),
        });
    });
    // Evento: Jugador marca número en cartón
    socket.on('mark-number', (data) => {
        structuredLogger_1.logger.business('number_marked', { number: data.number, cardId: data.cardId }, { gameId: data.gameId });
        // Emitir solo al jugador que marcó
        socket.emit('number-marked', {
            cardId: data.cardId,
            number: data.number,
            timestamp: new Date().toISOString(),
        });
    });
    // ===== EVENTOS DE ADMINISTRADOR =====
    // Evento: Admin se une a sala de administración
    socket.on('join-admin-room', (gameId) => {
        socket.join(`admin-${gameId}`);
        structuredLogger_1.logger.socket('admin_joined', { gameId, socketId: socket.id });
        socket.emit('joined-admin-room', {
            gameId,
            timestamp: new Date().toISOString(),
        });
    });
    // Evento: Admin canta un número
    socket.on('admin-call-number', (data) => {
        structuredLogger_1.logger.business('admin_called_number', { number: data.number }, { gameId: data.gameId });
        // Emitir a todos los jugadores en la sala del juego
        io.to(`game-${data.gameId}`).emit('number-called', {
            number: data.number,
            gameId: data.gameId,
            timestamp: new Date().toISOString(),
        });
        // Confirmar al admin
        socket.emit('number-call-confirmed', {
            number: data.number,
            gameId: data.gameId,
            timestamp: new Date().toISOString(),
        });
    });
    // Evento: Admin reinicia el juego
    socket.on('admin-reset-game', (data) => {
        structuredLogger_1.logger.business('admin_reset_game', {}, { gameId: data.gameId });
        // Emitir a todos los jugadores y admins
        io.to(`game-${data.gameId}`).emit('game-reset', {
            gameId: data.gameId,
            timestamp: new Date().toISOString(),
        });
        io.to(`admin-${data.gameId}`).emit('game-reset', {
            gameId: data.gameId,
            timestamp: new Date().toISOString(),
        });
    });
    // Evento: Admin pausa/reanuda el juego
    socket.on('admin-toggle-game', (data) => {
        structuredLogger_1.logger.business('admin_toggle_game', { status: data.status }, { gameId: data.gameId });
        // Emitir a todos los jugadores
        io.to(`game-${data.gameId}`).emit('game-status-changed', {
            status: data.status,
            gameId: data.gameId,
            timestamp: new Date().toISOString(),
        });
        // Confirmar al admin
        socket.emit('game-status-changed', {
            status: data.status,
            gameId: data.gameId,
            timestamp: new Date().toISOString(),
        });
    });
    // Evento: Admin cambia el patrón de juego
    socket.on('admin-set-pattern', (data) => {
        structuredLogger_1.logger.business('admin_set_pattern', { pattern: data.pattern }, { gameId: data.gameId });
        // Emitir a todos los jugadores
        io.to(`game-${data.gameId}`).emit('pattern-changed', {
            pattern: data.pattern,
            gameId: data.gameId,
            timestamp: new Date().toISOString(),
        });
        // Confirmar al admin
        socket.emit('pattern-changed', {
            pattern: data.pattern,
            gameId: data.gameId,
            timestamp: new Date().toISOString(),
        });
    });
    // Evento: Jugador reclama BINGO
    socket.on('player-claim-bingo', (data) => {
        structuredLogger_1.logger.business('player_claim_bingo', { pattern: data.pattern, userId: data.userId }, { gameId: data.gameId });
        // Emitir a todos los jugadores y admins
        io.to(`game-${data.gameId}`).emit('bingo-claimed', {
            pattern: data.pattern,
            userId: data.userId,
            gameId: data.gameId,
            timestamp: new Date().toISOString(),
        });
        io.to(`admin-${data.gameId}`).emit('bingo-claimed', {
            pattern: data.pattern,
            userId: data.userId,
            gameId: data.gameId,
            timestamp: new Date().toISOString(),
        });
        // Confirmar al jugador
        socket.emit('bingo-claim-confirmed', {
            pattern: data.pattern,
            gameId: data.gameId,
            timestamp: new Date().toISOString(),
        });
    });
    // Evento: ¡BINGO! - Jugador ganó
    socket.on('bingo-claimed', (data) => {
        structuredLogger_1.logUtils.bingoWon(data.gameId, data.userId, data.cardId, data.pattern);
        // Emitir a todos los jugadores en la sala
        io.to(`game-${data.gameId}`).emit('bingo-winner', {
            gameId: data.gameId,
            cardId: data.cardId,
            pattern: data.pattern,
            userId: data.userId,
            timestamp: new Date().toISOString(),
        });
    });
    // Evento: Estado del juego actualizado
    socket.on('game-state-changed', (data) => {
        structuredLogger_1.logger.business('game_state_changed', { status: data.status, playerCount: data.playerCount }, { gameId: data.gameId });
        io.to(`game-${data.gameId}`).emit('game-status-updated', {
            gameId: data.gameId,
            status: data.status,
            playerCount: data.playerCount,
            timestamp: new Date().toISOString(),
        });
    });
    // Evento: Desconexión del cliente
    socket.on('disconnect', (reason) => {
        structuredLogger_1.logger.socket('client_disconnected', { socketId: socket.id, reason });
    });
    // Evento: Error en el socket
    socket.on('error', (error) => {
        structuredLogger_1.logger.error('Socket error occurred', error, { socketId: socket.id });
    });
});
// Middleware de seguridad
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: environment_1.env.FRONTEND_URL,
    credentials: true,
}));
// Rate limiting global
app.use(rateLimiting_1.apiRateLimit);
// Performance monitoring middleware
app.use(performanceMonitoring_1.performanceMiddleware);
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
app.use('/api/analytics', analytics_1.default);
app.use('/api/performance', performance_1.default);
app.use('/api/reports', reports_1.default);
// Rutas del sistema de pagos "Perlas"
const wallet_1 = __importDefault(require("@/routes/wallet"));
const payment_1 = __importDefault(require("@/routes/payment"));
const paymentAdmin_1 = __importDefault(require("@/routes/admin/paymentAdmin"));
const gamePurchase_1 = __importDefault(require("@/routes/gamePurchase"));
const openpay_1 = __importDefault(require("@/routes/openpay"));
const openpay_2 = __importDefault(require("@/routes/webhooks/openpay"));
app.use('/api/wallet', wallet_1.default);
app.use('/api/payment', payment_1.default);
app.use('/api/admin/payment', paymentAdmin_1.default);
app.use('/api/game-purchase', gamePurchase_1.default);
app.use('/api/openpay', openpay_1.default);
app.use('/api/webhooks/openpay', openpay_2.default);
// Manejo de rutas no encontradas
app.use('*', (req, res) => {
    res.status(constants_1.HTTP_STATUS.NOT_FOUND).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
    });
});
// Middleware global de manejo de errores
app.use((error, req, res, next) => {
    structuredLogger_1.logger.error('Unhandled HTTP error', error, {
        url: req.url,
        method: req.method,
        userAgent: req.get('User-Agent'),
        ip: req.ip
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
    structuredLogger_1.logger.error('Unhandled promise rejection', reason, { promise: promise.toString() });
    process.exit(1);
});
// Manejo de excepciones no capturadas
process.on('uncaughtException', (error) => {
    structuredLogger_1.logger.error('Uncaught exception thrown', error);
    schedulerService_1.schedulerService.stop();
    process.exit(1);
});
// Manejo de señales de terminación
process.on('SIGTERM', () => {
    structuredLogger_1.logger.info('SIGTERM received, shutting down gracefully');
    schedulerService_1.schedulerService.stop();
    process.exit(0);
});
process.on('SIGINT', () => {
    structuredLogger_1.logger.info('SIGINT received, shutting down gracefully');
    schedulerService_1.schedulerService.stop();
    process.exit(0);
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
        structuredLogger_1.logger.info('Connecting to databases...');
        await (0, database_1.connectDatabase)();
        await (0, redis_1.connectRedis)();
        // Inicializar scheduler de reports automáticos
        structuredLogger_1.logger.info('Initializing report scheduler...');
        await schedulerService_1.schedulerService.initialize();
        server.listen(environment_1.env.PORT, () => {
            structuredLogger_1.logger.info('Server started successfully', {
                port: environment_1.env.PORT,
                environment: environment_1.env.NODE_ENV,
                frontendUrl: environment_1.env.FRONTEND_URL,
                features: ['HTTP', 'Socket.IO', 'CORS', 'Analytics', 'Reports', 'Scheduler']
            });
        });
    }
    catch (error) {
        structuredLogger_1.logger.error('Failed to start server', error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=server.js.map