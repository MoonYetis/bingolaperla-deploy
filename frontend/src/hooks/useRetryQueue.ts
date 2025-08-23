import { useState, useCallback, useRef, useEffect } from 'react';
import { useErrorHandler, ErrorType, ErrorSeverity } from './useErrorHandler';
import { useNetworkStatus } from './useNetworkStatus';

// Tipos para operaciones en la cola
export interface QueuedOperation {
  id: string;
  name: string;
  operation: () => Promise<any>;
  context?: string;
  priority: number; // 1 = alta, 5 = baja
  maxRetries: number;
  currentRetries: number;
  createdAt: Date;
  lastAttemptAt?: Date;
  nextRetryAt?: Date;
  metadata?: Record<string, any>;
}

export enum QueueStatus {
  IDLE = 'idle',
  PROCESSING = 'processing',
  PAUSED = 'paused',
  STOPPED = 'stopped'
}

// Estadísticas de la cola
export interface QueueStats {
  totalOperations: number;
  pendingOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageRetryTime: number;
  successRate: number;
}

export const useRetryQueue = () => {
  const [queue, setQueue] = useState<QueuedOperation[]>([]);
  const [status, setStatus] = useState<QueueStatus>(QueueStatus.IDLE);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<QueueStats>({
    totalOperations: 0,
    pendingOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    averageRetryTime: 0,
    successRate: 0,
  });

  // Hooks auxiliares
  const { handleError } = useErrorHandler();
  const { networkStatus, isOnline, hasGoodConnection } = useNetworkStatus();

  // Referencias para timers y control
  const processingTimer = useRef<NodeJS.Timeout | null>(null);
  const retryTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const operationHistory = useRef<Array<{
    id: string;
    success: boolean;
    duration: number;
    timestamp: Date;
  }>>([]);

  // Genera ID único para operación
  const generateOperationId = useCallback(() => {
    return `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Calcula delay de reintento usando backoff exponencial
  const calculateRetryDelay = useCallback((retries: number, priority: number): number => {
    const baseDelay = 1000; // 1 segundo base
    const maxDelay = 60000; // 1 minuto máximo
    
    // Factor basado en prioridad (alta prioridad = menos delay)
    const priorityFactor = Math.max(0.5, (6 - priority) / 5);
    
    // Factor basado en calidad de red
    const networkFactor = hasGoodConnection ? 1 : 2;
    
    // Backoff exponencial con jitter
    const exponentialDelay = Math.min(
      baseDelay * Math.pow(2, retries) * priorityFactor * networkFactor,
      maxDelay
    );
    
    // Agregar jitter (±25%)
    const jitter = exponentialDelay * 0.25 * (Math.random() - 0.5);
    
    return Math.round(exponentialDelay + jitter);
  }, [hasGoodConnection]);

  // Actualiza estadísticas
  const updateStats = useCallback(() => {
    const total = operationHistory.current.length;
    const successful = operationHistory.current.filter(op => op.success).length;
    const failed = operationHistory.current.filter(op => !op.success).length;
    const pending = queue.length;
    
    const avgRetryTime = total > 0 
      ? operationHistory.current.reduce((sum, op) => sum + op.duration, 0) / total 
      : 0;
    
    const successRate = total > 0 ? (successful / total) * 100 : 0;

    setStats({
      totalOperations: total,
      pendingOperations: pending,
      successfulOperations: successful,
      failedOperations: failed,
      averageRetryTime: Math.round(avgRetryTime),
      successRate: Math.round(successRate * 100) / 100,
    });
  }, [queue.length]);

  // Añade operación a la cola
  const enqueue = useCallback((
    name: string,
    operation: () => Promise<any>,
    options: {
      priority?: number;
      maxRetries?: number;
      context?: string;
      metadata?: Record<string, any>;
    } = {}
  ): string => {
    const id = generateOperationId();
    
    const queuedOperation: QueuedOperation = {
      id,
      name,
      operation,
      context: options.context,
      priority: options.priority || 3,
      maxRetries: options.maxRetries || 3,
      currentRetries: 0,
      createdAt: new Date(),
      metadata: options.metadata,
    };

    setQueue(prev => {
      // Insertar en orden de prioridad (prioridad más alta primero)
      const newQueue = [...prev, queuedOperation];
      return newQueue.sort((a, b) => a.priority - b.priority);
    });

    console.log(`📋 Operación añadida a la cola: ${name} (${id})`);
    return id;
  }, [generateOperationId]);

  // Remueve operación de la cola
  const dequeue = useCallback((operationId: string) => {
    setQueue(prev => prev.filter(op => op.id !== operationId));
    
    // Cancelar timeout si existe
    const timeoutId = retryTimeouts.current.get(operationId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      retryTimeouts.current.delete(operationId);
    }
  }, []);

  // Procesa una operación individual
  const processOperation = useCallback(async (operation: QueuedOperation): Promise<boolean> => {
    const startTime = Date.now();
    
    try {
      console.log(`🔄 Procesando: ${operation.name} (intento ${operation.currentRetries + 1}/${operation.maxRetries})`);
      
      await operation.operation();
      
      // Éxito
      const duration = Date.now() - startTime;
      operationHistory.current.push({
        id: operation.id,
        success: true,
        duration,
        timestamp: new Date(),
      });
      
      console.log(`✅ Operación exitosa: ${operation.name} (${duration}ms)`);
      return true;
      
    } catch (error) {
      // Falló
      const duration = Date.now() - startTime;
      operationHistory.current.push({
        id: operation.id,
        success: false,
        duration,
        timestamp: new Date(),
      });
      
      console.log(`❌ Operación falló: ${operation.name} (${duration}ms)`, error);
      
      // Manejar error con el sistema centralizado
      if (error instanceof Error) {
        handleError(error, {
          context: `Retry Queue: ${operation.name}`,
          type: ErrorType.UNKNOWN,
          severity: ErrorSeverity.LOW,
        });
      }
      
      return false;
    }
  }, [handleError]);

  // Programa reintento de una operación
  const scheduleRetry = useCallback((operation: QueuedOperation) => {
    const delay = calculateRetryDelay(operation.currentRetries, operation.priority);
    const nextRetryAt = new Date(Date.now() + delay);
    
    console.log(`⏰ Programando reintento de "${operation.name}" en ${delay}ms`);
    
    const timeoutId = setTimeout(() => {
      setQueue(prev => 
        prev.map(op => 
          op.id === operation.id 
            ? { ...op, currentRetries: op.currentRetries + 1, lastAttemptAt: new Date() }
            : op
        )
      );
      retryTimeouts.current.delete(operation.id);
    }, delay);
    
    retryTimeouts.current.set(operation.id, timeoutId);
    
    // Actualizar nextRetryAt en la operación
    setQueue(prev => 
      prev.map(op => 
        op.id === operation.id 
          ? { ...op, nextRetryAt }
          : op
      )
    );
  }, [calculateRetryDelay]);

  // Procesador principal de la cola
  const processQueue = useCallback(async () => {
    if (!isOnline || status === QueueStatus.PAUSED || status === QueueStatus.STOPPED) {
      return;
    }

    setIsProcessing(true);
    setStatus(QueueStatus.PROCESSING);

    // Obtener operaciones listas para procesar
    const readyOperations = queue.filter(op => 
      !op.nextRetryAt || op.nextRetryAt <= new Date()
    );

    if (readyOperations.length === 0) {
      setIsProcessing(false);
      setStatus(QueueStatus.IDLE);
      return;
    }

    // Procesar la operación de mayor prioridad
    const operation = readyOperations[0];
    const success = await processOperation(operation);

    if (success) {
      // Remover de la cola si fue exitosa
      dequeue(operation.id);
    } else {
      // Programar reintento si no se agotaron los intentos
      if (operation.currentRetries < operation.maxRetries) {
        scheduleRetry(operation);
      } else {
        // Remover si se agotaron los reintentos
        console.log(`🚫 Operación descartada tras ${operation.maxRetries} intentos: ${operation.name}`);
        dequeue(operation.id);
      }
    }

    // Actualizar estadísticas
    updateStats();

    setIsProcessing(false);
    setStatus(queue.length > 0 ? QueueStatus.IDLE : QueueStatus.IDLE);
  }, [isOnline, status, queue, processOperation, dequeue, scheduleRetry, updateStats]);

  // Inicia el procesamiento automático
  const startProcessing = useCallback(() => {
    if (status === QueueStatus.STOPPED) return;
    
    setStatus(QueueStatus.PROCESSING);
    
    const processInterval = () => {
      processQueue();
      processingTimer.current = setTimeout(processInterval, 2000); // Procesar cada 2 segundos
    };
    
    processInterval();
  }, [status, processQueue]);

  // Pausa el procesamiento
  const pauseProcessing = useCallback(() => {
    setStatus(QueueStatus.PAUSED);
    if (processingTimer.current) {
      clearTimeout(processingTimer.current);
      processingTimer.current = null;
    }
  }, []);

  // Reanuda el procesamiento
  const resumeProcessing = useCallback(() => {
    if (status === QueueStatus.PAUSED) {
      startProcessing();
    }
  }, [status, startProcessing]);

  // Detiene completamente el procesamiento
  const stopProcessing = useCallback(() => {
    setStatus(QueueStatus.STOPPED);
    if (processingTimer.current) {
      clearTimeout(processingTimer.current);
      processingTimer.current = null;
    }
    
    // Cancelar todos los timeouts
    retryTimeouts.current.forEach(timeoutId => clearTimeout(timeoutId));
    retryTimeouts.current.clear();
  }, []);

  // Limpia la cola
  const clearQueue = useCallback(() => {
    stopProcessing();
    setQueue([]);
    retryTimeouts.current.clear();
    operationHistory.current = [];
    updateStats();
  }, [stopProcessing, updateStats]);

  // Auto-iniciar procesamiento cuando hay operaciones
  useEffect(() => {
    if (queue.length > 0 && status === QueueStatus.IDLE && isOnline) {
      startProcessing();
    }
  }, [queue.length, status, isOnline, startProcessing]);

  // Pausar/reanudar según estado de red
  useEffect(() => {
    if (!isOnline && status === QueueStatus.PROCESSING) {
      pauseProcessing();
    } else if (isOnline && status === QueueStatus.PAUSED && queue.length > 0) {
      resumeProcessing();
    }
  }, [isOnline, status, queue.length, pauseProcessing, resumeProcessing]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      stopProcessing();
    };
  }, [stopProcessing]);

  // Helpers para tipos comunes de operaciones
  const helpers = {
    // API call retry
    apiCall: (name: string, apiCall: () => Promise<any>, priority: number = 2) =>
      enqueue(`API: ${name}`, apiCall, { priority, maxRetries: 3 }),
    
    // Socket operation retry
    socketOp: (name: string, socketOp: () => Promise<any>, priority: number = 1) =>
      enqueue(`Socket: ${name}`, socketOp, { priority, maxRetries: 5 }),
    
    // Data sync retry
    dataSync: (name: string, syncOp: () => Promise<any>, priority: number = 3) =>
      enqueue(`Sync: ${name}`, syncOp, { priority, maxRetries: 2 }),
  };

  return {
    // Estado
    queue,
    status,
    isProcessing,
    stats,
    
    // Operaciones
    enqueue,
    dequeue,
    
    // Control
    startProcessing,
    pauseProcessing,
    resumeProcessing,
    stopProcessing,
    clearQueue,
    
    // Helpers
    helpers,
  };
};

export default useRetryQueue;