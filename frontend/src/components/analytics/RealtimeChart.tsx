import React, { useState } from 'react';
import { RealtimeMetrics } from '../../services/analyticsApi';

interface RealtimeChartProps {
  data: RealtimeMetrics[];
}

type MetricType = 'activeUsers' | 'activeGames' | 'memoryUsage' | 'cpuUsage' | 'dbConnections' | 'socketConnections';

const metricConfig = {
  activeUsers: {
    label: 'Usuarios Activos',
    color: '#3B82F6',
    unit: '',
    format: (value: number) => value.toString()
  },
  activeGames: {
    label: 'Juegos Activos',
    color: '#10B981',
    unit: '',
    format: (value: number) => value.toString()
  },
  memoryUsage: {
    label: 'Uso de Memoria',
    color: '#F59E0B',
    unit: '%',
    format: (value: number) => `${value.toFixed(1)}%`
  },
  cpuUsage: {
    label: 'Uso de CPU',
    color: '#EF4444',
    unit: '%',
    format: (value: number) => `${value.toFixed(1)}%`
  },
  dbConnections: {
    label: 'Conexiones BD',
    color: '#8B5CF6',
    unit: '',
    format: (value: number) => value.toString()
  },
  socketConnections: {
    label: 'Conexiones Socket',
    color: '#06B6D4',
    unit: '',
    format: (value: number) => value.toString()
  }
};

export const RealtimeChart: React.FC<RealtimeChartProps> = ({ data }) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('activeUsers');
  
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No hay datos en tiempo real disponibles
      </div>
    );
  }

  const config = metricConfig[selectedMetric];
  const values = data.map(d => d[selectedMetric]);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = maxValue - minValue || 1;

  // Generate SVG path
  const pathData = data.map((point, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = ((maxValue - point[selectedMetric]) / range) * 70 + 15; // 70% height with 15% padding
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const currentValue = data[data.length - 1]?.[selectedMetric] || 0;

  return (
    <div className="space-y-4">
      {/* Metric Selector */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(metricConfig).map(([key, conf]) => (
          <button
            key={key}
            onClick={() => setSelectedMetric(key as MetricType)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedMetric === key
                ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {conf.label}
          </button>
        ))}
      </div>

      {/* Current Value Display */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium" style={{ color: config.color }}>
          {config.label}
        </h4>
        <div className="text-right">
          <div className="text-2xl font-bold" style={{ color: config.color }}>
            {config.format(currentValue)}
          </div>
          <div className="text-sm text-gray-500">
            Valor actual
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-64 bg-gray-50 rounded-lg p-4">
        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          <defs>
            <pattern id="realtimeGrid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#realtimeGrid)" />
          
          {/* Area under curve */}
          <path
            d={`${pathData} L 100 85 L 0 85 Z`}
            fill={config.color}
            fillOpacity="0.2"
          />
          
          {/* Main line */}
          <path
            d={pathData}
            fill="none"
            stroke={config.color}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          
          {/* Data points */}
          {data.map((point, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = ((maxValue - point[selectedMetric]) / range) * 70 + 15;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="1"
                fill={config.color}
                className="hover:r-2 transition-all cursor-pointer"
              >
                <title>
                  {new Date(point.timestamp).toLocaleTimeString('es-ES')}: {config.format(point[selectedMetric])}
                </title>
              </circle>
            );
          })}
        </svg>
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 -ml-12">
          <span>{config.format(maxValue)}</span>
          <span>{config.format(minValue)}</span>
        </div>
      </div>

      {/* Time range */}
      <div className="flex justify-between text-xs text-gray-500">
        <span>
          {new Date(data[0].timestamp).toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
        <span>Tiempo</span>
        <span>
          {new Date(data[data.length - 1].timestamp).toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-4 text-center text-sm">
        <div>
          <div className="font-medium text-gray-900">{config.format(maxValue)}</div>
          <div className="text-gray-500">Máximo</div>
        </div>
        <div>
          <div className="font-medium text-gray-900">
            {config.format(values.reduce((a, b) => a + b, 0) / values.length)}
          </div>
          <div className="text-gray-500">Promedio</div>
        </div>
        <div>
          <div className="font-medium text-gray-900">{config.format(minValue)}</div>
          <div className="text-gray-500">Mínimo</div>
        </div>
      </div>
    </div>
  );
};