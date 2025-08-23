import { useState, useEffect } from 'react'
import { paymentApi } from '@/services/paymentApi'
import { formatCurrency, CURRENCY_CONSTANTS, isValidAmount } from '@/utils/currency'
import Button from '@/components/common/Button'
import Modal from '@/components/common/Modal'

interface Bank {
  code: string
  name: string
  accountNumber: string
  accountHolder: string
  accountType: string
}

interface PaymentMethod {
  id: string
  name: string
  type: 'BANK_TRANSFER' | 'DIGITAL_WALLET'
  code?: string
  instructions: string
  isActive: boolean
  bankInfo?: Bank
}

interface DepositRequest {
  id: string
  referenceCode: string
  amount: number
  bankAccount?: string
  bankAccountName?: string
  expiresAt: string
}

interface RechargeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (deposit: DepositRequest) => void
  className?: string
}

export const RechargeModal = ({ isOpen, onClose, onSuccess, className = '' }: RechargeModalProps) => {
  const [step, setStep] = useState<'amount' | 'method' | 'details' | 'confirmation' | 'success'>('amount')
  const [amount, setAmount] = useState<string>('')
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [depositResult, setDepositResult] = useState<DepositRequest | null>(null)

  // Campos del formulario
  const [formData, setFormData] = useState({
    userBankAccount: '',
    userBankAccountName: ''
  })

  useEffect(() => {
    if (isOpen) {
      fetchPaymentMethods()
      resetForm()
    }
  }, [isOpen])

  const resetForm = () => {
    setStep('amount')
    setAmount('')
    setSelectedMethod(null)
    setError(null)
    setDepositResult(null)
    setFormData({
      userBankAccount: '',
      userBankAccountName: ''
    })
  }

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true)
      const methods = await paymentApi.getPaymentMethods()
      setPaymentMethods(methods.filter(m => m.isActive))
    } catch (err) {
      console.error('Error fetching payment methods:', err)
      setError('Error cargando métodos de pago')
    } finally {
      setLoading(false)
    }
  }

  const handleAmountSubmit = () => {
    const numAmount = parseFloat(amount)
    
    if (!isValidAmount(numAmount, CURRENCY_CONSTANTS.MIN_DEPOSIT, CURRENCY_CONSTANTS.MAX_DEPOSIT)) {
      setError(`Ingresa un monto entre ${formatCurrency(CURRENCY_CONSTANTS.MIN_DEPOSIT)} y ${formatCurrency(CURRENCY_CONSTANTS.MAX_DEPOSIT)}`)
      return
    }

    setError(null)
    setStep('method')
  }

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method)
    setError(null)
    
    if (method.type === 'DIGITAL_WALLET') {
      // Para billeteras digitales, ir directo a confirmación
      setStep('confirmation')
    } else {
      // Para bancos, pedir detalles de cuenta
      setStep('details')
    }
  }

  const handleDetailsSubmit = () => {
    if (!formData.userBankAccount.trim() || !formData.userBankAccountName.trim()) {
      setError('Completa todos los campos requeridos')
      return
    }

    setError(null)
    setStep('confirmation')
  }

  const handleConfirmDeposit = async () => {
    if (!selectedMethod) return

    try {
      setLoading(true)
      setError(null)

      const depositData = {
        amount: parseFloat(amount),
        paymentMethodId: selectedMethod.id,
        bankAccount: selectedMethod.type === 'BANK_TRANSFER' ? formData.userBankAccount : undefined,
        bankAccountName: selectedMethod.type === 'BANK_TRANSFER' ? formData.userBankAccountName : undefined
      }

      const result = await paymentApi.createDepositRequest(depositData)
      setDepositResult(result)
      setStep('success')
      
      if (onSuccess) {
        onSuccess(result)
      }
    } catch (err) {
      console.error('Error creating deposit request:', err)
      setError(err instanceof Error ? err.message : 'Error procesando solicitud')
    } finally {
      setLoading(false)
    }
  }

  const quickAmounts = [50, 100, 200, 500, 1000]
  const numAmount = parseFloat(amount) || 0

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      className={`max-w-md w-full mx-4 ${className}`}
      showCloseButton={step !== 'success'}
    >
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">💳</span>
            <div>
              <h2 className="text-xl font-bold">Recargar Billetera</h2>
              <p className="text-green-100 text-sm">
                {step === 'amount' && 'Ingresa el monto a recargar'}
                {step === 'method' && 'Selecciona método de pago'}
                {step === 'details' && 'Datos de tu cuenta'}
                {step === 'confirmation' && 'Confirmar recarga'}
                {step === 'success' && '¡Solicitud creada exitosamente!'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Step 1: Amount Input */}
          {step === 'amount' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto a recargar (Soles)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">
                    S/
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                    min={CURRENCY_CONSTANTS.MIN_DEPOSIT}
                    max={CURRENCY_CONSTANTS.MAX_DEPOSIT}
                    step="0.01"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo: {formatCurrency(CURRENCY_CONSTANTS.MIN_DEPOSIT)} - 
                  Máximo: {formatCurrency(CURRENCY_CONSTANTS.MAX_DEPOSIT)}
                </p>
              </div>

              {/* Quick amount buttons */}
              <div>
                <p className="text-sm text-gray-600 mb-2">Montos rápidos:</p>
                <div className="grid grid-cols-3 gap-2">
                  {quickAmounts.map((quickAmount) => (
                    <button
                      key={quickAmount}
                      onClick={() => setAmount(quickAmount.toString())}
                      className={`
                        py-2 px-3 text-sm rounded-lg border transition-all
                        ${amount === quickAmount.toString() 
                          ? 'bg-green-500 text-white border-green-500' 
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }
                      `}
                    >
                      S/ {quickAmount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Perlas equivalent */}
              {numAmount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Recibirás:</span>
                    <div className="text-right">
                      <p className="font-bold text-yellow-600">{numAmount.toFixed(2)} Perlas</p>
                      <p className="text-xs text-gray-600">1 Sol = 1 Perla</p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleAmountSubmit}
                disabled={!amount || numAmount < CURRENCY_CONSTANTS.MIN_DEPOSIT}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium"
                size="lg"
              >
                Continuar
              </Button>
            </div>
          )}

          {/* Step 2: Payment Method Selection */}
          {step === 'method' && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-lg font-semibold text-gray-800">
                  Monto: {formatCurrency(numAmount)}
                </p>
                <p className="text-sm text-gray-600">Selecciona tu método de pago preferido</p>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse border rounded-lg p-4">
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => handleMethodSelect(method)}
                      className={`
                        w-full p-4 border rounded-lg text-left transition-all
                        hover:border-green-500 hover:bg-green-50
                        ${selectedMethod?.id === method.id ? 'border-green-500 bg-green-50' : 'border-gray-200'}
                      `}
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">
                          {method.type === 'BANK_TRANSFER' ? '🏦' : '📱'}
                        </span>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800">{method.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{method.instructions}</p>
                          {method.bankInfo && (
                            <p className="text-xs text-green-600 mt-1">
                              Cuenta: {method.bankInfo.accountNumber}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex space-x-3">
                <Button
                  onClick={() => setStep('amount')}
                  variant="outline"
                  className="flex-1 py-2"
                >
                  Atrás
                </Button>
                <Button
                  onClick={() => selectedMethod && handleMethodSelect(selectedMethod)}
                  disabled={!selectedMethod}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2"
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Bank Details */}
          {step === 'details' && selectedMethod?.type === 'BANK_TRANSFER' && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-lg font-semibold text-gray-800">
                  {formatCurrency(numAmount)} → {selectedMethod.name}
                </p>
                <p className="text-sm text-gray-600">Datos de tu cuenta origen</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de cuenta origen *
                </label>
                <input
                  type="text"
                  value={formData.userBankAccount}
                  onChange={(e) => setFormData(prev => ({ ...prev, userBankAccount: e.target.value }))}
                  placeholder="Ej: 194-123456789-0-12"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Desde qué cuenta realizarás la transferencia
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del titular *
                </label>
                <input
                  type="text"
                  value={formData.userBankAccountName}
                  onChange={(e) => setFormData(prev => ({ ...prev, userBankAccountName: e.target.value }))}
                  placeholder="Tu nombre completo"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tal como aparece en tu documento de identidad
                </p>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={() => setStep('method')}
                  variant="outline"
                  className="flex-1 py-2"
                >
                  Atrás
                </Button>
                <Button
                  onClick={handleDetailsSubmit}
                  disabled={!formData.userBankAccount.trim() || !formData.userBankAccountName.trim()}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2"
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 'confirmation' && selectedMethod && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Confirmar Solicitud</h3>
                <p className="text-sm text-gray-600">Revisa los datos antes de continuar</p>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monto:</span>
                  <span className="font-semibold">{formatCurrency(numAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Recibirás:</span>
                  <span className="font-semibold text-green-600">{numAmount.toFixed(2)} Perlas</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Método:</span>
                  <span className="font-semibold">{selectedMethod.name}</span>
                </div>
                {selectedMethod.type === 'BANK_TRANSFER' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tu cuenta:</span>
                      <span className="font-semibold">{formData.userBankAccount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Titular:</span>
                      <span className="font-semibold">{formData.userBankAccountName}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">📋 Siguiente paso:</h4>
                <p className="text-sm text-blue-700">
                  Al confirmar, recibirás los datos de destino para realizar la transferencia. 
                  Tu solicitud expirará en 24 horas si no se completa.
                </p>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={() => setStep(selectedMethod.type === 'BANK_TRANSFER' ? 'details' : 'method')}
                  variant="outline"
                  className="flex-1 py-2"
                  disabled={loading}
                >
                  Atrás
                </Button>
                <Button
                  onClick={handleConfirmDeposit}
                  disabled={loading}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2"
                  size="lg"
                >
                  {loading ? 'Procesando...' : 'Confirmar Solicitud'}
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Success */}
          {step === 'success' && depositResult && (
            <div className="text-center space-y-4">
              <div className="text-6xl mb-4">✅</div>
              
              <div>
                <h3 className="text-xl font-bold text-green-600 mb-2">
                  ¡Solicitud Creada!
                </h3>
                <p className="text-gray-600 mb-4">
                  Tu código de referencia es:
                </p>
                <div className="bg-gray-100 rounded-lg p-3 mb-4">
                  <code className="text-lg font-mono font-bold text-gray-800">
                    {depositResult.referenceCode}
                  </code>
                </div>
              </div>

              {selectedMethod?.bankInfo && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
                  <h4 className="font-medium text-green-800 mb-2">
                    💳 Datos para transferencia:
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Banco:</span>
                      <span className="font-semibold">{selectedMethod.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cuenta:</span>
                      <span className="font-mono">{selectedMethod.bankInfo.accountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Titular:</span>
                      <span className="font-semibold">{selectedMethod.bankInfo.accountHolder}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monto exacto:</span>
                      <span className="font-bold text-green-600">{formatCurrency(numAmount)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-left">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Importante:</strong><br/>
                  • Transfiere exactamente {formatCurrency(numAmount)}<br/>
                  • Usa el código {depositResult.referenceCode} como concepto<br/>
                  • La solicitud expira el {new Date(depositResult.expiresAt).toLocaleString('es-PE')}<br/>
                  • Las Perlas se acreditarán tras validación manual (1-4 horas)
                </p>
              </div>

              <Button
                onClick={onClose}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium"
                size="lg"
              >
                Entendido
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default RechargeModal