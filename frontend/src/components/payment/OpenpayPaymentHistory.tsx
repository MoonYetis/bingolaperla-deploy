import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, CreditCard, Building2, ChevronDown, ChevronRight, Eye } from 'lucide-react';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Modal from '@/components/common/Modal';
import OpenpayTransactionStatus from './OpenpayTransactionStatus';
import { openpayApi, TransactionHistory, TransactionStatus } from '@/services/openpayApi';
import { useToast } from '@/contexts/ToastContext';

interface OpenpayPaymentHistoryProps {
  limit?: number;
  showPagination?: boolean;
  compact?: boolean;
}

export default function OpenpayPaymentHistory({
  limit = 10,
  showPagination = true,
  compact = false
}: OpenpayPaymentHistoryProps) {
  const [history, setHistory] = useState<TransactionHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [expandedTransactions, setExpandedTransactions] = useState<Set<string>>(new Set());
  const { showToast } = useToast();

  const fetchHistory = async (page: number = 1) => {
    try {
      setLoading(true);
      const data = await openpayApi.getTransactionHistory(page, limit);
      setHistory(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching payment history:', err);
      setError(err.message || 'Error loading payment history');
      showToast('Error loading payment history', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(currentPage);
  }, [currentPage, limit]);

  const toggleTransactionExpanded = (transactionId: string) => {
    const newExpanded = new Set(expandedTransactions);
    if (newExpanded.has(transactionId)) {
      newExpanded.delete(transactionId);
    } else {
      newExpanded.add(transactionId);
    }
    setExpandedTransactions(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    const iconProps = { size: 16, className: 'flex-shrink-0' };
    
    switch (status) {
      case 'completed':
        return <CheckCircle {...iconProps} className="text-green-600" />;
      case 'failed':
      case 'cancelled':
        return <XCircle {...iconProps} className="text-red-600" />;
      case 'pending':
      case 'charge_pending':
        return <Clock {...iconProps} className="text-yellow-600" />;
      default:
        return <Clock {...iconProps} className="text-gray-600" />;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    if (method.includes('card')) {
      return <CreditCard size={16} className="text-blue-600" />;
    } else if (method.includes('bank') || method.includes('transfer')) {
      return <Building2 size={16} className="text-purple-600" />;
    }
    return null;
  };

  const renderTransactionRow = (transaction: TransactionStatus) => {
    const isExpanded = expandedTransactions.has(transaction.id);
    const statusInfo = openpayApi.getPaymentStatusInfo(transaction.status);
    const methodDisplay = openpayApi.getPaymentMethodDisplayName(transaction.paymentMethod);
    const amountDisplay = openpayApi.formatCurrency(transaction.amount, transaction.currency);

    return (
      <div key={transaction.id} className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Transaction Summary Row */}
        <div className="p-4 bg-white hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              {/* Expand/Collapse Button */}
              {!compact && (
                <button
                  onClick={() => toggleTransactionExpanded(transaction.id)}
                  className="text-gray-500 hover:text-gray-700 transition-colors p-1"
                  title={isExpanded ? 'Collapse details' : 'Expand details'}
                >
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
              )}

              {/* Status Icon */}
              {getStatusIcon(transaction.status)}

              {/* Transaction Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  {getPaymentMethodIcon(transaction.paymentMethod)}
                  <span className="font-medium text-gray-900">
                    {methodDisplay}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    transaction.status === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : transaction.status === 'pending' || transaction.status === 'charge_pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {statusInfo.text}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {transaction.depositRequest.referenceCode} • {new Date(transaction.createdAt).toLocaleDateString('es-PE')}
                </div>
              </div>

              {/* Amount */}
              <div className="text-right">
                <div className="font-semibold text-lg text-gray-900">
                  {amountDisplay}
                </div>
                <div className="text-sm text-gray-600">
                  {transaction.depositRequest.pearlsAmount} Perlas
                </div>
              </div>

              {/* View Details Button */}
              <Button
                onClick={() => setSelectedTransaction(transaction.id)}
                variant="ghost"
                size="sm"
                className="ml-2"
              >
                <Eye size={16} />
              </Button>
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && !compact && (
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Transaction Details</h5>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-mono text-gray-900">{transaction.id.slice(0, 12)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Openpay ID:</span>
                    <span className="font-mono text-gray-900">{transaction.openpayChargeId.slice(0, 12)}...</span>
                  </div>
                  {transaction.authorizationCode && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Authorization:</span>
                      <span className="font-mono text-gray-900">{transaction.authorizationCode}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Timing</h5>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span>{new Date(transaction.createdAt).toLocaleString('es-PE')}</span>
                  </div>
                  {transaction.chargedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Charged:</span>
                      <span>{new Date(transaction.chargedAt).toLocaleString('es-PE')}</span>
                    </div>
                  )}
                  {transaction.expiresAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expires:</span>
                      <span>{new Date(transaction.expiresAt).toLocaleString('es-PE')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600">Loading payment history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center space-x-2 text-red-800 mb-3">
          <XCircle size={20} />
          <h3 className="font-medium">Error Loading History</h3>
        </div>
        <p className="text-red-700 mb-4">{error}</p>
        <Button onClick={() => fetchHistory(currentPage)} variant="secondary">
          Try Again
        </Button>
      </div>
    );
  }

  if (!history || history.transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <CreditCard size={24} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment History</h3>
        <p className="text-gray-600">
          Your Openpay transaction history will appear here once you make your first payment.
        </p>
      </div>
    );
  }

  const totalPages = Math.ceil(history.total / limit);

  return (
    <div className="space-y-4">
      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
            <p className="text-sm text-gray-600">{history.total} total transactions</p>
          </div>
          <Button onClick={() => fetchHistory(currentPage)} variant="ghost" size="sm">
            Refresh
          </Button>
        </div>
      )}

      {/* Transaction List */}
      <div className="space-y-3">
        {history.transactions.map(renderTransactionRow)}
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              variant="ghost"
              size="sm"
            >
              Previous
            </Button>
            <Button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              variant="ghost"
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <Modal
          isOpen={!!selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          maxWidth="lg"
        >
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Transaction Details</h2>
            <OpenpayTransactionStatus
              transactionId={selectedTransaction}
              onClose={() => setSelectedTransaction(null)}
              autoRefresh={true}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}