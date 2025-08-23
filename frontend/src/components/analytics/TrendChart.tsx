import React from 'react';
import { TrendData } from '../../services/analyticsApi';

interface TrendChartProps {
  data: TrendData[];
  color: string;
  label: string;
  formatValue?: (value: number) => string;
  height?: number;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  color,
  label,
  formatValue = (value) => value.toString(),
  height = 200
}) => {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        No hay datos disponibles
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  // Generate SVG path for the trend line
  const pathData = data.map((point, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = ((maxValue - point.value) / range) * 80 + 10; // 80% of height with 10% padding
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Generate points for hover
  const points = data.map((point, index) => ({
    x: (index / (data.length - 1)) * 100,
    y: ((maxValue - point.value) / range) * 80 + 10,
    value: point.value,
    date: point.date
  }));

  return (
    <div className="w-full">
      {/* Chart */}
      <div className="relative" style={{ height: `${height}px` }}>
        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="#f3f4f6"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
          
          {/* Area under the curve */}
          <path
            d={`${pathData} L 100 90 L 0 90 Z`}
            fill={color}
            fillOpacity="0.1"
          />
          
          {/* Trend line */}
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          
          {/* Data points */}
          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="1.5"
              fill={color}
              className="cursor-pointer hover:r-2 transition-all"
            >
              <title>
                {new Date(point.date).toLocaleDateString('es-ES')}: {formatValue(point.value)}
              </title>
            </circle>
          ))}
        </svg>
        
        {/* Overlay for better interactivity */}
        <div className="absolute inset-0 flex items-end justify-between px-2 pb-2">
          {data.map((point, index) => (
            <div
              key={index}
              className="group relative cursor-pointer"
              style={{ width: `${100 / data.length}%` }}
            >
              {/* Invisible hover area */}
              <div className="h-full w-full"></div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                  <div className="font-medium">{formatValue(point.value)}</div>
                  <div className="text-gray-300">
                    {new Date(point.date).toLocaleDateString('es-ES')}
                  </div>
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>{new Date(data[0].date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}</span>
        <span>{new Date(data[Math.floor(data.length / 2)].date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}</span>
        <span>{new Date(data[data.length - 1].date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}</span>
      </div>
      
      {/* Y-axis range */}
      <div className="flex justify-between mt-1 text-xs text-gray-400">
        <span>Min: {formatValue(minValue)}</span>
        <span>Max: {formatValue(maxValue)}</span>
      </div>
    </div>
  );
};