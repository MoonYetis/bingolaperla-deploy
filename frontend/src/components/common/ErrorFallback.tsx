import React from 'react';
import { cn } from '@/utils/cn';
import Button from './Button';
import { AlertTriangle, Wifi, RefreshCw, Home, Bug, Server, Shield } from 'lucide-react';

export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  SERVER = 'SERVER',
  SOCKET = 'SOCKET',
  UNKNOWN = 'UNKNOWN'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

interface ErrorFallbackProps {
  error?: Error;
  errorType?: ErrorType;
  severity?: ErrorSeverity;
  title?: string;
  message?: string;
  showTechnicalDetails?: boolean;
  onRetry?: () => void;
  onGoHome?: () => void;
  onReload?: () => void;
  retryLabel?: string;
  className?: string;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorType = ErrorType.UNKNOWN,
  severity = ErrorSeverity.MEDIUM,
  title,
  message,
  showTechnicalDetails = false,
  onRetry,
  onGoHome,
  onReload,
  retryLabel = 'Intentar Nuevamente',
  className,
}) => {
  // Configuración por tipo de error
  const getErrorConfig = () => {
    switch (errorType) {
      case ErrorType.NETWORK:
        return {
          icon: Wifi,
          iconColor: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          defaultTitle: 'Problema de Conexión',
          defaultMessage: 'No se pudo conectar al servidor. Verifica tu conexión a internet.',
          suggestions: [
            'Verifica tu conexión a internet',
            'Intenta recargar la página',
            'Desactiva el VPN si está activo',
          ],
        };
      
      case ErrorType.AUTH:
        return {
          icon: Shield,
          iconColor: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          defaultTitle: 'Sesión Expirada',
          defaultMessage: 'Tu sesión ha expirado. Inicia sesión nuevamente.',
          suggestions: [
            'Inicia sesión nuevamente',
            'Verifica tus credenciales',
            'Contacta soporte si el problema persiste',
          ],
        };
      
      case ErrorType.SERVER:
        return {
          icon: Server,
          iconColor: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          defaultTitle: 'Error del Servidor',
          defaultMessage: 'El servidor está experimentando problemas temporales.',
          suggestions: [
            'Intenta nuevamente en unos minutos',
            'El problema se resolverá automáticamente',
            'Contacta soporte si persiste',
          ],
        };
      
      case ErrorType.SOCKET:
        return {
          icon: Wifi,
          iconColor: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          defaultTitle: 'Conexión en Tiempo Real Perdida',
          defaultMessage: 'Se perdió la conexión en tiempo real. Reconectando...',
          suggestions: [
            'La reconexión es automática',
            'Mantén la página abierta',
            'Recarga si el problema persiste',
          ],
        };
      
      case ErrorType.VALIDATION:
        return {
          icon: AlertTriangle,
          iconColor: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          defaultTitle: 'Datos Incorrectos',
          defaultMessage: 'Los datos ingresados no son válidos.',
          suggestions: [
            'Revisa la información ingresada',
            'Verifica el formato de los campos',
            'Intenta con datos diferentes',
          ],
        };
      
      default:
        return {
          icon: Bug,
          iconColor: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          defaultTitle: 'Error Inesperado',
          defaultMessage: 'Ha ocurrido un error inesperado.',
          suggestions: [
            'Intenta recargar la página',
            'Verifica tu conexión',
            'Contacta soporte si persiste',
          ],
        };
    }
  };

  const config = getErrorConfig();
  const Icon = config.icon;

  // Configuración por severidad
  const getSeverityStyles = () => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return {
          containerBg: 'bg-red-50',
          containerBorder: 'border-red-300',
          titleColor: 'text-red-900',
          messageColor: 'text-red-700',
          iconPulse: 'animate-pulse',
        };
      case ErrorSeverity.HIGH:
        return {
          containerBg: 'bg-orange-50',
          containerBorder: 'border-orange-300',
          titleColor: 'text-orange-900',
          messageColor: 'text-orange-700',
          iconPulse: 'animate-bounce',
        };
      case ErrorSeverity.MEDIUM:
        return {
          containerBg: config.bgColor,
          containerBorder: config.borderColor,
          titleColor: 'text-gray-900',
          messageColor: 'text-gray-700',
          iconPulse: '',
        };
      case ErrorSeverity.LOW:
        return {
          containerBg: 'bg-blue-50',
          containerBorder: 'border-blue-200',
          titleColor: 'text-blue-900',
          messageColor: 'text-blue-700',
          iconPulse: '',
        };
      default:
        return {
          containerBg: config.bgColor,
          containerBorder: config.borderColor,
          titleColor: 'text-gray-900',
          messageColor: 'text-gray-700',
          iconPulse: '',
        };
    }
  };

  const severityStyles = getSeverityStyles();

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      window.location.href = '/';
    }
  };

  const handleReload = () => {
    if (onReload) {
      onReload();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className={cn(
      'max-w-md mx-auto p-6 rounded-lg border-2 shadow-lg',
      severityStyles.containerBg,
      severityStyles.containerBorder,
      className
    )}>
      {/* Icono */}
      <div className="flex justify-center mb-4">
        <div className={cn(
          'p-3 rounded-full',
          config.bgColor,
          config.borderColor,
          'border-2'
        )}>
          <Icon className={cn(
            'w-8 h-8',
            config.iconColor,
            severityStyles.iconPulse
          )} />
        </div>
      </div>

      {/* Título */}
      <h2 className={cn(
        'text-xl font-bold text-center mb-3',
        severityStyles.titleColor
      )}>
        {title || config.defaultTitle}
      </h2>

      {/* Mensaje */}
      <p className={cn(
        'text-center mb-6',
        severityStyles.messageColor
      )}>
        {message || config.defaultMessage}
      </p>

      {/* Sugerencias */}
      <div className="mb-6">
        <h3 className={cn(
          'text-sm font-medium mb-2',
          severityStyles.titleColor
        )}>
          Qué puedes hacer:
        </h3>
        <ul className="text-sm space-y-1">
          {config.suggestions.map((suggestion, index) => (
            <li key={index} className={cn(
              'flex items-center',
              severityStyles.messageColor
            )}>
              <span className="w-1.5 h-1.5 bg-current rounded-full mr-2 flex-shrink-0" />
              {suggestion}
            </li>
          ))}
        </ul>
      </div>

      {/* Detalles técnicos */}
      {showTechnicalDetails && error && (
        <details className="mb-6">
          <summary className={cn(
            'text-sm font-medium cursor-pointer hover:underline',
            severityStyles.titleColor
          )}>
            Detalles técnicos
          </summary>
          <div className="mt-2 p-3 bg-gray-100 rounded-lg">
            <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-auto">
              {error.name}: {error.message}
              {error.stack && '\n\nStack trace:\n' + error.stack}
            </pre>
          </div>
        </details>
      )}

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row gap-3">
        {onRetry && (
          <Button 
            onClick={onRetry} 
            className="flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {retryLabel}
          </Button>
        )}
        
        <Button 
          variant="outline" 
          onClick={handleReload}
          className="flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Recargar
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleGoHome}
          className="flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />
          Inicio
        </Button>
      </div>

      {/* Indicador de severidad */}
      {severity === ErrorSeverity.CRITICAL && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-sm text-red-800 font-medium">
              Error crítico: Se requiere recargar la aplicación
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorFallback;