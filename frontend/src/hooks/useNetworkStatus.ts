import { useState, useEffect, useCallback, useRef } from 'react';

// Tipos de conexión
export enum ConnectionType {
  ETHERNET = 'ethernet',
  WIFI = 'wifi',
  CELLULAR = 'cellular',
  UNKNOWN = 'unknown'
}

// Calidad de conexión
export enum ConnectionQuality {
  EXCELLENT = 'excellent', // < 100ms, > 10Mbps
  GOOD = 'good',          // < 300ms, > 5Mbps  
  POOR = 'poor',          // < 1000ms, > 1Mbps
  VERY_POOR = 'very_poor', // > 1000ms, < 1Mbps
  OFFLINE = 'offline'
}

// Estado de la red
export interface NetworkStatus {
  isOnline: boolean;
  connectionType: ConnectionType;
  quality: ConnectionQuality;
  latency: number | null;
  downloadSpeed: number | null;
  saveData: boolean;
  lastChecked: Date;
}

// Información extendida de la red (cuando esté disponible)
export interface ExtendedNetworkInfo {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

declare global {
  interface Navigator {
    connection?: {
      effectiveType?: string;
      downlink?: number;
      rtt?: number;
      saveData?: boolean;
      addEventListener?: (type: string, listener: () => void) => void;
      removeEventListener?: (type: string, listener: () => void) => void;
    };
  }
}

export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    connectionType: ConnectionType.UNKNOWN,
    quality: ConnectionQuality.GOOD,
    latency: null,
    downloadSpeed: null,
    saveData: false,
    lastChecked: new Date(),
  });

  const latencyTests = useRef<number[]>([]);
  const speedTestRef = useRef<AbortController | null>(null);

  // Detecta el tipo de conexión basado en la información disponible
  const detectConnectionType = useCallback((): ConnectionType => {
    const connection = navigator.connection;
    
    if (!connection) return ConnectionType.UNKNOWN;
    
    const effectiveType = connection.effectiveType;
    
    if (effectiveType === 'slow-2g' || effectiveType === '2g' || 
        effectiveType === '3g' || effectiveType === '4g') {
      return ConnectionType.CELLULAR;
    }
    
    // Si la velocidad es muy alta, probablemente sea ethernet
    if (connection.downlink && connection.downlink > 20) {
      return ConnectionType.ETHERNET;
    }
    
    // Por defecto, asumimos WiFi para conexiones no celulares
    return ConnectionType.WIFI;
  }, []);

  // Calcula la calidad basada en latencia y velocidad
  const calculateQuality = useCallback((
    latency: number | null, 
    downlink: number | null
  ): ConnectionQuality => {
    if (!navigator.onLine) return ConnectionQuality.OFFLINE;
    
    // Si tenemos latency y downlink, usar ambos
    if (latency !== null && downlink !== null) {
      if (latency < 100 && downlink > 10) return ConnectionQuality.EXCELLENT;
      if (latency < 300 && downlink > 5) return ConnectionQuality.GOOD;
      if (latency < 1000 && downlink > 1) return ConnectionQuality.POOR;
      return ConnectionQuality.VERY_POOR;
    }
    
    // Solo latencia
    if (latency !== null) {
      if (latency < 100) return ConnectionQuality.EXCELLENT;
      if (latency < 300) return ConnectionQuality.GOOD;
      if (latency < 1000) return ConnectionQuality.POOR;
      return ConnectionQuality.VERY_POOR;
    }
    
    // Solo velocidad de descarga
    if (downlink !== null) {
      if (downlink > 10) return ConnectionQuality.EXCELLENT;
      if (downlink > 5) return ConnectionQuality.GOOD;
      if (downlink > 1) return ConnectionQuality.POOR;
      return ConnectionQuality.VERY_POOR;
    }
    
    // Fallback: usar efectiveType si está disponible
    const connection = navigator.connection;
    if (connection?.effectiveType) {
      switch (connection.effectiveType) {
        case '4g': return ConnectionQuality.EXCELLENT;
        case '3g': return ConnectionQuality.GOOD;
        case '2g': return ConnectionQuality.POOR;
        case 'slow-2g': return ConnectionQuality.VERY_POOR;
        default: return ConnectionQuality.GOOD;
      }
    }
    
    return ConnectionQuality.GOOD;
  }, []);

  // Mide la latencia haciendo ping a un endpoint
  const measureLatency = useCallback(async (): Promise<number | null> => {
    try {
      const startTime = performance.now();
      
      // Hacer request a un endpoint liviano (favicon o API health check)
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);
      
      // Agregar a historial de latencias (mantener últimas 10)
      latencyTests.current.push(latency);
      if (latencyTests.current.length > 10) {
        latencyTests.current = latencyTests.current.slice(-10);
      }
      
      // Retornar promedio de últimas mediciones
      const avgLatency = latencyTests.current.reduce((a, b) => a + b, 0) / latencyTests.current.length;
      return Math.round(avgLatency);
      
    } catch (error) {
      console.warn('Failed to measure latency:', error);
      return null;
    }
  }, []);

  // Mide la velocidad de descarga aproximada
  const measureDownloadSpeed = useCallback(async (): Promise<number | null> => {
    try {
      // Cancelar test anterior si existe
      if (speedTestRef.current) {
        speedTestRef.current.abort();
      }
      
      speedTestRef.current = new AbortController();
      
      const startTime = performance.now();
      
      // Descargar un asset pequeño para estimar velocidad
      const response = await fetch('/favicon.ico', {
        signal: speedTestRef.current.signal,
        cache: 'no-cache',
      });
      
      const blob = await response.blob();
      const endTime = performance.now();
      
      const duration = (endTime - startTime) / 1000; // segundos
      const sizeInBits = blob.size * 8; // bits
      const speedMbps = (sizeInBits / duration) / (1024 * 1024); // Mbps
      
      return Math.max(speedMbps, 0.1); // Mínimo 0.1 Mbps
      
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.warn('Failed to measure download speed:', error);
      }
      return null;
    }
  }, []);

  // Actualiza el estado de la red
  const updateNetworkStatus = useCallback(async () => {
    const isOnline = navigator.onLine;
    const connection = navigator.connection;
    
    let latency: number | null = null;
    let downloadSpeed: number | null = null;
    
    if (isOnline) {
      // Medir latencia en paralelo
      const [measuredLatency, measuredSpeed] = await Promise.allSettled([
        measureLatency(),
        connection?.downlink ? Promise.resolve(connection.downlink) : measureDownloadSpeed()
      ]);
      
      latency = measuredLatency.status === 'fulfilled' ? measuredLatency.value : null;
      downloadSpeed = measuredSpeed.status === 'fulfilled' ? measuredSpeed.value : null;
    }
    
    const connectionType = detectConnectionType();
    const quality = calculateQuality(latency, downloadSpeed);
    
    setNetworkStatus({
      isOnline,
      connectionType,
      quality,
      latency,
      downloadSpeed,
      saveData: connection?.saveData ?? false,
      lastChecked: new Date(),
    });
  }, [detectConnectionType, calculateQuality, measureLatency, measureDownloadSpeed]);

  // Maneja cambios en el estado online/offline
  const handleOnlineStatusChange = useCallback(() => {
    updateNetworkStatus();
  }, [updateNetworkStatus]);

  // Maneja cambios en la conexión (si está soportado)
  const handleConnectionChange = useCallback(() => {
    updateNetworkStatus();
  }, [updateNetworkStatus]);

  // Efecto para configurar listeners
  useEffect(() => {
    // Listeners para online/offline
    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);
    
    // Listener para cambios de conexión (si está soportado)
    const connection = navigator.connection;
    if (connection && connection.addEventListener) {
      connection.addEventListener('change', handleConnectionChange);
    }
    
    // Medición inicial
    updateNetworkStatus();
    
    // Medición periódica cada 30 segundos
    const interval = setInterval(updateNetworkStatus, 30000);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
      
      if (connection && connection.removeEventListener) {
        connection.removeEventListener('change', handleConnectionChange);
      }
      
      clearInterval(interval);
      
      // Cancelar speed test en progreso
      if (speedTestRef.current) {
        speedTestRef.current.abort();
      }
    };
  }, [handleOnlineStatusChange, handleConnectionChange, updateNetworkStatus]);

  // Fuerza una actualización manual
  const refreshNetworkStatus = useCallback(() => {
    updateNetworkStatus();
  }, [updateNetworkStatus]);

  // Helpers para verificar estado
  const isOnline = networkStatus.isOnline;
  const isOffline = !networkStatus.isOnline;
  const hasGoodConnection = networkStatus.quality === ConnectionQuality.EXCELLENT || 
                           networkStatus.quality === ConnectionQuality.GOOD;
  const hasPoorConnection = networkStatus.quality === ConnectionQuality.POOR || 
                           networkStatus.quality === ConnectionQuality.VERY_POOR;
  const isSlowConnection = networkStatus.saveData || hasPoorConnection;

  // Información extendida si está disponible
  const getExtendedInfo = useCallback((): ExtendedNetworkInfo => {
    const connection = navigator.connection;
    return {
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
      saveData: connection?.saveData,
    };
  }, []);

  return {
    networkStatus,
    isOnline,
    isOffline,
    hasGoodConnection,
    hasPoorConnection,
    isSlowConnection,
    refreshNetworkStatus,
    getExtendedInfo,
  };
};

export default useNetworkStatus;