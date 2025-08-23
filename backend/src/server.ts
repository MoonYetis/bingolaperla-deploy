import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { env } from '@/config/environment';
import { logger, logUtils } from '@/utils/structuredLogger';
import { HTTP_STATUS, ERROR_MESSAGES } from '@/utils/constants';
import { apiRateLimit } from '@/middleware/rateLimiting';
import { connectDatabase } from '@/config/database';
import { connectRedis } from '@/config/redis';
import { schedulerService } from '@/services/schedulerService';
import authRoutes from '@/routes/auth';
import gameRoutes from '@/routes/game';
import bingoCardRoutes from '@/routes/bingoCard';
import analyticsRoutes from '@/routes/analytics';
import performanceRoutes from '@/routes/performance';
import reportsRoutes from '@/routes/reports';
import { performanceMiddleware } from '@/middleware/performanceMonitoring';

const app = express();

// Crear servidor HTTP para Socket.IO
const server = createServer(app);

// Configurar Socket.IO
const io = new Server(server, {
  cors: {
    origin: env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Exportar io para uso en otros módulos
export { io };

// Hacer io disponible globalmente para GameService
(global as any).socketIO = io;

// Eventos de Socket.IO para tiempo real
io.on('connection', (socket) => {
  logger.socket('client_connected', { socketId: socket.id });

  // Evento: Cliente se une a una sala de juego
  socket.on('join-game-room', (gameId: string) => {
    socket.join(`game-${gameId}`);
    const roomSize = io.sockets.adapter.rooms.get(`game-${gameId}`)?.size || 1;
    logUtils.playerJoined(gameId, socket.id, roomSize);
    
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
  socket.on('leave-game-room', (gameId: string) => {
    socket.leave(`game-${gameId}`);
    logger.socket('player_left_room', { gameId, socketId: socket.id });
    
    socket.to(`game-${gameId}`).emit('player-left', {
      playerId: socket.id,
      timestamp: new Date().toISOString(),
    });
  });

  // Evento: Sorteo de bola en tiempo real
  socket.on('ball-drawn', (data: { gameId: string; ball: number; ballsDrawn: number[] }) => {
    logger.business('ball_drawn', { ball: data.ball, ballsDrawn: data.ballsDrawn }, { gameId: data.gameId });
    
    // Emitir a todos los jugadores en la sala del juego
    io.to(`game-${data.gameId}`).emit('new-ball-drawn', {
      gameId: data.gameId,
      ball: data.ball,
      ballsDrawn: data.ballsDrawn,
      timestamp: new Date().toISOString(),
    });
  });

  // Evento: Jugador marca número en cartón
  socket.on('mark-number', (data: { gameId: string; cardId: string; number: number }) => {
    logger.business('number_marked', { number: data.number, cardId: data.cardId }, { gameId: data.gameId });
    
    // Emitir solo al jugador que marcó
    socket.emit('number-marked', {
      cardId: data.cardId,
      number: data.number,
      timestamp: new Date().toISOString(),
    });
  });

  // ===== EVENTOS DE ADMINISTRADOR =====
  
  // Evento: Admin se une a sala de administración
  socket.on('join-admin-room', (gameId: string) => {
    socket.join(`admin-${gameId}`);
    logger.socket('admin_joined', { gameId, socketId: socket.id });
    
    socket.emit('joined-admin-room', {
      gameId,
      timestamp: new Date().toISOString(),
    });
  });

  // Evento: Admin canta un número
  socket.on('admin-call-number', (data: { number: number; gameId: string }) => {
    logger.business('admin_called_number', { number: data.number }, { gameId: data.gameId });
    
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
  socket.on('admin-reset-game', (data: { gameId: string }) => {
    logger.business('admin_reset_game', {}, { gameId: data.gameId });
    
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
  socket.on('admin-toggle-game', (data: { gameId: string; status: 'active' | 'paused' }) => {
    logger.business('admin_toggle_game', { status: data.status }, { gameId: data.gameId });
    
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
  socket.on('admin-set-pattern', (data: { pattern: string; gameId: string }) => {
    logger.business('admin_set_pattern', { pattern: data.pattern }, { gameId: data.gameId });
    
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
  socket.on('player-claim-bingo', (data: { pattern: string; userId: string; gameId: string }) => {
    logger.business('player_claim_bingo', { pattern: data.pattern, userId: data.userId }, { gameId: data.gameId });
    
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
  socket.on('bingo-claimed', (data: { gameId: string; cardId: string; pattern: string; userId: string }) => {
    logUtils.bingoWon(data.gameId, data.userId, data.cardId, data.pattern);
    
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
  socket.on('game-state-changed', (data: { gameId: string; status: string; playerCount?: number }) => {
    logger.business('game_state_changed', { status: data.status, playerCount: data.playerCount }, { gameId: data.gameId });
    
    io.to(`game-${data.gameId}`).emit('game-status-updated', {
      gameId: data.gameId,
      status: data.status,
      playerCount: data.playerCount,
      timestamp: new Date().toISOString(),
    });
  });

  // Evento: Desconexión del cliente
  socket.on('disconnect', (reason) => {
    logger.socket('client_disconnected', { socketId: socket.id, reason });
  });

  // Evento: Error en el socket
  socket.on('error', (error) => {
    logger.error('Socket error occurred', error, { socketId: socket.id });
  });
});

// Middleware de seguridad
app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

// Rate limiting global
app.use(apiRateLimit);

// Performance monitoring middleware
app.use(performanceMiddleware);

// Parsing de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'bingo-backend',
    version: '1.0.0',
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/cards', bingoCardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/reports', reportsRoutes);

// Rutas del sistema de pagos "Perlas"
import walletRoutes from '@/routes/wallet';
import paymentRoutes from '@/routes/payment';
import paymentAdminRoutes from '@/routes/admin/paymentAdmin';
import gamePurchaseRoutes from '@/routes/gamePurchase';
import openpayRoutes from '@/routes/openpay';
import openpayWebhookRoutes from '@/routes/webhooks/openpay';
app.use('/api/wallet', walletRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin/payment', paymentAdminRoutes);
app.use('/api/game-purchase', gamePurchaseRoutes);
app.use('/api/openpay', openpayRoutes);
app.use('/api/webhooks/openpay', openpayWebhookRoutes);

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
  });
});

// Middleware global de manejo de errores
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled HTTP error', error, {
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    error: ERROR_MESSAGES.INTERNAL_ERROR,
    ...(env.NODE_ENV === 'development' && { 
      details: error.message,
      stack: error.stack 
    }),
  });
});

// Manejo de promesas rechazadas
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  logger.error('Unhandled promise rejection', reason as Error, { promise: promise.toString() });
  process.exit(1);
});

// Manejo de excepciones no capturadas
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught exception thrown', error);
  schedulerService.stop();
  process.exit(1);
});

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  schedulerService.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  schedulerService.stop();
  process.exit(0);
});

const startServer = async () => {
  try {
    // Crear directorio de logs si no existe
    const fs = await import('fs');
    const path = await import('path');
    const logsDir = path.join(process.cwd(), 'logs');
    
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Conectar a las bases de datos
    logger.info('Connecting to databases...');
    await connectDatabase();
    await connectRedis();

    // Inicializar scheduler de reports automáticos
    logger.info('Initializing report scheduler...');
    await schedulerService.initialize();

    server.listen(env.PORT, () => {
      logger.info('Server started successfully', {
        port: env.PORT,
        environment: env.NODE_ENV,
        frontendUrl: env.FRONTEND_URL,
        features: ['HTTP', 'Socket.IO', 'CORS', 'Analytics', 'Reports', 'Scheduler']
      });
    });
  } catch (error) {
    logger.error('Failed to start server', error as Error);
    process.exit(1);
  }
};

startServer();