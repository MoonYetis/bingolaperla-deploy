import React, { useMemo } from 'react'
import { cn } from '@/utils/cn'
import { WinningPattern } from '@/types'

interface PatternHighlightProps {
  patterns: WinningPattern[]
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  className?: string
}

// Mapeo de patrones a posiciones de celdas (0-24)
const PATTERN_POSITIONS: Record<WinningPattern, number[]> = {
  // Líneas horizontales
  [WinningPattern.LINE_HORIZONTAL_1]: [0, 1, 2, 3, 4],
  [WinningPattern.LINE_HORIZONTAL_2]: [5, 6, 7, 8, 9],
  [WinningPattern.LINE_HORIZONTAL_3]: [10, 11, 12, 13, 14],
  [WinningPattern.LINE_HORIZONTAL_4]: [15, 16, 17, 18, 19],
  [WinningPattern.LINE_HORIZONTAL_5]: [20, 21, 22, 23, 24],
  
  // Líneas verticales
  [WinningPattern.LINE_VERTICAL_B]: [0, 5, 10, 15, 20],
  [WinningPattern.LINE_VERTICAL_I]: [1, 6, 11, 16, 21],
  [WinningPattern.LINE_VERTICAL_N]: [2, 7, 12, 17, 22],
  [WinningPattern.LINE_VERTICAL_G]: [3, 8, 13, 18, 23],
  [WinningPattern.LINE_VERTICAL_O]: [4, 9, 14, 19, 24],
  
  // Diagonales
  [WinningPattern.DIAGONAL_TOP_LEFT]: [0, 6, 12, 18, 24],
  [WinningPattern.DIAGONAL_TOP_RIGHT]: [4, 8, 12, 16, 20],
  
  // Patrones especiales
  [WinningPattern.FOUR_CORNERS]: [0, 4, 20, 24],
  [WinningPattern.PATTERN_X]: [0, 4, 6, 8, 12, 16, 18, 20, 24],
  [WinningPattern.PATTERN_T]: [0, 1, 2, 3, 4, 12, 17, 22],
  [WinningPattern.PATTERN_L]: [0, 5, 10, 15, 20, 21, 22, 23, 24],
  
  // Cartón completo
  [WinningPattern.FULL_CARD]: Array.from({ length: 25 }, (_, i) => i),
}

export const PatternHighlight: React.FC<PatternHighlightProps> = ({
  patterns,
  size = 'md',
  animated = true,
  className,
}) => {
  // Combinar todas las posiciones de los patrones ganadores
  const highlightedPositions = useMemo(() => {
    const positions = new Set<number>()
    patterns.forEach(pattern => {
      const patternPositions = PATTERN_POSITIONS[pattern] || []
      patternPositions.forEach(pos => positions.add(pos))
    })
    return positions
  }, [patterns])

  // Si no hay patrones, no mostrar nada
  if (patterns.length === 0) {
    return null
  }

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12', 
    lg: 'h-16 w-16',
  }

  const gridSizeClass = sizeClasses[size]

  // Crear elementos de overlay para cada posición destacada
  const overlayElements = useMemo(() => {
    return Array.from({ length: 25 }, (_, position) => {
      const isHighlighted = highlightedPositions.has(position)
      const row = Math.floor(position / 5)
      const col = position % 5
      
      if (!isHighlighted) return null

      return (
        <div
          key={position}
          className={cn(
            'absolute rounded-lg pointer-events-none z-10',
            gridSizeClass,
            
            // Posicionamiento en grid
            'top-0 left-0',
            
            // Estilos de highlight
            'bg-gradient-to-br from-gold-400/40 to-gold-600/40',
            'border-2 border-gold-400',
            'shadow-lg shadow-gold-200/50',
            
            // Animaciones
            animated && [
              'animate-pulse',
              'transition-all duration-500',
            ]
          )}
          style={{
            gridColumn: col + 1,
            gridRow: row + 1,
          }}
        >
          {/* Efecto de brillo interno */}
          <div className="absolute inset-1 bg-gradient-to-br from-yellow-200/30 to-gold-300/30 rounded-md" />
          
          {/* Indicador de patrón ganador */}
          <div className="absolute top-0 right-0 w-2 h-2 bg-gold-500 rounded-full animate-bounce" 
               style={{ animationDelay: `${position * 50}ms` }} />
        </div>
      )
    })
  }, [highlightedPositions, gridSizeClass, animated])

  return (
    <div 
      className={cn(
        'absolute inset-0 grid grid-cols-5 gap-1 pointer-events-none z-10',
        className
      )}
      role="presentation"
      aria-label={`Patrón ganador: ${patterns.join(', ')}`}
    >
      {overlayElements}
      
      {/* Efecto de celebración para cartón completo */}
      {patterns.includes(WinningPattern.FULL_CARD) && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Confeti o efecto especial */}
          <div className="absolute inset-0 bg-gradient-radial from-gold-200/20 via-transparent to-transparent animate-ping" />
          <div className="absolute inset-0 bg-gradient-radial from-yellow-200/20 via-transparent to-transparent animate-pulse" 
               style={{ animationDelay: '250ms' }} />
        </div>
      )}
    </div>
  )
}

