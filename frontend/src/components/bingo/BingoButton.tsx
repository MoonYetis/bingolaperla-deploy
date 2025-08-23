import React, { useState } from 'react'
import { cn } from '@/utils/cn'
import Button from '@/components/common/Button'
import { BingoCardData } from '@/types'

interface BingoButtonProps {
  card: BingoCardData
  gameId: string
  disabled?: boolean
  onAnnounceBingo?: (cardId: string) => Promise<void>
  className?: string
}

export const BingoButton: React.FC<BingoButtonProps> = ({
  card,
  gameId,
  disabled = false,
  onAnnounceBingo,
  className,
}) => {
  const [isAnnouncing, setIsAnnouncing] = useState(false)

  const handleClick = async () => {
    if (disabled || isAnnouncing || card.isWinner) return

    try {
      setIsAnnouncing(true)
      
      if (onAnnounceBingo) {
        await onAnnounceBingo(card.id)
      } else {
        // Llamada por defecto a la API
        const response = await fetch(`/api/games/${gameId}/announce-bingo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ cardId: card.id }),
        })

        const result = await response.json()
        
        if (result.isValid) {
          console.log('¡BINGO VÁLIDO!', result)
        } else {
          console.log('BINGO inválido:', result.message)
        }
      }
    } catch (error) {
      console.error('Error announcing BINGO:', error)
    } finally {
      setIsAnnouncing(false)
    }
  }

  // Detectar si hay patrones potenciales cerca de completar
  const hasNearPattern = () => {
    // Aquí podrías agregar lógica para detectar patrones casi completos
    // Por ahora, simplemente verificar si hay varios números marcados
    return card.markedNumbers.length >= 10
  }

  if (card.isWinner) {
    return (
      <div className={cn(
        'w-full p-3 rounded-lg text-center font-bold',
        'bg-gradient-to-r from-gold-400 to-yellow-400',
        'text-gold-900 border-2 border-gold-500',
        'animate-pulse',
        className
      )}>
        <span className="text-lg">🎉 ¡GANADOR! 🎉</span>
        <div className="text-sm mt-1 opacity-80">
          {card.winningPattern}
        </div>
      </div>
    )
  }

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || isAnnouncing}
      className={cn(
        'w-full font-bold text-lg py-3 transition-all duration-200',
        
        // Estados del botón
        !disabled && !isAnnouncing && [
          'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
          'text-white shadow-lg hover:shadow-xl transform hover:scale-105',
          'border-2 border-red-400',
          hasNearPattern() && 'animate-pulse ring-2 ring-red-300',
        ],
        
        isAnnouncing && [
          'bg-gradient-to-r from-yellow-400 to-orange-400',
          'text-orange-900 animate-bounce',
          'cursor-wait',
        ],
        
        disabled && [
          'bg-gray-300 text-gray-500 cursor-not-allowed',
          'border-gray-200',
        ],
        
        className
      )}
    >
      {isAnnouncing ? (
        <span className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-orange-900 border-t-transparent rounded-full animate-spin" />
          Verificando...
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <span className="text-2xl">🎯</span>
          ¡BINGO!
        </span>
      )}
    </Button>
  )
}

export default BingoButton