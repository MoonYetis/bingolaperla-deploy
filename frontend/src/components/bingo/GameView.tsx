import React, { useState, useEffect } from 'react'
import { MultiCardView } from './MultiCardView'
import { BallDisplay } from './BallDisplay'
import PrizeNotificationModal from '../game/PrizeNotificationModal'
import WalletNotifications from '../wallet/WalletNotifications'
import { cn } from '@/utils/cn'
import { BingoCardData } from '@/types'
import { useAppSelector, useAppDispatch } from '@/hooks/redux'
import { selectCurrentBall, selectBallsDrawn, selectIsGameActive } from '@/store/gamePlaySlice'
import { autoMarkNumber } from '@/store/bingoCardSlice'
import { useAnnounceBingoMutation } from '@/services/gameApi'
import { useToast } from '@/contexts/ToastContext'
import { useWalletSocket } from '@/hooks/useSocket'

interface GameViewProps {
  cards?: BingoCardData[]
  gameId?: string
  layout?: 'horizontal' | 'vertical' | 'sidebar'
  ballDisplayVariant?: 'full' | 'compact' | 'recent'
  autoMarkEnabled?: boolean
  showGameStats?: boolean
  className?: string
}

export const GameView: React.FC<GameViewProps> = ({
  cards = [],
  gameId,
  layout = 'horizontal',
  ballDisplayVariant = 'recent',
  autoMarkEnabled = false, // BINGO TRADICIONAL: auto-marcado desactivado por defecto
  showGameStats = true,
  className,
}) => {
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const currentBall = useAppSelector(selectCurrentBall)
  const ballsDrawn = useAppSelector(selectBallsDrawn)
  const isGameActive = useAppSelector(selectIsGameActive)
  const user = useAppSelector(state => state.auth.user)
  const [lastBallProcessed, setLastBallProcessed] = useState<number | null>(null)
  const [showPrizeModal, setShowPrizeModal] = useState(false)
  const [prizeInfo, setPrizeInfo] = useState<any>(null)
  
  // Hook para anunciar BINGO
  const [announceBingo, { isLoading: isAnnouncingBingo }] = useAnnounceBingoMutation()
  
  // Hook para notificaciones de wallet en tiempo real
  const {
    currentBalance,
    notifications,
    unreadCount,
    markNotificationAsRead,
    clearNotifications
  } = useWalletSocket(user?.id || null)

  // BINGO TRADICIONAL: NO hay auto-marcado
  // Los jugadores deben marcar manualmente haciendo click en los números
  // Solo actualizamos el estado de la última bola procesada para evitar duplicados
  useEffect(() => {
    if (currentBall && currentBall !== lastBallProcessed) {
      setLastBallProcessed(currentBall)
    }
  }, [currentBall, lastBallProcessed])

  // Manejar anuncio de BINGO
  const handleAnnounceBingo = async (cardId: string) => {
    if (!gameId) {
      toast.error('ID de juego no disponible')
      return
    }

    try {
      const result = await announceBingo({ gameId, cardId }).unwrap()
      
      if (result.success && result.isValid) {
        // BINGO VÁLIDO
        if (result.prize) {
          // Mostrar modal de premio
          setPrizeInfo({
            amount: result.prize.amount,
            currency: result.prize.currency,
            transactionId: result.prize.transactionId,
            newBalance: result.prize.newBalance,
            description: result.prize.description,
            timestamp: result.prize.timestamp,
            pattern: result.winningPattern || 'UNKNOWN',
            gameId: gameId,
          })
          setShowPrizeModal(true)
        } else {
          toast.success(result.message)
        }
      } else {
        // BINGO INVÁLIDO
        toast.error(result.message || 'BINGO inválido')
      }
    } catch (error: any) {
      console.error('Error announcing BINGO:', error)
      const errorMessage = error.data?.error || error.message || 'Error anunciando BINGO'
      toast.error(errorMessage)
    }
  }

  // Cerrar modal de premio
  const handleClosePrizeModal = () => {
    setShowPrizeModal(false)
    setPrizeInfo(null)
  }

  // Layout configurations
  const layoutConfigs = {
    horizontal: {
      container: 'grid grid-cols-1 xl:grid-cols-3 gap-6',
      cardsArea: 'xl:col-span-2',
      ballsArea: '',
      cardSize: 'sm' as const,
      ballSize: 'md' as const,
    },
    vertical: {
      container: 'flex flex-col gap-6',
      cardsArea: '',
      ballsArea: '',
      cardSize: 'md' as const,
      ballSize: 'lg' as const,
    },
    sidebar: {
      container: 'grid grid-cols-1 lg:grid-cols-4 gap-6',
      cardsArea: 'lg:col-span-3',
      ballsArea: '',
      cardSize: 'sm' as const,
      ballSize: 'sm' as const,
    },
  }

  const config = layoutConfigs[layout]

  return (
    <div className={cn('space-y-6', className)}>
      {/* Game Header */}
      {showGameStats && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{cards.length}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Cartones</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{ballsDrawn.length}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Cantados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {currentBall || '--'}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Actual</div>
              </div>
            </div>
            
            {/* Game Status */}
            <div className="flex items-center gap-3">
              <div className={cn(
                'px-3 py-1 rounded-full text-sm font-medium',
                isGameActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              )}>
                {isGameActive ? 'En Vivo' : 'Pausado'}
              </div>
              
              <div className={cn(
                'px-3 py-1 rounded-full text-sm font-medium',
                autoMarkEnabled 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-orange-100 text-orange-800'
              )}>
                {autoMarkEnabled ? 'Auto-marca: ON' : 'Marcado Manual'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Game Area */}
      <div className={config.container}>
        {/* Cards Area */}
        <div className={config.cardsArea}>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Mis Cartones
              </h2>
              <div className="text-sm text-gray-500">
                {cards.filter(c => c.isWinner).length > 0 && (
                  <span className="text-gold-600 font-medium">
                    ¡{cards.filter(c => c.isWinner).length} ganador(es)!
                  </span>
                )}
              </div>
            </div>
            
            <MultiCardView
              cards={cards}
              gameId={gameId}
              layout="grid"
              size={config.cardSize}
              showStats={!showGameStats} // Don't duplicate stats
              showCardSelector={false}
              autoMark={autoMarkEnabled}
              disabled={!isGameActive || isAnnouncingBingo}
              showBingoButton={true} // BINGO TRADICIONAL: mostrar botón de BINGO
              onAnnounceBingo={handleAnnounceBingo}
            />
          </div>
        </div>

        {/* Ball Display Area */}
        <div className={config.ballsArea}>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {ballDisplayVariant === 'full' && 'Todos los Números'}
                {ballDisplayVariant === 'compact' && 'Números Cantados'}
                {ballDisplayVariant === 'recent' && 'Últimos Números'}
              </h2>
              
              {ballsDrawn.length > 0 && (
                <div className="text-sm text-gray-500">
                  {ballsDrawn.length}/75
                </div>
              )}
            </div>
            
            <BallDisplay
              variant={ballDisplayVariant}
              size={config.ballSize}
              showTitle={false}
              showStats={ballDisplayVariant === 'full'}
              animated={isGameActive}
            />
          </div>
        </div>
      </div>

      {/* Game Actions */}
      {!isGameActive && ballsDrawn.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-4">🎯</div>
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Esperando Inicio del Juego
          </h3>
          <p className="text-blue-700">
            El juego comenzará pronto. Asegúrate de tener tus cartones listos.
          </p>
        </div>
      )}

      {/* Winner Celebration */}
      {cards.some(card => card.isWinner) && (
        <div className="bg-gradient-to-r from-gold-50 to-yellow-50 border-2 border-gold-400 rounded-lg p-6 text-center animate-pulse">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-2xl font-bold text-gold-800 mb-2">
            ¡FELICITACIONES!
          </h3>
          <p className="text-gold-700">
            {cards.filter(c => c.isWinner).length === 1 
              ? 'Tienes un cartón ganador'
              : `Tienes ${cards.filter(c => c.isWinner).length} cartones ganadores`
            }
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {cards.filter(c => c.isWinner).map(card => (
              <div key={card.id} className="px-3 py-1 bg-gold-200 text-gold-800 rounded-full text-sm font-medium">
                Cartón #{card.cardNumber} - {card.winningPattern}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Game Complete */}
      {!isGameActive && ballsDrawn.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-4">🏁</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Juego Finalizado
          </h3>
          <p className="text-gray-600">
            Se cantaron {ballsDrawn.length} números en total.
          </p>
        </div>
      )}

      {/* Modal de Premio */}
      <PrizeNotificationModal
        isOpen={showPrizeModal}
        onClose={handleClosePrizeModal}
        prize={prizeInfo}
      />

      {/* Notificaciones de Wallet en tiempo real */}
      <WalletNotifications
        notifications={notifications}
        onMarkAsRead={markNotificationAsRead}
        onClearAll={clearNotifications}
      />
    </div>
  )
}

export default GameView