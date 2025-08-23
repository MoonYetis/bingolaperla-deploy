import { io, Socket } from 'socket.io-client';

// Configuración del socket
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Estados de conexión
enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  FAILED = 'failed'
}

// Configuración adaptativa basada en calidad de red
interface AdaptiveConfig {
  reconnectionDelay: number;
  reconnectionDelayMax: number;
  maxReconnectionAttempts: number;
  timeout: number;
}

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private reconnectStrategy: 'linear' | 'exponential' | 'adaptive' = 'adaptive';
  private networkQuality: string = 'good';
  private lastDisconnectReason: string | null = null;
  private connectionHistory: Array<{ timestamp: number; event: string; success: boolean }> = [];
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private adaptiveConfig: AdaptiveConfig;

  constructor() {
    // Configuración inicial (se ajustará dinámicamente)
    this.adaptiveConfig = this.getConfigForNetworkQuality('good');
  }

  // Obtiene configuración optimizada según calidad de red
  private getConfigForNetworkQuality(quality: string): AdaptiveConfig {
    switch (quality) {
      case 'excellent':
        return {
          reconnectionDelay: 500,
          reconnectionDelayMax: 2000,
          maxReconnectionAttempts: 10,
          timeout: 5000,
        };
      case 'good':
        return {
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          maxReconnectionAttempts: 8,
          timeout: 10000,
        };
      case 'poor':
        return {
          reconnectionDelay: 2000,
          reconnectionDelayMax: 10000,
          maxReconnectionAttempts: 5,
          timeout: 15000,
        };
      case 'very_poor':
        return {
          reconnectionDelay: 5000,
          reconnectionDelayMax: 30000,
          maxReconnectionAttempts: 3,
          timeout: 20000,
        };
      default:
        return {
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          maxReconnectionAttempts: 5,
          timeout: 10000,
        };
    }
  }

  // Actualiza la configuración basada en la calidad de red
  public updateNetworkQuality(quality: string): void {
    if (this.networkQuality !== quality) {
      this.networkQuality = quality;
      this.adaptiveConfig = this.getConfigForNetworkQuality(quality);
      
      // Si hay una conexión activa, actualizar sus parámetros
      if (this.socket) {
        this.socket.timeout = this.adaptiveConfig.timeout;
      }
    }
  }

  // Calcula el delay de reconexión usando backoff exponencial
  private getReconnectDelay(): number {
    const { reconnectionDelay, reconnectionDelayMax } = this.adaptiveConfig;
    
    switch (this.reconnectStrategy) {
      case 'linear':
        return Math.min(reconnectionDelay * this.reconnectAttempts, reconnectionDelayMax);
      
      case 'exponential':
        return Math.min(reconnectionDelay * Math.pow(2, this.reconnectAttempts), reconnectionDelayMax);
      
      case 'adaptive':
        // Estrategia adaptativa que considera historial de conexiones
        const recentFailures = this.connectionHistory
          .filter(h => h.timestamp > Date.now() - 60000) // Últimos 60 segundos
          .filter(h => !h.success).length;
        
        const multiplier = Math.min(Math.pow(2, this.reconnectAttempts), 8);
        const adaptiveDelay = reconnectionDelay * multiplier;
        
        // Aumentar delay si hay muchos fallos recientes
        const failurePenalty = recentFailures * 1000;
        
        return Math.min(adaptiveDelay + failurePenalty, reconnectionDelayMax);
      
      default:
        return reconnectionDelay;
    }
  }

  // Registra eventos de conexión para análisis
  private recordConnectionEvent(event: string, success: boolean): void {
    this.connectionHistory.push({
      timestamp: Date.now(),
      event,
      success
    });
    
    // Mantener solo los últimos 50 eventos
    if (this.connectionHistory.length > 50) {
      this.connectionHistory = this.connectionHistory.slice(-50);
    }
  }

  // Inicia heartbeat para detectar conexiones zombie
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping', Date.now());
      }
    }, 30000); // Ping cada 30 segundos
  }

  // Detiene heartbeat
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Inicializar conexión
  connect(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve(this.socket);
        return;
      }

      this.connectionState = ConnectionState.CONNECTING;
      this.recordConnectionEvent('connect_attempt', false);

      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: this.adaptiveConfig.reconnectionDelay,
        reconnectionDelayMax: this.adaptiveConfig.reconnectionDelayMax,
        maxReconnectionAttempts: this.adaptiveConfig.maxReconnectionAttempts,
        timeout: this.adaptiveConfig.timeout,
        forceNew: false,
      });

      // Eventos de conexión
      this.socket.on('connect', () => {
        console.log('🔌 Conectado a Socket.IO:', this.socket?.id);
        this.connectionState = ConnectionState.CONNECTED;
        this.reconnectAttempts = 0;
        this.recordConnectionEvent('connect', true);
        this.startHeartbeat();
        resolve(this.socket as Socket);
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Error de conexión Socket.IO:', error);
        this.connectionState = ConnectionState.FAILED;
        this.reconnectAttempts++;
        this.lastDisconnectReason = error.message;
        this.recordConnectionEvent('connect_error', false);
        
        if (this.reconnectAttempts >= this.adaptiveConfig.maxReconnectionAttempts) {
          this.connectionState = ConnectionState.FAILED;
          reject(new Error(`No se pudo conectar después de ${this.adaptiveConfig.maxReconnectionAttempts} intentos`));
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Desconectado de Socket.IO:', reason);
        this.connectionState = ConnectionState.DISCONNECTED;
        this.lastDisconnectReason = reason;
        this.stopHeartbeat();
        this.recordConnectionEvent('disconnect', false);
      });

      this.socket.on('reconnect_attempt', (attemptNumber) => {
        console.log('🔄 Intento de reconexión #', attemptNumber);
        this.connectionState = ConnectionState.RECONNECTING;
        this.reconnectAttempts = attemptNumber;
        this.recordConnectionEvent('reconnect_attempt', false);
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log('🔄 Reconectado a Socket.IO después de', attemptNumber, 'intentos');
        this.connectionState = ConnectionState.CONNECTED;
        this.reconnectAttempts = 0;
        this.recordConnectionEvent('reconnect', true);
        this.startHeartbeat();
        
        // Emitir evento personalizado para sincronizar estado
        this.socket?.emit('sync-state-request', {
          timestamp: Date.now(),
          reason: 'reconnect'
        });
      });

      this.socket.on('reconnect_error', (error) => {
        console.error('❌ Error de reconexión:', error);
        this.connectionState = ConnectionState.FAILED;
        this.recordConnectionEvent('reconnect_error', false);
      });

      this.socket.on('reconnect_failed', () => {
        console.error('❌ Falló la reconexión después de todos los intentos');
        this.connectionState = ConnectionState.FAILED;
        this.recordConnectionEvent('reconnect_failed', false);
      });

      // Respuesta al ping para medir latencia
      this.socket.on('pong', (timestamp: number) => {
        const latency = Date.now() - timestamp;
        console.debug('🏓 Latency:', latency, 'ms');
      });
    });
  }

  // Desconectar
  disconnect(): void {
    if (this.socket) {
      this.stopHeartbeat();
      this.socket.disconnect();
      this.socket = null;
      this.connectionState = ConnectionState.DISCONNECTED;
      this.recordConnectionEvent('manual_disconnect', true);
    }
  }

  // Estado de conexión
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // Obtener ID del socket
  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  // Obtener estado detallado de conexión
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  // Obtener información de diagnóstico
  getDiagnosticInfo() {
    return {
      connectionState: this.connectionState,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.adaptiveConfig.maxReconnectionAttempts,
      lastDisconnectReason: this.lastDisconnectReason,
      networkQuality: this.networkQuality,
      connectionHistory: this.connectionHistory.slice(-10), // Últimos 10 eventos
      adaptiveConfig: this.adaptiveConfig,
      socketId: this.getSocketId(),
      isConnected: this.isConnected(),
    };
  }

  // Fuerza reconexión manual
  public forceReconnect(): Promise<Socket> {
    console.log('🔄 Forzando reconexión manual...');
    
    if (this.socket) {
      this.socket.disconnect();
    }
    
    this.reconnectAttempts = 0;
    return this.connect();
  }

  // Verifica la salud de la conexión
  public async checkConnectionHealth(): Promise<boolean> {
    if (!this.socket?.connected) {
      return false;
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, 5000);

      this.socket!.emit('health-check', Date.now(), (response: any) => {
        clearTimeout(timeout);
        resolve(!!response);
      });
    });
  }

  // =============================================================================
  // EVENTOS DE JUEGO
  // =============================================================================

  // Unirse a sala de juego
  joinGameRoom(gameId: string): void {
    if (!this.socket?.connected) {
      throw new Error('Socket no conectado');
    }
    
    console.log('👥 Uniéndose a sala del juego:', gameId);
    this.socket.emit('join-game-room', gameId);
  }

  // Abandonar sala de juego
  leaveGameRoom(gameId: string): void {
    if (!this.socket?.connected) return;
    
    console.log('👋 Abandonando sala del juego:', gameId);
    this.socket.emit('leave-game-room', gameId);
  }

  // Marcar número en cartón
  markNumber(gameId: string, cardId: string, number: number): void {
    if (!this.socket?.connected) return;
    
    console.log('✅ Marcando número:', number, 'en cartón:', cardId);
    this.socket.emit('mark-number', { gameId, cardId, number });
  }

  // Reclamar BINGO
  claimBingo(gameId: string, cardId: string, pattern: string, userId: string): void {
    if (!this.socket?.connected) return;
    
    console.log('🎉 Reclamando BINGO:', { gameId, cardId, pattern });
    this.socket.emit('bingo-claimed', { gameId, cardId, pattern, userId });
  }

  // =============================================================================
  // EVENTOS DE PERLAS (WALLET)
  // =============================================================================

  // Unirse a sala de notificaciones de wallet
  joinWalletRoom(userId: string): void {
    if (!this.socket?.connected) {
      throw new Error('Socket no conectado');
    }
    
    console.log('💎 Uniéndose a sala de wallet:', userId);
    this.socket.emit('join-wallet-room', userId);
  }

  // Abandonar sala de notificaciones de wallet
  leaveWalletRoom(userId: string): void {
    if (!this.socket?.connected) return;
    
    console.log('💎 Abandonando sala de wallet:', userId);
    this.socket.emit('leave-wallet-room', userId);
  }

  // =============================================================================
  // LISTENERS DE EVENTOS
  // =============================================================================

  // Escuchar unión exitosa a sala
  onJoinedGameRoom(callback: (data: { gameId: string; roomSize: number }) => void): void {
    this.socket?.on('joined-game-room', callback);
  }

  // Escuchar jugador que se une
  onPlayerJoined(callback: (data: { playerId: string; timestamp: string }) => void): void {
    this.socket?.on('player-joined', callback);
  }

  // Escuchar jugador que se va
  onPlayerLeft(callback: (data: { playerId: string; timestamp: string }) => void): void {
    this.socket?.on('player-left', callback);
  }

  // Escuchar nueva bola sorteada
  onNewBallDrawn(callback: (data: { 
    gameId: string; 
    ball: number; 
    ballsDrawn: number[]; 
    timestamp: string 
  }) => void): void {
    this.socket?.on('new-ball-drawn', callback);
  }

  // Escuchar confirmación de número marcado
  onNumberMarked(callback: (data: { 
    cardId: string; 
    number: number; 
    timestamp: string 
  }) => void): void {
    this.socket?.on('number-marked', callback);
  }

  // Escuchar ganador de BINGO
  onBingoWinner(callback: (data: { 
    gameId: string; 
    cardId: string; 
    pattern: string; 
    userId: string; 
    timestamp: string 
  }) => void): void {
    this.socket?.on('bingo-winner', callback);
  }

  // Escuchar cambios de estado del juego
  onGameStatusUpdated(callback: (data: { 
    gameId: string; 
    status: string; 
    playerCount?: number; 
    timestamp: string 
  }) => void): void {
    this.socket?.on('game-status-updated', callback);
  }

  // =============================================================================
  // LISTENERS DE EVENTOS DE PERLAS (WALLET)
  // =============================================================================

  // Escuchar actualizaciones de balance
  onBalanceUpdated(callback: (data: { 
    userId: string; 
    newBalance: number; 
    change: number; 
    reason: string; 
    transactionId: string;
    timestamp: string;
  }) => void): void {
    this.socket?.on('balance-updated', callback);
  }

  // Escuchar premios ganados
  onPrizeAwarded(callback: (data: { 
    userId: string; 
    amount: number; 
    currency: string;
    transactionId: string; 
    gameId: string; 
    cardId: string;
    pattern: string;
    newBalance: number;
    description: string;
    timestamp: string;
  }) => void): void {
    this.socket?.on('prize-awarded', callback);
  }

  // Escuchar transferencias recibidas
  onTransferReceived(callback: (data: { 
    userId: string; 
    amount: number; 
    fromUserId: string; 
    fromUserName: string;
    transactionId: string; 
    newBalance: number;
    message?: string;
    timestamp: string;
  }) => void): void {
    this.socket?.on('transfer-received', callback);
  }

  // Escuchar transferencias enviadas confirmadas
  onTransferConfirmed(callback: (data: { 
    userId: string; 
    amount: number; 
    toUserId: string; 
    toUserName: string;
    transactionId: string; 
    newBalance: number;
    message?: string;
    timestamp: string;
  }) => void): void {
    this.socket?.on('transfer-confirmed', callback);
  }

  // Escuchar estado de depósitos
  onDepositStatusUpdated(callback: (data: { 
    userId: string; 
    depositId: string; 
    status: 'APPROVED' | 'REJECTED'; 
    amount: number;
    newBalance?: number;
    adminComment?: string;
    timestamp: string;
  }) => void): void {
    this.socket?.on('deposit-status-updated', callback);
  }

  // Escuchar estado de retiros
  onWithdrawalStatusUpdated(callback: (data: { 
    userId: string; 
    withdrawalId: string; 
    status: 'APPROVED' | 'REJECTED' | 'PROCESSING'; 
    amount: number;
    newBalance?: number;
    adminComment?: string;
    timestamp: string;
  }) => void): void {
    this.socket?.on('withdrawal-status-updated', callback);
  }

  // Escuchar notificaciones generales de wallet
  onWalletNotification(callback: (data: { 
    userId: string; 
    type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
    title: string;
    message: string;
    timestamp: string;
  }) => void): void {
    this.socket?.on('wallet-notification', callback);
  }

  // =============================================================================
  // LIMPIEZA DE LISTENERS
  // =============================================================================

  // Remover todos los listeners
  removeAllListeners(): void {
    this.socket?.removeAllListeners();
  }

  // Remover listener específico
  removeListener(event: string): void {
    this.socket?.off(event);
  }
}

// Instancia singleton
export const socketService = new SocketService();
export default socketService;