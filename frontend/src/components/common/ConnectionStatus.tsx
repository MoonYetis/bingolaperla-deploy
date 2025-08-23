import React, { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
  error?: string | null;
  reconnectAttempts?: number;
  maxReconnectAttempts?: number;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  showDetails?: boolean;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  isConnecting,
  error,
  reconnectAttempts = 0,
  maxReconnectAttempts = 5,
  size = 'md',
  showText = true,
  showDetails = false,
  className,
}) => {
  const [showReconnectingAnimation, setShowReconnectingAnimation] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  // Animaciones para cambios de estado
  useEffect(() => {
    if (isConnecting) {
      setShowReconnectingAnimation(true);
    } else {
      setShowReconnectingAnimation(false);
    }

    if (isConnected) {
      setPulseAnimation(true);
      setTimeout(() => setPulseAnimation(false), 2000);
    }
  }, [isConnected, isConnecting]);

  const sizeClasses = {
    sm: {
      container: 'px-2 py-1 text-xs',
      icon: 'w-3 h-3',
      dot: 'w-2 h-2',
    },
    md: {
      container: 'px-3 py-2 text-sm',
      icon: 'w-4 h-4',
      dot: 'w-3 h-3',
    },
    lg: {
      container: 'px-4 py-3 text-base',
      icon: 'w-5 h-5',
      dot: 'w-4 h-4',
    },
  };

  const currentSizeClasses = sizeClasses[size];

  // Determinar estado y estilos
  const getStatusInfo = () => {
    if (isConnected) {
      return {
        status: 'connected',
        text: 'Conectado',
        icon: Wifi,
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-200',
        iconColor: 'text-green-600',
        dotColor: 'bg-green-500',
      };
    } else if (isConnecting) {
      return {
        status: 'connecting',
        text: reconnectAttempts > 0 ? `Reconectando... (${reconnectAttempts}/${maxReconnectAttempts})` : 'Conectando...',
        icon: Wifi,
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-200',
        iconColor: 'text-yellow-600',
        dotColor: 'bg-yellow-500',
      };
    } else if (error) {
      return {
        status: 'error',
        text: 'Error de conexión',
        icon: AlertCircle,
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        borderColor: 'border-red-200',
        iconColor: 'text-red-600',
        dotColor: 'bg-red-500',
      };
    } else {
      return {
        status: 'disconnected',
        text: 'Desconectado',
        icon: WifiOff,
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        borderColor: 'border-gray-200',
        iconColor: 'text-gray-600',
        dotColor: 'bg-gray-500',
      };
    }
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-full border transition-all duration-300 transform-gpu',
        currentSizeClasses.container,
        statusInfo.bgColor,
        statusInfo.textColor,
        statusInfo.borderColor,
        
        // Animaciones especiales
        pulseAnimation && 'animate-pulse scale-105',
        showReconnectingAnimation && 'animate-bounce',
        
        // Estado de error
        statusInfo.status === 'error' && 'ring-2 ring-red-300 ring-offset-1',
        
        className
      )}
    >
      {/* Indicador de conexión (dot) */}
      <div className="relative">
        <div
          className={cn(
            'rounded-full transition-all duration-300',
            currentSizeClasses.dot,
            statusInfo.dotColor,
            
            // Animaciones por estado
            statusInfo.status === 'connected' && 'animate-pulse',
            statusInfo.status === 'connecting' && 'animate-ping',
            statusInfo.status === 'error' && 'animate-bounce',
          )}
        />
        
        {/* Ondas de conexión para estado conectado */}
        {statusInfo.status === 'connected' && (
          <>
            <div className={cn(
              'absolute inset-0 rounded-full border-2 border-green-400 animate-ping opacity-20',
              currentSizeClasses.dot
            )} />
            <div className={cn(
              'absolute inset-0 rounded-full border border-green-300 animate-ping opacity-10',
              currentSizeClasses.dot
            )} style={{animationDelay: '0.5s'}} />
          </>
        )}
        
        {/* Spinner para estado conectando */}
        {statusInfo.status === 'connecting' && (
          <div className={cn(
            'absolute inset-0 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin',
            currentSizeClasses.dot
          )} />
        )}
      </div>

      {/* Icono */}
      <Icon
        className={cn(
          'transition-all duration-300',
          currentSizeClasses.icon,
          statusInfo.iconColor,
          
          // Animaciones especiales por estado
          statusInfo.status === 'connected' && pulseAnimation && 'animate-bounce',
          statusInfo.status === 'connecting' && 'animate-pulse',
          statusInfo.status === 'error' && 'animate-shake',
        )}
      />

      {/* Texto del estado */}
      {showText && (
        <span className={cn(
          'font-medium transition-all duration-300',
          statusInfo.textColor,
          showReconnectingAnimation && 'animate-pulse'
        )}>
          {statusInfo.text}
        </span>
      )}

      {/* Detalles adicionales */}
      {showDetails && error && (
        <div className="ml-2 px-2 py-1 bg-red-50 rounded text-xs text-red-600 border border-red-200">
          {error}
        </div>
      )}

      {/* Indicador de progreso para reconexión */}
      {isConnecting && reconnectAttempts > 0 && (
        <div className="ml-2">
          <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-500 rounded-full transition-all duration-300 animate-pulse"
              style={{
                width: `${(reconnectAttempts / maxReconnectAttempts) * 100}%`
              }}
            />
          </div>
        </div>
      )}

      {/* Efectos de partículas para conexión exitosa */}
      {statusInfo.status === 'connected' && pulseAnimation && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-2 w-1 h-1 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0s'}} />
          <div className="absolute top-1 right-2 w-0.5 h-0.5 bg-green-300 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
          <div className="absolute bottom-1 left-4 w-0.5 h-0.5 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}} />
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;