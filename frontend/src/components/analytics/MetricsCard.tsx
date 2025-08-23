import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: number; // percentage change
  color: 'blue' | 'green' | 'emerald' | 'purple' | 'red' | 'yellow';
  invertTrend?: boolean; // for metrics where lower is better (like response time)
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    accent: 'border-blue-200'
  },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    accent: 'border-green-200'
  },
  emerald: {
    bg: 'bg-emerald-50',
    icon: 'text-emerald-600',
    accent: 'border-emerald-200'
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    accent: 'border-purple-200'
  },
  red: {
    bg: 'bg-red-50',
    icon: 'text-red-600',
    accent: 'border-red-200'
  },
  yellow: {
    bg: 'bg-yellow-50',
    icon: 'text-yellow-600',
    accent: 'border-yellow-200'
  }
};

export const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color,
  invertTrend = false
}) => {
  const colorClass = colorClasses[color];
  
  const getTrendColor = (trendValue: number) => {
    if (invertTrend) {
      return trendValue < 0 ? 'text-green-600' : 'text-red-600';
    }
    return trendValue > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getTrendIcon = (trendValue: number) => {
    if (invertTrend) {
      return trendValue < 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />;
    }
    return trendValue > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow border-l-4 ${colorClass.accent} hover:shadow-lg transition-shadow`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {typeof value === 'number' ? value.toLocaleString('es-ES') : value}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">
              {subtitle}
            </p>
          )}
          
          {trend !== undefined && (
            <div className={`flex items-center mt-2 ${getTrendColor(trend)}`}>
              {getTrendIcon(trend)}
              <span className="text-sm font-medium ml-1">
                {Math.abs(trend).toFixed(1)}%
              </span>
              <span className="text-xs text-gray-500 ml-2">
                vs período anterior
              </span>
            </div>
          )}
        </div>
        
        <div className={`p-3 rounded-full ${colorClass.bg} ${colorClass.icon}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};