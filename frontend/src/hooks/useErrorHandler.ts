import { useCallback, useRef } from 'react';
import { useToast } from '@/contexts/ToastContext';

// Tipos de errores
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  SERVER = 'SERVER',
  SOCKET = 'SOCKET',
  UNKNOWN = 'UNKNOWN'
}

// Severidad del error
export enum ErrorSeverity {
  LOW = 'LOW',       // Info toast, auto-retry
  MEDIUM = 'MEDIUM', // Warning toast, manual retry
  HIGH = 'HIGH',     // Error toast, force action
  CRITICAL = 'CRITICAL' // Error boundary, reload required
}

// Configuración de error
export interface ErrorConfig {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  originalError?: Error;
  context?: string;
  autoRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: () => Promise<void> | void;
  onIgnore?: () => void;
}

// Error handled con metadata
export interface HandledError extends ErrorConfig {
  id: string;
  timestamp: Date;
  retryCount: number;
}

export const useErrorHandler = () => {
  const { toast } = useToast();
  const errorHistory = useRef<HandledError[]>([]);
  const retryTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Genera ID único para error
  const generateErrorId = useCallback(() => {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Clasifica el error automáticamente
  const classifyError = useCallback((error: Error): { type: ErrorType; severity: ErrorSeverity } => {
    const message = error.message.toLowerCase();
    
    // Errores de red
    if (message.includes('network') || message.includes('fetch') || 
        message.includes('timeout') || message.includes('offline')) {
      return { type: ErrorType.NETWORK, severity: ErrorSeverity.MEDIUM };
    }
    
    // Errores de autenticación
    if (message.includes('unauthorized') || message.includes('403') || 
        message.includes('401') || message.includes('token')) {
      return { type: ErrorType.AUTH, severity: ErrorSeverity.HIGH };
    }
    
    // Errores de validación
    if (message.includes('validation') || message.includes('invalid') || 
        message.includes('required') || message.includes('400')) {
      return { type: ErrorType.VALIDATION, severity: ErrorSeverity.LOW };
    }
    
    // Errores de servidor
    if (message.includes('500') || message.includes('internal') || 
        message.includes('server') || message.includes('503')) {
      return { type: ErrorType.SERVER, severity: ErrorSeverity.HIGH };
    }
    
    // Errores de Socket.IO
    if (message.includes('socket') || message.includes('disconnect') || 
        message.includes('connect_error')) {
      return { type: ErrorType.SOCKET, severity: ErrorSeverity.MEDIUM };
    }
    
    return { type: ErrorType.UNKNOWN, severity: ErrorSeverity.MEDIUM };
  }, []);

  // Crea mensaje de error user-friendly
  const createUserMessage = useCallback((config: ErrorConfig): string => {
    switch (config.type) {
      case ErrorType.NETWORK:
        return 'Problema de conexión. Verifica tu internet.';
      case ErrorType.AUTH:
        return 'Sesión expirada. Inicia sesión nuevamente.';
      case ErrorType.VALIDATION:
        return 'Datos inválidos. Revisa la información ingresada.';
      case ErrorType.SERVER:
        return 'Error del servidor. Intenta más tarde.';
      case ErrorType.SOCKET:
        return 'Conexión en tiempo real perdida. Reconectando...';
      default:
        return config.message || 'Error inesperado. Intenta nuevamente.';
    }
  }, []);

  // Determina si debe auto-reintentar
  const shouldAutoRetry = useCallback((config: ErrorConfig): boolean => {
    if (config.autoRetry === false) return false;
    if (config.severity === ErrorSeverity.CRITICAL) return false;
    if (config.type === ErrorType.AUTH) return false;
    if (config.type === ErrorType.VALIDATION) return false;
    
    return true;
  }, []);

  // Ejecuta reintento con delay
  const scheduleRetry = useCallback((handledError: HandledError) => {
    if (!handledError.onRetry) return;
    
    const delay = handledError.retryDelay || Math.min(1000 * Math.pow(2, handledError.retryCount), 30000);
    
    const timeoutId = setTimeout(async () => {
      try {
        await handledError.onRetry!();
        
        // Mostrar toast de éxito si la operación fue exitosa
        toast.success('Operación completada exitosamente');
        
        // Limpiar timeout
        retryTimeouts.current.delete(handledError.id);
      } catch (retryError) {
        // Si el retry falla, manejar el error recursivamente
        const newRetryCount = handledError.retryCount + 1;
        const maxRetries = handledError.maxRetries || 3;
        
        if (newRetryCount < maxRetries) {
          const updatedError: HandledError = {
            ...handledError,
            retryCount: newRetryCount,
          };
          
          scheduleRetry(updatedError);
        } else {
          // Máximo de reintentos alcanzado
          toast.error(`Error persistente: ${createUserMessage(handledError)}`);
        }
      }
    }, delay);
    
    retryTimeouts.current.set(handledError.id, timeoutId);
  }, [toast, createUserMessage]);

  // Maneja el error principal
  const handleError = useCallback(async (
    error: Error | ErrorConfig,
    contextualConfig?: Partial<ErrorConfig>
  ): Promise<string> => {
    let config: ErrorConfig;
    
    // Si es un Error nativo, clasificarlo automáticamente
    if (error instanceof Error) {
      const { type, severity } = classifyError(error);
      config = {
        type,
        severity,
        message: error.message,
        originalError: error,
        ...contextualConfig,
      };
    } else {
      // Si ya es un ErrorConfig, usarlo directamente
      config = { ...error, ...contextualConfig };
    }
    
    const handledError: HandledError = {
      ...config,
      id: generateErrorId(),
      timestamp: new Date(),
      retryCount: 0,
    };
    
    // Agregar a historial
    errorHistory.current.push(handledError);
    
    // Mantener solo los últimos 50 errores
    if (errorHistory.current.length > 50) {
      errorHistory.current = errorHistory.current.slice(-50);
    }
    
    // Mostrar toast apropiado
    const userMessage = createUserMessage(config);
    
    switch (config.severity) {
      case ErrorSeverity.LOW:
        toast.info(userMessage);
        break;
      case ErrorSeverity.MEDIUM:
        toast.warning(userMessage);
        break;
      case ErrorSeverity.HIGH:
        toast.error(userMessage);
        break;
      case ErrorSeverity.CRITICAL:
        toast.error(`Error crítico: ${userMessage}`);
        break;
    }
    
    // Auto-retry si corresponde
    if (shouldAutoRetry(config) && config.onRetry) {
      scheduleRetry(handledError);
    }
    
    // Log para debugging (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Handler');
      console.error('Original Error:', config.originalError || error);
      console.info('Config:', config);
      console.info('Context:', config.context);
      console.groupEnd();
    }
    
    return handledError.id;
  }, [
    classifyError,
    generateErrorId,
    createUserMessage,
    shouldAutoRetry,
    scheduleRetry,
    toast
  ]);

  // Cancela un reintento programado
  const cancelRetry = useCallback((errorId: string) => {
    const timeoutId = retryTimeouts.current.get(errorId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      retryTimeouts.current.delete(errorId);
    }
  }, []);

  // Limpia todos los reintentos
  const clearAllRetries = useCallback(() => {
    retryTimeouts.current.forEach(timeoutId => clearTimeout(timeoutId));
    retryTimeouts.current.clear();
  }, []);

  // Obtiene el historial de errores
  const getErrorHistory = useCallback(() => {
    return [...errorHistory.current];
  }, []);

  // Helpers específicos para tipos comunes de errores
  const handlers = {
    // Error de red
    network: (error: Error, onRetry?: () => Promise<void>) =>
      handleError(error, {
        type: ErrorType.NETWORK,
        severity: ErrorSeverity.MEDIUM,
        onRetry,
        autoRetry: true,
        maxRetries: 3,
        retryDelay: 2000,
      }),
    
    // Error de autenticación
    auth: (error: Error) =>
      handleError(error, {
        type: ErrorType.AUTH,
        severity: ErrorSeverity.HIGH,
        autoRetry: false,
      }),
    
    // Error de validación
    validation: (error: Error, context?: string) =>
      handleError(error, {
        type: ErrorType.VALIDATION,
        severity: ErrorSeverity.LOW,
        context,
        autoRetry: false,
      }),
    
    // Error de Socket.IO
    socket: (error: Error, onRetry?: () => Promise<void>) =>
      handleError(error, {
        type: ErrorType.SOCKET,
        severity: ErrorSeverity.MEDIUM,
        onRetry,
        autoRetry: true,
        maxRetries: 5,
        retryDelay: 1000,
      }),
    
    // Error crítico
    critical: (error: Error, context?: string) =>
      handleError(error, {
        type: ErrorType.UNKNOWN,
        severity: ErrorSeverity.CRITICAL,
        context,
        autoRetry: false,
      }),
  };

  return {
    handleError,
    cancelRetry,
    clearAllRetries,
    getErrorHistory,
    handlers,
  };
};

export default useErrorHandler;