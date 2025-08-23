import { useEffect, useState, useCallback } from 'react';
import { socketService } from '@/services/socketService';
import { useErrorHandler, ErrorType } from './useErrorHandler';
import { useNetworkStatus } from './useNetworkStatus';
import { useRetryQueue } from './useRetryQueue';

// Hook para gestionar la conexión de Socket.IO
export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socketId, setSocketId] = useState<string | undefined>();
  const [connectionQuality, setConnectionQuality] = useState<string>('unknown');
  
  // Hooks auxiliares
  const { handleError, handlers } = useErrorHandler();
  const { networkStatus, hasGoodConnection, isOnline } = useNetworkStatus();
  const { helpers: retryHelpers } = useRetryQueue();

  // Actualiza la calidad de red en socketService
  useEffect(() => {
    const quality = networkStatus.quality;
    socketService.updateNetworkQuality(quality);
    setConnectionQuality(quality);
  }, [networkStatus.quality]);

  // Conectar al socket
  const connect = useCallback(async () => {
    if (isConnected || isConnecting) return;

    // Verificar si estamos online antes de intentar conectar
    if (!isOnline) {
      const offlineError = new Error('Sin conexión a internet');
      handlers.network(offlineError);
      setError('Sin conexión a internet');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      await socketService.connect();
      setIsConnected(true);
      setSocketId(socketService.getSocketId());
      setError(null);
      
      // Log successful connection
      console.log('✅ Socket conectado exitosamente:', {
        quality: networkStatus.quality,
        latency: networkStatus.latency,
        online: isOnline
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión';
      setError(errorMessage);
      setIsConnected(false);
      
      // Añadir conexión a la cola de reintentos
      if (err instanceof Error) {
        retryHelpers.socketOp('conectar-socket', () => socketService.connect(), 1);
        handlers.socket(err, () => connect());
      }
      
    } finally {
      setIsConnecting(false);
    }
  }, [isConnected, isConnecting, isOnline, networkStatus, handlers, retryHelpers]);

  // Desconectar del socket
  const disconnect = useCallback(() => {
    socketService.disconnect();
    setIsConnected(false);
    setSocketId(undefined);
    setError(null);
  }, []);

  // Fuerza reconexión manual
  const forceReconnect = useCallback(async () => {
    try {
      setIsConnecting(true);
      await socketService.forceReconnect();
      setIsConnected(true);
      setSocketId(socketService.getSocketId());
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de reconexión';
      setError(errorMessage);
      setIsConnected(false);
      
      // Añadir reconexión a la cola de reintentos
      if (err instanceof Error) {
        retryHelpers.socketOp('reconectar-socket', () => socketService.forceReconnect(), 1);
        handlers.socket(err);
      }
    } finally {
      setIsConnecting(false);
    }
  }, [handlers, retryHelpers]);

  // Verifica la salud de la conexión
  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      return await socketService.checkConnectionHealth();
    } catch (err) {
      console.warn('Health check failed:', err);
      return false;
    }
  }, []);

  // Auto-reconexión cuando se recupera la red
  useEffect(() => {
    if (isOnline && !isConnected && !isConnecting && hasGoodConnection) {
      console.log('🔄 Red recuperada, intentando reconectar...');
      connect();
    }
  }, [isOnline, isConnected, isConnecting, hasGoodConnection, connect]);

  // Efecto para limpiar al desmontar
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Información de diagnóstico
  const getDiagnostics = useCallback(() => {
    return {
      ...socketService.getDiagnosticInfo(),
      networkStatus,
      connectionQuality,
      hasGoodConnection,
      isOnline,
    };
  }, [networkStatus, connectionQuality, hasGoodConnection, isOnline]);

  return {
    isConnected,
    isConnecting,
    error,
    socketId,
    connectionQuality,
    networkStatus,
    connect,
    disconnect,
    forceReconnect,
    checkHealth,
    getDiagnostics,
  };
};

