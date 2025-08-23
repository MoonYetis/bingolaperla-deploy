import { useState, useEffect } from 'react'
import { adminPaymentApi, AdminWithdrawalRequest } from '@/services/adminPaymentApi'
import { formatCurrency } from '@/utils/currency'
import Button from '@/components/common/Button'

interface PendingWithdrawalsProps {
  onProcessWithdrawal?: (withdrawal: AdminWithdrawalRequest) => void
  className?: string
}

export const PendingWithdrawals = ({ onProcessWithdrawal, className = '' }: PendingWithdrawalsProps) => {
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    total: 0
  })
  
  // Filters
  const [filters, setFilters] = useState({
    search: '', // For user search
    bankCode: '',
    minAmount: '',
    maxAmount: ''
  })

  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'user' | 'bank'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedWithdrawals, setSelectedWithdrawals] = useState<Set<string>>(new Set())

  const fetchWithdrawals = async (newOffset: number = 0) => {
    try {
      setLoading(true)
      setError(null)

      const params = {
        limit: pagination.limit,
        offset: newOffset
      }

      const response = await adminPaymentApi.getPendingWithdrawals(params)
      
      let sortedWithdrawals = [...response.withdrawals]
      
      // Apply sorting
      sortedWithdrawals.sort((a, b) => {
        let aValue: any, bValue: any
        
        switch (sortBy) {
          case 'amount':
            aValue = a.netAmount
            bValue = b.netAmount
            break
          case 'user':
            aValue = a.user.username.toLowerCase()
            bValue = b.user.username.toLowerCase()
            break
          case 'bank':
            aValue = a.bankCode
            bValue = b.bankCode
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

      // Apply client-side filters
      if (filters.search.trim()) {
        const searchTerm = filters.search.toLowerCase()
        sortedWithdrawals = sortedWithdrawals.filter(withdrawal => 
          withdrawal.user.username.toLowerCase().includes(searchTerm) ||
          withdrawal.user.fullName.toLowerCase().includes(searchTerm) ||
          withdrawal.user.email.toLowerCase().includes(searchTerm) ||
          withdrawal.referenceCode.toLowerCase().includes(searchTerm) ||
          withdrawal.accountNumber.includes(searchTerm)
        )
      }

      if (filters.bankCode) {
        sortedWithdrawals = sortedWithdrawals.filter(withdrawal => 
          withdrawal.bankCode === filters.bankCode
        )
      }

      if (filters.minAmount) {
        const minAmount = parseFloat(filters.minAmount)
        sortedWithdrawals = sortedWithdrawals.filter(withdrawal => 
          withdrawal.netAmount >= minAmount
        )
      }

      if (filters.maxAmount) {
        const maxAmount = parseFloat(filters.maxAmount)
        sortedWithdrawals = sortedWithdrawals.filter(withdrawal => 
          withdrawal.netAmount <= maxAmount
        )
      }

      setWithdrawals(sortedWithdrawals)
      setPagination(response.pagination)
    } catch (err) {
      console.error('Error fetching pending withdrawals:', err)
      setError('Error cargando retiros pendientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWithdrawals()
  }, [])

  useEffect(() => {
    // Re-sort when sort criteria changes
    if (withdrawals.length > 0) {
      fetchWithdrawals(pagination.offset)
    }
  }, [sortBy, sortOrder])

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const handleSearch = () => {
    fetchWithdrawals(0)
  }

  const handlePageChange = (newOffset: number) => {
    setPagination(prev => ({ ...prev, offset: newOffset }))
    fetchWithdrawals(newOffset)
  }

  const handleSelectWithdrawal = (withdrawalId: string, selected: boolean) => {
    setSelectedWithdrawals(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(withdrawalId)
      } else {
        newSet.delete(withdrawalId)
      }
      return newSet
    })
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedWithdrawals(new Set(withdrawals.map(w => w.id)))
    } else {
      setSelectedWithdrawals(new Set())
    }
  }

  const getBankInfo = (bankCode: string) => {
    const banks = {
      'BCP': { name: 'BCP', icon: '🟦', color: 'text-blue-600' },
      'BBVA': { name: 'BBVA', icon: '🟨', color: 'text-blue-700' },
      'INTERBANK': { name: 'Interbank', icon: '🟩', color: 'text-green-600' },
      'SCOTIABANK': { name: 'Scotiabank', icon: '🟥', color: 'text-red-600' }
    }
    return banks[bankCode as keyof typeof banks] || { name: bankCode, icon: '🏦', color: 'text-gray-600' }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'PENDING': { color: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30', label: '⏳ Pendiente' },
      'APPROVED': { color: 'bg-green-500/20 text-green-700 border-green-500/30', label: '✅ Aprobado' },
      'REJECTED': { color: 'bg-red-500/20 text-red-700 border-red-500/30', label: '❌ Rechazado' },
      'COMPLETED': { color: 'bg-blue-500/20 text-blue-700 border-blue-500/30', label: '🏆 Completado' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const exportSelectedForBanking = () => {
    if (selectedWithdrawals.size === 0) return

    const selectedData = withdrawals.filter(w => selectedWithdrawals.has(w.id))
    
    // Format for banking system (CSV-like)
    let csvContent = "BANCO,NUMERO_CUENTA,TIPO_CUENTA,TITULAR,DNI,MONTO,CONCEPTO,REFERENCIA\n"
    
    selectedData.forEach(withdrawal => {
      csvContent += `"${withdrawal.bankCode}","${withdrawal.accountNumber}","${withdrawal.accountType}","${withdrawal.accountHolderName}","${withdrawal.accountHolderDni}","${withdrawal.netAmount.toFixed(2)}","Retiro Bingo La Perla","${withdrawal.referenceCode}"\n`
    })

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `retiros_pendientes_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  if (loading && withdrawals.length === 0) {
    return (
      <div className={`bg-white/10 backdrop-blur-md rounded-2xl p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/20 rounded w-1/2"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
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

  if (error && withdrawals.length === 0) {
    return (
      <div className={`bg-red-500/20 border border-red-500/30 rounded-2xl p-6 text-center ${className}`}>
        <span className="text-4xl block mb-4">⚠️</span>
        <p className="text-red-300 mb-4">{error}</p>
        <Button
          onClick={() => fetchWithdrawals()}
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
            <span>🏧</span>
            <span>Retiros Pendientes</span>
            <span className="text-sm font-normal text-white/60">
              ({withdrawals.length})
            </span>
          </h3>
          
          <div className="flex items-center space-x-3">
            {/* Export selected button */}
            {selectedWithdrawals.size > 0 && (
              <Button
                onClick={exportSelectedForBanking}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 text-sm"
                size="sm"
              >
                📊 Exportar ({selectedWithdrawals.size})
              </Button>
            )}

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
              <option value="bank-asc">Banco A-Z</option>
            </select>

            <button
              onClick={() => fetchWithdrawals(pagination.offset)}
              disabled={loading}
              className="text-white/80 hover:text-white hover:rotate-180 transition-all duration-300"
              title="Actualizar"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <select
              value={filters.bankCode}
              onChange={(e) => handleFilterChange({ bankCode: e.target.value })}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los bancos</option>
              <option value="BCP">BCP</option>
              <option value="BBVA">BBVA</option>
              <option value="INTERBANK">Interbank</option>
              <option value="SCOTIABANK">Scotiabank</option>
            </select>
          </div>
          
          <div>
            <input
              type="number"
              value={filters.minAmount}
              onChange={(e) => handleFilterChange({ minAmount: e.target.value })}
              placeholder="Monto mín."
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 placeholder-white/50"
              min="0"
              step="0.01"
            />
          </div>
          
          <div>
            <input
              type="number"
              value={filters.maxAmount}
              onChange={(e) => handleFilterChange({ maxAmount: e.target.value })}
              placeholder="Monto máx."
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 placeholder-white/50"
              min="0"
              step="0.01"
            />
          </div>
          
          <div className="md:col-span-2">
            <div className="flex space-x-2">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Buscar por usuario, cuenta, referencia..."
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

      {/* Select All */}
      {withdrawals.length > 0 && (
        <div className="px-6 py-3 border-b border-white/10 bg-white/5">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedWithdrawals.size === withdrawals.length && withdrawals.length > 0}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="rounded"
            />
            <span className="text-white/80 text-sm">
              Seleccionar todos ({selectedWithdrawals.size}/{withdrawals.length})
            </span>
          </label>
        </div>
      )}

      {/* Withdrawals List */}
      <div className="divide-y divide-white/10">
        {withdrawals.length === 0 ? (
          <div className="p-8 text-center">
            <span className="text-4xl block mb-4">🏆</span>
            <p className="text-white/70 mb-2">No hay retiros pendientes</p>
            <p className="text-sm text-white/50">
              {filters.search || filters.bankCode || filters.minAmount || filters.maxAmount
                ? 'No se encontraron retiros con los filtros aplicados'
                : 'Todos los retiros han sido procesados'
              }
            </p>
          </div>
        ) : (
          withdrawals.map((withdrawal) => (
            <div
              key={withdrawal.id}
              className={`p-6 hover:bg-white/5 transition-colors ${
                selectedWithdrawals.has(withdrawal.id) ? 'bg-blue-500/10' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                {/* Left side - Selection and user info */}
                <div className="flex items-center space-x-4 flex-1">
                  {/* Selection checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedWithdrawals.has(withdrawal.id)}
                    onChange={(e) => handleSelectWithdrawal(withdrawal.id, e.target.checked)}
                    className="rounded"
                  />

                  {/* User avatar */}
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {withdrawal.user.username.charAt(0).toUpperCase()}
                  </div>

                  {/* User and withdrawal details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-semibold text-white truncate">
                        {withdrawal.user.fullName}
                      </p>
                      <span className="text-sm text-white/60">@{withdrawal.user.username}</span>
                      {getStatusBadge(withdrawal.status)}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-white/70">
                      <span className="flex items-center space-x-1">
                        <span>🏷️</span>
                        <span className="font-mono">{withdrawal.referenceCode}</span>
                      </span>
                      <span>
                        {new Date(withdrawal.createdAt).toLocaleDateString('es-PE', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    {/* Bank account info */}
                    <div className="mt-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <span className={getBankInfo(withdrawal.bankCode).color}>
                          {getBankInfo(withdrawal.bankCode).icon}
                        </span>
                        <span className="text-white/80">
                          {getBankInfo(withdrawal.bankCode).name} - {withdrawal.accountType}
                        </span>
                        <span className="font-mono text-white/70">
                          {withdrawal.accountNumber}
                        </span>
                      </div>
                      <div className="text-xs text-white/60 mt-1">
                        <span>{withdrawal.accountHolderName}</span>
                        <span className="ml-2">DNI: {withdrawal.accountHolderDni}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Center - Amount breakdown */}
                <div className="text-center mx-6">
                  <div className="text-lg font-bold text-orange-400">
                    {formatCurrency(withdrawal.netAmount)}
                  </div>
                  <div className="text-sm text-white/60">
                    {withdrawal.pearlsAmount} Perlas → {formatCurrency(withdrawal.amountInSoles)}
                  </div>
                  <div className="text-xs text-white/50 mt-1">
                    Comisión: {formatCurrency(withdrawal.commission)}
                  </div>
                </div>

                {/* Right side - Actions */}
                <div className="text-right">
                  <Button
                    onClick={() => onProcessWithdrawal?.(withdrawal)}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2"
                    size="sm"
                    disabled={withdrawal.status !== 'PENDING'}
                  >
                    {withdrawal.status === 'PENDING' ? '🔄 Procesar' : '✅ Procesado'}
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Footer */}
      {selectedWithdrawals.size > 0 && (
        <div className="p-6 border-t border-white/20 bg-blue-500/10">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <span className="font-semibold">{selectedWithdrawals.size} retiros seleccionados</span>
              <span className="text-white/70 ml-2">
                Total: {formatCurrency(
                  withdrawals
                    .filter(w => selectedWithdrawals.has(w.id))
                    .reduce((sum, w) => sum + w.netAmount, 0)
                )}
              </span>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={() => setSelectedWithdrawals(new Set())}
                variant="outline"
                size="sm"
                className="text-white border-white/20 hover:bg-white/10"
              >
                Limpiar selección
              </Button>
              <Button
                onClick={exportSelectedForBanking}
                className="bg-blue-500 hover:bg-blue-600 text-white"
                size="sm"
              >
                📊 Exportar para banco
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {withdrawals.length > 0 && pagination.total > pagination.limit && (
        <div className="p-6 border-t border-white/20">
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/60">
              Mostrando {pagination.offset + 1} a {Math.min(pagination.offset + pagination.limit, pagination.total)} de {pagination.total} retiros
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
      {loading && withdrawals.length > 0 && (
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

export default PendingWithdrawals