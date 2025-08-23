import { useState, useEffect, useMemo } from 'react'
import { walletApi, UsernameVerification, TransferPearlsResponse } from '@/services/walletApi'
import { formatCurrency, CURRENCY_CONSTANTS, isValidAmount } from '@/utils/currency'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/common/Button'
import Modal from '@/components/common/Modal'

interface TransferModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (transfer: TransferPearlsResponse) => void
  className?: string
  defaultRecipient?: string
}

export const TransferModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  className = '',
  defaultRecipient = ''
}: TransferModalProps) => {
  const { user } = useAuth()
  const [step, setStep] = useState<'recipient' | 'amount' | 'confirmation' | 'success'>('recipient')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form data
  const [recipientUsername, setRecipientUsername] = useState(defaultRecipient)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  
  // Verification and results
  const [recipientVerification, setRecipientVerification] = useState<UsernameVerification | null>(null)
  const [isVerifyingRecipient, setIsVerifyingRecipient] = useState(false)
  const [transferResult, setTransferResult] = useState<TransferPearlsResponse | null>(null)

  // Commission calculation (mock - should come from API)
  const TRANSFER_COMMISSION = CURRENCY_CONSTANTS.DEFAULT_COMMISSION
  const numAmount = parseFloat(amount) || 0
  const totalDebit = numAmount + TRANSFER_COMMISSION

  const resetForm = () => {
    setStep('recipient')
    setRecipientUsername(defaultRecipient)
    setAmount('')
    setDescription('')
    setRecipientVerification(null)
    setError(null)
    setTransferResult(null)
  }

  useEffect(() => {
    if (isOpen) {
      resetForm()
    }
  }, [isOpen, defaultRecipient])

  // Auto-verify username when typing stops
  useEffect(() => {
    if (!recipientUsername.trim() || recipientUsername === user?.username) {
      setRecipientVerification(null)
      return
    }

    const timeoutId = setTimeout(() => {
      verifyRecipient(recipientUsername)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [recipientUsername, user?.username])

  const verifyRecipient = async (username: string) => {
    if (!username.trim()) return

    try {
      setIsVerifyingRecipient(true)
      setError(null)
      
      const verification = await walletApi.verifyUsername(username)
      setRecipientVerification(verification)
      
      if (!verification.exists) {
        setError(`El usuario "${username}" no existe`)
      }
    } catch (err) {
      console.error('Error verifying recipient:', err)
      setError('Error verificando destinatario')
      setRecipientVerification(null)
    } finally {
      setIsVerifyingRecipient(false)
    }
  }

  const handleRecipientSubmit = () => {
    if (!recipientUsername.trim()) {
      setError('Ingresa el nombre de usuario del destinatario')
      return
    }

    if (recipientUsername === user?.username) {
      setError('No puedes transferir dinero a ti mismo')
      return
    }

    if (!recipientVerification?.exists) {
      setError('Usuario no válido o no encontrado')
      return
    }

    setError(null)
    setStep('amount')
  }

  const handleAmountSubmit = () => {
    if (!isValidAmount(numAmount, CURRENCY_CONSTANTS.MIN_TRANSFER, CURRENCY_CONSTANTS.MAX_TRANSFER)) {
      setError(`Ingresa un monto entre ${formatCurrency(CURRENCY_CONSTANTS.MIN_TRANSFER)} y ${formatCurrency(CURRENCY_CONSTANTS.MAX_TRANSFER)}`)
      return
    }

    // TODO: Verificar balance disponible del usuario
    // if (numAmount + TRANSFER_COMMISSION > userBalance) {
    //   setError('Saldo insuficiente para la transferencia')
    //   return
    // }

    setError(null)
    setStep('confirmation')
  }

  const handleConfirmTransfer = async () => {
    if (!recipientVerification?.exists) return

    try {
      setLoading(true)
      setError(null)

      const transferData = {
        toUsername: recipientUsername,
        amount: numAmount,
        description: description.trim() || 'Transferencia P2P',
        confirmTransfer: true
      }

      const result = await walletApi.transferPearls(transferData)
      setTransferResult(result)
      setStep('success')
      
      if (onSuccess) {
        onSuccess(result)
      }
    } catch (err) {
      console.error('Error processing transfer:', err)
      setError(err instanceof Error ? err.message : 'Error procesando transferencia')
    } finally {
      setLoading(false)
    }
  }

  const quickAmounts = [10, 25, 50, 100, 200]

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      className={`max-w-md w-full mx-4 ${className}`}
      showCloseButton={step !== 'success'}
    >
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">💸</span>
            <div>
              <h2 className="text-xl font-bold">Transferir Perlas</h2>
              <p className="text-blue-100 text-sm">
                {step === 'recipient' && 'Ingresa el usuario destinatario'}
                {step === 'amount' && 'Ingresa el monto a enviar'}
                {step === 'confirmation' && 'Confirmar transferencia'}
                {step === 'success' && '¡Transferencia exitosa!'}
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

          {/* Step 1: Recipient Selection */}
          {step === 'recipient' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usuario destinatario *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={recipientUsername}
                    onChange={(e) => setRecipientUsername(e.target.value)}
                    placeholder="Ej: juan_peru"
                    className={`
                      w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      ${recipientVerification?.exists === false ? 'border-red-300' : 'border-gray-300'}
                    `}
                    disabled={isVerifyingRecipient}
                  />
                  
                  {/* Loading indicator */}
                  {isVerifyingRecipient && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full"></div>
                    </div>
                  )}

                  {/* Verification status */}
                  {!isVerifyingRecipient && recipientUsername && recipientUsername !== user?.username && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {recipientVerification?.exists ? (
                        <span className="text-green-500 text-xl">✓</span>
                      ) : (
                        <span className="text-red-500 text-xl">✗</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Recipient info */}
                {recipientVerification?.exists && (
                  <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-green-500">👤</span>
                      <div>
                        <p className="font-medium text-green-800">
                          {recipientVerification.fullName}
                        </p>
                        <p className="text-sm text-green-600">
                          @{recipientVerification.username}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-1">
                  Ingresa el nombre de usuario exacto del destinatario
                </p>
              </div>

              <Button
                onClick={handleRecipientSubmit}
                disabled={!recipientVerification?.exists || isVerifyingRecipient}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium"
                size="lg"
              >
                {isVerifyingRecipient ? 'Verificando...' : 'Continuar'}
              </Button>
            </div>
          )}

          {/* Step 2: Amount Input */}
          {step === 'amount' && recipientVerification && (
            <div className="space-y-4">
              {/* Recipient confirmation */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <span>📤</span>
                  <div>
                    <p className="text-sm text-gray-600">Enviando a:</p>
                    <p className="font-medium">{recipientVerification.fullName}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto a enviar (Perlas)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    min={CURRENCY_CONSTANTS.MIN_TRANSFER}
                    max={CURRENCY_CONSTANTS.MAX_TRANSFER}
                    step="0.01"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    Perlas
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo: {formatCurrency(CURRENCY_CONSTANTS.MIN_TRANSFER)} - 
                  Máximo: {formatCurrency(CURRENCY_CONSTANTS.MAX_TRANSFER)}
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
                          ? 'bg-blue-500 text-white border-blue-500' 
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }
                      `}
                    >
                      {quickAmount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Commission breakdown */}
              {numAmount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <h4 className="font-medium text-yellow-800 mb-2">💰 Resumen de costos:</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monto a enviar:</span>
                      <span>{formatCurrency(numAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Comisión P2P:</span>
                      <span>{formatCurrency(TRANSFER_COMMISSION)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-yellow-800 border-t pt-1">
                      <span>Total a debitar:</span>
                      <span>{formatCurrency(totalDebit)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Concepto (opcional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej: Pago entre amigos"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {description.length}/100 caracteres
                </p>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={() => setStep('recipient')}
                  variant="outline"
                  className="flex-1 py-2"
                >
                  Atrás
                </Button>
                <Button
                  onClick={handleAmountSubmit}
                  disabled={!amount || numAmount < CURRENCY_CONSTANTS.MIN_TRANSFER}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2"
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 'confirmation' && recipientVerification && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Confirmar Transferencia</h3>
                <p className="text-sm text-gray-600">Revisa los datos antes de enviar</p>
              </div>

              {/* Transfer summary */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-3 pb-3 border-b">
                  <span className="text-2xl">👤</span>
                  <div>
                    <p className="font-semibold">{recipientVerification.fullName}</p>
                    <p className="text-sm text-gray-600">@{recipientVerification.username}</p>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Monto a enviar:</span>
                  <span className="font-semibold">{formatCurrency(numAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Comisión:</span>
                  <span className="font-semibold">{formatCurrency(TRANSFER_COMMISSION)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total a pagar:</span>
                  <span className="text-red-600">{formatCurrency(totalDebit)}</span>
                </div>
                
                {description && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-600">Concepto:</p>
                    <p className="text-sm font-medium">{description}</p>
                  </div>
                )}
              </div>

              {/* Warning */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <span className="text-orange-500 text-lg">⚠️</span>
                  <div className="text-sm text-orange-800">
                    <p className="font-medium mb-1">Esta acción no se puede deshacer</p>
                    <p>Las Perlas se enviarán inmediatamente y no podrás cancelar la operación.</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={() => setStep('amount')}
                  variant="outline"
                  className="flex-1 py-2"
                  disabled={loading}
                >
                  Atrás
                </Button>
                <Button
                  onClick={handleConfirmTransfer}
                  disabled={loading}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2"
                  size="lg"
                >
                  {loading ? 'Enviando...' : 'Confirmar Envío'}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && transferResult && (
            <div className="text-center space-y-4">
              <div className="text-6xl mb-4">✅</div>
              
              <div>
                <h3 className="text-xl font-bold text-green-600 mb-2">
                  ¡Transferencia Exitosa!
                </h3>
                <p className="text-gray-600">
                  Has enviado {formatCurrency(transferResult.amount)} a {transferResult.toUsername}
                </p>
              </div>

              {/* Transaction details */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
                <h4 className="font-medium text-green-800 mb-3">📋 Detalles de la transacción:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Enviado:</span>
                    <span className="font-semibold">{formatCurrency(transferResult.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Comisión:</span>
                    <span>{formatCurrency(transferResult.commission)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total debitado:</span>
                    <span className="font-bold">{formatCurrency(transferResult.totalDebit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Destinatario:</span>
                    <span className="font-semibold">@{transferResult.toUsername}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fecha:</span>
                    <span>{new Date(transferResult.timestamp).toLocaleString('es-PE')}</span>
                  </div>
                  {transferResult.description && (
                    <div className="pt-2 border-t">
                      <span className="text-gray-600 block">Concepto:</span>
                      <span className="font-medium">{transferResult.description}</span>
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={onClose}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium"
                size="lg"
              >
                Finalizar
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default TransferModal