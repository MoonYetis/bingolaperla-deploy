import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useWalletSocket } from '@/hooks/useSocket'
import Button from '@/components/common/Button'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import MyGameCards from '@/components/game/MyGameCards'
import WalletNotifications from '@/components/wallet/WalletNotifications'
import { useToast } from '@/contexts/ToastContext'

const DashboardPage = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [pearlsBalance, setPearlsBalance] = useState<number>(0)
  const [loadingBalance, setLoadingBalance] = useState(false)
  
  // Hook para notificaciones de wallet en tiempo real
  const {
    currentBalance,
    notifications,
    unreadCount,
    markNotificationAsRead,
    clearNotifications
  } = useWalletSocket(user?.id || null)

  // Cargar balance de Perlas al montar el componente
  useEffect(() => {
    loadPearlsBalance()
  }, [])

  // Actualizar balance cuando llegan notificaciones Socket.IO
  useEffect(() => {
    if (currentBalance > 0) {
      setPearlsBalance(currentBalance)
    }
  }, [currentBalance])

  const loadPearlsBalance = async () => {
    try {
      setLoadingBalance(true)
      const { walletApi } = await import('@/services/walletApi')
      const balanceData = await walletApi.getBalance()
      setPearlsBalance(balanceData.balance)
    } catch (error) {
      console.error('Error loading Perlas balance:', error)
      toast.error('Error cargando balance de Perlas')
    } finally {
      setLoadingBalance(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 px-4 py-6">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Header Simple para PLAY */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/menu')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <span className="text-xl">←</span>
            <span>Volver al menú</span>
          </button>
          <div className="flex items-center space-x-4">
            {/* Indicador de notificaciones */}
            {unreadCount > 0 && (
              <div className="relative">
                <span className="text-2xl">🔔</span>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Perlas:</span>
              {loadingBalance ? (
                <LoadingSpinner size="sm" />
              ) : (
                <div className="text-right">
                  <span className="text-lg font-bold text-green-600">
                    💎 {pearlsBalance.toFixed(2)}
                  </span>
                  <p className="text-xs text-gray-500">
                    ≈ S/ {pearlsBalance.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content - My Game Cards */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <MyGameCards />
        </div>

        {/* Quick Access to Wallet */}
        <div className="bg-white rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-gray-600">¿Quieres comprar cartones?</span>
              <p className="text-xs text-gray-500">Ve a tu billetera para comprar cartones</p>
            </div>
            <button
              onClick={() => navigate('/wallet')}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              💰 Billetera
            </button>
          </div>
        </div>
      </div>

      {/* Notificaciones de Wallet en tiempo real */}
      <WalletNotifications
        notifications={notifications}
        onMarkAsRead={markNotificationAsRead}
        onClearAll={clearNotifications}
      />
    </div>
  )
}

export default DashboardPage