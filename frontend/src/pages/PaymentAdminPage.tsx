import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import PaymentAdminDashboard from '@/components/admin/PaymentAdminDashboard'
import PendingDeposits from '@/components/admin/PendingDeposits'
import DepositValidationModal from '@/components/admin/DepositValidationModal'
import PendingWithdrawals from '@/components/admin/PendingWithdrawals'
import { AdminDepositRequest, AdminWithdrawalRequest, ApproveDepositResponse, RejectDepositResponse } from '@/services/adminPaymentApi'
import Button from '@/components/common/Button'

type TabType = 'dashboard' | 'deposits' | 'withdrawals' | 'statistics' | 'audit'

const PaymentAdminPage = () => {
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  
  // Modal states
  const [selectedDeposit, setSelectedDeposit] = useState<AdminDepositRequest | null>(null)
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<AdminWithdrawalRequest | null>(null)
  
  // Refresh triggers
  const [refreshDashboard, setRefreshDashboard] = useState(0)
  const [refreshDeposits, setRefreshDeposits] = useState(0)
  const [refreshWithdrawals, setRefreshWithdrawals] = useState(0)

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard')
    }
  }, [isAdmin, navigate])

  const handleValidateDeposit = (deposit: AdminDepositRequest) => {
    setSelectedDeposit(deposit)
    setShowValidationModal(true)
  }

  const handleDepositApproved = (result: ApproveDepositResponse) => {
    console.log('Deposit approved:', result)
    // Refresh components
    setRefreshDashboard(prev => prev + 1)
    setRefreshDeposits(prev => prev + 1)
    
    // TODO: Show success notification
    // Could also emit Socket.IO event to notify user
  }

  const handleDepositRejected = (result: RejectDepositResponse) => {
    console.log('Deposit rejected:', result)
    // Refresh components
    setRefreshDashboard(prev => prev + 1)
    setRefreshDeposits(prev => prev + 1)
    
    // TODO: Show rejection notification
  }

  const handleProcessWithdrawal = (withdrawal: AdminWithdrawalRequest) => {
    setSelectedWithdrawal(withdrawal)
    // TODO: Open withdrawal processing modal or flow
    console.log('Processing withdrawal:', withdrawal)
  }

  const tabs = [
    {
      id: 'dashboard' as TabType,
      label: 'Dashboard',
      icon: '📊',
      description: 'Vista general del sistema'
    },
    {
      id: 'deposits' as TabType,
      label: 'Depósitos',
      icon: '💳',
      description: 'Validar recargas'
    },
    {
      id: 'withdrawals' as TabType,
      label: 'Retiros',
      icon: '🏧',
      description: 'Procesar retiros'
    },
    {
      id: 'statistics' as TabType,
      label: 'Estadísticas',
      icon: '📈',
      description: 'Análisis detallado'
    },
    {
      id: 'audit' as TabType,
      label: 'Auditoría',
      icon: '🔍',
      description: 'Logs del sistema'
    }
  ]

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl block mb-4">🚫</span>
          <h1 className="text-2xl font-bold mb-2">Acceso Denegado</h1>
          <p className="text-white/70 mb-4">No tienes permisos de administrador</p>
          <Button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            ← Volver al Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin')}
                className="text-white/80 hover:text-white transition-colors"
                title="Volver al panel de administración"
              >
                <span className="text-2xl">←</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
                  <span>💰</span>
                  <span>Sistema de Pagos "Perlas"</span>
                </h1>
                <p className="text-white/80 text-sm">
                  Panel administrativo para gestión de transacciones
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-white/80">Sistema activo</span>
              </div>
              <div className="text-right">
                <div className="text-sm text-white/60">Admin:</div>
                <div className="text-white font-semibold">{user?.username}</div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="mt-6">
            <div className="flex space-x-1 bg-white/5 p-1 rounded-lg">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-md font-medium text-sm transition-all duration-200
                    ${activeTab === tab.id 
                      ? 'bg-white/20 text-white shadow-md' 
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                    }
                  `}
                  title={tab.description}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <PaymentAdminDashboard
            key={refreshDashboard}
            onViewPendingDeposits={() => setActiveTab('deposits')}
            onViewPendingWithdrawals={() => setActiveTab('withdrawals')}
            onViewStatistics={() => setActiveTab('statistics')}
          />
        )}

        {/* Deposits Tab */}
        {activeTab === 'deposits' && (
          <PendingDeposits
            key={refreshDeposits}
            onValidateDeposit={handleValidateDeposit}
          />
        )}

        {/* Withdrawals Tab */}
        {activeTab === 'withdrawals' && (
          <PendingWithdrawals
            key={refreshWithdrawals}
            onProcessWithdrawal={handleProcessWithdrawal}
          />
        )}

        {/* Statistics Tab */}
        {activeTab === 'statistics' && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center">
            <span className="text-6xl block mb-4">📈</span>
            <h3 className="text-2xl font-bold text-white mb-4">
              Estadísticas Detalladas
            </h3>
            <p className="text-white/70 mb-6">
              Panel de análisis financiero con métricas avanzadas, reportes de compliance y análisis de tendencias.
            </p>
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-6">
              <p className="text-blue-200 text-sm">
                🚧 <strong>En desarrollo:</strong> Esta funcionalidad estará disponible próximamente con dashboards interactivos, 
                exportación de reportes y análisis de patrones de transacciones.
              </p>
            </div>
            <Button
              onClick={() => setActiveTab('dashboard')}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              ← Volver al Dashboard
            </Button>
          </div>
        )}

        {/* Audit Tab */}
        {activeTab === 'audit' && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center">
            <span className="text-6xl block mb-4">🔍</span>
            <h3 className="text-2xl font-bold text-white mb-4">
              Logs de Auditoría
            </h3>
            <p className="text-white/70 mb-6">
              Sistema completo de trazabilidad y auditoría para cumplimiento normativo. 
              Registro detallado de todas las acciones administrativas.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-2xl mb-2">🔐</div>
                <div className="text-white font-semibold">Acciones Admin</div>
                <div className="text-white/60 text-sm">Todas las validaciones y rechazos</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-2xl mb-2">🌐</div>
                <div className="text-white font-semibold">Tracking IP</div>
                <div className="text-white/60 text-sm">Localización de cada acción</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-2xl mb-2">📋</div>
                <div className="text-white font-semibold">Compliance</div>
                <div className="text-white/60 text-sm">Reportes para SUNAT/SBS</div>
              </div>
            </div>
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <p className="text-yellow-200 text-sm">
                ⚠️ <strong>Próximamente:</strong> Interfaz completa de auditoría con filtros avanzados, 
                exportación de logs y dashboards de compliance para reguladores peruanos.
              </p>
            </div>
            <Button
              onClick={() => setActiveTab('dashboard')}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              ← Volver al Dashboard
            </Button>
          </div>
        )}
      </main>

      {/* Modals */}
      <DepositValidationModal
        isOpen={showValidationModal}
        onClose={() => {
          setShowValidationModal(false)
          setSelectedDeposit(null)
        }}
        deposit={selectedDeposit}
        onApproved={handleDepositApproved}
        onRejected={handleDepositRejected}
      />

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-6">
        <div className="text-center text-white/40 text-sm">
          <p>🔐 Panel de Administración Seguro • Sistema Perlas v1.0</p>
          <p className="mt-1">
            Todas las acciones son registradas para auditoría y compliance
          </p>
        </div>
      </footer>

      {/* Custom Styles */}
      <style>{`
        /* Tab transitions */
        .tab-content {
          animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Scrollbar styling for long lists */
        .admin-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .admin-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        
        .admin-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }
        
        .admin-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  )
}

export default PaymentAdminPage