// Hook para gestionar eventos de juego
export const useGameSocket = (gameId: string | null) => {
  const [roomSize, setRoomSize] = useState(0);
  const [lastBall, setLastBall] = useState<number | null>(null);
  const [ballsDrawn, setBallsDrawn] = useState<number[]>([]);
  const [gameStatus, setGameStatus] = useState<string>('');
  const [playerCount, setPlayerCount] = useState<number>(0);
  const [bingoWinner, setBingoWinner] = useState<{
    cardId: string;
    pattern: string;
    userId: string;
    timestamp: string;
  } | null>(null);

  // Cola de reintentos para operaciones de juego
  const { helpers: retryHelpers } = useRetryQueue();

  // Unirse a sala de juego
  const joinRoom = useCallback(() => {
    if (!gameId || !socketService.isConnected()) {
      // Si no hay conexión, añadir a cola de reintentos
      if (gameId) {
        retryHelpers.socketOp('unirse-sala', () => {
          if (socketService.isConnected()) {
            socketService.joinGameRoom(gameId);
          } else {
            throw new Error('Socket no conectado');
          }
        }, 2);
      }
      return;
    }
    
    socketService.joinGameRoom(gameId);
  }, [gameId, retryHelpers]);

  // Abandonar sala de juego
  const leaveRoom = useCallback(() => {
    if (!gameId || !socketService.isConnected()) return;
    
    socketService.leaveGameRoom(gameId);
  }, [gameId]);

  // Marcar número
  const markNumber = useCallback((cardId: string, number: number) => {
    if (!gameId || !socketService.isConnected()) {
      // Añadir marcado a cola de reintentos
      if (gameId) {
        retryHelpers.socketOp(`marcar-${number}`, () => {
          if (socketService.isConnected()) {
            socketService.markNumber(gameId, cardId, number);
          } else {
            throw new Error('Socket no conectado');
          }
        }, 1); // Alta prioridad para acciones de juego
      }
      return;
    }
    
    socketService.markNumber(gameId, cardId, number);
  }, [gameId, retryHelpers]);

  // Reclamar BINGO
  const claimBingo = useCallback((cardId: string, pattern: string, userId: string) => {
    if (!gameId || !socketService.isConnected()) {
      // Añadir reclamación de BINGO a cola de reintentos (máxima prioridad)
      if (gameId) {
        retryHelpers.socketOp('reclamar-bingo', () => {
          if (socketService.isConnected()) {
            socketService.claimBingo(gameId, cardId, pattern, userId);
          } else {
            throw new Error('Socket no conectado para BINGO');
          }
        }, 1); // Máxima prioridad
      }
      return;
    }
    
    socketService.claimBingo(gameId, cardId, pattern, userId);
  }, [gameId, retryHelpers]);

  // Configurar listeners
  useEffect(() => {
    if (!socketService.isConnected()) return;

    // Listener: Unión exitosa a sala
    socketService.onJoinedGameRoom((data) => {
      console.log('🎮 Unido a sala:', data);
      setRoomSize(data.roomSize);
    });

    // Listener: Jugador se une
    socketService.onPlayerJoined((data) => {
      console.log('👥 Jugador se unió:', data.playerId);
      setRoomSize(prev => prev + 1);
    });

    // Listener: Jugador se va
    socketService.onPlayerLeft((data) => {
      console.log('👋 Jugador se fue:', data.playerId);
      setRoomSize(prev => Math.max(0, prev - 1));
    });

    // Listener: Nueva bola sorteada
    socketService.onNewBallDrawn((data) => {
      console.log('🎱 Nueva bola:', data.ball);
      setLastBall(data.ball);
      setBallsDrawn(data.ballsDrawn);
    });

    // Listener: Número marcado
    socketService.onNumberMarked((data) => {
      console.log('✅ Número marcado:', data.number);
    });

    // Listener: Ganador de BINGO
    socketService.onBingoWinner((data) => {
      console.log('🎉 ¡BINGO!:', data);
      setBingoWinner({
        cardId: data.cardId,
        pattern: data.pattern,
        userId: data.userId,
        timestamp: data.timestamp,
      });
    });

    // Listener: Estado del juego actualizado
    socketService.onGameStatusUpdated((data) => {
      console.log('🎮 Estado del juego:', data.status);
      setGameStatus(data.status);
      if (data.playerCount !== undefined) {
        setPlayerCount(data.playerCount);
      }
    });

    // Limpieza al desmontar
    return () => {
      socketService.removeAllListeners();
    };
  }, []);

  // Auto-unirse a sala cuando se conecta
  useEffect(() => {
    if (gameId && socketService.isConnected()) {
      joinRoom();
    }

    // Abandonar sala al desmontar
    return () => {
      if (gameId) {
        leaveRoom();
      }
    };
  }, [gameId, joinRoom, leaveRoom]);

  return {
    roomSize,
    lastBall,
    ballsDrawn,
    gameStatus,
    playerCount,
    bingoWinner,
    joinRoom,
    leaveRoom,
    markNumber,
    claimBingo,
    clearBingoWinner: () => setBingoWinner(null),
  };
};

