import React from 'react';
import { BingoKPIs } from '../../services/analyticsApi';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  Gamepad2, 
  DollarSign, 
  Repeat, 
  Share2, 
  Activity,
  Zap,
  AlertTriangle
} from 'lucide-react';

interface KPIGridProps {
  kpis: BingoKPIs;
}

interface KPIItemProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  status: 'good' | 'warning' | 'critical';
}

const KPIItem: React.FC<KPIItemProps> = ({ title, value, subtitle, icon, trend, status }) => {
  const statusColors = {
    good: 'border-green-200 bg-green-50',
    warning: 'border-yellow-200 bg-yellow-50',
    critical: 'border-red-200 bg-red-50'
  };

  const statusTextColors = {
    good: 'text-green-800',
    warning: 'text-yellow-800',
    critical: 'text-red-800'
  };

  const statusIconColors = {
    good: 'text-green-600',
    warning: 'text-yellow-600',
    critical: 'text-red-600'
  };

  return (
    <div className={`p-4 rounded-lg border ${statusColors[status]} hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg bg-white ${statusIconColors[status]}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            trend.startsWith('+') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {trend}
          </span>
        )}
      </div>
      
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className={`text-xl font-bold ${statusTextColors[status]}`}>{value}</p>
      
      {subtitle && (
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
};

export const KPIGrid: React.FC<KPIGridProps> = ({ kpis }) => {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const getStatus = (value: number, goodThreshold: number, warningThreshold: number): 'good' | 'warning' | 'critical' => {
    if (value >= goodThreshold) return 'good';
    if (value >= warningThreshold) return 'warning';
    return 'critical';
  };

  const getUptimeStatus = (uptime: number): 'good' | 'warning' | 'critical' => {
    if (uptime >= 99.5) return 'good';
    if (uptime >= 95) return 'warning';
    return 'critical';
  };

  const getLatencyStatus = (latency: number): 'good' | 'warning' | 'critical' => {
    if (latency <= 200) return 'good';
    if (latency <= 500) return 'warning';
    return 'critical';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {/* User Metrics */}
      <KPIItem
        title="Usuarios Activos Diarios"
        value={kpis.dailyActiveUsers.toLocaleString()}
        icon={<Users className="h-5 w-5" />}
        trend={kpis.trendIndicators.usersGrowth}
        status={getStatus(kpis.dailyActiveUsers, 100, 50)}
      />

      <KPIItem
        title="Tasa de Conversión"
        value={formatPercentage(kpis.conversionRate)}
        subtitle="Usuarios que compran cartones"
        icon={<TrendingUp className="h-5 w-5" />}
        status={getStatus(kpis.conversionRate, 15, 10)}
      />

      <KPIItem
        title="Duración de Sesión"
        value={`${kpis.averageSessionDuration} min`}
        subtitle="Promedio por usuario"
        icon={<Clock className="h-5 w-5" />}
        status={getStatus(kpis.averageSessionDuration, 20, 10)}
      />

      <KPIItem
        title="Retención de Usuarios"
        value={formatPercentage(kpis.userRetentionRate)}
        subtitle="Usuarios que regresan"
        icon={<Repeat className="h-5 w-5" />}
        status={getStatus(kpis.userRetentionRate, 70, 50)}
      />

      {/* Game Metrics */}
      <KPIItem
        title="Juegos por Día"
        value={kpis.gamesPerDay.toString()}
        icon={<Gamepad2 className="h-5 w-5" />}
        status={getStatus(kpis.gamesPerDay, 10, 5)}
      />

      <KPIItem
        title="Jugadores por Juego"
        value={kpis.averagePlayersPerGame.toFixed(1)}
        subtitle="Promedio"
        icon={<Users className="h-5 w-5" />}
        status={getStatus(kpis.averagePlayersPerGame, 15, 8)}
      />

      <KPIItem
        title="Cartones por Juego"
        value={kpis.cardsSoldPerGame.toFixed(1)}
        subtitle="Promedio vendidos"
        icon={<Gamepad2 className="h-5 w-5" />}
        status={getStatus(kpis.cardsSoldPerGame, 20, 10)}
      />

      {/* Revenue Metrics */}
      <KPIItem
        title="Ingresos Diarios"
        value={formatCurrency(kpis.dailyRevenue)}
        icon={<DollarSign className="h-5 w-5" />}
        trend={kpis.trendIndicators.revenueGrowth}
        status={getStatus(kpis.dailyRevenue, 500, 200)}
      />

      <KPIItem
        title="ARPU"
        value={formatCurrency(kpis.arpu)}
        subtitle="Ingreso promedio por usuario"
        icon={<DollarSign className="h-5 w-5" />}
        status={getStatus(kpis.arpu, 25, 10)}
      />

      <KPIItem
        title="Ingresos Mensuales"
        value={formatCurrency(kpis.monthlyRevenue)}
        icon={<TrendingUp className="h-5 w-5" />}
        status={getStatus(kpis.monthlyRevenue, 10000, 5000)}
      />

      {/* Engagement Metrics */}
      <KPIItem
        title="Jugadores Repetidos"
        value={formatPercentage(kpis.repeatPlayerRate)}
        subtitle="Juegan múltiples veces"
        icon={<Repeat className="h-5 w-5" />}
        status={getStatus(kpis.repeatPlayerRate, 60, 40)}
      />

      <KPIItem
        title="Tasa de Compartido"
        value={formatPercentage(kpis.socialSharingRate)}
        subtitle="Usuarios que comparten"
        icon={<Share2 className="h-5 w-5" />}
        status={getStatus(kpis.socialSharingRate, 20, 10)}
      />

      {/* Technical Metrics */}
      <KPIItem
        title="Uptime del Sistema"
        value={formatPercentage(kpis.systemUptime)}
        icon={<Activity className="h-5 w-5" />}
        status={getUptimeStatus(kpis.systemUptime)}
      />

      <KPIItem
        title="Latencia Promedio"
        value={`${kpis.averageLatency}ms`}
        icon={<Zap className="h-5 w-5" />}
        status={getLatencyStatus(kpis.averageLatency)}
      />

      <KPIItem
        title="Tasa de Error"
        value={formatPercentage(kpis.errorRate)}
        icon={<AlertTriangle className="h-5 w-5" />}
        status={kpis.errorRate <= 0.5 ? 'good' : kpis.errorRate <= 2 ? 'warning' : 'critical'}
      />
    </div>
  );
};