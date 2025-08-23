/**
 * Unified Balance Display Component
 * Single component for consistent balance display across the app
 */

import React, { memo } from 'react';
import { useBalance } from '@/hooks/useBalance';
import { formatBalance } from '@/utils/balance';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface BalanceDisplayProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCurrency?: boolean;
  showSource?: boolean;
  showRefresh?: boolean;
  variant?: 'default' | 'card' | 'inline' | 'minimal';
  testId?: string;
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-2xl',
  xl: 'text-4xl'
};

const BalanceDisplay = memo<BalanceDisplayProps>(({
  className = '',
  size = 'md',
  showCurrency = true,
  showSource = false,
  showRefresh = false,
  variant = 'default',
  testId = 'balance-display'
}) => {
  const {
    balance,
    isLoading,
    error,
    source,
    lastSync,
    inconsistencyDetected,
    refreshBalance
  } = useBalance();

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`} data-testid={`${testId}-loading`}>
        <LoadingSpinner size="sm" />
        <span className="text-gray-400">Cargando...</span>
      </div>
    );
  }

  if (error && variant !== 'minimal') {
    return (
      <div className={`text-red-500 text-sm ${className}`} data-testid={`${testId}-error`}>
        ⚠️ {error}
        {showRefresh && (
          <button
            onClick={refreshBalance}
            className="ml-2 text-red-400 hover:text-red-600 underline"
          >
            Reintentar
          </button>
        )}
      </div>
    );
  }

  const renderBalance = () => (
    <span className={`font-bold ${sizeClasses[size]}`} data-testid={`${testId}-amount`}>
      {formatBalance(balance)}
      {showCurrency && (
        <span className={`${size === 'xl' ? 'text-lg' : 'text-sm'} font-normal ml-1 text-opacity-70`}>
          Perlas
        </span>
      )}
    </span>
  );

  const renderRefreshButton = () => showRefresh && (
    <button
      onClick={refreshBalance}
      className="ml-2 text-gray-400 hover:text-gray-600 hover:rotate-180 transition-all duration-300"
      title={`Última actualización: ${lastSync?.toLocaleTimeString() || 'Nunca'}`}
      data-testid={`${testId}-refresh`}
    >
      🔄
    </button>
  );

  const renderSourceIndicator = () => showSource && (
    <div className={`text-xs mt-1 flex items-center space-x-2`}>
      <span className={`
        px-2 py-1 rounded-full text-white
        ${source === 'redux' ? 'bg-blue-500' : source === 'api' ? 'bg-green-500' : 'bg-yellow-500'}
      `}>
        {source.toUpperCase()}
      </span>
      {inconsistencyDetected && (
        <span className="bg-red-500 text-white px-2 py-1 rounded-full" title="Inconsistencia detectada - balance sincronizado">
          ⚠️ SYNC
        </span>
      )}
    </div>
  );

  switch (variant) {
    case 'card':
      return (
        <div className={`bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl p-4 text-white ${className}`} data-testid={testId}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Balance disponible</p>
              {renderBalance()}
              <p className="text-white/70 text-xs">1 Perla = 1 Sol</p>
            </div>
            {renderRefreshButton()}
          </div>
          {renderSourceIndicator()}
        </div>
      );

    case 'inline':
      return (
        <div className={`flex items-center space-x-2 ${className}`} data-testid={testId}>
          {renderBalance()}
          {renderRefreshButton()}
          {renderSourceIndicator()}
        </div>
      );

    case 'minimal':
      return (
        <span className={`${sizeClasses[size]} font-bold ${className}`} data-testid={testId}>
          {error ? '-.--' : formatBalance(balance)}
        </span>
      );

    default:
      return (
        <div className={`text-center ${className}`} data-testid={testId}>
          <p className="text-gray-600 text-sm mb-1">Balance actual</p>
          {renderBalance()}
          <p className="text-gray-500 text-xs mt-1">1 Perla = 1 Sol (PEN)</p>
          <div className="flex items-center justify-center">
            {renderRefreshButton()}
            {renderSourceIndicator()}
          </div>
        </div>
      );
  }
});

BalanceDisplay.displayName = 'BalanceDisplay';

export default BalanceDisplay;