import React, { useState, useEffect } from 'react';
import { X, CreditCard, Building2, Wallet, ShieldCheck, AlertCircle } from 'lucide-react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/hooks/useAuth';
import { openpayApi } from '@/services/openpayApi';

export type PaymentMethod = 'card' | 'bank_transfer' | 'cash';

interface OpenpayPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  depositAmount: number;
  onPaymentSuccess: (transactionId: string) => void;
}

interface CardFormData {
  cardNumber: string;
  expirationMonth: string;
  expirationYear: string;
  cvv: string;
  holderName: string;
}

interface BankTransferInstructions {
  bankName: string;
  accountNumber: string;
  reference: string;
  expirationDate: string;
}

export default function OpenpayPaymentModal({
  isOpen,
  onClose,
  depositAmount,
  onPaymentSuccess
}: OpenpayPaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [deviceSessionId] = useState(() => generateDeviceSessionId());
  const [cardForm, setCardForm] = useState<CardFormData>({
    cardNumber: '',
    expirationMonth: '',
    expirationYear: '',
    cvv: '',
    holderName: ''
  });
  const [bankInstructions, setBankInstructions] = useState<BankTransferInstructions | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    // Load Openpay.js SDK
    const script = document.createElement('script');
    script.src = 'https://js.openpay.pe/openpay.v1.min.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const generateDeviceSessionId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  };

  const createOpenpayToken = async (cardData: CardFormData): Promise<any> => {
    return new Promise((resolve, reject) => {
      // @ts-ignore - Openpay SDK loaded dynamically
      if (!window.OpenPay) {
        reject(new Error('Openpay SDK not loaded'));
        return;
      }

      // @ts-ignore
      window.OpenPay.token.create({
        card_number: cardData.cardNumber.replace(/\s/g, ''),
        holder_name: cardData.holderName,
        expiration_year: cardData.expirationYear,
        expiration_month: cardData.expirationMonth,
        cvv2: cardData.cvv
      }, resolve, reject);
    });
  };

  const handleCardPayment = async () => {
    if (!validateCardForm()) return;

    setIsProcessing(true);
    setError(null);

    try {
      // 1. Create Openpay token with card data
      const token = await createOpenpayToken(cardForm);

      // 2. Process payment through backend
      const result = await openpayApi.processCardPayment({
        amount: depositAmount,
        token: token.id,
        deviceSessionId,
        customerEmail: user?.email || '',
        customerName: user?.fullName || user?.username || '',
        customerPhone: user?.phone
      });

      if (result.success) {
        onPaymentSuccess(result.transactionId);
        showToast('¡Pago procesado exitosamente! Perlas agregadas a tu cuenta.', 'success');
        onClose();
      } else {
        setError(result.error || 'Error procesando el pago');
        showToast(result.error || 'Error procesando el pago', 'error');
      }

    } catch (error: any) {
      console.error('Payment processing error:', error);
      const errorMessage = error.message || 'Error procesando el pago';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBankTransfer = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await openpayApi.processBankTransfer({
        amount: depositAmount,
        customerEmail: user?.email || '',
        customerName: user?.fullName || user?.username || ''
      });

      if (result.success && result.paymentInstructions) {
        setBankInstructions(result.paymentInstructions);
        showToast('Instrucciones de transferencia generadas', 'success');
      } else {
        setError(result.error || 'Error creando transferencia bancaria');
        showToast(result.error || 'Error creando transferencia bancaria', 'error');
      }

    } catch (error: any) {
      console.error('Bank transfer error:', error);
      const errorMessage = error.message || 'Error creando transferencia bancaria';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const validateCardForm = (): boolean => {
    const { cardNumber, expirationMonth, expirationYear, cvv, holderName } = cardForm;
    
    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 13) {
      setError('Número de tarjeta inválido');
      return false;
    }
    
    if (!expirationMonth || !expirationYear) {
      setError('Fecha de expiración requerida');
      return false;
    }
    
    if (!cvv || cvv.length < 3) {
      setError('CVV inválido');
      return false;
    }
    
    if (!holderName.trim()) {
      setError('Nombre del titular requerido');
      return false;
    }

    return true;
  };

  const formatCardNumber = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g) || [];
    return groups.join(' ').substring(0, 19);
  };

  const handleCardInputChange = (field: keyof CardFormData, value: string) => {
    let formattedValue = value;
    
    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substring(0, 4);
    } else if (field === 'expirationMonth') {
      formattedValue = value.replace(/\D/g, '').substring(0, 2);
      if (parseInt(formattedValue) > 12) formattedValue = '12';
    } else if (field === 'expirationYear') {
      formattedValue = value.replace(/\D/g, '').substring(0, 2);
    }

    setCardForm(prev => ({
      ...prev,
      [field]: formattedValue
    }));

    if (error) setError(null);
  };

  const renderPaymentMethodSelector = () => (
    <div className="grid grid-cols-3 gap-3 mb-6">
      <button
        className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-all ${
          selectedMethod === 'card'
            ? 'border-blue-500 bg-blue-50 text-blue-700'
            : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => setSelectedMethod('card')}
      >
        <CreditCard size={24} />
        <span className="text-sm font-medium">Tarjeta</span>
      </button>

      <button
        className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-all ${
          selectedMethod === 'bank_transfer'
            ? 'border-blue-500 bg-blue-50 text-blue-700'
            : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => setSelectedMethod('bank_transfer')}
      >
        <Building2 size={24} />
        <span className="text-sm font-medium">Transferencia</span>
      </button>

      <button
        className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-all opacity-50 cursor-not-allowed`}
        disabled
      >
        <Wallet size={24} />
        <span className="text-sm font-medium">Efectivo</span>
        <span className="text-xs text-gray-500">Próximamente</span>
      </button>
    </div>
  );

  const renderCardForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Número de tarjeta
        </label>
        <Input
          type="text"
          placeholder="1234 5678 9012 3456"
          value={cardForm.cardNumber}
          onChange={(e) => handleCardInputChange('cardNumber', e.target.value)}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nombre del titular
        </label>
        <Input
          type="text"
          placeholder="Como aparece en la tarjeta"
          value={cardForm.holderName}
          onChange={(e) => handleCardInputChange('holderName', e.target.value.toUpperCase())}
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mes
          </label>
          <Input
            type="text"
            placeholder="MM"
            value={cardForm.expirationMonth}
            onChange={(e) => handleCardInputChange('expirationMonth', e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Año
          </label>
          <Input
            type="text"
            placeholder="AA"
            value={cardForm.expirationYear}
            onChange={(e) => handleCardInputChange('expirationYear', e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CVV
          </label>
          <Input
            type="text"
            placeholder="123"
            value={cardForm.cvv}
            onChange={(e) => handleCardInputChange('cvv', e.target.value)}
          />
        </div>
      </div>

      <Button
        onClick={handleCardPayment}
        disabled={isProcessing}
        className="w-full bg-green-600 hover:bg-green-700"
      >
        {isProcessing ? (
          <div className="flex items-center justify-center space-x-2">
            <LoadingSpinner size="sm" />
            <span>Procesando pago...</span>
          </div>
        ) : (
          `Pagar ${depositAmount.toFixed(2)} Soles`
        )}
      </Button>
    </div>
  );

  const renderBankTransferForm = () => {
    if (bankInstructions) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-3">
            Instrucciones de Transferencia
          </h3>
          
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium text-gray-700">Banco:</span>
              <span className="ml-2">{bankInstructions.bankName}</span>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Número de cuenta:</span>
              <span className="ml-2 font-mono bg-white px-2 py-1 rounded">
                {bankInstructions.accountNumber}
              </span>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Referencia:</span>
              <span className="ml-2 font-mono bg-white px-2 py-1 rounded">
                {bankInstructions.reference}
              </span>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Monto:</span>
              <span className="ml-2 font-semibold">S/ {depositAmount.toFixed(2)}</span>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Válido hasta:</span>
              <span className="ml-2">{new Date(bankInstructions.expirationDate).toLocaleDateString('es-PE')}</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded">
            <div className="flex items-start space-x-2">
              <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-800">
                <p className="font-medium">Importante:</p>
                <p>Realiza la transferencia usando exactamente la referencia mostrada. 
                   Las Perlas se agregarán automáticamente a tu cuenta una vez confirmado el pago.</p>
              </div>
            </div>
          </div>

          <Button
            onClick={onClose}
            variant="secondary"
            className="w-full mt-4"
          >
            Entendido
          </Button>
        </div>
      );
    }

    return (
      <div className="text-center space-y-4">
        <p className="text-gray-600">
          Se generarán las instrucciones para realizar una transferencia bancaria.
        </p>
        
        <Button
          onClick={handleBankTransfer}
          disabled={isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <div className="flex items-center justify-center space-x-2">
              <LoadingSpinner size="sm" />
              <span>Generando instrucciones...</span>
            </div>
          ) : (
            'Generar Instrucciones'
          )}
        </Button>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Depositar {depositAmount.toFixed(2)} Soles
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Payment Method Selector */}
        {renderPaymentMethodSelector()}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertCircle size={16} />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Payment Form */}
        {selectedMethod === 'card' && renderCardForm()}
        {selectedMethod === 'bank_transfer' && renderBankTransferForm()}

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center text-green-700">
            <ShieldCheck size={20} className="mr-2 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Pagos 100% Seguros</p>
              <p>Procesados por Openpay.pe - Certificación PCI DSS Nivel 1</p>
            </div>
          </div>
        </div>

        {/* Conversion Info */}
        <div className="mt-4 text-center text-sm text-gray-600">
          Recibirás <span className="font-semibold text-blue-600">
            {depositAmount.toFixed(0)} Perlas
          </span> (1 Perla = 1 Sol)
        </div>
      </div>
    </Modal>
  );
}