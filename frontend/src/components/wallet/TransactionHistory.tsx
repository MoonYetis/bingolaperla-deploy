import { useState, useEffect } from 'react'
import { walletApi, Transaction } from '@/services/walletApi'
import { formatCurrency } from '@/utils/currency'

interface TransactionHistoryProps {
  className?: string
  limit?: number
  showPagination?: boolean
}

const TransactionHistory = ({ 
  className = '', 
  limit = 10, 
  showPagination = true 
}: TransactionHistoryProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    limit,
    offset: 0,
    total: 0
  })
  const [filters, setFilters] = useState({
    type: 'all',
    dateFrom: '',
    dateTo: ''
  })

  const fetchTransactions = async (newOffset: number = 0) => {
    try {
      setLoading(true)
      setError(null)
      
      const params = {
        limit: pagination.limit,
        offset: newOffset,
        type: filters.type !== 'all' ? filters.type : undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined
      }

      const response = await walletApi.getTransactionHistory(params)
      setTransactions(response.transactions)
      setPagination(response.pagination)
    } catch (err) {
      console.error('Error fetching transactions:', err)
      setError('Error cargando historial de transacciones')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [filters])

  const getTransactionIcon = (transaction: Transaction): string => {
    switch (transaction.type) {
      case 'PEARL_PURCHASE': return '💳'
      case 'PEARL_TRANSFER': 
        return transaction.isCredit ? '📥' : '📤'
      case 'WITHDRAWAL': return '🏧'
      case 'GAME_PURCHASE': return '🎮'
      case 'GAME_WIN': return '🏆'
      default: return '💰'
    }
  }

  const getTransactionTitle = (transaction: Transaction): string => {
    switch (transaction.type) {
      case 'PEARL_PURCHASE': return 'Recarga de Perlas'
      case 'PEARL_TRANSFER': 
        if (transaction.isCredit) {
          return `Transferencia recibida${transaction.fromUser ? ` de @${transaction.fromUser.username}` : ''}`
        } else {
          return `Transferencia enviada${transaction.toUser ? ` a @${transaction.toUser.username}` : ''}`
        }
      case 'WITHDRAWAL': return 'Retiro de Perlas'
      case 'GAME_PURCHASE': return 'Compra cartón de bingo'
      case 'GAME_WIN': return 'Premio de bingo'
      default: return transaction.description || 'Transacción'
    }
  }

  const getTransactionColor = (transaction: Transaction): string => {
    if (transaction.isCredit) {
      return 'text-green-600'
    } else {
      return 'text-red-600'
    }
  }

  const getTransactionAmount = (transaction: Transaction): string => {
    const sign = transaction.isCredit ? '+' : '-'
    return `${sign} ${formatCurrency(transaction.amount)}`
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'COMPLETED': { color: 'bg-green-100 text-green-800', label: 'Completada' },
      'PENDING': { color: 'bg-yellow-100 text-yellow-800', label: 'Pendiente' },
      'FAILED': { color: 'bg-red-100 text-red-800', label: 'Fallida' },
      'REFUNDED': { color: 'bg-blue-100 text-blue-800', label: 'Reembolsada' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.COMPLETED
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setPagination(prev => ({ ...prev, offset: 0 }))
  }

  const handlePageChange = (newOffset: number) => {
    setPagination(prev => ({ ...prev, offset: newOffset }))
    fetchTransactions(newOffset)
  }

  if (loading && transactions.length === 0) {
    return (
      <div className={`bg-white rounded-2xl shadow-lg p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white rounded-2xl shadow-lg p-6 ${className}`}>
        <div className="text-center py-8">
          <span className="text-4xl mb-4 block">⚠️</span>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => fetchTransactions()}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-2xl shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
            <span>📋</span>
            <span>Historial de Transacciones</span>
          </h3>
          
          <button 
            onClick={() => fetchTransactions(pagination.offset)}
            className="text-gray-500 hover:text-gray-700 hover:rotate-180 transition-all duration-300"
            title="Actualizar"
          >
            🔄
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange({ type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas las transacciones</option>
              <option value="PEARL_PURCHASE">Recargas</option>
              <option value="PEARL_TRANSFER">Transferencias</option>
              <option value="WITHDRAWAL">Retiros</option>
              <option value="GAME_PURCHASE">Compras juego</option>
              <option value="GAME_WIN">Premios</option>
            </select>
          </div>
          
          <div>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange({ dateFrom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Desde"
            />
          </div>
          
          <div>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange({ dateTo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Hasta"
            />
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="divide-y divide-gray-100">
        {transactions.length === 0 ? (
          <div className="p-8 text-center">
            <span className="text-4xl block mb-4">📭</span>
            <p className="text-gray-600 mb-2">No hay transacciones</p>
            <p className="text-sm text-gray-500">
              {filters.type !== 'all' || filters.dateFrom || filters.dateTo 
                ? 'No se encontraron transacciones con los filtros aplicados' 
                : 'Aún no has realizado ninguna transacción'
              }
            </p>
          </div>
        ) : (
          transactions.map((transaction) => (
            <div key={transaction.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-4">
                {/* Icon */}
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">
                  {getTransactionIcon(transaction)}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">
                    {getTransactionTitle(transaction)}
                  </p>
                  
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-sm text-gray-500">
                      {new Date(transaction.createdAt).toLocaleDateString('es-PE', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    
                    {getStatusBadge(transaction.status)}
                    
                    {transaction.referenceId && (
                      <span className="text-xs text-gray-400 font-mono">
                        #{transaction.referenceId.slice(-6)}
                      </span>
                    )}
                  </div>

                  {/* Additional info for transfers */}
                  {transaction.type === 'PEARL_TRANSFER' && transaction.commissionAmount && (
                    <p className="text-xs text-gray-500 mt-1">
                      Comisión: {formatCurrency(transaction.commissionAmount)}
                    </p>
                  )}
                </div>

                {/* Amount */}
                <div className="text-right">
                  <p className={`font-bold text-lg ${getTransactionColor(transaction)}`}>
                    {getTransactionAmount(transaction)}
                  </p>
                  
                  {transaction.pearlsAmount && transaction.pearlsAmount !== transaction.amount && (
                    <p className="text-sm text-gray-500">
                      {transaction.isCredit ? '+' : '-'}{transaction.pearlsAmount} Perlas
                    </p>
                  )}
                </div>
              </div>

              {/* Description if available */}
              {transaction.description && transaction.type === 'PEARL_TRANSFER' && (
                <div className="mt-2 ml-14">
                  <p className="text-sm text-gray-600 italic">
                    "{transaction.description}"
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {showPagination && transactions.length > 0 && pagination.total > pagination.limit && (
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Mostrando {pagination.offset + 1} a {Math.min(pagination.offset + pagination.limit, pagination.total)} de {pagination.total} transacciones
            </p>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(Math.max(0, pagination.offset - pagination.limit))}
                disabled={pagination.offset === 0}
                className={`
                  px-3 py-2 text-sm rounded-lg transition-colors
                  ${pagination.offset === 0 
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                    : 'text-gray-700 bg-gray-200 hover:bg-gray-300'
                  }
                `}
              >
                ← Anterior
              </button>
              
              <span className="text-sm text-gray-600 px-2">
                {Math.floor(pagination.offset / pagination.limit) + 1} de {Math.ceil(pagination.total / pagination.limit)}
              </span>
              
              <button
                onClick={() => handlePageChange(pagination.offset + pagination.limit)}
                disabled={pagination.offset + pagination.limit >= pagination.total}
                className={`
                  px-3 py-2 text-sm rounded-lg transition-colors
                  ${pagination.offset + pagination.limit >= pagination.total
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                    : 'text-gray-700 bg-gray-200 hover:bg-gray-300'
                  }
                `}
              >
                Siguiente →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay for pagination */}
      {loading && transactions.length > 0 && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-2xl">
          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-lg">
            <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Cargando...</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default TransactionHistory