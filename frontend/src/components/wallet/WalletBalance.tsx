import { useState, useEffect } from 'react'
import { walletApi, WalletBalance as WalletBalanceType } from '@/services/walletApi'
import { useAuth } from '@/hooks/useAuth'
import { useWalletSocket } from '@/hooks/useSocket'
import Button from '@/components/common/Button'
import { formatCurrency } from '@/utils/currency'

interface WalletBalanceProps {
  onRecharge?: () => void
  onTransfer?: () => void
  onViewHistory?: () => void
  className?: string
}

export const WalletBalance = ({ 
  onRecharge, 
  onTransfer, 
  onViewHistory,
  className = '' 
}: WalletBalanceProps) => {
  const { user } = useAuth()
  const [balance, setBalance] = useState<WalletBalanceType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Hook para notificaciones de wallet en tiempo real
  const { currentBalance, lastTransaction } = useWalletSocket(user?.id || null)

  const fetchBalance = async () => {
    try {
      setLoading(true)
      setError(null)
      const balanceData = await walletApi.getBalance()
      setBalance(balanceData)
    } catch (err) {
      console.error('Error fetching wallet balance:', err)
      setError('Error cargando balance')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchBalance()
    }
  }, [user])

  // Actualizar el balance cuando llegan notificaciones de Socket.IO
  useEffect(() => {
    if (currentBalance > 0 && balance) {
      setBalance(prev => prev ? { ...prev, balance: currentBalance } : null)
    }
  }, [currentBalance, balance])

  if (loading) {
    return (
      <div className={`bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 rounded-2xl p-6 text-white shadow-2xl ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-white/20 rounded w-32"></div>
            <div className="h-8 w-8 bg-white/20 rounded-full"></div>
          </div>
          <div className="h-12 bg-white/20 rounded w-48 mb-2"></div>
          <div className="h-4 bg-white/20 rounded w-24 mb-4"></div>
          <div className="h-10 bg-white/20 rounded w-full"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-red-500 rounded-2xl p-6 text-white shadow-2xl ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">⚠️ Error</h3>
          <button 
            onClick={fetchBalance}
            className="text-white/80 hover:text-white text-sm underline"
          >
            Reintentar
          </button>
        </div>
        <p className="text-white/90">{error}</p>
      </div>
    )
  }

  const isWalletFrozen = balance?.isFrozen
  const isLowBalance = balance && balance.balance < 10
  const isNearDailyLimit = balance && balance.balance >= balance.dailyLimit * 0.8

  return (
    <div className={`
      bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 
      rounded-2xl p-6 text-white shadow-2xl 
      transform hover:scale-105 transition-all duration-300
      ${isWalletFrozen ? 'from-gray-400 to-gray-600' : ''}
      ${className}
    `}>
      {/* Header con título y icono de estado */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center space-x-2">
          <span>💰</span>
          <span>Mi Billetera</span>
        </h3>
        <div className="flex items-center space-x-2">
          {/* Indicador de estado */}
          <div className={`
            w-3 h-3 rounded-full 
            ${balance?.isActive && !isWalletFrozen ? 'bg-green-300' : 'bg-red-300'}
          `} title={
            balance?.isActive && !isWalletFrozen 
              ? 'Billetera activa' 
              : 'Billetera inactiva o congelada'
          }></div>
          
          {/* Botón de actualizar */}
          <button 
            onClick={fetchBalance}
            className="text-white/80 hover:text-white hover:rotate-180 transition-all duration-300"
            title="Actualizar balance"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Balance principal */}
      <div className="mb-4">
        <p className="text-white/80 text-sm mb-1">Balance disponible</p>
        <div className="flex items-baseline space-x-2">
          <span className="text-4xl font-bold">
            {balance ? formatCurrency(balance.balance) : '0.00'}
          </span>
          <span className="text-lg font-medium text-white/90">Perlas</span>
          {/* Indicador de transacción reciente */}
          {lastTransaction && (
            <span 
              className="text-xs bg-green-500 px-2 py-1 rounded-full animate-pulse"
              title={`Última transacción: ${lastTransaction.type} ${lastTransaction.amount > 0 ? '+' : ''}${lastTransaction.amount.toFixed(2)} Perlas`}
            >
              {lastTransaction.amount > 0 ? '+' : ''}{lastTransaction.amount.toFixed(2)}
            </span>
          )}
        </div>
        <p className="text-xs text-white/70 mt-1">
          1 Perla = 1 Sol (PEN)
        </p>
      </div>

      {/* Alertas y estado */}
      <div className="space-y-2 mb-4">
        {isWalletFrozen && (
          <div className="bg-red-500/20 border border-red-300/50 rounded-lg p-2">
            <p className="text-xs text-red-100">
              🔒 Billetera congelada - Contacta soporte
            </p>
          </div>
        )}
        
        {isLowBalance && !isWalletFrozen && (
          <div className="bg-orange-500/20 border border-orange-300/50 rounded-lg p-2">
            <p className="text-xs text-orange-100">
              ⚠️ Balance bajo - Considera recargar tu billetera
            </p>
          </div>
        )}

        {isNearDailyLimit && (
          <div className="bg-blue-500/20 border border-blue-300/50 rounded-lg p-2">
            <p className="text-xs text-blue-100">
              📊 Cerca del límite diario ({formatCurrency(balance?.dailyLimit || 0)})
            </p>
          </div>
        )}
      </div>

      {/* Límites */}
      <div className="bg-white/10 rounded-lg p-3 mb-4">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-white/70">Límite diario</p>
            <p className="font-semibold">
              {balance ? formatCurrency(balance.dailyLimit) : '0.00'}
            </p>
          </div>
          <div>
            <p className="text-white/70">Límite mensual</p>
            <p className="font-semibold">
              {balance ? formatCurrency(balance.monthlyLimit) : '0.00'}
            </p>
          </div>
        </div>
      </div>

      {/* Botones de acción rápida */}
      {!isWalletFrozen && (
        <div className="grid grid-cols-3 gap-2">
          <Button
            onClick={onRecharge}
            size="sm"
            className="
              bg-white/20 hover:bg-white/30 text-white 
              border border-white/30 rounded-xl
              flex flex-col items-center py-3 px-2
              transform hover:scale-105 transition-all duration-200
            "
          >
            <span className="text-lg mb-1">💳</span>
            <span className="text-xs font-medium">Recargar</span>
          </Button>

          <Button
            onClick={onTransfer}
            size="sm"
            className="
              bg-white/20 hover:bg-white/30 text-white 
              border border-white/30 rounded-xl
              flex flex-col items-center py-3 px-2
              transform hover:scale-105 transition-all duration-200
            "
            disabled={!balance || balance.balance <= 0}
          >
            <span className="text-lg mb-1">💸</span>
            <span className="text-xs font-medium">Enviar</span>
          </Button>

          <Button
            onClick={onViewHistory}
            size="sm"
            className="
              bg-white/20 hover:bg-white/30 text-white 
              border border-white/30 rounded-xl
              flex flex-col items-center py-3 px-2
              transform hover:scale-105 transition-all duration-200
            "
          >
            <span className="text-lg mb-1">📋</span>
            <span className="text-xs font-medium">Historial</span>
          </Button>
        </div>
      )}

      {/* Mensaje para billetera congelada */}
      {isWalletFrozen && (
        <div className="text-center">
          <p className="text-sm text-white/90 mb-2">
            Tu billetera está temporalmente suspendida
          </p>
          <Button
            onClick={() => {/* TODO: Implementar contacto soporte */}}
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-lg"
          >
            📞 Contactar Soporte
          </Button>
        </div>
      )}
    </div>
  )
}

export default WalletBalance