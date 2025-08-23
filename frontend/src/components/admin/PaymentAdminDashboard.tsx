import { useState, useEffect } from 'react'
import { adminPaymentApi, AdminDashboardStats } from '@/services/adminPaymentApi'
import { formatCurrency } from '@/utils/currency'
import Button from '@/components/common/Button'

interface PaymentAdminDashboardProps {
  onViewPendingDeposits?: () => void
  onViewPendingWithdrawals?: () => void
  onViewStatistics?: () => void
  className?: string
}

export const PaymentAdminDashboard = ({ 
  onViewPendingDeposits, 
  onViewPendingWithdrawals, 
  onViewStatistics,
  className = '' 
}: PaymentAdminDashboardProps) => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchStats = async () => {
    try {
      setError(null)
      const data = await adminPaymentApi.getPaymentDashboard()
      setStats(data)
    } catch (err) {
      console.error('Error fetching admin dashboard stats:', err)
      setError('Error cargando estadísticas del dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchStats()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh])

  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          {/* Header skeleton */}
          <div className="h-8 bg-white/20 rounded w-1/2"></div>
          
          {/* Cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
                <div className="h-6 bg-white/20 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-white/20 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-white/20 rounded w-full"></div>
              </div>
            ))}
          </div>
          
          {/* Large cards skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
                <div className="h-6 bg-white/20 rounded w-1/2 mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="flex justify-between">
                      <div className="h-4 bg-white/20 rounded w-1/3"></div>
                      <div className="h-4 bg-white/20 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error && !stats) {
    return (
      <div className={`bg-red-500/20 border border-red-500/30 rounded-2xl p-6 text-center ${className}`}>
        <span className="text-4xl block mb-4">⚠️</span>
        <p className="text-red-300 mb-4">{error}</p>
        <Button
          onClick={fetchStats}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          🔄 Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center space-x-2">
            <span>📊</span>
            <span>Dashboard de Pagos</span>
          </h2>
          <p className="text-white/80 text-sm">
            Sistema de moneda virtual "Perlas" - Estadísticas en tiempo real
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`
              flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors
              ${autoRefresh 
                ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                : 'bg-white/10 text-white/70 border border-white/20'
              }
            `}
            title={autoRefresh ? 'Deshabilitar actualización automática' : 'Habilitar actualización automática'}
          >
            <span>{autoRefresh ? '🔄' : '⏸️'}</span>
            <span>Auto</span>
          </button>
          
          {/* Manual refresh */}
          <button
            onClick={fetchStats}
            disabled={loading}
            className="text-white/80 hover:text-white hover:rotate-180 transition-all duration-300"
            title="Actualizar ahora"
          >
            🔄
          </button>
          
          {/* Last updated */}
          {stats && (
            <span className="text-xs text-white/60">
              Actualizado: {formatLastUpdated(stats.lastUpdated)}
            </span>
          )}
        </div>
      </div>

      {/* Alert Messages */}
      {stats?.alerts && stats.alerts.length > 0 && (
        <div className="space-y-2">
          {stats.alerts.map((alert, index) => (
            <div
              key={index}
              className={`
                p-4 rounded-lg border flex items-center justify-between
                ${alert.type === 'warning' 
                  ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-200' 
                  : alert.type === 'error'
                  ? 'bg-red-500/20 border-red-500/30 text-red-200'
                  : 'bg-blue-500/20 border-blue-500/30 text-blue-200'
                }
              `}
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">
                  {alert.type === 'warning' ? '⚠️' : alert.type === 'error' ? '🚨' : 'ℹ️'}
                </span>
                <span>{alert.message}</span>
              </div>
              <span className="text-xs opacity-70">{alert.action}</span>
            </div>
          ))}
        </div>
      )}

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Deposits */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 hover:bg-white/15 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">💳 Depósitos</h3>
            <button
              onClick={onViewPendingDeposits}
              className="text-white/60 hover:text-white text-sm underline"
            >
              Ver todos
            </button>
          </div>
          <div className="text-3xl font-bold text-yellow-400 mb-2">
            {stats?.pendingRequests.deposits || 0}
          </div>
          <p className="text-white/70 text-sm">Pendientes de validación</p>
        </div>

        {/* Pending Withdrawals */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 hover:bg-white/15 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">🏧 Retiros</h3>
            <button
              onClick={onViewPendingWithdrawals}
              className="text-white/60 hover:text-white text-sm underline"
            >
              Ver todos
            </button>
          </div>
          <div className="text-3xl font-bold text-orange-400 mb-2">
            {stats?.pendingRequests.withdrawals || 0}
          </div>
          <p className="text-white/70 text-sm">Pendientes de proceso</p>
        </div>

        {/* Today's Volume */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 hover:bg-white/15 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">📈 Hoy</h3>
            <span className="text-xs text-white/60">Volumen</span>
          </div>
          <div className="text-2xl font-bold text-green-400 mb-2">
            {stats ? formatCurrency(stats.todayStats.totalVolume) : '0.00'}
          </div>
          <p className="text-white/70 text-sm">
            {stats?.todayStats.totalTransactions || 0} transacciones
          </p>
        </div>

        {/* Monthly Volume */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 hover:bg-white/15 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">📊 Este mes</h3>
            <button
              onClick={onViewStatistics}
              className="text-white/60 hover:text-white text-sm underline"
            >
              Detalles
            </button>
          </div>
          <div className="text-2xl font-bold text-blue-400 mb-2">
            {stats ? formatCurrency(stats.monthlyStats.totalVolume) : '0.00'}
          </div>
          <p className="text-white/70 text-sm">
            {stats?.monthlyStats.totalTransactions || 0} transacciones
          </p>
        </div>
      </div>

      {/* Detailed Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Breakdown */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <span>📅</span>
            <span>Actividad de Hoy</span>
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-white/80 flex items-center space-x-2">
                <span>💳</span>
                <span>Depósitos</span>
              </span>
              <span className="font-semibold text-green-400">
                {stats?.todayStats.deposits || 0}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-white/80 flex items-center space-x-2">
                <span>🏧</span>
                <span>Retiros</span>
              </span>
              <span className="font-semibold text-orange-400">
                {stats?.todayStats.withdrawals || 0}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-white/80 flex items-center space-x-2">
                <span>💸</span>
                <span>Transferencias P2P</span>
              </span>
              <span className="font-semibold text-blue-400">
                {stats?.todayStats.transfers || 0}
              </span>
            </div>
            
            <div className="border-t border-white/20 pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-white font-medium">Total transacciones:</span>
                <span className="font-bold text-white">
                  {stats?.todayStats.totalTransactions || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <span>⚙️</span>
            <span>Estado del Sistema</span>
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-white/80">Depósitos</span>
              <div className={`
                px-2 py-1 rounded-full text-xs font-semibold
                ${stats?.systemStatus.depositsEnabled 
                  ? 'bg-green-500/20 text-green-300' 
                  : 'bg-red-500/20 text-red-300'
                }
              `}>
                {stats?.systemStatus.depositsEnabled ? '✅ Activo' : '❌ Inactivo'}
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-white/80">Retiros</span>
              <div className={`
                px-2 py-1 rounded-full text-xs font-semibold
                ${stats?.systemStatus.withdrawalsEnabled 
                  ? 'bg-green-500/20 text-green-300' 
                  : 'bg-red-500/20 text-red-300'
                }
              `}>
                {stats?.systemStatus.withdrawalsEnabled ? '✅ Activo' : '❌ Inactivo'}
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-white/80">Transferencias P2P</span>
              <div className={`
                px-2 py-1 rounded-full text-xs font-semibold
                ${stats?.systemStatus.transfersEnabled 
                  ? 'bg-green-500/20 text-green-300' 
                  : 'bg-red-500/20 text-red-300'
                }
              `}>
                {stats?.systemStatus.transfersEnabled ? '✅ Activo' : '❌ Inactivo'}
              </div>
            </div>
            
            <div className="border-t border-white/20 pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-white/80">Comisión P2P:</span>
                <span className="font-semibold text-yellow-400">
                  {stats ? formatCurrency(stats.systemStatus.p2pCommission) : '0.00'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
          <span>⚡</span>
          <span>Acciones Rápidas</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={onViewPendingDeposits}
            className="
              bg-gradient-to-r from-green-500 to-emerald-600 
              hover:from-green-600 hover:to-emerald-700 
              text-white py-3 rounded-xl font-medium
              flex items-center justify-center space-x-2
            "
            disabled={!stats || stats.pendingRequests.deposits === 0}
          >
            <span>💳</span>
            <span>Validar Depósitos ({stats?.pendingRequests.deposits || 0})</span>
          </Button>

          <Button
            onClick={onViewPendingWithdrawals}
            className="
              bg-gradient-to-r from-orange-500 to-red-600 
              hover:from-orange-600 hover:to-red-700 
              text-white py-3 rounded-xl font-medium
              flex items-center justify-center space-x-2
            "
            disabled={!stats || stats.pendingRequests.withdrawals === 0}
          >
            <span>🏧</span>
            <span>Procesar Retiros ({stats?.pendingRequests.withdrawals || 0})</span>
          </Button>

          <Button
            onClick={onViewStatistics}
            className="
              bg-gradient-to-r from-blue-500 to-purple-600 
              hover:from-blue-600 hover:to-purple-700 
              text-white py-3 rounded-xl font-medium
              flex items-center justify-center space-x-2
            "
          >
            <span>📊</span>
            <span>Ver Estadísticas</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PaymentAdminDashboard