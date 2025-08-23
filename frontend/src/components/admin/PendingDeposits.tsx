import { useState, useEffect } from 'react'
import { adminPaymentApi, AdminDepositRequest } from '@/services/adminPaymentApi'
import { formatCurrency } from '@/utils/currency'
import Button from '@/components/common/Button'

interface PendingDepositsProps {
  onValidateDeposit?: (deposit: AdminDepositRequest) => void
  className?: string
}

export const PendingDeposits = ({ onValidateDeposit, className = '' }: PendingDepositsProps) => {
  const [deposits, setDeposits] = useState<AdminDepositRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    total: 0
  })
  
  // Filters
  const [filters, setFilters] = useState({
    status: 'PENDING',
    paymentMethod: '',
    search: '' // For user search
  })

  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'user'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const fetchDeposits = async (newOffset: number = 0) => {
    try {
      setLoading(true)
      setError(null)

      const params = {
        status: filters.status || undefined,
        paymentMethod: filters.paymentMethod || undefined,
        limit: pagination.limit,
        offset: newOffset
      }

      const response = await adminPaymentApi.getPendingDeposits(params)
      
      let sortedDeposits = [...response.deposits]
      
      // Apply sorting
      sortedDeposits.sort((a, b) => {
        let aValue: any, bValue: any
        
        switch (sortBy) {
          case 'amount':
            aValue = a.amount
            bValue = b.amount
            break
          case 'user':
            aValue = a.user.username.toLowerCase()
            bValue = b.user.username.toLowerCase()
            break
          case 'date':
          default:
            aValue = new Date(a.createdAt).getTime()
            bValue = new Date(b.createdAt).getTime()
            break
        }
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1
        } else {
          return aValue < bValue ? 1 : -1
        }
      })

      // Apply client-side search filter if needed
      if (filters.search.trim()) {
        const searchTerm = filters.search.toLowerCase()
        sortedDeposits = sortedDeposits.filter(deposit => 
          deposit.user.username.toLowerCase().includes(searchTerm) ||
          deposit.user.fullName.toLowerCase().includes(searchTerm) ||
          deposit.user.email.toLowerCase().includes(searchTerm) ||
          deposit.referenceCode.toLowerCase().includes(searchTerm)
        )
      }

      setDeposits(sortedDeposits)
      setPagination(response.pagination)
    } catch (err) {
      console.error('Error fetching pending deposits:', err)
      setError('Error cargando depósitos pendientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeposits()
  }, [filters.status, filters.paymentMethod])

  useEffect(() => {
    // Re-sort when sort criteria changes
    if (deposits.length > 0) {
      fetchDeposits(pagination.offset)
    }
  }, [sortBy, sortOrder])

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setPagination(prev => ({ ...prev, offset: 0 }))
  }

  const handleSearch = () => {
    fetchDeposits(0)
  }

  const handlePageChange = (newOffset: number) => {
    setPagination(prev => ({ ...prev, offset: newOffset }))
    fetchDeposits(newOffset)
  }

  const getStatusBadge = (deposit: AdminDepositRequest) => {
    if (deposit.isExpired) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
          🕐 Expirado
        </span>
      )
    }

    const statusConfig = {
      'PENDING': { color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', label: '⏳ Pendiente' },
      'APPROVED': { color: 'bg-green-500/20 text-green-300 border-green-500/30', label: '✅ Aprobado' },
      'REJECTED': { color: 'bg-red-500/20 text-red-300 border-red-500/30', label: '❌ Rechazado' },
    }

    const config = statusConfig[deposit.status as keyof typeof statusConfig] || statusConfig.PENDING
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const getPaymentMethodIcon = (method: string) => {
    if (method.includes('BCP') || method.includes('BBVA') || method.includes('INTERBANK') || method.includes('SCOTIABANK')) {
      return '🏦'
    }
    if (method.includes('YAPE') || method.includes('PLIN')) {
      return '📱'
    }
    return '💳'
  }

  if (loading && deposits.length === 0) {
    return (
      <div className={`bg-white/10 backdrop-blur-md rounded-2xl p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/20 rounded w-1/2"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-12 h-12 bg-white/20 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-white/20 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="h-8 bg-white/20 rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error && deposits.length === 0) {
    return (
      <div className={`bg-red-500/20 border border-red-500/30 rounded-2xl p-6 text-center ${className}`}>
        <span className="text-4xl block mb-4">⚠️</span>
        <p className="text-red-300 mb-4">{error}</p>
        <Button
          onClick={() => fetchDeposits()}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          🔄 Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className={`bg-white/10 backdrop-blur-md rounded-2xl ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center space-x-2">
            <span>💳</span>
            <span>Depósitos Pendientes</span>
            <span className="text-sm font-normal text-white/60">
              ({deposits.length})
            </span>
          </h3>
          
          <div className="flex items-center space-x-3">
            {/* Sort controls */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder]
                setSortBy(newSortBy)
                setSortOrder(newSortOrder)
              }}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="date-desc">Más recientes</option>
              <option value="date-asc">Más antiguos</option>
              <option value="amount-desc">Mayor monto</option>
              <option value="amount-asc">Menor monto</option>
              <option value="user-asc">Usuario A-Z</option>
              <option value="user-desc">Usuario Z-A</option>
            </select>

            <button
              onClick={() => fetchDeposits(pagination.offset)}
              disabled={loading}
              className="text-white/80 hover:text-white hover:rotate-180 transition-all duration-300"
              title="Actualizar"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange({ status: e.target.value })}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="PENDING">Pendientes</option>
              <option value="EXPIRED">Expirados</option>
              <option value="APPROVED">Aprobados</option>
              <option value="REJECTED">Rechazados</option>
            </select>
          </div>
          
          <div>
            <select
              value={filters.paymentMethod}
              onChange={(e) => handleFilterChange({ paymentMethod: e.target.value })}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los métodos</option>
              <option value="BCP">BCP</option>
              <option value="BBVA">BBVA</option>
              <option value="INTERBANK">Interbank</option>
              <option value="SCOTIABANK">Scotiabank</option>
              <option value="YAPE">Yape</option>
              <option value="PLIN">Plin</option>
            </select>
          </div>
          
          <div className="md:col-span-2">
            <div className="flex space-x-2">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Buscar por usuario, email o código..."
                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 placeholder-white/50"
              />
              <Button
                onClick={handleSearch}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2"
                size="sm"
              >
                🔍
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Deposits List */}
      <div className="divide-y divide-white/10">
        {deposits.length === 0 ? (
          <div className="p-8 text-center">
            <span className="text-4xl block mb-4">📭</span>
            <p className="text-white/70 mb-2">No hay depósitos pendientes</p>
            <p className="text-sm text-white/50">
              {filters.status !== 'PENDING' || filters.paymentMethod || filters.search
                ? 'No se encontraron depósitos con los filtros aplicados'
                : 'Todos los depósitos han sido procesados'
              }
            </p>
          </div>
        ) : (
          deposits.map((deposit) => (
            <div
              key={deposit.id}
              className="p-6 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center justify-between">
                {/* Left side - User and deposit info */}
                <div className="flex items-center space-x-4 flex-1">
                  {/* User avatar */}
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {deposit.user.username.charAt(0).toUpperCase()}
                  </div>

                  {/* User and deposit details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-semibold text-white truncate">
                        {deposit.user.fullName}
                      </p>
                      <span className="text-sm text-white/60">@{deposit.user.username}</span>
                      {getStatusBadge(deposit)}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-white/70">
                      <span className="flex items-center space-x-1">
                        <span>{getPaymentMethodIcon(deposit.paymentMethod)}</span>
                        <span>{deposit.paymentMethod}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <span>🏷️</span>
                        <span className="font-mono">{deposit.referenceCode}</span>
                      </span>
                      <span>
                        {new Date(deposit.createdAt).toLocaleDateString('es-PE', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    {/* Bank account info */}
                    {deposit.bankAccount && (
                      <div className="mt-2 text-xs text-white/60">
                        <span>Cuenta origen: {deposit.bankAccount}</span>
                        {deposit.bankAccountName && (
                          <span> - {deposit.bankAccountName}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Center - Amount info */}
                <div className="text-center mx-6">
                  <div className="text-xl font-bold text-green-400">
                    {formatCurrency(deposit.amount)}
                  </div>
                  <div className="text-sm text-white/60">
                    → {deposit.pearlsAmount} Perlas
                  </div>
                </div>

                {/* Right side - Status and actions */}
                <div className="text-right space-y-2">
                  {/* Time remaining */}
                  {deposit.status === 'PENDING' && (
                    <div className={`text-xs ${deposit.isExpired ? 'text-red-400' : 'text-yellow-400'}`}>
                      {deposit.isExpired ? '🕐 Expirado' : `⏰ ${deposit.timeRemaining}`}
                    </div>
                  )}

                  {/* Action button */}
                  <div>
                    {deposit.status === 'PENDING' && !deposit.isExpired ? (
                      <Button
                        onClick={() => onValidateDeposit?.(deposit)}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2"
                        size="sm"
                      >
                        ✅ Validar
                      </Button>
                    ) : deposit.isExpired ? (
                      <Button
                        onClick={() => onValidateDeposit?.(deposit)}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2"
                        size="sm"
                      >
                        📝 Revisar
                      </Button>
                    ) : (
                      <span className="text-xs text-white/50 px-3 py-2">
                        {deposit.status === 'APPROVED' ? '✅ Procesado' : '❌ Rechazado'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Proof image indicator */}
              {deposit.proofImage && (
                <div className="mt-3 flex items-center space-x-2 text-sm text-white/60">
                  <span>📎</span>
                  <span>Comprobante adjunto</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {deposits.length > 0 && pagination.total > pagination.limit && (
        <div className="p-6 border-t border-white/20">
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/60">
              Mostrando {pagination.offset + 1} a {Math.min(pagination.offset + pagination.limit, pagination.total)} de {pagination.total} depósitos
            </p>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => handlePageChange(Math.max(0, pagination.offset - pagination.limit))}
                disabled={pagination.offset === 0 || loading}
                size="sm"
                variant="outline"
                className="text-white border-white/20 hover:bg-white/10"
              >
                ← Anterior
              </Button>
              
              <span className="text-sm text-white/60 px-3">
                {Math.floor(pagination.offset / pagination.limit) + 1} de {Math.ceil(pagination.total / pagination.limit)}
              </span>
              
              <Button
                onClick={() => handlePageChange(pagination.offset + pagination.limit)}
                disabled={pagination.offset + pagination.limit >= pagination.total || loading}
                size="sm"
                variant="outline"
                className="text-white border-white/20 hover:bg-white/10"
              >
                Siguiente →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && deposits.length > 0 && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center rounded-2xl">
          <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg">
            <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
            <span className="text-white text-sm">Cargando...</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default PendingDeposits