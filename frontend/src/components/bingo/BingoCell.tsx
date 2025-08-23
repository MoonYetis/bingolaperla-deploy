import React, { useState, useEffect } from 'react'
import { cn } from '@/utils/cn'
import { CardNumberData, WinningPattern } from '@/types'

interface BingoCellProps {
  number: CardNumberData
  isHighlighted?: boolean
  winningPatterns?: WinningPattern[]
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  autoMark?: boolean
  onClick?: (number: CardNumberData) => void
  className?: string
  isNewlyMarked?: boolean
  isRecentlyDrawn?: boolean
}

export const BingoCell: React.FC<BingoCellProps> = ({
  number,
  isHighlighted = false,
  winningPatterns = [],
  size = 'md',
  disabled = false,
  autoMark = true,
  onClick,
  className,
  isNewlyMarked = false,
  isRecentlyDrawn = false,
}) => {
  const { number: cellNumber, isMarked, isFree, column } = number
  const [wasJustMarked, setWasJustMarked] = useState(false)
  const [showMarkAnimation, setShowMarkAnimation] = useState(false)
  
  // Detectar cuando se marca un número para mostrar animación
  useEffect(() => {
    if (isMarked && isNewlyMarked) {
      setWasJustMarked(true)
      setShowMarkAnimation(true)
      
      const timer = setTimeout(() => {
        setWasJustMarked(false)
        setShowMarkAnimation(false)
      }, 1200)
      
      return () => clearTimeout(timer)
    }
  }, [isMarked, isNewlyMarked])

  const handleClick = () => {
    if (!disabled && !isFree && onClick && (!autoMark || !isMarked)) {
      setShowMarkAnimation(true)
      onClick(number)
      
      // Resetear animación después de un tiempo
      setTimeout(() => setShowMarkAnimation(false), 600)
    }
  }

  const isWinningCell = winningPatterns.length > 0

  const sizeClasses = {
    sm: 'h-10 w-10 text-sm',
    md: 'h-14 w-14 text-base',
    lg: 'h-18 w-18 text-lg', // Tamaño optimizado para touch móvil
  }

  const getColumnColor = (col: string) => {
    const colors = {
      B: 'border-blue-500',
      I: 'border-red-500', 
      N: 'border-green-500',
      G: 'border-yellow-500',
      O: 'border-purple-500',
    }
    return colors[col as keyof typeof colors] || 'border-gray-400'
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || (autoMark && isFree)}
      className={cn(
        // Base styles
        'relative flex items-center justify-center border-2 rounded-lg font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-1 transform-gpu touch-manipulation',
        
        // Size
        sizeClasses[size],
        
        // Column color
        getColumnColor(column),
        
        // Free cell styles
        isFree && [
          'bg-gradient-to-br from-gray-100 to-gray-200',
          'text-gray-600 cursor-default',
          'shadow-inner',
        ],
        
        // Marked state
        isMarked && !isFree && [
          'bg-gradient-to-br from-green-400 to-green-600',
          'text-white shadow-lg',
          'border-green-600',
          wasJustMarked ? 'animate-bounce scale-110' : 'scale-95',
        ],
        
        // Unmarked state
        !isMarked && !isFree && [
          'bg-white hover:bg-gray-50',
          'text-gray-800 shadow-sm',
          'hover:shadow-md hover:scale-105 hover:-translate-y-0.5',
          !disabled && 'cursor-pointer',
          'active:scale-95 active:translate-y-0',
        ],
        
        // Highlighted state (when ball is drawn)
        isHighlighted && !isMarked && [
          'ring-4 ring-yellow-400 ring-offset-2',
          'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-400',
          'animate-pulse scale-110 shadow-lg shadow-yellow-200',
        ],
        
        // Recently drawn animation
        isRecentlyDrawn && [
          'animate-ping scale-105',
        ],
        
        // Winning pattern highlight
        isWinningCell && [
          'ring-4 ring-gold-400 ring-offset-2',
          'shadow-xl shadow-gold-200',
          isMarked && 'bg-gradient-to-br from-gold-400 to-gold-600',
          'animate-pulse',
        ],
        
        // Disabled state
        disabled && [
          'opacity-50 cursor-not-allowed',
          'hover:transform-none hover:shadow-none',
        ],
        
        className
      )}
      aria-label={
        isFree 
          ? 'Free space' 
          : `${column}${cellNumber}${isMarked ? ' marked' : ''}`
      }
      aria-pressed={isMarked}
    >
      {/* Cell content */}
      <span className={cn(
        "relative z-10 transition-all duration-300",
        showMarkAnimation && "scale-125",
        wasJustMarked && "animate-pulse"
      )}>
        {isFree ? 'FREE' : cellNumber}
      </span>
      
      {/* Marked indicator overlay */}
      {isMarked && !isFree && (
        <div className={cn(
          "absolute inset-0 flex items-center justify-center transition-all duration-500",
          wasJustMarked && "animate-bounce"
        )}>
          <div className={cn(
            "w-6 h-6 bg-white bg-opacity-30 rounded-full flex items-center justify-center transition-all duration-300",
            showMarkAnimation && "scale-150 rotate-12"
          )}>
            <svg className={cn(
              "w-4 h-4 text-white transition-all duration-300",
              showMarkAnimation && "scale-125"
            )} fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      )}
      
      {/* Pattern highlight indicator */}
      {isWinningCell && (
        <div className="absolute top-0 right-0 w-3 h-3 bg-gold-400 rounded-full animate-bounce shadow-lg">
          <div className="absolute inset-0 bg-gold-400 rounded-full animate-ping opacity-75" />
        </div>
      )}
      
      {/* Highlight pulse for drawn numbers */}
      {isHighlighted && (
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-200 to-yellow-300 bg-opacity-60 rounded-lg animate-ping" />
      )}
      
      {/* Recently drawn sparkle effect */}
      {isRecentlyDrawn && (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-purple-200 bg-opacity-40 rounded-lg animate-pulse" />
          <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full animate-ping" />
          <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-white rounded-full animate-ping" style={{animationDelay: '0.5s'}} />
        </>
      )}
      
      {/* Success animation burst */}
      {showMarkAnimation && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-green-300 bg-opacity-40 rounded-lg animate-ping" />
          <div className="absolute top-0 left-1/2 w-1 h-1 bg-green-400 rounded-full animate-bounce transform -translate-x-1/2" />
          <div className="absolute bottom-0 left-1/4 w-1 h-1 bg-green-400 rounded-full animate-bounce transform -translate-x-1/2" style={{animationDelay: '0.1s'}} />
          <div className="absolute bottom-0 right-1/4 w-1 h-1 bg-green-400 rounded-full animate-bounce transform translate-x-1/2" style={{animationDelay: '0.2s'}} />
        </div>
      )}
    </button>
  )
}

export default BingoCell