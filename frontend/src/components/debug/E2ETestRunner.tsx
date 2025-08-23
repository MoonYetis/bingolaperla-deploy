import React, { useState, useCallback, useRef } from 'react';
import { cn } from '@/utils/cn';
import Button from '@/components/common/Button';
import { 
  Play, 
  Pause, 
  Square, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Monitor,
  Smartphone,
  Tablet,
  AlertTriangle,
  BarChart3,
  RefreshCw
} from 'lucide-react';

interface TestStep {
  id: string;
  name: string;
  description: string;
  duration?: number;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  error?: string;
  metrics?: Record<string, any>;
}

interface TestSuite {
  id: string;
  name: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  steps: TestStep[];
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  duration?: number;
}

const E2ETestRunner: React.FC = () => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([
    {
      id: 'auth',
      name: 'Autenticación',
      description: 'Flujo completo de registro y login',
      priority: 'high',
      status: 'pending',
      steps: [
        { id: 'navigate-register', name: 'Navegar a registro', description: 'Ir a página de registro', status: 'pending' },
        { id: 'fill-form', name: 'Llenar formulario', description: 'Completar datos de registro', status: 'pending' },
        { id: 'submit-register', name: 'Registrar usuario', description: 'Enviar formulario de registro', status: 'pending' },
        { id: 'verify-redirect', name: 'Verificar redirección', description: 'Confirmar redirección al dashboard', status: 'pending' },
        { id: 'logout-test', name: 'Logout', description: 'Cerrar sesión', status: 'pending' },
        { id: 'login-test', name: 'Login', description: 'Iniciar sesión con credenciales', status: 'pending' },
      ]
    },
    {
      id: 'dashboard',
      name: 'Dashboard',
      description: 'Funcionalidad del dashboard de usuario',
      priority: 'high',
      status: 'pending',
      steps: [
        { id: 'load-stats', name: 'Cargar estadísticas', description: 'Verificar carga de datos del dashboard', status: 'pending' },
        { id: 'navigate-cards', name: 'Ir a cartones', description: 'Navegar a selección de cartones', status: 'pending' },
        { id: 'back-dashboard', name: 'Volver al dashboard', description: 'Regresar al dashboard', status: 'pending' },
      ]
    },
    {
      id: 'cards',
      name: 'Selección de Cartones',
      description: 'Generación y selección de cartones únicos',
      priority: 'high',
      status: 'pending',
      steps: [
        { id: 'generate-1', name: 'Generar 1 cartón', description: 'Crear un cartón único', status: 'pending' },
        { id: 'generate-4', name: 'Generar 4 cartones', description: 'Crear múltiples cartones únicos', status: 'pending' },
        { id: 'validate-unique', name: 'Validar unicidad', description: 'Verificar que cartones son únicos', status: 'pending' },
        { id: 'proceed-game', name: 'Ir al juego', description: 'Proceder al juego con cartones', status: 'pending' },
      ]
    },
    {
      id: 'socket',
      name: 'Socket.IO',
      description: 'Comunicación en tiempo real',
      priority: 'high',
      status: 'pending',
      steps: [
        { id: 'connect-socket', name: 'Conectar Socket', description: 'Establecer conexión Socket.IO', status: 'pending' },
        { id: 'join-room', name: 'Unirse a sala', description: 'Unirse a sala de juego', status: 'pending' },
        { id: 'simulate-disconnect', name: 'Simular desconexión', description: 'Probar pérdida de conexión', status: 'pending' },
        { id: 'test-reconnect', name: 'Probar reconexión', description: 'Verificar reconexión automática', status: 'pending' },
      ]
    },
    {
      id: 'gameplay',
      name: 'Juego en Tiempo Real',
      description: 'Funcionalidad completa del juego',
      priority: 'high',
      status: 'pending',
      steps: [
        { id: 'start-demo', name: 'Iniciar demo', description: 'Comenzar sorteo automático', status: 'pending' },
        { id: 'verify-balls', name: 'Verificar sorteo', description: 'Confirmar sorteo de bolas', status: 'pending' },
        { id: 'verify-marking', name: 'Verificar marcado', description: 'Confirmar marcado automático', status: 'pending' },
        { id: 'detect-patterns', name: 'Detectar patrones', description: 'Verificar detección de líneas', status: 'pending' },
        { id: 'complete-bingo', name: 'BINGO completo', description: 'Completar cartón para BINGO', status: 'pending' },
      ]
    },
    {
      id: 'errors',
      name: 'Sistema de Errores',
      description: 'Resilencia y manejo de errores',
      priority: 'medium',
      status: 'pending',
      steps: [
        { id: 'test-network-error', name: 'Error de red', description: 'Simular pérdida de conexión', status: 'pending' },
        { id: 'test-retry-queue', name: 'Cola de reintentos', description: 'Verificar reintentos automáticos', status: 'pending' },
        { id: 'test-recovery', name: 'Recuperación', description: 'Verificar recuperación automática', status: 'pending' },
      ]
    },
    {
      id: 'performance',
      name: 'Rendimiento',
      description: 'Performance con múltiples cartones',
      priority: 'medium',
      status: 'pending',
      steps: [
        { id: 'load-4-cards', name: 'Cargar 4 cartones', description: 'Probar con carga máxima', status: 'pending' },
        { id: 'measure-memory', name: 'Medir memoria', description: 'Monitorear uso de memoria', status: 'pending' },
        { id: 'measure-cpu', name: 'Medir CPU', description: 'Monitorear uso de CPU', status: 'pending' },
      ]
    },
    {
      id: 'responsive',
      name: 'Responsive Design',
      description: 'Experiencia en múltiples dispositivos',
      priority: 'low',
      status: 'pending',
      steps: [
        { id: 'desktop-test', name: 'Desktop', description: 'Probar en resolución de escritorio', status: 'pending' },
        { id: 'tablet-test', name: 'Tablet', description: 'Probar en resolución tablet', status: 'pending' },
        { id: 'mobile-test', name: 'Mobile', description: 'Probar en resolución móvil', status: 'pending' },
      ]
    },
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [currentSuite, setCurrentSuite] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [results, setResults] = useState<string[]>([]);
  const [metrics, setMetrics] = useState({
    totalDuration: 0,
    passedTests: 0,
    failedTests: 0,
    overallScore: 0,
  });

  const abortController = useRef<AbortController | null>(null);

  const addResult = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setResults(prev => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  const updateTestStep = useCallback((suiteId: string, stepId: string, updates: Partial<TestStep>) => {
    setTestSuites(prev => prev.map(suite => 
      suite.id === suiteId 
        ? {
            ...suite,
            steps: suite.steps.map(step => 
              step.id === stepId ? { ...step, ...updates } : step
            )
          }
        : suite
    ));
  }, []);

  const updateTestSuite = useCallback((suiteId: string, updates: Partial<TestSuite>) => {
    setTestSuites(prev => prev.map(suite => 
      suite.id === suiteId ? { ...suite, ...updates } : suite
    ));
  }, []);

  // Simulación de ejecución de test individual
  const runTestStep = useCallback(async (suiteId: string, step: TestStep): Promise<boolean> => {
    updateTestStep(suiteId, step.id, { status: 'running' });
    setCurrentStep(step.id);
    
    addResult(`🔄 Ejecutando: ${step.name}`);
    
    const startTime = Date.now();
    
    try {
      // Simular tiempo de ejecución variable
      const executionTime = Math.random() * 2000 + 500; // 0.5-2.5 segundos
      await new Promise(resolve => setTimeout(resolve, executionTime));
      
      // Simular tasa de éxito del 90%
      const success = Math.random() > 0.1;
      
      const duration = Date.now() - startTime;
      
      if (success) {
        updateTestStep(suiteId, step.id, { 
          status: 'passed', 
          duration,
          metrics: { executionTime: duration }
        });
        addResult(`✅ ${step.name} - PASSED (${duration}ms)`);
        return true;
      } else {
        const error = `Simulación de error en ${step.name}`;
        updateTestStep(suiteId, step.id, { 
          status: 'failed', 
          duration,
          error 
        });
        addResult(`❌ ${step.name} - FAILED: ${error}`);
        return false;
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTestStep(suiteId, step.id, { 
        status: 'failed', 
        duration,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      addResult(`❌ ${step.name} - ERROR: ${error}`);
      return false;
    }
  }, [updateTestStep, addResult]);

  // Ejecutar suite completa
  const runTestSuite = useCallback(async (suite: TestSuite): Promise<void> => {
    if (!isRunning) return;
    
    setCurrentSuite(suite.id);
    updateTestSuite(suite.id, { status: 'running' });
    
    addResult(`📋 Iniciando suite: ${suite.name}`);
    
    const startTime = Date.now();
    let passedSteps = 0;
    
    for (const step of suite.steps) {
      if (!isRunning || abortController.current?.signal.aborted) {
        updateTestSuite(suite.id, { status: 'skipped' });
        return;
      }
      
      const success = await runTestStep(suite.id, step);
      if (success) passedSteps++;
    }
    
    const duration = Date.now() - startTime;
    const success = passedSteps === suite.steps.length;
    
    updateTestSuite(suite.id, { 
      status: success ? 'passed' : 'failed',
      duration 
    });
    
    addResult(`${success ? '✅' : '❌'} Suite ${suite.name} - ${success ? 'PASSED' : 'FAILED'} (${passedSteps}/${suite.steps.length} pasos)`);
    
    setCurrentSuite(null);
    setCurrentStep(null);
  }, [isRunning, updateTestSuite, addResult, runTestStep]);

  // Ejecutar todos los tests
  const runAllTests = useCallback(async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    abortController.current = new AbortController();
    setResults([]);
    
    addResult('🚀 Iniciando ejecución completa de tests E2E');
    
    const startTime = Date.now();
    let totalPassed = 0;
    let totalFailed = 0;
    
    // Ejecutar suites de alta prioridad primero
    const highPriority = testSuites.filter(s => s.priority === 'high');
    const mediumPriority = testSuites.filter(s => s.priority === 'medium');
    const lowPriority = testSuites.filter(s => s.priority === 'low');
    
    for (const suite of [...highPriority, ...mediumPriority, ...lowPriority]) {
      if (!isRunning || abortController.current?.signal.aborted) break;
      
      await runTestSuite(suite);
      
      const suiteResults = suite.steps.filter(s => s.status === 'passed').length;
      const suiteFailed = suite.steps.filter(s => s.status === 'failed').length;
      
      totalPassed += suiteResults;
      totalFailed += suiteFailed;
    }
    
    const totalDuration = Date.now() - startTime;
    const overallScore = totalPassed / (totalPassed + totalFailed) * 100;
    
    setMetrics({
      totalDuration,
      passedTests: totalPassed,
      failedTests: totalFailed,
      overallScore: Math.round(overallScore * 100) / 100
    });
    
    addResult(`🏁 Tests completados en ${Math.round(totalDuration / 1000)}s - Score: ${overallScore.toFixed(1)}%`);
    
    setIsRunning(false);
    setCurrentSuite(null);
    setCurrentStep(null);
  }, [isRunning, testSuites, addResult, runTestSuite]);

  const stopTests = useCallback(() => {
    setIsRunning(false);
    abortController.current?.abort();
    addResult('⏹️ Tests detenidos por el usuario');
  }, [addResult]);

  const resetTests = useCallback(() => {
    setIsRunning(false);
    setCurrentSuite(null);
    setCurrentStep(null);
    setResults([]);
    setMetrics({ totalDuration: 0, passedTests: 0, failedTests: 0, overallScore: 0 });
    
    setTestSuites(prev => prev.map(suite => ({
      ...suite,
      status: 'pending',
      duration: undefined,
      steps: suite.steps.map(step => ({
        ...step,
        status: 'pending',
        duration: undefined,
        error: undefined,
        metrics: undefined
      }))
    })));
    
    addResult('🔄 Tests reiniciados');
  }, [addResult]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Clock className="w-4 h-4 animate-spin text-blue-600" />;
      case 'passed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'skipped': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default: return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          Test Runner E2E - Bingo La Perla
        </h2>

        {/* Controles principales */}
        <div className="mb-6 flex gap-3">
          <Button 
            onClick={runAllTests} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Ejecutar Todos los Tests
          </Button>
          
          <Button 
            onClick={stopTests} 
            disabled={!isRunning}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Square className="w-4 h-4" />
            Detener
          </Button>
          
          <Button 
            onClick={resetTests} 
            disabled={isRunning}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reiniciar
          </Button>
        </div>

        {/* Métricas generales */}
        {metrics.overallScore > 0 && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Resultados Generales</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Score Total:</span>
                <span className={cn('ml-1 font-bold', metrics.overallScore >= 90 ? 'text-green-600' : metrics.overallScore >= 70 ? 'text-yellow-600' : 'text-red-600')}>
                  {metrics.overallScore}%
                </span>
              </div>
              <div>
                <span className="font-medium">Pasaron:</span>
                <span className="ml-1 text-green-600">{metrics.passedTests}</span>
              </div>
              <div>
                <span className="font-medium">Fallaron:</span>
                <span className="ml-1 text-red-600">{metrics.failedTests}</span>
              </div>
              <div>
                <span className="font-medium">Duración:</span>
                <span className="ml-1">{Math.round(metrics.totalDuration / 1000)}s</span>
              </div>
            </div>
          </div>
        )}

        {/* Lista de test suites */}
        <div className="space-y-4 mb-6">
          {testSuites.map((suite) => (
            <div key={suite.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getStatusIcon(suite.status)}
                  <div>
                    <h3 className="font-semibold">{suite.name}</h3>
                    <p className="text-sm text-gray-600">{suite.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('px-2 py-1 rounded text-xs font-medium border', getPriorityColor(suite.priority))}>
                    {suite.priority.toUpperCase()}
                  </span>
                  {suite.duration && (
                    <span className="text-xs text-gray-500">{Math.round(suite.duration / 1000)}s</span>
                  )}
                </div>
              </div>
              
              {/* Pasos del test */}
              <div className="grid gap-2">
                {suite.steps.map((step) => (
                  <div 
                    key={step.id} 
                    className={cn(
                      'flex items-center justify-between p-2 rounded border',
                      currentSuite === suite.id && currentStep === step.id ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(step.status)}
                      <span className="text-sm">{step.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {step.duration && <span>{step.duration}ms</span>}
                      {step.error && <span className="text-red-600" title={step.error}>⚠️</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Log de resultados */}
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg">
          <h3 className="font-semibold mb-2 text-white">Log de Ejecución</h3>
          <div className="h-64 overflow-y-auto font-mono text-sm">
            {results.length === 0 ? (
              <div className="text-gray-500">Presiona "Ejecutar Todos los Tests" para comenzar...</div>
            ) : (
              results.map((result, index) => (
                <div key={index} className="mb-1">{result}</div>
              ))
            )}
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2 text-blue-900">ℹ️ Información</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• Este test runner simula la ejecución de tests E2E reales</p>
            <p>• Los tests verifican funcionalidad crítica del sistema</p>
            <p>• Tasa de éxito simulada: ~90% (configurable para testing)</p>
            <p>• Para tests reales, integrar con Playwright o Cypress</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default E2ETestRunner;