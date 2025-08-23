import React, { useState, useEffect } from 'react'
import { cn } from '@/utils/cn'
import { ColumnLetter } from '@/types'
import { useAppSelector } from '@/hooks/redux'
import { 
  selectCurrentBall, 
  selectBallsDrawn, 
  selectBallHistory, 
  selectLastBalls 
} from '@/store/gamePlaySlice'

interface BallDisplayProps {
  variant?: 'full' | 'compact' | 'recent'
  size?: 'sm' | 'md' | 'lg'
  showTitle?: boolean
  showStats?: boolean
  animated?: boolean
  className?: string
}

// Función helper para obtener el color de la columna
const getColumnColor = (number: number): { bg: string; text: string; border: string } => {
  if (number >= 1 && number <= 15) return { 
    bg: 'bg-blue-500', 
    text: 'text-white', 
    border: 'border-blue-600' 
  }
  if (number >= 16 && number <= 30) return { 
    bg: 'bg-red-500', 
    text: 'text-white', 
    border: 'border-red-600' 
  }
  if (number >= 31 && number <= 45) return { 
    bg: 'bg-green-500', 
    text: 'text-white', 
    border: 'border-green-600' 
  }
  if (number >= 46 && number <= 60) return { 
    bg: 'bg-yellow-500', 
    text: 'text-white', 
    border: 'border-yellow-600' 
  }
  if (number >= 61 && number <= 75) return { 
    bg: 'bg-purple-500', 
    text: 'text-white', 
    border: 'border-purple-600' 
  }
  return { bg: 'bg-gray-400', text: 'text-white', border: 'border-gray-500' }
}

// Función helper para obtener la letra de la columna
const getColumnLetter = (number: number): ColumnLetter => {
  if (number >= 1 && number <= 15) return 'B'
  if (number >= 16 && number <= 30) return 'I'
  if (number >= 31 && number <= 45) return 'N'
  if (number >= 46 && number <= 60) return 'G'
  if (number >= 61 && number <= 75) return 'O'
  return 'B' // Fallback
}

