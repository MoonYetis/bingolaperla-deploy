import React, { useState, useEffect } from 'react';
import { analyticsApi, DashboardData, BingoKPIs } from '../../services/analyticsApi';
import { MetricsCard } from './MetricsCard';
import { TrendChart } from './TrendChart';
import { RealtimeChart } from './RealtimeChart';
import { KPIGrid } from './KPIGrid';
import { ExportButton } from './ExportButton';
import { RefreshButton } from './RefreshButton';
import { DateRangePicker } from './DateRangePicker';
import { Users, Gamepad2, DollarSign, Activity, TrendingUp, AlertTriangle } from 'lucide-react';

interface AdminDashboardProps {
  refreshInterval?: number; // in milliseconds
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  refreshInterval = 30000 // 30 seconds default
}) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [kpis, setKPIs] = useState<BingoKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Cargar datos del dashboard
  const loadDashboardData = async () => {
    try {
      setError(null);
      const [dashboardResponse, kpisResponse] = await Promise.all([
        analyticsApi.getDashboard(),
        analyticsApi.getBingoKPIs()
      ]);
      
      setDashboardData(dashboardResponse);
      setKPIs(kpisResponse);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Error al cargar datos del dashboard');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Efecto para carga inicial y auto-refresh
  useEffect(() => {
    loadDashboardData();

    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadDashboardData, refreshInterval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval]);

  // Exportar datos del dashboard
  const handleExport = () => {
    if (!dashboardData || !kpis) return;

    const exportData = {
      businessMetrics: dashboardData.businessMetrics,
      kpis,
      exportedAt: new Date().toISOString()
    };

    analyticsApi.exportToCSV([exportData], 'bingo_dashboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData || !kpis) {
    return <div>No hay datos disponibles</div>;
  }

  const { businessMetrics, realtimeMetrics, trends } = dashboardData;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              📊 Analytics Dashboard - Bingo La Perla
            </h1>
            <p className="text-gray-600 mt-1">
              Última actualización: {lastUpdated.toLocaleString('es-ES')}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-600">Auto-refresh</span>
            </label>
            
            <RefreshButton onRefresh={loadDashboardData} />
            <ExportButton onExport={handleExport} />
          </div>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">🎯 KPIs Principales</h2>
        <KPIGrid kpis={kpis} />
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricsCard
          title="Usuarios Activos"
          value={businessMetrics.activeUsers}
          subtitle={`${businessMetrics.newUsersToday} nuevos hoy`}
          icon={<Users className="h-6 w-6" />}
          trend={+15} // Would be calculated from trends
          color="blue"
        />
        
        <MetricsCard
          title="Juegos Activos"
          value={businessMetrics.activeGames}
          subtitle={`${businessMetrics.gamesCompletedToday} completados hoy`}
          icon={<Gamepad2 className="h-6 w-6" />}
          trend={+8}
          color="green"
        />
        
        <MetricsCard
          title="Ingresos Hoy"
          value={analyticsApi.formatCurrency(businessMetrics.revenueToday)}
          subtitle={`ARPU: ${analyticsApi.formatCurrency(businessMetrics.averageRevenuePerUser)}`}
          icon={<DollarSign className="h-6 w-6" />}
          trend={+12}
          color="emerald"
        />
        
        <MetricsCard
          title="Performance"
          value={`${businessMetrics.averageResponseTime}ms`}
          subtitle={`Uptime: ${analyticsApi.formatPercentage((businessMetrics.serverUptime / 86400) * 100)}`}
          icon={<Activity className="h-6 w-6" />}
          trend={-5} // Negative is good for response time
          color="purple"
          invertTrend={true}
        />
      </div>

      {/* Gráficos de Tendencias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Tendencia de Usuarios (7 días)
          </h3>
          <TrendChart
            data={trends.users}
            color="#3B82F6"
            label="Nuevos Usuarios"
          />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Tendencia de Ingresos (7 días)
          </h3>
          <TrendChart
            data={trends.revenue.map(item => ({
              ...item,
              value: item.value / 100 // Convert cents to euros
            }))}
            color="#10B981"
            label="Ingresos"
            formatValue={(value) => analyticsApi.formatCurrency(value)}
          />
        </div>
      </div>

      {/* Métricas en Tiempo Real */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          Métricas en Tiempo Real (Últimas 24h)
        </h3>
        <RealtimeChart data={realtimeMetrics} />
      </div>

      {/* Estadísticas Adicionales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Engagement Stats */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">📱 Engagement</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Retención:</span>
              <span className="font-medium">
                {analyticsApi.formatPercentage(kpis.userRetentionRate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Jugadores Repetidos:</span>
              <span className="font-medium">
                {analyticsApi.formatPercentage(kpis.repeatPlayerRate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tasa de Conversión:</span>
              <span className="font-medium">
                {analyticsApi.formatPercentage(kpis.conversionRate)}
              </span>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">🏥 Salud del Sistema</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Uptime:</span>
              <span className="font-medium text-green-600">
                {analyticsApi.formatPercentage(kpis.systemUptime)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Latencia Promedio:</span>
              <span className="font-medium">
                {kpis.averageLatency}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tasa de Error:</span>
              <span className={`font-medium ${kpis.errorRate < 1 ? 'text-green-600' : 'text-red-600'}`}>
                {analyticsApi.formatPercentage(kpis.errorRate)}
              </span>
            </div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">💰 Desglose de Ingresos</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Diario:</span>
              <span className="font-medium text-green-600">
                {analyticsApi.formatCurrency(kpis.dailyRevenue)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Semanal:</span>
              <span className="font-medium">
                {analyticsApi.formatCurrency(kpis.weeklyRevenue)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Mensual:</span>
              <span className="font-medium">
                {analyticsApi.formatCurrency(kpis.monthlyRevenue)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Growth Indicators */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">📈 Indicadores de Crecimiento</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {kpis.trendIndicators.usersGrowth}
            </div>
            <div className="text-gray-600">Crecimiento de Usuarios</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {kpis.trendIndicators.revenueGrowth}
            </div>
            <div className="text-gray-600">Crecimiento de Ingresos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {kpis.trendIndicators.engagementGrowth}
            </div>
            <div className="text-gray-600">Crecimiento de Engagement</div>
          </div>
        </div>
      </div>
    </div>
  );
};