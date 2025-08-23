import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useWalletSocket } from '@/hooks/useSocket'
import WalletBalance from '@/components/wallet/WalletBalance'
import GameCardsShop from '@/components/wallet/GameCardsShop'
import RechargeModal from '@/components/wallet/RechargeModal'
import TransferModal from '@/components/wallet/TransferModal'
import TransactionHistory from '@/components/wallet/TransactionHistory'
import WalletNotifications from '@/components/wallet/WalletNotifications'
import VideoBackground from '@/components/common/VideoBackground'
import Button from '@/components/common/Button'
import { DepositRequest, TransferPearlsResponse } from '@/services/walletApi'

const WalletPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  // Modal states
  const [showRechargeModal, setShowRechargeModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  
  // Refresh triggers
  const [refreshBalance, setRefreshBalance] = useState(0)
  const [refreshHistory, setRefreshHistory] = useState(0)
  
  // Hook para notificaciones de wallet en tiempo real
  const {
    notifications,
    unreadCount,
    markNotificationAsRead,
    clearNotifications
  } = useWalletSocket(user?.id || null)

  const handleRechargeSuccess = (deposit: DepositRequest) => {
    console.log('Deposit created:', deposit)
    // TODO: Show success toast or notification
    setShowRechargeModal(false)
    // Note: Balance will update when admin approves the deposit
  }

  const handleTransferSuccess = (transfer: TransferPearlsResponse) => {
    console.log('Transfer completed:', transfer)
    // TODO: Show success toast or notification
    setShowTransferModal(false)
    // Refresh balance and history immediately
    setRefreshBalance(prev => prev + 1)
    setRefreshHistory(prev => prev + 1)
  }

  const handleBalanceRefresh = () => {
    setRefreshBalance(prev => prev + 1)
  }

  const handleHistoryRefresh = () => {
    setRefreshHistory(prev => prev + 1)
  }

  const handleCardPurchaseSuccess = () => {
    // Refresh balance and history when cards are purchased
    setRefreshBalance(prev => prev + 1)
    setRefreshHistory(prev => prev + 1)
  }

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Video Background */}
      <VideoBackground 
        src="/videos/bingo-background.mp4"
        overlay={true}
        showAudioControl={false}
        className="z-0 opacity-30"
      />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-white/80 hover:text-white transition-colors"
                  title="Volver al menú principal"
                >
                  <span className="text-2xl">←</span>
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
                    <span>💰</span>
                    <span>Mi Billetera</span>
                  </h1>
                  <p className="text-white/80 text-sm">
                    Gestiona tus Perlas - Tu moneda virtual
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Indicador de notificaciones */}
                {unreadCount > 0 && (
                  <div className="relative">
                    <span className="text-white text-2xl">🔔</span>
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <span className="text-white/80 text-sm">👤</span>
                  <span className="text-white font-medium">{user?.username}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-8">
          {/* Top Section - Balance and Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Wallet Balance Card */}
            <div className="lg:col-span-2">
              <WalletBalance
                onRecharge={() => setShowRechargeModal(true)}
                onTransfer={() => setShowTransferModal(true)}
                onViewHistory={handleHistoryRefresh}
                key={refreshBalance} // Force re-render on refresh
              />
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                <span>⚡</span>
                <span>Acciones Rápidas</span>
              </h3>
              
              <div className="space-y-3">
                <Button
                  onClick={() => setShowRechargeModal(true)}
                  className="
                    w-full bg-gradient-to-r from-green-500 to-emerald-600 
                    hover:from-green-600 hover:to-emerald-700 
                    text-white py-3 rounded-xl font-medium
                    flex items-center justify-center space-x-2
                    transform hover:scale-105 transition-all duration-200
                  "
                >
                  <span>💳</span>
                  <span>Recargar Perlas</span>
                </Button>

                <Button
                  onClick={() => setShowTransferModal(true)}
                  className="
                    w-full bg-gradient-to-r from-blue-500 to-purple-600 
                    hover:from-blue-600 hover:to-purple-700 
                    text-white py-3 rounded-xl font-medium
                    flex items-center justify-center space-x-2
                    transform hover:scale-105 transition-all duration-200
                  "
                >
                  <span>💸</span>
                  <span>Enviar Perlas</span>
                </Button>

                <Button
                  onClick={() => navigate('/dashboard')}
                  className="
                    w-full bg-gradient-to-r from-orange-500 to-red-600 
                    hover:from-orange-600 hover:to-red-700 
                    text-white py-3 rounded-xl font-medium
                    flex items-center justify-center space-x-2
                    transform hover:scale-105 transition-all duration-200
                  "
                >
                  <span>🎯</span>
                  <span>Mis Cartones</span>
                </Button>
              </div>

              {/* Info section */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="font-medium text-blue-800 text-sm mb-1">
                    💡 ¿Sabías que?
                  </h4>
                  <p className="text-blue-700 text-xs">
                    1 Perla equivale exactamente a 1 Sol peruano. 
                    Puedes usar tus Perlas para comprar cartones de bingo y participar en juegos.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Section - Game Cards Shop */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <GameCardsShop onPurchaseSuccess={handleCardPurchaseSuccess} />
            </div>
          </div>

          {/* Current Requests */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                <span>📋</span>
                <span>Solicitudes Pendientes</span>
              </h3>
              
              {/* TODO: Component for showing pending deposits/withdrawals */}
              <div className="text-center py-8 text-gray-500">
                <span className="text-2xl block mb-2">⏳</span>
                <p className="text-sm">No tienes solicitudes pendientes</p>
                <p className="text-xs text-gray-400">
                  Las recargas y retiros aparecerán aquí mientras se procesan
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Section - Transaction History */}
          <div>
            <TransactionHistory
              limit={15}
              showPagination={true}
              key={refreshHistory} // Force re-render on refresh
            />
          </div>
        </main>

        {/* Footer */}
        <footer className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center text-white/60 text-sm">
            <p>🔒 Transacciones seguras • Sistema de pagos Perlas</p>
            <p className="mt-1">
              ¿Necesitas ayuda? Contacta soporte en el menú principal
            </p>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <RechargeModal
        isOpen={showRechargeModal}
        onClose={() => setShowRechargeModal(false)}
        onSuccess={handleRechargeSuccess}
      />

      <TransferModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onSuccess={handleTransferSuccess}
      />

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-6 right-6 lg:hidden">
        <div className="relative">
          {/* Main FAB */}
          <button 
            className="
              w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-600 
              hover:from-green-600 hover:to-emerald-700
              text-white rounded-full shadow-lg
              flex items-center justify-center text-xl
              transform hover:scale-110 active:scale-95 
              transition-all duration-200
            "
            onClick={() => setShowRechargeModal(true)}
          >
            💳
          </button>
          
          {/* Secondary FAB */}
          <button 
            className="
              absolute -top-16 left-0
              w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 
              hover:from-blue-600 hover:to-purple-700
              text-white rounded-full shadow-lg
              flex items-center justify-center text-lg
              transform hover:scale-110 active:scale-95 
              transition-all duration-200
            "
            onClick={() => setShowTransferModal(true)}
          >
            💸
          </button>
        </div>
      </div>

      {/* Notificaciones de Wallet en tiempo real */}
      <WalletNotifications
        notifications={notifications}
        onMarkAsRead={markNotificationAsRead}
        onClearAll={clearNotifications}
      />

      {/* Custom Styles */}
      <style>{`
        /* Custom scrollbar for transaction history */
        .transaction-history::-webkit-scrollbar {
          width: 6px;
        }
        
        .transaction-history::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .transaction-history::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 10px;
        }
        
        .transaction-history::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }

        /* Fade in animation for cards */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .fade-in-up {
          animation: fadeInUp 0.6s ease-out;
        }
      `}</style>
    </div>
  )
}

export default WalletPage