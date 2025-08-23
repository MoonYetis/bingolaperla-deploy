import { useState, useEffect } from 'react'
import Modal from '@/components/common/Modal'
import Button from '@/components/common/Button'
import { formatCurrency } from '@/utils/currency'

interface PrizeInfo {
  amount: number
  currency: string
  transactionId: string
  newBalance: number
  description: string
  timestamp: string
  pattern: string
  gameId: string
}

interface PrizeNotificationModalProps {
  isOpen: boolean
  onClose: () => void
  prize: PrizeInfo | null
  className?: string
}

const patternNames: { [key: string]: string } = {
  'LINE_HORIZONTAL_1': 'Línea Horizontal Superior',
  'LINE_HORIZONTAL_2': 'Línea Horizontal (2)',
  'LINE_HORIZONTAL_3': 'Línea Horizontal Central',
  'LINE_HORIZONTAL_4': 'Línea Horizontal (4)',
  'LINE_HORIZONTAL_5': 'Línea Horizontal Inferior',
  'LINE_VERTICAL_B': 'Línea Vertical B',
  'LINE_VERTICAL_I': 'Línea Vertical I',
  'LINE_VERTICAL_N': 'Línea Vertical N',
  'LINE_VERTICAL_G': 'Línea Vertical G',
  'LINE_VERTICAL_O': 'Línea Vertical O',
  'DIAGONAL_1': 'Diagonal Principal',
  'DIAGONAL_2': 'Diagonal Secundaria',
  'FOUR_CORNERS': 'Cuatro Esquinas',
  'SMALL_DIAMOND': 'Diamante Pequeño',
  'BIG_DIAMOND': 'Diamante Grande',
  'FULL_CARD': 'Cartón Completo',
}

const patternEmojis: { [key: string]: string } = {
  'LINE_HORIZONTAL_1': '↔️',
  'LINE_HORIZONTAL_2': '↔️',
  'LINE_HORIZONTAL_3': '↔️',
  'LINE_HORIZONTAL_4': '↔️',
  'LINE_HORIZONTAL_5': '↔️',
  'LINE_VERTICAL_B': '↕️',
  'LINE_VERTICAL_I': '↕️',
  'LINE_VERTICAL_N': '↕️',
  'LINE_VERTICAL_G': '↕️',
  'LINE_VERTICAL_O': '↕️',
  'DIAGONAL_1': '↗️',
  'DIAGONAL_2': '↖️',
  'FOUR_CORNERS': '📐',
  'SMALL_DIAMOND': '💎',
  'BIG_DIAMOND': '💎',
  'FULL_CARD': '🏆',
}

export const PrizeNotificationModal = ({ 
  isOpen, 
  onClose, 
  prize, 
  className = '' 
}: PrizeNotificationModalProps) => {
  const [showConfetti, setShowConfetti] = useState(false)
  const [animationStep, setAnimationStep] = useState(0)

  useEffect(() => {
    if (isOpen && prize) {
      setShowConfetti(true)
      setAnimationStep(1)

      // Secuencia de animaciones
      const timer1 = setTimeout(() => setAnimationStep(2), 500)
      const timer2 = setTimeout(() => setAnimationStep(3), 1000)
      const timer3 = setTimeout(() => setShowConfetti(false), 3000)

      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
        clearTimeout(timer3)
      }
    }
  }, [isOpen, prize])

  if (!prize) return null

  const patternName = patternNames[prize.pattern] || prize.pattern
  const patternEmoji = patternEmojis[prize.pattern] || '🎯'

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      className={`max-w-md w-full mx-4 ${className}`}
      showCloseButton={false}
      closeOnClickOutside={false}
    >
      <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-2xl shadow-2xl overflow-hidden relative">
        {/* Confetti Animation */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none z-10">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-3 h-3 rounded-full animate-bounce
                  ${i % 4 === 0 ? 'bg-red-500' : ''}
                  ${i % 4 === 1 ? 'bg-blue-500' : ''}
                  ${i % 4 === 2 ? 'bg-green-500' : ''}
                  ${i % 4 === 3 ? 'bg-purple-500' : ''}
                `}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random()}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-6 text-white text-center relative">
          <div className={`transition-all duration-500 ${animationStep >= 1 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
            <div className="text-6xl mb-2">🎉</div>
            <h2 className="text-2xl font-bold mb-1">¡FELICIDADES!</h2>
            <p className="text-yellow-100 text-sm">¡Has ganado un premio en Perlas!</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 bg-white space-y-6">
          {/* Pattern Info */}
          <div className={`text-center transition-all duration-500 delay-300 ${animationStep >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <div className="text-4xl mb-2">{patternEmoji}</div>
            <h3 className="text-xl font-bold text-gray-800 mb-1">
              {patternName}
            </h3>
            <p className="text-gray-600 text-sm">
              Patrón ganador completado
            </p>
          </div>

          {/* Prize Amount */}
          <div className={`bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 text-center transition-all duration-500 delay-500 ${animationStep >= 3 ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
            <p className="text-gray-600 text-sm mb-2">Premio ganado:</p>
            <div className="flex items-center justify-center space-x-2 mb-3">
              <span className="text-3xl">💎</span>
              <span className="text-4xl font-bold text-green-600">
                {prize.amount.toFixed(2)}
              </span>
              <span className="text-xl font-semibold text-green-600">
                Perlas
              </span>
            </div>
            <p className="text-xs text-gray-500">
              ≈ {formatCurrency(prize.amount)}
            </p>
          </div>

          {/* Transaction Details */}
          <div className={`bg-gray-50 rounded-lg p-4 space-y-2 transition-all duration-300 delay-700 ${animationStep >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Nuevo balance:</span>
              <span className="font-semibold text-green-600">
                💎 {prize.newBalance.toFixed(2)} Perlas
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Transacción:</span>
              <code className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">
                {prize.transactionId.slice(-8)}
              </code>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Fecha:</span>
              <span className="font-mono text-xs">
                {new Date(prize.timestamp).toLocaleString('es-PE')}
              </span>
            </div>
          </div>

          {/* Motivational Message */}
          <div className={`text-center transition-all duration-300 delay-900 ${animationStep >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <p className="text-gray-600 text-sm italic">
              "¡Excelente jugada! Tus Perlas han sido acreditadas automáticamente."
            </p>
          </div>

          {/* Action Buttons */}
          <div className={`space-y-3 transition-all duration-300 delay-1000 ${animationStep >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <Button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-3 rounded-xl font-medium text-lg"
              size="lg"
            >
              ¡Continuar Jugando! 🎯
            </Button>
            
            <div className="flex space-x-3">
              <Button
                onClick={() => window.open('/wallet', '_blank')}
                variant="outline"
                className="flex-1 py-2 border-green-500 text-green-600 hover:bg-green-50"
              >
                💎 Ver Billetera
              </Button>
              <Button
                onClick={() => window.open(`/game/${prize.gameId}`, '_blank')}
                variant="outline" 
                className="flex-1 py-2 border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                🎮 Estado del Juego
              </Button>
            </div>
          </div>

          {/* Fun Facts */}
          <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 text-center transition-all duration-300 delay-1200 ${animationStep >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <p className="text-blue-700 text-xs">
              💡 <strong>¿Sabías que?</strong> Las Perlas se pueden usar para comprar más cartones o transferir a otros jugadores.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default PrizeNotificationModal