// Componente para mostrar información del patrón
export const PatternInfo: React.FC<{
  patterns: WinningPattern[]
  className?: string
}> = ({ patterns, className }) => {
  const patternNames: Record<WinningPattern, string> = {
    [WinningPattern.LINE_HORIZONTAL_1]: 'Línea Horizontal 1',
    [WinningPattern.LINE_HORIZONTAL_2]: 'Línea Horizontal 2',
    [WinningPattern.LINE_HORIZONTAL_3]: 'Línea Horizontal 3',
    [WinningPattern.LINE_HORIZONTAL_4]: 'Línea Horizontal 4',
    [WinningPattern.LINE_HORIZONTAL_5]: 'Línea Horizontal 5',
    [WinningPattern.LINE_VERTICAL_B]: 'Columna B',
    [WinningPattern.LINE_VERTICAL_I]: 'Columna I',
    [WinningPattern.LINE_VERTICAL_N]: 'Columna N',
    [WinningPattern.LINE_VERTICAL_G]: 'Columna G',
    [WinningPattern.LINE_VERTICAL_O]: 'Columna O',
    [WinningPattern.DIAGONAL_TOP_LEFT]: 'Diagonal ↘',
    [WinningPattern.DIAGONAL_TOP_RIGHT]: 'Diagonal ↙',
    [WinningPattern.FOUR_CORNERS]: 'Cuatro Esquinas',
    [WinningPattern.PATTERN_X]: 'Patrón X',
    [WinningPattern.PATTERN_T]: 'Patrón T',
    [WinningPattern.PATTERN_L]: 'Patrón L',
    [WinningPattern.FULL_CARD]: 'Cartón Completo',
  }

  if (patterns.length === 0) return null

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {patterns.map(pattern => (
        <span
          key={pattern}
          className="px-2 py-1 bg-gold-100 text-gold-800 text-xs rounded-full font-medium"
        >
          {patternNames[pattern] || pattern}
        </span>
      ))}
    </div>
  )
}

// Hook para detectar patrones ganadores
export const usePatternDetection = (markedPositions: number[]): WinningPattern[] => {
  return useMemo(() => {
    const detectedPatterns: WinningPattern[] = []
    const markedSet = new Set(markedPositions)

    // Verificar cada patrón
    Object.entries(PATTERN_POSITIONS).forEach(([pattern, positions]) => {
      const isPatternComplete = positions.every(pos => markedSet.has(pos))
      if (isPatternComplete) {
        detectedPatterns.push(pattern as WinningPattern)
      }
    })

    return detectedPatterns
  }, [markedPositions])
}

export default PatternHighlight