import React, { useState } from 'react';
import { useRetryQueue, QueueStatus } from '@/hooks/useRetryQueue';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import Button from '@/components/common/Button';
import { cn } from '@/utils/cn';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Pause, 
  Play, 
  Square, 
  RotateCcw,
  Wifi,
  WifiOff,
  Activity,
  BarChart3
} from 'lucide-react';

const RetryQueueTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  
  const {
    queue,
    status,
    isProcessing,
    stats,
    enqueue,
    pauseProcessing,
    resumeProcessing,
    stopProcessing,
    clearQueue,
    helpers,
  } = useRetryQueue();

  const { networkStatus, isOnline, hasGoodConnection } = useNetworkStatus();

  // Función que siempre falla para probar reintentos
  const failingOperation = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    throw new Error('Operación de prueba que siempre falla');
  };

  // Función que falla las primeras 2 veces
  let attemptCount = 0;
  const intermittentOperation = async () => {
    attemptCount++;
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (attemptCount <= 2) {
      throw new Error(`Intento ${attemptCount} falló`);
    }
    
    setTestResults(prev => [...prev, `✅ Operación exitosa después de ${attemptCount} intentos`]);
    attemptCount = 0; // Reset para próxima prueba
  };

  // Operación que simula una llamada a API
  const apiCallSimulation = async () => {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000));
    
    if (Math.random() < 0.3) { // 30% de probabilidad de fallo
      throw new Error('Error simulado de API');
    }
    
    setTestResults(prev => [...prev, '📡 Llamada a API exitosa']);
  };

  // Operación que simula Socket.IO
  const socketOpSimulation = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!isOnline) {
      throw new Error('Sin conexión para Socket.IO');
    }
    
    setTestResults(prev => [...prev, '🔌 Operación Socket.IO exitosa']);
  };

  const addTestOperations = () => {
    // Añadir operaciones de diferentes tipos y prioridades
    enqueue('Operación Crítica', intermittentOperation, {
      priority: 1,
      maxRetries: 5,
      context: 'test-critical'
    });

    helpers.apiCall('Test API Call', apiCallSimulation);
    helpers.socketOp('Test Socket Op', socketOpSimulation);
    helpers.dataSync('Test Data Sync', intermittentOperation);

    enqueue('Operación que Falla', failingOperation, {
      priority: 5,
      maxRetries: 2,
      context: 'test-failing'
    });

    setTestResults(prev => [...prev, '📋 5 operaciones añadidas a la cola']);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const getStatusIcon = () => {
    switch (status) {
      case QueueStatus.PROCESSING:
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
      case QueueStatus.PAUSED:
        return <Pause className="w-4 h-4 text-yellow-600" />;
      case QueueStatus.STOPPED:
        return <Square className="w-4 h-4 text-red-600" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'text-red-600 bg-red-50';
      case 2: return 'text-orange-600 bg-orange-50';
      case 3: return 'text-yellow-600 bg-yellow-50';
      case 4: return 'text-blue-600 bg-blue-50';
      case 5: return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Activity className="w-6 h-6" />
          Prueba de Cola de Reintentos
        </h2>

        {/* Estado de la red */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            {isOnline ? <Wifi className="w-4 h-4 text-green-600" /> : <WifiOff className="w-4 h-4 text-red-600" />}
            Estado de la Red
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Estado:</span>
              <span className={cn('ml-1', isOnline ? 'text-green-600' : 'text-red-600')}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div>
              <span className="font-medium">Calidad:</span>
              <span className="ml-1 capitalize">{networkStatus.quality}</span>
            </div>
            <div>
              <span className="font-medium">Latencia:</span>
              <span className="ml-1">{networkStatus.latency}ms</span>
            </div>
            <div>
              <span className="font-medium">Conexión Buena:</span>
              <span className={cn('ml-1', hasGoodConnection ? 'text-green-600' : 'text-orange-600')}>
                {hasGoodConnection ? 'Sí' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* Estadísticas de la cola */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Estadísticas
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Total:</span>
              <span className="ml-1">{stats.totalOperations}</span>
            </div>
            <div>
              <span className="font-medium">Pendientes:</span>
              <span className="ml-1">{stats.pendingOperations}</span>
            </div>
            <div>
              <span className="font-medium">Exitosas:</span>
              <span className="ml-1 text-green-600">{stats.successfulOperations}</span>
            </div>
            <div>
              <span className="font-medium">Fallidas:</span>
              <span className="ml-1 text-red-600">{stats.failedOperations}</span>
            </div>
            <div>
              <span className="font-medium">Tasa de Éxito:</span>
              <span className="ml-1">{stats.successRate}%</span>
            </div>
            <div>
              <span className="font-medium">Tiempo Promedio:</span>
              <span className="ml-1">{stats.averageRetryTime}ms</span>
            </div>
          </div>
        </div>

        {/* Estado de la cola */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            {getStatusIcon()}
            Estado: {status}
          </h3>
          <p className="text-sm text-gray-600">
            {isProcessing ? 'Procesando operaciones...' : 'En espera'}
          </p>
        </div>

        {/* Controles */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Button onClick={addTestOperations} variant="default">
            Añadir Operaciones de Prueba
          </Button>
          
          <Button 
            onClick={pauseProcessing} 
            variant="outline"
            disabled={status === QueueStatus.PAUSED || status === QueueStatus.STOPPED}
          >
            <Pause className="w-4 h-4 mr-1" />
            Pausar
          </Button>
          
          <Button 
            onClick={resumeProcessing} 
            variant="outline"
            disabled={status !== QueueStatus.PAUSED}
          >
            <Play className="w-4 h-4 mr-1" />
            Reanudar
          </Button>
          
          <Button 
            onClick={stopProcessing} 
            variant="outline"
            disabled={status === QueueStatus.STOPPED}
          >
            <Square className="w-4 h-4 mr-1" />
            Detener
          </Button>
          
          <Button onClick={clearQueue} variant="outline">
            <RotateCcw className="w-4 h-4 mr-1" />
            Limpiar Cola
          </Button>
          
          <Button onClick={clearResults} variant="outline">
            Limpiar Resultados
          </Button>
        </div>

        {/* Cola actual */}
        {queue.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Cola Actual ({queue.length} operaciones)</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {queue.map((operation, index) => (
                <div 
                  key={operation.id} 
                  className="p-3 bg-white border rounded-lg shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        getPriorityColor(operation.priority)
                      )}>
                        P{operation.priority}
                      </span>
                      <span className="font-medium">{operation.name}</span>
                      {operation.context && (
                        <span className="text-xs text-gray-500">({operation.context})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{operation.currentRetries}/{operation.maxRetries} intentos</span>
                      {operation.nextRetryAt && (
                        <Clock className="w-3 h-3" />
                      )}
                    </div>
                  </div>
                  {operation.nextRetryAt && (
                    <div className="mt-1 text-xs text-gray-500">
                      Próximo intento: {operation.nextRetryAt.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resultados */}
        {testResults.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Resultados de Prueba</h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm py-1 font-mono">
                  <span className="text-gray-500 mr-2">
                    {new Date().toLocaleTimeString()}
                  </span>
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RetryQueueTest;