// Hook para gestionar eventos de wallet/perlas
export const useWalletSocket = (userId: string | null) => {
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [lastTransaction, setLastTransaction] = useState<{
    id: string;
    amount: number;
    type: string;
    timestamp: string;
  } | null>(null);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
  }>>([]);
  const [pendingDeposit, setPendingDeposit] = useState<{
    id: string;
    status: 'APPROVED' | 'REJECTED';
    amount: number;
    timestamp: string;
  } | null>(null);
  const [pendingWithdrawal, setPendingWithdrawal] = useState<{
    id: string;
    status: 'APPROVED' | 'REJECTED' | 'PROCESSING';
    amount: number;
    timestamp: string;
  } | null>(null);

  // Cola de reintentos para operaciones de wallet
  const { helpers: retryHelpers } = useRetryQueue();

  // Unirse a sala de wallet
  const joinWalletRoom = useCallback(() => {
    if (!userId || !socketService.isConnected()) {
      // Si no hay conexión, añadir a cola de reintentos
      if (userId) {
        retryHelpers.socketOp('unirse-wallet', () => {
          if (socketService.isConnected()) {
            socketService.joinWalletRoom(userId);
          } else {
            throw new Error('Socket no conectado');
          }
        }, 2);
      }
      return;
    }
    
    socketService.joinWalletRoom(userId);
  }, [userId, retryHelpers]);

  // Abandonar sala de wallet
  const leaveWalletRoom = useCallback(() => {
    if (!userId || !socketService.isConnected()) return;
    
    socketService.leaveWalletRoom(userId);
  }, [userId]);

  // Marcar notificación como leída
  const markNotificationAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    ));
  }, []);

  // Limpiar notificaciones
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Configurar listeners de wallet
  useEffect(() => {
    if (!socketService.isConnected()) return;

    // Listener: Balance actualizado
    socketService.onBalanceUpdated((data) => {
      console.log('💎 Balance actualizado:', data);
      if (data.userId === userId) {
        setCurrentBalance(data.newBalance);
        setLastTransaction({
          id: data.transactionId,
          amount: data.change,
          type: data.reason,
          timestamp: data.timestamp
        });

        // Crear notificación visual
        const notif = {
          id: `balance-${Date.now()}`,
          type: data.change > 0 ? 'SUCCESS' as const : 'INFO' as const,
          title: data.change > 0 ? 'Balance Incrementado' : 'Balance Actualizado',
          message: `${data.change > 0 ? '+' : ''}${data.change.toFixed(2)} Perlas. Nuevo balance: ${data.newBalance.toFixed(2)}`,
          timestamp: data.timestamp,
          read: false
        };
        
        setNotifications(prev => [notif, ...prev.slice(0, 9)]); // Máximo 10 notificaciones
      }
    });

    // Listener: Premio otorgado
    socketService.onPrizeAwarded((data) => {
      console.log('🏆 Premio otorgado:', data);
      if (data.userId === userId) {
        setCurrentBalance(data.newBalance);
        setLastTransaction({
          id: data.transactionId,
          amount: data.amount,
          type: 'PRIZE',
          timestamp: data.timestamp
        });

        // Crear notificación de premio
        const notif = {
          id: `prize-${Date.now()}`,
          type: 'SUCCESS' as const,
          title: '¡Premio Ganado! 🎉',
          message: `+${data.amount.toFixed(2)} Perlas por ${data.pattern}. Nuevo balance: ${data.newBalance.toFixed(2)}`,
          timestamp: data.timestamp,
          read: false
        };
        
        setNotifications(prev => [notif, ...prev.slice(0, 9)]);
      }
    });

    // Listener: Transferencia recibida
    socketService.onTransferReceived((data) => {
      console.log('📨 Transferencia recibida:', data);
      if (data.userId === userId) {
        setCurrentBalance(data.newBalance);
        setLastTransaction({
          id: data.transactionId,
          amount: data.amount,
          type: 'TRANSFER_RECEIVED',
          timestamp: data.timestamp
        });

        const notif = {
          id: `transfer-in-${Date.now()}`,
          type: 'SUCCESS' as const,
          title: 'Perlas Recibidas 💎',
          message: `+${data.amount.toFixed(2)} Perlas de ${data.fromUserName}. Nuevo balance: ${data.newBalance.toFixed(2)}`,
          timestamp: data.timestamp,
          read: false
        };
        
        setNotifications(prev => [notif, ...prev.slice(0, 9)]);
      }
    });

    // Listener: Transferencia confirmada (enviada)
    socketService.onTransferConfirmed((data) => {
      console.log('📤 Transferencia confirmada:', data);
      if (data.userId === userId) {
        setCurrentBalance(data.newBalance);
        setLastTransaction({
          id: data.transactionId,
          amount: -data.amount,
          type: 'TRANSFER_SENT',
          timestamp: data.timestamp
        });

        const notif = {
          id: `transfer-out-${Date.now()}`,
          type: 'INFO' as const,
          title: 'Perlas Enviadas 💸',
          message: `-${data.amount.toFixed(2)} Perlas a ${data.toUserName}. Nuevo balance: ${data.newBalance.toFixed(2)}`,
          timestamp: data.timestamp,
          read: false
        };
        
        setNotifications(prev => [notif, ...prev.slice(0, 9)]);
      }
    });

    // Listener: Estado de depósito actualizado
    socketService.onDepositStatusUpdated((data) => {
      console.log('📥 Estado de depósito:', data);
      if (data.userId === userId) {
        setPendingDeposit({
          id: data.depositId,
          status: data.status,
          amount: data.amount,
          timestamp: data.timestamp
        });

        if (data.newBalance !== undefined) {
          setCurrentBalance(data.newBalance);
        }

        const notif = {
          id: `deposit-${Date.now()}`,
          type: data.status === 'APPROVED' ? 'SUCCESS' as const : 'WARNING' as const,
          title: data.status === 'APPROVED' ? 'Depósito Aprobado ✅' : 'Depósito Rechazado ❌',
          message: `${data.amount.toFixed(2)} Perlas - ${data.adminComment || 'Sin comentarios'}`,
          timestamp: data.timestamp,
          read: false
        };
        
        setNotifications(prev => [notif, ...prev.slice(0, 9)]);
      }
    });

    // Listener: Estado de retiro actualizado
    socketService.onWithdrawalStatusUpdated((data) => {
      console.log('📤 Estado de retiro:', data);
      if (data.userId === userId) {
        setPendingWithdrawal({
          id: data.withdrawalId,
          status: data.status,
          amount: data.amount,
          timestamp: data.timestamp
        });

        if (data.newBalance !== undefined) {
          setCurrentBalance(data.newBalance);
        }

        const statusMessages = {
          APPROVED: 'Retiro Aprobado ✅',
          REJECTED: 'Retiro Rechazado ❌',
          PROCESSING: 'Retiro en Proceso ⏳'
        };

        const notif = {
          id: `withdrawal-${Date.now()}`,
          type: data.status === 'APPROVED' ? 'SUCCESS' as const : 
                data.status === 'REJECTED' ? 'WARNING' as const : 'INFO' as const,
          title: statusMessages[data.status],
          message: `${data.amount.toFixed(2)} Perlas - ${data.adminComment || 'Sin comentarios'}`,
          timestamp: data.timestamp,
          read: false
        };
        
        setNotifications(prev => [notif, ...prev.slice(0, 9)]);
      }
    });

    // Listener: Notificaciones generales de wallet
    socketService.onWalletNotification((data) => {
      console.log('🔔 Notificación de wallet:', data);
      if (data.userId === userId) {
        const notif = {
          id: `wallet-notif-${Date.now()}`,
          type: data.type,
          title: data.title,
          message: data.message,
          timestamp: data.timestamp,
          read: false
        };
        
        setNotifications(prev => [notif, ...prev.slice(0, 9)]);
      }
    });

    // Limpieza al desmontar
    return () => {
      // Los listeners se limpian en el socketService.removeAllListeners()
    };
  }, [userId]);

  // Auto-unirse a sala cuando se conecta
  useEffect(() => {
    if (userId && socketService.isConnected()) {
      joinWalletRoom();
    }

    // Abandonar sala al desmontar
    return () => {
      if (userId) {
        leaveWalletRoom();
      }
    };
  }, [userId, joinWalletRoom, leaveWalletRoom]);

  return {
    currentBalance,
    lastTransaction,
    notifications,
    pendingDeposit,
    pendingWithdrawal,
    unreadCount: notifications.filter(n => !n.read).length,
    joinWalletRoom,
    leaveWalletRoom,
    markNotificationAsRead,
    clearNotifications,
    clearPendingDeposit: () => setPendingDeposit(null),
    clearPendingWithdrawal: () => setPendingWithdrawal(null),
  };
};