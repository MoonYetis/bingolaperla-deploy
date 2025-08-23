import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGetGameByIdQuery } from '@/services/gameApi'
import { useGetMyCardsQuery } from '@/services/bingoCardApi'
import { useBingoSocket } from '@/hooks/useBingoSocket'
import { useToast } from '@/contexts/ToastContext'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import Button from '@/components/common/Button'
import BingoCard from '@/components/bingo/BingoCard'
import { BingoButton } from '@/components/bingo/BingoButton'
import { GameStatus } from '@/types'

const GamePage = () => {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  // API queries
  const { data: gameResponse, isLoading: gameLoading } = useGetGameByIdQuery(gameId!, {
    skip: !gameId,
    pollingInterval: 5000,
  })
  
  const { data: cardsResponse, isLoading: cardsLoading } = useGetMyCardsQuery(gameId!, {
    skip: !gameId,
  })

  // Socket para tiempo real - usando sistema unificado
  const [lastBall, setLastBall] = useState<number | null>(null)
  const [ballsDrawn, setBallsDrawn] = useState<number[]>([])
  const [gameStatus, setGameStatus] = useState<string>('')
  const [playerCount, setPlayerCount] = useState<number>(0)
  
  const { isConnected, on, off } = useBingoSocket({
    gameId: gameId || undefined,
    isAdmin: false
  })

  const game = gameResponse?.game
  const myCards = cardsResponse?.cards || []
  
  // Listeners de eventos Socket.IO para sincronización
  useEffect(() => {
    if (!isConnected) return

    // Escuchar números cantados por el admin
    const handleNumberCalled = (data: { number: number; gameId: string }) => {
      console.log('🎱 Número cantado por admin:', data.number)
      setLastBall(data.number)
      setBallsDrawn(prev => {
        if (!prev.includes(data.number)) {
          return [...prev, data.number]
        }
        return prev
      })
    }

    // Escuchar reset del juego
    const handleGameReset = (data: { gameId: string }) => {
      console.log('🔄 Juego reiniciado por admin')
      setLastBall(null)
      setBallsDrawn([])
    }

    // Escuchar cambios de estado del juego
    const handleGameStatusChanged = (data: { status: 'active' | 'paused'; gameId: string }) => {
      console.log('🎮 Estado del juego cambiado:', data.status)
      setGameStatus(data.status)
    }

    // Escuchar cambios de patrón
    const handlePatternChanged = (data: { pattern: string; gameId: string }) => {
      console.log('🏆 Patrón cambiado:', data.pattern)
      // Aquí podrías actualizar el patrón actual si es necesario
    }

    // Escuchar ganadores de BINGO
    const handleBingoWinner = (data: { 
      userId: string; 
      cardId: string; 
      gameId: string; 
      pattern: string; 
      prizeAmount: number;
      timestamp: string;
    }) => {
      console.log('🎉 ¡Ganador de BINGO!', data)
      toast.success(`🎉 ¡${data.userId} ganó con patrón ${data.pattern}! Premio: ${data.prizeAmount} Perlas`, {
        duration: 5000
      })
    }

    // Registrar listeners
    on('number-called', handleNumberCalled)
    on('game-reset', handleGameReset)
    on('game-status-changed', handleGameStatusChanged)
    on('pattern-changed', handlePatternChanged)
    on('bingo-winner', handleBingoWinner)

    return () => {
      off('number-called', handleNumberCalled)
      off('game-reset', handleGameReset)
      off('game-status-changed', handleGameStatusChanged)
      off('pattern-changed', handlePatternChanged)
      off('bingo-winner', handleBingoWinner)
    }
  }, [isConnected, on, off])

  const handleExit = () => {
    navigate('/dashboard')
  }

  const handleAnnounceBingo = async (cardId: string) => {
    try {
      // Llamada a la API para anunciar BINGO
      const response = await fetch(`/api/games/${gameId}/announce-bingo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ cardId }),
      })

      const result = await response.json()
      
      if (result.isValid) {
        toast.success('¡BINGO VÁLIDO! ¡Felicitaciones! 🎉')
        
        // Notificar sobre BINGO válido a través de Socket.IO
        // (esto ya se maneja desde el backend, pero podemos agregar feedback visual)
        console.log('🎉 BINGO VÁLIDO confirmado')
      } else {
        toast.error('BINGO inválido. Continúa jugando.')
      }
    } catch (error) {
      toast.error('Error al anunciar BINGO')
      console.error('Error announcing BINGO:', error)
    }
  }

  if (gameLoading || cardsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!game || myCards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">
            {!game ? 'Juego no encontrado' : 'Sin cartones'}
          </h2>
          <Button onClick={handleExit} className="bg-white text-gray-900">
            Volver al Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
      
      {/* Header Simple */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <button 
          onClick={handleExit}
          className="text-2xl hover:text-gray-300"
        >
          ←
        </button>
        <h1 className="text-lg font-bold truncate">{game.title}</h1>
        <div className="flex items-center space-x-2">
          <div className="text-sm bg-green-600 px-2 py-1 rounded">
            {gameStatus === 'IN_PROGRESS' || gameStatus === 'active' ? '🔴 EN VIVO' : 
             gameStatus === 'paused' ? '⏸️ PAUSADO' : 'ESPERANDO'}
          </div>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} 
               title={isConnected ? 'Conectado al servidor' : 'Desconectado'} />
        </div>
      </div>

      {/* Área de Streaming - 40% de la pantalla */}
      <div className="bg-black flex-shrink-0" style={{ height: '40vh' }}>
        <div className="h-full flex flex-col items-center justify-center text-white">
          {/* Placeholder para streaming */}
          <div className="text-center">
            <div className="text-6xl mb-4">📹</div>
            <h2 className="text-2xl font-bold mb-2">STREAMING EN VIVO</h2>
            
            {/* Bola Actual */}
            {lastBall && (
              <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-white">{lastBall}</span>
              </div>
            )}
            
            {/* Últimas Bolas */}
            <div className="flex justify-center space-x-2 mb-4">
              {ballsDrawn.slice(-5).map((ball, index) => (
                <div
                  key={`${ball}-${index}`}
                  className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-sm font-bold"
                >
                  {ball}
                </div>
              ))}
            </div>
            
            <p className="text-gray-300">
              {ballsDrawn.length} bolas cantadas | {playerCount || game.participantCount} jugadores
              {isConnected && (
                <span className="ml-2 text-green-400">• Sincronizado</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Área de Cartones - 60% de la pantalla */}
      <div className="flex-1 bg-gradient-to-br from-primary-50 to-primary-100 overflow-y-auto">
        <div className="p-2 sm:p-4">
          {/* Header de cartones */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              MIS CARTONES ({myCards.length})
            </h3>
            {myCards.length > 6 && (
              <div className="text-xs text-gray-600 bg-white px-2 py-1 rounded-full">
                🤖 AUTO activado en todos
              </div>
            )}
          </div>
          
          {/* Grid responsivo para múltiples cartones */}
          <div className={`
            grid gap-3 
            ${myCards.length === 1 ? 'grid-cols-1 max-w-md mx-auto' : ''}
            ${myCards.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-4xl mx-auto' : ''}
            ${myCards.length >= 3 && myCards.length <= 4 ? 'grid-cols-1 sm:grid-cols-2 max-w-4xl mx-auto' : ''}
            ${myCards.length >= 5 && myCards.length <= 8 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : ''}
            ${myCards.length >= 9 && myCards.length <= 16 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : ''}
            ${myCards.length > 16 ? 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8' : ''}
          `}>
            {myCards.map((card, index) => (
              <div 
                key={card.id} 
                className={`
                  bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow
                  ${myCards.length <= 4 ? 'p-4' : myCards.length <= 8 ? 'p-3' : 'p-2'}
                `}
              >
                <BingoCard
                  card={card}
                  gameId={gameId!}
                  size={
                    myCards.length <= 2 ? 'lg' : 
                    myCards.length <= 8 ? 'md' : 
                    'sm'
                  }
                  showHeader={true}
                  showStats={myCards.length <= 8}
                  autoMark={true}
                  highlightWinningPattern={true}
                  showBingoButton={false}
                  onAnnounceBingo={handleAnnounceBingo}
                  className="touch-manipulation"
                />
                
                {/* Botón BINGO compacto para muchos cartones */}
                {!card.isWinner && myCards.length <= 8 && (
                  <div className="mt-2">
                    <BingoButton
                      card={card}
                      gameId={gameId!}
                      onAnnounceBingo={handleAnnounceBingo}
                      className="w-full"
                    />
                  </div>
                )}
                
                {/* Indicador de ganador compacto */}
                {card.isWinner && (
                  <div className={`
                    text-center rounded-lg mt-2
                    ${myCards.length <= 8 
                      ? 'p-3 bg-gradient-to-r from-yellow-400 to-orange-400' 
                      : 'p-1 bg-yellow-200'
                    }
                  `}>
                    <div className={myCards.length <= 8 ? 'text-xl mb-1' : 'text-sm'}>
                      {myCards.length <= 8 ? '🏆' : '👑'}
                    </div>
                    <p className={`
                      font-bold 
                      ${myCards.length <= 8 
                        ? 'text-orange-900 text-sm' 
                        : 'text-yellow-800 text-xs'
                      }
                    `}>
                      {myCards.length <= 8 ? `¡GANADOR! - ${card.winningPattern}` : 'GANÓ'}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Información adicional para muchos cartones */}
          {myCards.length > 10 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-center text-sm text-blue-700">
                <div className="font-medium mb-1">
                  🤖 Modo Automático Activado
                </div>
                <div className="text-xs">
                  Los números se marcan automáticamente y el BINGO se anuncia cuando se completa un patrón.
                  {myCards.length > 16 && (
                    <span className="block mt-1 font-medium">
                      Con {myCards.length} cartones, ¡tienes muchas posibilidades de ganar! 🍀
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Espaciado inferior */}
          <div className="h-4"></div>
        </div>
      </div>
    </div>
  )
}

export default GamePage