export const BallDisplay: React.FC<BallDisplayProps> = ({
  variant = 'full',
  size = 'md',
  showTitle = true,
  showStats = true,
  animated = true,
  className,
}) => {
  const currentBall = useAppSelector(selectCurrentBall)
  const ballsDrawn = useAppSelector(selectBallsDrawn)
  const ballHistory = useAppSelector(selectBallHistory)
  const lastBalls = useAppSelector(selectLastBalls(5))
  
  // Estados para animaciones
  const [newlyDrawnBalls, setNewlyDrawnBalls] = useState<Set<number>>(new Set())
  const [highlightedBall, setHighlightedBall] = useState<number | null>(null)
  const [bounceAnimation, setBounceAnimation] = useState<number | null>(null)
  
  // Efecto para detectar nuevas bolas cantadas
  useEffect(() => {
    if (currentBall && !newlyDrawnBalls.has(currentBall)) {
      setNewlyDrawnBalls(prev => new Set([...prev, currentBall]))
      setHighlightedBall(currentBall)
      setBounceAnimation(currentBall)
      
      // Limpiar highlight después de 3 segundos
      setTimeout(() => {
        setHighlightedBall(null)
        setBounceAnimation(null)
      }, 3000)
      
      // Remover de newly drawn después de 5 segundos
      setTimeout(() => {
        setNewlyDrawnBalls(prev => {
          const newSet = new Set(prev)
          newSet.delete(currentBall)
          return newSet
        })
      }, 5000)
    }
  }, [currentBall, newlyDrawnBalls])

  // Configuraciones de tamaño
  const sizeClasses = {
    sm: {
      ball: 'w-8 h-8 text-xs',
      container: 'gap-2',
      recent: 'gap-1',
    },
    md: {
      ball: 'w-10 h-10 text-sm',
      container: 'gap-3',
      recent: 'gap-2',
    },
    lg: {
      ball: 'w-12 h-12 text-base',
      container: 'gap-4',
      recent: 'gap-3',
    },
  }

  const currentSizeClasses = sizeClasses[size]

  // Vista de grid completo (1-75)
  const FullGridView = () => {
    const numbers = Array.from({ length: 75 }, (_, i) => i + 1)
    
    return (
      <div className="space-y-4">
        {/* Headers B-I-N-G-O */}
        <div className="grid grid-cols-5 gap-4">
          {(['B', 'I', 'N', 'G', 'O'] as ColumnLetter[]).map((letter, index) => (
            <div key={letter} className="text-center">
              <div className={cn(
                'text-lg font-bold py-2 px-4 rounded-lg text-white',
                index === 0 && 'bg-blue-500',
                index === 1 && 'bg-red-500',
                index === 2 && 'bg-green-500',
                index === 3 && 'bg-yellow-500',
                index === 4 && 'bg-purple-500',
              )}>
                {letter}
              </div>
            </div>
          ))}
        </div>

        {/* Grid de números */}
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }, (_, colIndex) => (
            <div key={colIndex} className={cn('grid grid-cols-3 gap-1', currentSizeClasses.container)}>
              {numbers
                .filter(num => {
                  const ranges = [
                    [1, 15],   // B
                    [16, 30],  // I
                    [31, 45],  // N
                    [46, 60],  // G
                    [61, 75]   // O
                  ]
                  const range = ranges[colIndex]
                  if (!range) return false
                  const [min, max] = range
                  return min !== undefined && max !== undefined && num >= min && num <= max
                })
                .map(number => {
                  const isDrawn = ballsDrawn.includes(number)
                  const isCurrent = currentBall === number
                  const colors = getColumnColor(number)
                  
                  const isNewlyDrawn = newlyDrawnBalls.has(number)
                  const isHighlighted = highlightedBall === number
                  const hasBounceAnimation = bounceAnimation === number
                  
                  return (
                    <div
                      key={number}
                      className={cn(
                        'rounded-full flex items-center justify-center font-bold border-2 transition-all duration-500 transform-gpu relative',
                        currentSizeClasses.ball,
                        
                        // Estados básicos
                        !isDrawn && 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200',
                        isDrawn && !isCurrent && [colors.bg, colors.text, colors.border, 'shadow-md'],
                        
                        // Bola actual con efectos especiales
                        isCurrent && [
                          colors.bg, 
                          colors.text, 
                          colors.border,
                          'ring-4 ring-yellow-400 ring-offset-2 shadow-xl',
                          animated && 'animate-pulse scale-125 z-10'
                        ],
                        
                        // Efectos para bolas recién cantadas
                        isNewlyDrawn && [
                          'scale-110 shadow-2xl',
                          animated && 'animate-bounce'
                        ],
                        
                        // Highlight especial
                        isHighlighted && 'ring-2 ring-green-400 ring-offset-1',
                        
                        // Animación de rebote
                        hasBounceAnimation && animated && 'animate-bounce',
                        
                        // Hover effects
                        isDrawn && 'hover:scale-105 cursor-pointer',
                      )}
                      style={{
                        animationDelay: isDrawn ? `${ballsDrawn.indexOf(number) * 50}ms` : '0ms',
                        transitionDelay: isDrawn ? `${ballsDrawn.indexOf(number) * 50}ms` : '0ms'
                      }}
                    >
                      {number}
                      
                      {/* Efectos visuales adicionales */}
                      {isNewlyDrawn && (
                        <>
                          <div className="absolute inset-0 bg-white bg-opacity-30 rounded-full animate-ping" />
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-bounce" />
                        </>
                      )}
                      
                      {isCurrent && (
                        <>
                          <div className="absolute inset-0 bg-yellow-300 bg-opacity-20 rounded-full animate-pulse" />
                          <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-ping opacity-75" />
                        </>
                      )}
                    </div>
                  )
                })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Vista compacta (solo números cantados)
  const CompactView = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-center gap-2">
        {ballHistory.slice(0, 25).map((entry, index) => {
          const isCurrent = entry.ball === currentBall
          const colors = getColumnColor(entry.ball)
          
          const isNewlyDrawn = newlyDrawnBalls.has(entry.ball)
          const isHighlighted = highlightedBall === entry.ball
          
          return (
            <div
              key={`${entry.ball}-${entry.timestamp}`}
              className={cn(
                'rounded-full flex items-center justify-center font-bold border-2 transition-all duration-500 transform-gpu relative',
                currentSizeClasses.ball,
                colors.bg,
                colors.text,
                colors.border,
                
                isCurrent && [
                  'ring-4 ring-yellow-400 ring-offset-2 shadow-xl',
                  animated && 'animate-pulse scale-125 z-10'
                ],
                
                // Efectos para bolas recién cantadas
                isNewlyDrawn && [
                  'scale-110 shadow-2xl',
                  animated && 'animate-bounce'
                ],
                
                // Highlight especial
                isHighlighted && 'ring-2 ring-green-400 ring-offset-1',
                
                // Fade progresivo para números más antiguos
                index > 5 && 'opacity-80',
                index > 10 && 'opacity-60',
                index > 15 && 'opacity-40',
                index > 20 && 'opacity-30',
                
                // Hover effects
                'hover:scale-105 cursor-pointer',
              )}
              style={{
                animationDelay: animated ? `${index * 75}ms` : '0ms',
                transform: animated ? `translateY(${Math.sin(index * 0.5) * 2}px)` : 'none'
              }}
            >
              {entry.ball}
              
              {/* Efectos especiales para la primera bola */}
              {index === 0 && isNewlyDrawn && (
                <>
                  <div className="absolute inset-0 bg-white bg-opacity-20 rounded-full animate-ping" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-bounce" />
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  // Vista de últimas bolas
  const RecentView = () => (
    <div className="space-y-3">
      {/* Bola actual destacada */}
      {currentBall && (
        <div className="text-center">
          <div className="text-sm text-gray-500 mb-2 animate-pulse">🎱 Número Actual</div>
          <div className="relative">
            <div className={cn(
              'mx-auto rounded-full flex items-center justify-center font-bold border-4 shadow-2xl relative z-10',
              'w-20 h-20 text-2xl transform-gpu',
              getColumnColor(currentBall).bg,
              getColumnColor(currentBall).text,
              getColumnColor(currentBall).border,
              'ring-4 ring-yellow-400 ring-offset-2',
              animated && 'animate-pulse scale-110'
            )}>
              {getColumnLetter(currentBall)}{currentBall}
              
              {/* Efectos de partículas alrededor */}
              <div className="absolute inset-0 rounded-full">
                <div className="absolute -top-2 -left-2 w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '0s'}} />
                <div className="absolute top-0 -right-3 w-2 h-2 bg-yellow-300 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
                <div className="absolute -bottom-2 left-0 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}} />
                <div className="absolute bottom-1 -right-2 w-2 h-2 bg-yellow-300 rounded-full animate-bounce" style={{animationDelay: '0.6s'}} />
              </div>
            </div>
            
            {/* Ondas de expansión */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 border-2 border-yellow-300 rounded-full animate-ping opacity-20" />
              <div className="absolute w-28 h-28 border border-yellow-200 rounded-full animate-ping opacity-10" style={{animationDelay: '0.5s'}} />
            </div>
          </div>
        </div>
      )}

      {/* Últimas 5 bolas */}
      {lastBalls.length > 0 && (
        <div>
          <div className="text-sm text-gray-500 mb-2 text-center">Últimos Números</div>
          <div className={cn('flex justify-center flex-wrap', currentSizeClasses.recent)}>
            {lastBalls.map((entry, index) => {
              const colors = getColumnColor(entry.ball)
              
              const isNewlyDrawn = newlyDrawnBalls.has(entry.ball)
              const isHighlighted = highlightedBall === entry.ball
              
              return (
                <div
                  key={`${entry.ball}-${entry.timestamp}`}
                  className={cn(
                    'rounded-full flex items-center justify-center font-bold border-2 transition-all duration-500 transform-gpu relative',
                    currentSizeClasses.ball,
                    colors.bg,
                    colors.text,
                    colors.border,
                    
                    // Efectos especiales para bolas recién cantadas
                    isNewlyDrawn && [
                      'scale-110 shadow-lg',
                      animated && 'animate-bounce'
                    ],
                    
                    // Highlight especial
                    isHighlighted && 'ring-2 ring-green-400 ring-offset-1',
                    
                    // Transparencia progresiva
                    index > 0 && 'opacity-90',
                    index > 1 && 'opacity-80',
                    index > 2 && 'opacity-70',
                    index > 3 && 'opacity-60',
                    
                    // Hover effects
                    'hover:scale-105 cursor-pointer hover:shadow-md',
                  )}
                  style={{
                    animationDelay: animated ? `${index * 100}ms` : '0ms',
                    transform: `scale(${1 - index * 0.05}) translateY(${index * 2}px)`
                  }}
                >
                  {entry.ball}
                  
                  {/* Efectos para la primera bola (más reciente) */}
                  {index === 0 && isNewlyDrawn && (
                    <>
                      <div className="absolute inset-0 bg-white bg-opacity-20 rounded-full animate-ping" />
                      <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )

  // Estadísticas
  const StatsView = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">{ballsDrawn.length}</div>
        <div className="text-xs text-gray-500 uppercase tracking-wide">Cantados</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">{75 - ballsDrawn.length}</div>
        <div className="text-xs text-gray-500 uppercase tracking-wide">Restantes</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600">
          {currentBall || '--'}
        </div>
        <div className="text-xs text-gray-500 uppercase tracking-wide">Actual</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-yellow-600">
          {Math.round((ballsDrawn.length / 75) * 100)}%
        </div>
        <div className="text-xs text-gray-500 uppercase tracking-wide">Progreso</div>
      </div>
    </div>
  )

  return (
    <div className={cn('bg-white rounded-xl shadow-lg border border-gray-200 p-6', className)}>
      {/* Header */}
      {showTitle && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {variant === 'full' && 'Números de Bingo (1-75)'}
            {variant === 'compact' && 'Números Cantados'}
            {variant === 'recent' && 'Últimos Números'}
          </h2>
          <div className="text-sm text-gray-500">
            {ballsDrawn.length > 0 
              ? `${ballsDrawn.length} de 75 números cantados`
              : 'Esperando inicio del juego...'
            }
          </div>
        </div>
      )}

      {/* Stats */}
      {showStats && <StatsView />}

      {/* Contenido principal */}
      <div className="mt-6">
        {variant === 'full' && <FullGridView />}
        {variant === 'compact' && <CompactView />}
        {variant === 'recent' && <RecentView />}
      </div>

      {/* Estado vacío con animación */}
      {ballsDrawn.length === 0 && (
        <div className="text-center py-12">
          <div className="relative inline-block">
            <div className="text-8xl mb-4 animate-bounce">🎱</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 border-2 border-gray-300 rounded-full animate-ping opacity-20" />
            </div>
          </div>
          <p className="text-gray-500 text-lg animate-pulse">
            {variant === 'full' ? 'Números listos para ser cantados' : 'Esperando el primer número...'}
          </p>
          <div className="flex justify-center mt-4 space-x-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0s'}} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}} />
          </div>
        </div>
      )}
    </div>
  )
}

export default BallDisplay