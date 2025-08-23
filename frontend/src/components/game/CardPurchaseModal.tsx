import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { gamePurchaseApi } from '@/services/gamePurchaseApi'
import { walletApi } from '@/services/walletApi'
import { useToast } from '@/contexts/ToastContext'
import Button from '@/components/common/Button'
import Modal from '@/components/common/Modal'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { formatCurrency } from '@/utils/currency'

interface Game {
  id: string
  title: string
  cardPrice: number
  status: string
  scheduledAt: string
  totalPrize: number
  participantCount: number
  maxPlayers: number
}

interface CardPurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  game: Game | null
  onSuccess?: (result: any) => void
  className?: string
}

export const CardPurchaseModal = ({ 
  isOpen, 
  onClose, 
  game, 
  onSuccess,
  className = '' 
}: CardPurchaseModalProps) => {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [step, setStep] = useState<'selection' | 'confirmation' | 'processing' | 'success'>('selection')
  const [cardCount, setCardCount] = useState<number>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userBalance, setUserBalance] = useState<number>(0)
  const [validation, setValidation] = useState<any>(null)
  const [purchaseResult, setPurchaseResult] = useState<any>(null)

  useEffect(() => {
    if (isOpen && game) {
      resetModal()
      loadUserBalance()
      validateInitialPurchase()
    }
  }, [isOpen, game])

  const resetModal = () => {
    setStep('selection')
    setCardCount(1)
    setError(null)
    setValidation(null)
    setPurchaseResult(null)
    setLoading(false)
  }

  const loadUserBalance = async () => {
    try {
      const balanceData = await walletApi.getBalance()
      setUserBalance(balanceData.balance)
    } catch (err) {
      console.error('Error loading wallet balance:', err)
    }
  }

  const validateInitialPurchase = async () => {
    if (!game) return
    
    try {
      const validationData = await gamePurchaseApi.validatePurchase(game.id, 1)
      setValidation(validationData)
    } catch (err) {
      console.error('Error validating purchase:', err)
    }
  }

  const validatePurchaseForCardCount = async (count: number) => {
    if (!game) return
    
    try {
      setLoading(true)
      const validationData = await gamePurchaseApi.validatePurchase(game.id, count)
      setValidation(validationData)
      setError(null)
    } catch (err) {
      console.error('Error validating purchase:', err)
      setError(err instanceof Error ? err.message : 'Error validando compra')
    } finally {
      setLoading(false)
    }
  }

  const handleCardCountChange = (count: number) => {
    setCardCount(count)
    validatePurchaseForCardCount(count)
  }

  const handleConfirmPurchase = async () => {
    // Validación local como fallback si la API falla
    const totalCost = game?.cardPrice * cardCount || 0
    const insufficientBalance = userBalance < totalCost
    const localValidation = !insufficientBalance && game && userBalance > 0 && totalCost > 0
    const canPurchaseLocal = validation?.data.canPurchase || localValidation
    
    if (!game || !canPurchaseLocal) return

    try {
      setStep('processing')
      setLoading(true)
      setError(null)

      const result = await gamePurchaseApi.purchaseCards({
        gameId: game.id,
        cardCount: cardCount
      })

      setPurchaseResult(result)
      setStep('success')
      
      // Actualizar balance local
      setUserBalance(result.data.wallet.newBalance)
      
      toast.success(result.message)

      if (onSuccess) {
        onSuccess(result)
      }

    } catch (err) {
      console.error('Error purchasing cards:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error procesando compra'
      setError(errorMessage)
      toast.error(errorMessage)
      setStep('confirmation')
    } finally {
      setLoading(false)
    }
  }

  const handleGoToGame = () => {
    onClose()
    navigate(`/game/${game?.id}`)
  }

  if (!game) return null

  const totalCost = game.cardPrice * cardCount
  const insufficientBalance = userBalance < totalCost
  
  // SOLUCIÓN TEMPORAL: Validación local en lugar de API
  // Si la API de validación falla, usar validación local
  const localValidation = !insufficientBalance && game && userBalance > 0 && totalCost > 0
  const canPurchase = validation?.data.canPurchase || localValidation

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      className={`max-w-md w-full mx-4 ${className}`}
      showCloseButton={step !== 'processing'}
      closeOnClickOutside={step !== 'processing'}
    >
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🎯</span>
            <div>
              <h2 className="text-xl font-bold">Comprar Cartones</h2>
              <p className="text-blue-100 text-sm">
                {step === 'selection' && 'Selecciona cantidad de cartones'}
                {step === 'confirmation' && 'Confirmar compra con Perlas'}
                {step === 'processing' && 'Procesando compra...'}
                {step === 'success' && '¡Compra exitosa!'}
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

          {/* Step 1: Card Selection */}
          {step === 'selection' && (
            <div className="space-y-6">
              {/* Game Info */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-2">🎮 {game.title}</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">💰 Premio:</span>
                    <span className="font-semibold text-yellow-600">
                      S/ {game.totalPrize.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">👥 Jugadores:</span>
                    <span className="font-semibold">
                      {game.participantCount} / {game.maxPlayers}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">💳 Por cartón:</span>
                    <span className="font-semibold text-green-600">
                      {game.cardPrice.toFixed(2)} Perlas
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">🕐 Hora:</span>
                    <span className="font-semibold">
                      {game.status === 'IN_PROGRESS' ? 'EN VIVO' : 
                       new Date(game.scheduledAt).toLocaleTimeString('es-ES', { 
                         hour: '2-digit', 
                         minute: '2-digit' 
                       })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Balance Display */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">💎</span>
                    <span className="text-sm text-gray-700">Tu balance:</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600 text-lg">
                      {userBalance.toFixed(2)} Perlas
                    </p>
                    <p className="text-xs text-gray-600">
                      ≈ {formatCurrency(userBalance)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Count Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  ¿Cuántos cartones quieres comprar?
                </label>
                
                {/* Botones de cantidad rápida */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[1, 2, 3, 5].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleCardCountChange(num)}
                      disabled={loading}
                      className={`
                        h-12 rounded-lg text-sm font-bold transition-all
                        ${cardCount === num
                          ? 'bg-blue-500 text-white shadow-lg scale-105' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }
                        ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                {/* Selector personalizado para más cartones */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleCardCountChange(Math.max(1, cardCount - 1))}
                      disabled={loading || cardCount <= 1}
                      className="w-10 h-10 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 flex items-center justify-center font-bold text-gray-700"
                    >
                      -
                    </button>
                    
                    <div className="flex-1 text-center">
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={cardCount}
                        onChange={(e) => {
                          const value = Math.max(1, Math.min(50, parseInt(e.target.value) || 1))
                          handleCardCountChange(value)
                        }}
                        disabled={loading}
                        className="w-20 h-10 text-center text-lg font-bold border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">Máx. 50 por compra</p>
                    </div>
                    
                    <button
                      onClick={() => handleCardCountChange(Math.min(50, cardCount + 1))}
                      disabled={loading || cardCount >= 50}
                      className="w-10 h-10 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 flex items-center justify-center font-bold text-gray-700"
                    >
                      +
                    </button>
                  </div>

                  {/* Botones de cantidad alta */}
                  <div className="grid grid-cols-3 gap-2">
                    {[10, 20, 50].map((num) => (
                      <button
                        key={num}
                        onClick={() => handleCardCountChange(num)}
                        disabled={loading}
                        className={`
                          h-10 rounded-lg text-sm font-medium transition-all
                          ${cardCount === num
                            ? 'bg-purple-500 text-white shadow-lg' 
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                          }
                          ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cost Calculation */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cartones:</span>
                    <span>{cardCount} × {game.cardPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span className="text-gray-800">Total:</span>
                    <span className="text-blue-600">{totalCost.toFixed(2)} Perlas</span>
                  </div>
                  {insufficientBalance && (
                    <p className="text-red-600 text-sm mt-2">
                      ⚠️ Saldo insuficiente. Necesitas {(totalCost - userBalance).toFixed(2)} Perlas más
                    </p>
                  )}
                </div>
              </div>

              {/* Continue Button */}
              <Button
                onClick={() => setStep('confirmation')}
                disabled={loading || !canPurchase || insufficientBalance}
                className={`
                  w-full py-3 rounded-xl font-medium text-lg
                  ${canPurchase && !insufficientBalance
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span>Validando...</span>
                  </div>
                ) : insufficientBalance ? (
                  'Saldo Insuficiente'
                ) : canPurchase ? (
                  'Continuar'
                ) : (
                  'No Disponible'
                )}
              </Button>

              {insufficientBalance && (
                <Button
                  onClick={() => navigate('/wallet')}
                  variant="outline"
                  className="w-full"
                >
                  Recargar Perlas
                </Button>
              )}
            </div>
          )}

          {/* Step 2: Confirmation */}
          {step === 'confirmation' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  Confirmar Compra
                </h3>
                <p className="text-sm text-gray-600">
                  Revisa los detalles antes de confirmar
                </p>
              </div>

              {/* Purchase Summary */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Juego:</span>
                  <span className="font-semibold">{game.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cartones:</span>
                  <span className="font-semibold">{cardCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Precio unitario:</span>
                  <span className="font-semibold">{game.cardPrice.toFixed(2)} Perlas</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-blue-600 pt-2 border-t">
                  <span>Total a pagar:</span>
                  <span>{totalCost.toFixed(2)} Perlas</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Balance actual:</span>
                  <span className="font-semibold text-green-600">
                    {userBalance.toFixed(2)} Perlas
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Balance después:</span>
                  <span className="font-semibold">
                    {(userBalance - totalCost).toFixed(2)} Perlas
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button
                  onClick={() => setStep('selection')}
                  variant="outline"
                  className="flex-1 py-2"
                  disabled={loading}
                >
                  Atrás
                </Button>
                <Button
                  onClick={handleConfirmPurchase}
                  disabled={loading}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2"
                  size="lg"
                >
                  {loading ? 'Procesando...' : 'Confirmar Compra'}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Processing */}
          {step === 'processing' && (
            <div className="text-center space-y-6 py-8">
              <LoadingSpinner size="lg" />
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Procesando tu compra
                </h3>
                <p className="text-gray-600">
                  Generando tus cartones con Perlas...
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && purchaseResult && (
            <div className="text-center space-y-6">
              <div className="text-6xl mb-4">🎉</div>
              
              <div>
                <h3 className="text-xl font-bold text-green-600 mb-2">
                  ¡Compra Exitosa!
                </h3>
                <p className="text-gray-600 mb-4">
                  {purchaseResult.data.purchase.cardsPurchased} cartón{purchaseResult.data.purchase.cardsPurchased > 1 ? 'es' : ''} adquirido{purchaseResult.data.purchase.cardsPurchased > 1 ? 's' : ''}
                </p>
              </div>

              {/* Purchase Details */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
                <h4 className="font-medium text-green-800 mb-3">
                  📄 Detalles de la compra:
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transacción:</span>
                    <code className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">
                      {purchaseResult.data.purchase.transactionId.slice(-8)}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cartones:</span>
                    <span className="font-semibold">
                      {purchaseResult.data.cards.map((card: any) => 
                        `#${card.cardNumber}`
                      ).join(', ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Perlas usadas:</span>
                    <span className="font-bold text-blue-600">
                      {purchaseResult.data.wallet.pearlsUsed.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Balance nuevo:</span>
                    <span className="font-bold text-green-600">
                      {purchaseResult.data.wallet.newBalance.toFixed(2)} Perlas
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleGoToGame}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium"
                  size="lg"
                >
                  🎯 Ir al Juego
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="w-full py-2"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default CardPurchaseModal