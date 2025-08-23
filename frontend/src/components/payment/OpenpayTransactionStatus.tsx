import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, CreditCard, Building2 } from 'lucide-react';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { openpayApi, TransactionStatus } from '@/services/openpayApi';
import { useToast } from '@/contexts/ToastContext';

interface OpenpayTransactionStatusProps {
  transactionId: string;
  onClose?: () => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function OpenpayTransactionStatus({
  transactionId,
  onClose,
  autoRefresh = true,
  refreshInterval = 5000
}: OpenpayTransactionStatusProps) {
  const [transaction, setTransaction] = useState<TransactionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchTransactionStatus = async () => {
    try {
      const transactionData = await openpayApi.getTransactionStatus(transactionId);
      setTransaction(transactionData);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching transaction status:', err);
      setError(err.message || 'Error loading transaction status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactionStatus();
  }, [transactionId]);

  useEffect(() => {
    if (autoRefresh && transaction && 
        ['pending', 'charge_pending'].includes(transaction.status)) {
      const interval = setInterval(fetchTransactionStatus, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, transaction?.status, refreshInterval]);

  const getStatusIcon = (status: string) => {
    const iconProps = { size: 20, className: 'flex-shrink-0' };
    
    switch (status) {
      case 'completed':
        return <CheckCircle {...iconProps} className="text-green-600 flex-shrink-0" />;
      case 'failed':
      case 'cancelled':
        return <XCircle {...iconProps} className="text-red-600 flex-shrink-0" />;
      case 'pending':
      case 'charge_pending':
        return <Clock {...iconProps} className="text-yellow-600 flex-shrink-0" />;
      default:
        return <AlertCircle {...iconProps} className="text-gray-600 flex-shrink-0" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'failed':
      case 'cancelled':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'pending':
      case 'charge_pending':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard', 'success');
    } catch (err) {
      showToast('Failed to copy', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600">Loading transaction details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center space-x-2 text-red-800 mb-3">
          <XCircle size={20} />
          <h3 className="font-medium">Error Loading Transaction</h3>
        </div>
        <p className="text-red-700 mb-4">{error}</p>
        <div className="flex space-x-3">
          <Button 
            onClick={fetchTransactionStatus} 
            variant="secondary" 
            size="sm"
          >
            Try Again
          </Button>
          {onClose && (
            <Button onClick={onClose} variant="ghost" size="sm">
              Close
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="p-4 text-center text-gray-600">
        Transaction not found
      </div>
    );
  }

  const statusInfo = openpayApi.getPaymentStatusInfo(transaction.status);
  const methodDisplay = openpayApi.getPaymentMethodDisplayName(transaction.paymentMethod);
  const amountDisplay = openpayApi.formatCurrency(transaction.amount, transaction.currency);

  return (
    <div className="space-y-6">
      {/* Transaction Status Header */}
      <div className={`p-4 border rounded-lg ${getStatusColor(transaction.status)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon(transaction.status)}
            <div>
              <h3 className="font-semibold text-lg">
                {statusInfo.icon} {statusInfo.text}
              </h3>
              <p className="text-sm opacity-90">
                Payment {transaction.status === 'completed' ? 'completed successfully' : 'status'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-xl">{amountDisplay}</p>
            <p className="text-sm opacity-90">{transaction.depositRequest.pearlsAmount} Perlas</p>
          </div>
        </div>
      </div>

      {/* Transaction Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Payment Details</h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Transaction ID:</span>
              <button 
                onClick={() => copyToClipboard(transaction.id)}
                className="font-mono text-blue-600 hover:text-blue-800 transition-colors"
                title="Click to copy"
              >
                {transaction.id.slice(0, 8)}...
              </button>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Reference:</span>
              <button 
                onClick={() => copyToClipboard(transaction.depositRequest.referenceCode)}
                className="font-mono text-blue-600 hover:text-blue-800 transition-colors"
                title="Click to copy"
              >
                {transaction.depositRequest.referenceCode}
              </button>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Payment Method:</span>
              <div className="flex items-center space-x-2">
                {getPaymentMethodIcon(transaction.paymentMethod)}
                <span>{methodDisplay}</span>
              </div>
            </div>
            
            {transaction.authorizationCode && (
              <div className="flex justify-between">
                <span className="text-gray-600">Authorization:</span>
                <span className="font-mono">{transaction.authorizationCode}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Timeline</h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Created:</span>
              <span>{new Date(transaction.createdAt).toLocaleString('es-PE')}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Updated:</span>
              <span>{new Date(transaction.updatedAt).toLocaleString('es-PE')}</span>
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

      {/* Pending Status Actions */}
      {['pending', 'charge_pending'].includes(transaction.status) && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <Clock size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-blue-800 font-medium">Payment Processing</p>
              <p className="text-blue-700 text-sm mt-1">
                Your payment is being processed. This usually takes a few minutes. 
                Perlas will be added to your account automatically once confirmed.
              </p>
              {autoRefresh && (
                <p className="text-blue-600 text-xs mt-2">
                  Status updates automatically every {refreshInterval / 1000} seconds
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {transaction.status === 'completed' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-green-800 font-medium">Payment Completed!</p>
              <p className="text-green-700 text-sm mt-1">
                {transaction.depositRequest.pearlsAmount} Perlas have been added to your account. 
                You can now use them to purchase bingo cards and participate in games.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Button 
          onClick={fetchTransactionStatus} 
          variant="ghost"
          disabled={loading}
        >
          Refresh Status
        </Button>
        
        {onClose && (
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        )}
      </div>
    </div>
  );
}