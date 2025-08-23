import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { BingoCell } from './BingoCell'
import { BingoButton } from './BingoButton'
import { PatternHighlight, usePatternDetection } from './PatternHighlight'
import { cn } from '@/utils/cn'
import { BingoCardData, CardNumberData, WinningPattern, ColumnLetter } from '@/types'
import { useMarkNumberMutation } from '@/services/bingoCardApi'
import { useAppSelector } from '@/hooks/redux'
import { selectCurrentBall, selectBallsDrawn } from '@/store/gamePlaySlice'
import { useBingoSocket } from '@/hooks/useBingoSocket'

interface BingoCardProps {
  card: BingoCardData
  gameId?: string
  size?: 'sm' | 'md' | 'lg'
  showHeader?: boolean
  showStats?: boolean
  autoMark?: boolean
  disabled?: boolean
  highlightWinningPattern?: boolean
  showBingoButton?: boolean
  onCellClick?: (number: CardNumberData) => void
  onAnnounceBingo?: (cardId: string) => Promise<void>
  className?: string
}

export const BingoCard: React.FC<BingoCardProps> = ({
  card,
  gameId,
  size = 'md',
  showHeader = true,
  showStats = true,
  autoMark = true,
  disabled = false,
  highlightWinningPattern = true,
  showBingoButton = true,
  onCellClick,
  onAnnounceBingo,
  className,
}) => {
  const [markNumber] = useMarkNumberMutation()
  const currentBall = useAppSelector(selectCurrentBall)
  const ballsDrawn = useAppSelector(selectBallsDrawn)
  const [isAnimating, setIsAnimating] = useState(false)
  const [recentlyMarked, setRecentlyMarked] = useState<number | null>(null)
  
  // Hook de Socket.IO para eventos en tiempo real
  const [lastBallLocal, setLastBallLocal] = useState<number | null>(null)
  const { isConnected, on, off } = useBingoSocket({
    gameId: gameId || undefined,
    isAdmin: false
  })

  // Escuchar eventos de números cantados
  useEffect(() => {
    if (!isConnected) return

    const handleNumberCalled = (data: { number: number; gameId: string }) => {
      setLastBallLocal(data.number)
    }

    on('number-called', handleNumberCalled)

    return () => {
      off('number-called', handleNumberCalled)
    }
  }, [isConnected, on, off])

  const lastBall = lastBallLocal

  // Efecto para manejar marcado automático cuando se canta un número
  useEffect(() => {
    if (!lastBall || disabled || !autoMark) return

    // Buscar si el número cantado está en este cartón
    const numberToMark = card.numbers.find(
      num => num.number === lastBall && !num.isMarked && !num.isFree
    )

    if (numberToMark) {
      // Marcar automáticamente el número
      markNumber({
        cardId: card.id,
        number: lastBall,
      }).unwrap().then(() => {
        // Resaltar número recién marcado
        setRecentlyMarked(lastBall)
        setIsAnimating(true)
        
        setTimeout(() => {
          setIsAnimating(false)
          setRecentlyMarked(null)
        }, 2000)
      }).catch(error => {
        console.error('Error auto-marking number:', error)
      })
    } else {
      // Solo resaltar visualmente si el número no está en el cartón
      setRecentlyMarked(lastBall)
      setIsAnimating(true)
      
      setTimeout(() => {
        setIsAnimating(false)
        setRecentlyMarked(null)
      }, 2000)
    }
  }, [lastBall, disabled, autoMark, card.numbers, card.id, markNumber])

  // Efecto para detectar BINGO automático después de marcar números
  useEffect(() => {
    if (!autoMark || disabled || detectedPatterns.length === 0 || card.isWinner) return

    // Solo anunciar BINGO automáticamente si:
    // 1. El marcado automático está activado
    // 2. Se detectaron patrones ganadores
    // 3. El cartón aún no está marcado como ganador
    // 4. Tenemos una función para anunciar BINGO

    if (onAnnounceBingo && detectedPatterns.length > 0) {
      console.log(`🎉 BINGO AUTOMÁTICO detectado en cartón #${card.cardNumber}:`, detectedPatterns)
      
      // Anunciar automáticamente el primer patrón detectado
      onAnnounceBingo(card.id).then(() => {
        console.log(`✅ BINGO automático anunciado para cartón #${card.cardNumber}`)
      }).catch(error => {
        console.error('Error anunciando BINGO automático:', error)
      })
    }
  }, [detectedPatterns, autoMark, disabled, card.isWinner, card.id, card.cardNumber, onAnnounceBingo])

  // Organizar números en grid 5x5
  const cardGrid = useMemo(() => {
    const grid: (CardNumberData | null)[][] = Array(5).fill(null).map(() => Array(5).fill(null))
    
    card.numbers.forEach(number => {
      const row = Math.floor(number.position / 5)
      const col = number.position % 5
      if (row >= 0 && row < 5 && col >= 0 && col < 5 && grid[row]) {
        grid[row]![col] = number
      }
    })
    
    return grid
  }, [card.numbers])

  // Headers de columnas
  const columnHeaders: ColumnLetter[] = ['B', 'I', 'N', 'G', 'O']

  // Detectar números resaltados (bola actual y recién marcados)
  const highlightedNumbers = useMemo(() => {
    const highlighted = new Set<number>()
    if (currentBall !== null) {
      highlighted.add(currentBall)
    }
    if (lastBall !== null) {
      highlighted.add(lastBall)
    }
    return highlighted
  }, [currentBall, lastBall])

  // Detectar números con animación especial
  const animatedNumbers = useMemo(() => {
    const animated = new Set<number>()
    if (recentlyMarked !== null) {
      animated.add(recentlyMarked)
    }
    return animated
  }, [recentlyMarked])

  // Detectar patrones ganadores usando el hook
  const markedPositions = useMemo(() => {
    return card.numbers
      .filter(number => number?.isMarked)
      .map(number => number.position)
  }, [card.numbers])
  
  const detectedPatterns = usePatternDetection(markedPositions)
  
  // Patrones a mostrar (solo si está habilitado y es ganador)
  const patternsToHighlight = useMemo(() => {
    if (!highlightWinningPattern || !card.isWinner) return []
    return detectedPatterns
  }, [highlightWinningPattern, card.isWinner, detectedPatterns])
  
  // Map de patrones por posición para BingoCell
  const winningPatterns = useMemo(() => {
    const patterns = new Map<number, WinningPattern[]>()
    if (patternsToHighlight.length > 0) {
      card.numbers.forEach(number => {
        if (number.isMarked) {
          patterns.set(number.position, patternsToHighlight)
        }
      })
    }
    return patterns
  }, [patternsToHighlight, card.numbers])

  // Manejar click en celda - MARCADO MANUAL OPCIONAL
  const handleCellClick = useCallback(async (number: CardNumberData) => {
    if (disabled || number.isFree || number.isMarked) return

    try {
      setIsAnimating(true)
      
      if (onCellClick) {
        onCellClick(number)
      } else if (number.number !== null) {
        // MARCADO MANUAL: permitir marcar manualmente incluso con autoMark activado
        // Útil para corregir errores o marcar números no cantados aún
        await markNumber({
          cardId: card.id,
          number: number.number,
        }).unwrap()
      }
    } catch (error) {
      console.error('Error marking number:', error)
    } finally {
      setTimeout(() => setIsAnimating(false), 300)
    }
  }, [disabled, onCellClick, markNumber, card.id])

  const cardSizeClasses = {
    sm: 'p-2 gap-1',
    md: 'p-4 gap-2', 
    lg: 'p-4 gap-2', // Optimizado para móvil
  }

  const headerSizeClasses = {
    sm: 'text-xs py-1',
    md: 'text-sm py-2',
    lg: 'text-lg py-3', // Más grande para móvil
  }

  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-lg border-2 transition-all duration-300',
        
        // Winner styles
        card.isWinner && [
          'border-gold-400 shadow-gold-200 shadow-xl',
          'bg-gradient-to-br from-gold-50 to-yellow-50',
        ],
        
        // Normal styles
        !card.isWinner && 'border-gray-200 hover:shadow-xl',
        
        // Animation
        isAnimating && 'transform scale-105',
        
        // Disabled
        disabled && 'opacity-60 pointer-events-none',
        
        cardSizeClasses[size],
        className
      )}
    >
      {/* Header con información del cartón */}
      {showHeader && (
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-600">
              Cartón #{card.cardNumber}
            </span>
            {card.isWinner && (
              <span className="px-2 py-1 bg-gold-100 text-gold-800 text-xs rounded-full font-bold">
                ¡GANADOR!
              </span>
            )}
            {autoMark && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                🤖 AUTO
              </span>
            )}
          </div>
          
          {showStats && (
            <div className="text-xs text-gray-500">
              {card.markedNumbers.length}/24 marcados
            </div>
          )}
        </div>
      )}

      {/* Headers de columnas B-I-N-G-O */}
      <div className="grid grid-cols-5 gap-1 mb-2">
        {columnHeaders.map((header, index) => (
          <div
            key={header}
            className={cn(
              'text-center font-bold text-white rounded-lg',
              headerSizeClasses[size],
              // Colores por columna
              index === 0 && 'bg-blue-500',
              index === 1 && 'bg-red-500',
              index === 2 && 'bg-green-500',
              index === 3 && 'bg-yellow-500',
              index === 4 && 'bg-purple-500',
            )}
          >
            {header}
          </div>
        ))}
      </div>

      {/* Grid de números con overlay de patrones */}
      <div className="relative">
        <div className="grid grid-cols-5 gap-1 touch-manipulation">
          {cardGrid.map((row, rowIndex) =>
            row.map((number, colIndex) => {
              if (!number) return null

              const isHighlighted = number && number.number !== null ? highlightedNumbers.has(number.number) : false
              const isAnimated = number && number.number !== null ? animatedNumbers.has(number.number) : false
              const cellWinningPatterns = winningPatterns.get(number.position) || []

              return (
                <BingoCell
                  key={`${rowIndex}-${colIndex}`}
                  number={number}
                  size={size}
                  isHighlighted={isHighlighted}
                  winningPatterns={cellWinningPatterns}
                  disabled={disabled}
                  autoMark={autoMark}
                  onClick={handleCellClick}
                  className={isAnimated ? 'animate-pulse ring-2 ring-green-400' : ''}
                />
              )
            })
          )}
        </div>
        
        {/* Overlay de patrones ganadores */}
        {patternsToHighlight.length > 0 && (
          <PatternHighlight
            patterns={patternsToHighlight}
            size={size}
            animated={!disabled}
          />
        )}
      </div>

      {/* Footer con información adicional */}
      {card.isWinner && card.winningPattern && (
        <div className="mt-3 p-2 bg-gold-50 rounded-lg border border-gold-200">
          <div className="text-xs text-gold-800 font-medium">
            Patrón ganador: {card.winningPattern}
          </div>
        </div>
      )}

      {/* Botón de BINGO - BINGO TRADICIONAL */}
      {showBingoButton && gameId && (
        <div className="mt-4">
          <BingoButton
            card={card}
            gameId={gameId}
            disabled={disabled}
            onAnnounceBingo={onAnnounceBingo}
          />
        </div>
      )}

      {/* Indicador de estado activo */}
      {card.isActive && (
        <div className="absolute top-2 right-2">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  )
}

export default BingoCard