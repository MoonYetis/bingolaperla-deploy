import React, { useState, useEffect } from 'react'
import { cn } from '@/utils/cn'
import { BingoCardData } from '@/types'
import { useGenerateCardsMutation, useGetMyCardsQuery } from '@/services/bingoCardApi'
import { BingoCard } from './BingoCard'
import Button from '@/components/common/Button'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { RefreshCw, ShoppingCart, Check, X, Plus } from 'lucide-react'

interface CardSelectorProps {
  gameId: string
  maxCards?: number
  cardPrice: number
  onSelectionChange?: (selectedCards: BingoCardData[], totalCost: number) => void
  onConfirmSelection?: (selectedCards: BingoCardData[]) => void
  disabled?: boolean
  className?: string
}

export const CardSelector: React.FC<CardSelectorProps> = ({
  gameId,
  maxCards = 3,
  cardPrice,
  onSelectionChange,
  onConfirmSelection,
  disabled = false,
  className,
}) => {
  const [selectedCards, setSelectedCards] = useState<BingoCardData[]>([])
  const [availableCards, setAvailableCards] = useState<BingoCardData[]>([])
  
  // Query para obtener cartones existentes
  const { data: myCardsData, isLoading, error, refetch } = useGetMyCardsQuery(gameId)
  
  // Mutation para generar nuevos cartones
  const [generateCards, { isLoading: isGenerating }] = useGenerateCardsMutation()

  // Actualizar cartones disponibles cuando se cargan
  useEffect(() => {
    if (myCardsData?.cards) {
      setAvailableCards(myCardsData.cards)
    }
  }, [myCardsData])

  // Notificar cambios en la selección
  useEffect(() => {
    const totalCost = selectedCards.length * cardPrice
    onSelectionChange?.(selectedCards, totalCost)
  }, [selectedCards, cardPrice, onSelectionChange])

  const handleCardToggle = (card: BingoCardData) => {
    if (disabled) return

    setSelectedCards(prev => {
      const isSelected = prev.some(c => c.id === card.id)
      
      if (isSelected) {
        // Deseleccionar cartón
        return prev.filter(c => c.id !== card.id)
      } else if (prev.length < maxCards) {
        // Seleccionar cartón (si no se ha alcanzado el límite)
        return [...prev, card]
      }
      
      return prev // No hacer nada si se alcanzó el límite
    })
  }

  const handleGenerateNewCards = async () => {
    try {
      await generateCards({ gameId, count: 12 }).unwrap()
      // Después de generar, refrescar la lista
      await refetch()
    } catch (error) {
      console.error('Error generating new cards:', error)
    }
  }

  const handleConfirmSelection = () => {
    if (selectedCards.length === 0) return
    onConfirmSelection?.(selectedCards)
  }

  const isCardSelected = (cardId: string) => {
    return selectedCards.some(c => c.id === cardId)
  }

  const canSelectMore = selectedCards.length < maxCards
  const totalCost = selectedCards.length * cardPrice

  if (isLoading && !availableCards.length) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Generando cartones...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('text-center p-8', className)}>
        <div className="text-red-600 mb-4">
          Error al generar cartones
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Selecciona tus Cartones</h2>
          <p className="text-gray-600 mt-1">
            Elige hasta {maxCards} cartones para jugar • S/ {cardPrice.toFixed(2)} cada uno
          </p>
        </div>
        
        <Button
          variant="outline"
          onClick={handleGenerateNewCards}
          disabled={isGenerating || disabled}
          className="flex items-center gap-2"
        >
          <RefreshCw className={cn('w-4 h-4', isGenerating && 'animate-spin')} />
          {isGenerating ? 'Generando...' : 'Nuevos Cartones'}
        </Button>
      </div>

      {/* Selection Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">
              {selectedCards.length} de {maxCards} cartones seleccionados
            </span>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              S/ {totalCost.toFixed(2)}
            </div>
            <div className="text-sm text-blue-700">
              Total a pagar
            </div>
          </div>
        </div>
        
        {selectedCards.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedCards.map((card) => (
              <div
                key={card.id}
                className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
              >
                <span>Cartón #{card.cardNumber}</span>
                <button
                  onClick={() => handleCardToggle(card)}
                  className="text-blue-600 hover:text-blue-800"
                  disabled={disabled}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {availableCards.map((card) => {
          const isSelected = isCardSelected(card.id)
          const canSelect = canSelectMore || isSelected
          
          return (
            <div
              key={card.id}
              className={cn(
                'relative group cursor-pointer transition-all duration-200',
                disabled && 'cursor-not-allowed opacity-50',
                !canSelect && !isSelected && 'opacity-40 cursor-not-allowed'
              )}
              onClick={() => canSelect && handleCardToggle(card)}
            >
              {/* Selection Overlay */}
              <div
                className={cn(
                  'absolute inset-0 rounded-lg border-3 transition-all duration-200 z-10 pointer-events-none',
                  isSelected
                    ? 'border-green-500 bg-green-50/20'
                    : canSelect
                    ? 'border-transparent group-hover:border-blue-300 group-hover:bg-blue-50/20'
                    : 'border-transparent'
                )}
              />
              
              {/* Selection Badge */}
              {isSelected && (
                <div className="absolute -top-2 -right-2 z-20 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
              
              {/* Add Button (when not selected and can select) */}
              {!isSelected && canSelect && (
                <div className="absolute -top-2 -right-2 z-20 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus className="w-4 h-4 text-white" />
                </div>
              )}
              
              {/* Card Number Badge */}
              <div className="absolute top-2 left-2 z-10 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-gray-700">
                #{card.cardNumber}
              </div>
              
              {/* Bingo Card */}
              <BingoCard
                card={card}
                size="sm"
                className={cn(
                  'transition-transform duration-200',
                  canSelect && 'group-hover:scale-105',
                  disabled && 'pointer-events-none'
                )}
              />
              
              {/* Card Footer */}
              <div className="mt-2 text-center">
                <div className="text-sm font-medium text-gray-700">
                  Cartón #{card.cardNumber}
                </div>
                <div className="text-xs text-gray-500">
                  S/ {cardPrice.toFixed(2)}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {availableCards.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay cartones disponibles
          </h3>
          <p className="text-gray-600 mb-4">
            Intenta generar nuevos cartones para este juego
          </p>
          <Button onClick={handleGenerateNewCards} disabled={isGenerating}>
            <RefreshCw className={cn('w-4 h-4 mr-2', isGenerating && 'animate-spin')} />
            Generar Cartones
          </Button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          {selectedCards.length === 0 && 'Selecciona al menos un cartón para continuar'}
          {selectedCards.length > 0 && selectedCards.length < maxCards && 
            `Puedes seleccionar ${maxCards - selectedCards.length} cartón${maxCards - selectedCards.length !== 1 ? 'es' : ''} más`}
          {selectedCards.length === maxCards && 'Has alcanzado el límite máximo de cartones'}
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setSelectedCards([])}
            disabled={selectedCards.length === 0 || disabled}
          >
            Limpiar Selección
          </Button>
          
          <Button
            onClick={handleConfirmSelection}
            disabled={selectedCards.length === 0 || disabled}
            className="min-w-32"
          >
            Confirmar Selección
            {selectedCards.length > 0 && (
              <span className="ml-2 bg-white/20 px-2 py-1 rounded-full text-xs">
                {selectedCards.length}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CardSelector