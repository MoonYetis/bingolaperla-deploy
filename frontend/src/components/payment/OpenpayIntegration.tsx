import React, { useState } from 'react';
import { CreditCard, Plus, History, Shield } from 'lucide-react';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import OpenpayPaymentModal from './OpenpayPaymentModal';
import OpenpayPaymentHistory from './OpenpayPaymentHistory';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';

interface OpenpayIntegrationProps {
  onPaymentSuccess?: (transactionId: string, amount: number) => void;
  defaultAmount?: number;
  showHistory?: boolean;
  compact?: boolean;
}

export default function OpenpayIntegration({
  onPaymentSuccess,
  defaultAmount = 50,
  showHistory = true,
  compact = false
}: OpenpayIntegrationProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(defaultAmount);
  const { user } = useAuth();
  const { showToast } = useToast();

  const handlePaymentSuccess = (transactionId: string) => {
    setShowPaymentModal(false);
    showToast('¡Pago procesado exitosamente!', 'success');
    if (onPaymentSuccess) {
      onPaymentSuccess(transactionId, paymentAmount);
    }
  };

  const quickAmounts = [10, 25, 50, 100, 200, 500];

  if (!user) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
        <p className="text-gray-600">Please log in to access payment features</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Section */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <CreditCard size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Openpay - Depósitos Instantáneos</h3>
              <p className="text-sm text-gray-600">
                Paga con tarjeta o transferencia bancaria de forma segura
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Quick Amount Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecciona el monto a depositar
            </label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {quickAmounts.map(amount => (
                <button
                  key={amount}
                  onClick={() => setPaymentAmount(amount)}
                  className={`p-3 text-sm font-medium rounded-lg border transition-all ${
                    paymentAmount === amount
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  S/ {amount}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount Input */}
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto personalizado
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  S/
                </span>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingresa el monto"
                />
              </div>
            </div>
            
            <Button
              onClick={() => setShowPaymentModal(true)}
              disabled={!paymentAmount || paymentAmount < 1}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 mt-6"
            >
              <Plus size={16} className="mr-2" />
              Depositar
            </Button>
          </div>

          {/* Conversion Info */}
          {paymentAmount > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700">Recibirás:</span>
                <span className="font-semibold text-blue-800">
                  {paymentAmount.toFixed(0)} Perlas
                </span>
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Conversión 1:1 • 1 Sol = 1 Perla
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <Shield size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-green-800">Pagos 100% Seguros</p>
              <p className="text-green-700">
                Procesados por Openpay.pe con certificación PCI DSS Nivel 1. 
                Tus datos están completamente protegidos.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History Section */}
      {showHistory && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <History size={20} className="text-gray-600" />
                <h3 className="font-semibold text-gray-900">Historial de Pagos</h3>
              </div>
              <Button
                onClick={() => setShowHistoryModal(true)}
                variant="ghost"
                size="sm"
              >
                Ver Todo
              </Button>
            </div>
          </div>
          
          <div className="p-4">
            <OpenpayPaymentHistory 
              limit={5} 
              showPagination={false} 
              compact={true} 
            />
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <OpenpayPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        depositAmount={paymentAmount}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Full History Modal */}
      {showHistoryModal && (
        <Modal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          maxWidth="4xl"
        >
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Historial Completo de Pagos Openpay
            </h2>
            <OpenpayPaymentHistory showPagination={true} compact={false} />
          </div>
        </Modal>
      )}
    </div>
  );
}