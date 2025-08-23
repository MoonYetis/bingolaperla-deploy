import React, { useMemo, useState, useCallback } from 'react'
import { BingoCard } from './BingoCard'
import { cn } from '@/utils/cn'
import { BingoCardData, BINGO_CONSTANTS } from '@/types'
import { useAppSelector } from '@/hooks/redux'
import { selectActiveCards, selectIsGenerating } from '@/store/bingoCardSlice'
import LoadingSpinner from '@/components/common/LoadingSpinner'

interface MultiCardViewProps {
  cards?: BingoCardData[]
  gameId?: string
  maxCards?: number
  size?: 'sm' | 'md' | 'lg'
  layout?: 'grid' | 'horizontal' | 'vertical'
  showStats?: boolean
  showCardSelector?: boolean
  autoMark?: boolean
  disabled?: boolean
  showBingoButton?: boolean
  onCardClick?: (card: BingoCardData) => void
  onCellClick?: (card: BingoCardData, number: any) => void
  onAnnounceBingo?: (cardId: string) => Promise<void>
  className?: string
}

export const MultiCardView: React.FC<MultiCardViewProps> = ({
  cards: propCards,
  gameId,
  maxCards = BINGO_CONSTANTS.MAX_CARDS_PER_USER,
  size = 'md',
  layout = 'grid',
  showStats = true,
  showCardSelector = false,
  autoMark = true,
  disabled = false,
  showBingoButton = true,
  onCardClick,
  onCellClick,
  onAnnounceBingo,
  className,
}) => {
  // Estado local para seguimiento de cartón seleccionado
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  
  // Usar cards del prop o del estado de Redux
  const activeCardsFromStore = useAppSelector(selectActiveCards)
  const isGenerating = useAppSelector(selectIsGenerating)
  const cards = propCards || activeCardsFromStore

  // Limitar número de cartones
  const displayCards = useMemo(() => {
    return cards.slice(0, maxCards)
  }, [cards, maxCards])

  // Estadísticas generales
  const stats = useMemo(() => {
    const totalCards = displayCards.length
    const totalMarked = displayCards.reduce((sum, card) => sum + card.markedNumbers.length, 0)
    const totalWinners = displayCards.filter(card => card.isWinner).length
    const totalPossible = totalCards * 24 // 24 números marcables por cartón (excluyendo FREE)
    
    return {
      totalCards,
      totalMarked,
      totalWinners,
      totalPossible,
      completionPercentage: totalPossible > 0 ? (totalMarked / totalPossible) * 100 : 0,
    }
  }, [displayCards])

  // Manejar click en cartón
  const handleCardClick = useCallback((card: BingoCardData) => {
    if (showCardSelector && !disabled) {
      setSelectedCardId(selectedCardId === card.id ? null : card.id)
    }
    onCardClick?.(card)
  }, [showCardSelector, disabled, selectedCardId, onCardClick])

  // Manejar click en celda
  const handleCellClick = useCallback((card: BingoCardData, number: any) => {
    onCellClick?.(card, number)
  }, [onCellClick])

  // Clases de layout
  const layoutClasses = {
    grid: {
      1: 'grid-cols-1 justify-items-center',
      2: 'grid-cols-1 md:grid-cols-2 justify-items-center',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 justify-items-center',
    },
    horizontal: {
      1: 'flex-row justify-center',
      2: 'flex-row justify-center space-x-4',
      3: 'flex-row justify-center space-x-2',
    },
    vertical: {
      1: 'flex-col items-center',
      2: 'flex-col items-center space-y-4',
      3: 'flex-col items-center space-y-2',
    },
  }

  const getLayoutClass = (cardCount: number) => {
    const count = Math.min(cardCount, 3) as 1 | 2 | 3
    if (layout === 'grid') {
      return `grid ${layoutClasses.grid[count]}`
    } else {
      return `flex ${layoutClasses[layout][count]}`
    }
  }

  // Si está cargando
  if (isGenerating && displayCards.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-8', className)}>
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Generando cartones...</p>
      </div>
    )
  }

  // Si no hay cartones
  if (displayCards.length === 0) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center p-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300',
        className
      )}>
        <div className="text-6xl mb-4">🎯</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          No hay cartones activos
        </h3>
        <p className="text-gray-500 text-center">
          Genera o selecciona cartones para comenzar a jugar
        </p>
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Estadísticas generales */}
      {showStats && (
        <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalCards}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Cartones</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.totalMarked}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Marcados</div>
              </div>
              {stats.totalWinners > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-gold-600">{stats.totalWinners}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Ganadores</div>
                </div>
              )}
            </div>
            
            {/* Barra de progreso */}
            <div className="flex-1 max-w-xs">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progreso</span>
                <span>{Math.round(stats.completionPercentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(stats.completionPercentage, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid de cartones */}
      <div className={cn(
        'gap-4',
        getLayoutClass(displayCards.length)
      )}>
        {displayCards.map((card, index) => {
          const isSelected = selectedCardId === card.id
          
          return (
            <div
              key={card.id}
              className={cn(
                'relative transition-all duration-300',
                
                // Efectos de selección si está habilitado el selector
                showCardSelector && [
                  'cursor-pointer hover:scale-105',
                  isSelected && [
                    'ring-4 ring-blue-400 ring-offset-2',
                    'transform scale-105',
                  ]
                ],
                
                // Responsive sizing based on card count
                layout === 'grid' && displayCards.length === 3 && size === 'md' && 'max-w-sm',
                layout === 'horizontal' && displayCards.length === 3 && size === 'md' && 'max-w-xs',
              )}
              onClick={() => handleCardClick(card)}
            >
              {/* Número de cartón flotante */}
              <div className="absolute -top-2 -left-2 z-20 bg-blue-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                {index + 1}
              </div>
              
              {/* Indicador de cartón seleccionado */}
              {isSelected && (
                <div className="absolute -top-1 -left-1 -right-1 -bottom-1 bg-blue-400 bg-opacity-20 rounded-xl z-0" />
              )}
              
              <BingoCard
                card={card}
                gameId={gameId}
                size={size}
                autoMark={autoMark}
                disabled={disabled}
                highlightWinningPattern={true}
                showHeader={true}
                showStats={true}
                showBingoButton={showBingoButton}
                onCellClick={(number) => handleCellClick(card, number)}
                onAnnounceBingo={onAnnounceBingo}
                className={cn(
                  'relative z-10',
                  // Reducir sombra si está seleccionado para evitar conflicto visual
                  isSelected && 'shadow-none'
                )}
              />
              
              {/* Badge de estado */}
              {card.isWinner && (
                <div className="absolute -top-2 -right-2 z-20 bg-gold-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
                  ¡GANADOR!
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Indicador de capacidad */}
      {displayCards.length < maxCards && !isGenerating && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">
                +{maxCards - displayCards.length}
              </span>
            </div>
            <div>
              <div className="text-sm font-medium text-blue-800">
                Puedes agregar {maxCards - displayCards.length} cartón{maxCards - displayCards.length !== 1 ? 'es' : ''} más
              </div>
              <div className="text-xs text-blue-600">
                Máximo {maxCards} cartones por jugador
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MultiCardView