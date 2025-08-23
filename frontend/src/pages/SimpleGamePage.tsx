import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/common/Button'
import { formatBalance } from '@/utils/balance'
import { useEffect, useState } from 'react'
import { useBingoSocket } from '@/hooks/useBingoSocket'

// Componente para el video streaming
const StreamingVideo = ({ streamUrl }: { streamUrl: string }) => {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  const handleVideoLoad = () => {
    setIsVideoLoaded(true)
    setHasError(false)
  }

  const handleVideoError = () => {
    setHasError(true)
    setIsVideoLoaded(false)
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 mb-6">
      <h3 className="text-xl font-bold mb-4 text-center">📺 Streaming en Vivo</h3>
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {!hasError ? (
          <iframe
            src={streamUrl}
            title="Bingo Live Stream"
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={handleVideoLoad}
            onError={handleVideoError}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-white/80">
            <div className="text-center">
              <div className="text-4xl mb-2">📺</div>
              <p>Stream no disponible</p>
              <p className="text-sm">Simularemos números en vivo</p>
            </div>
          </div>
        )}
        
        {!isVideoLoaded && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="text-white text-center">
              <div className="animate-spin text-2xl mb-2">⏳</div>
              <p>Cargando stream...</p>
            </div>
          </div>
        )}
      </div>
      <div className="mt-2 text-center text-sm text-white/60">
        🔴 EN VIVO • Presentador cantando números
      </div>
    </div>
  )
}

const SimpleGamePage = () => {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  // Estado para números cantados en tiempo real
  const [calledNumbers, setCalledNumbers] = useState<number[]>([7, 23, 12, 31, 49, 14, 27])
  const [lastCalledNumber, setLastCalledNumber] = useState<number>(27)
  const [currentPattern, setCurrentPattern] = useState<string>('horizontal')
  const [canClaimBingo, setCanClaimBingo] = useState<boolean>(false)

  // Conectar Socket.IO como jugador - usar gameId consistente
  const { isConnected, on, off, playerClaimBingo } = useBingoSocket({
    gameId: gameId || 'game-1', // Usar mismo gameId por defecto que admin
    isAdmin: false
  })

  // Obtener nombre del patrón actual
  const getPatternName = (patternId: string) => {
    const patterns = {
      'horizontal': 'Línea horizontal',
      'vertical': 'Línea vertical', 
      'diagonal': 'Diagonal',
      'corners': '4 esquinas',
      'full': 'Cartón lleno'
    }
    return patterns[patternId as keyof typeof patterns] || 'Línea horizontal'
  }

  // Función para verificar si el cartón cumple el patrón actual
  const checkPatternComplete = (cardNumbers: (number | null)[][], pattern: string) => {
    const isNumberCalled = (num: number | null) => {
      return num === null || (num !== null && calledNumbers.includes(num))
    }

    switch (pattern) {
      case 'horizontal':
        // Verificar cualquier fila completa
        return cardNumbers.some(row => row.every(num => isNumberCalled(num)))
      
      case 'vertical':
        // Verificar cualquier columna completa
        for (let col = 0; col < 5; col++) {
          if (cardNumbers.every(row => isNumberCalled(row[col]))) {
            return true
          }
        }
        return false
      
      case 'diagonal':
        // Verificar ambas diagonales
        const diagonal1 = cardNumbers.every((row, i) => isNumberCalled(row[i]))
        const diagonal2 = cardNumbers.every((row, i) => isNumberCalled(row[4 - i]))
        return diagonal1 || diagonal2
      
      case 'corners':
        // Verificar 4 esquinas
        return (
          isNumberCalled(cardNumbers[0][0]) &&
          isNumberCalled(cardNumbers[0][4]) &&
          isNumberCalled(cardNumbers[4][0]) &&
          isNumberCalled(cardNumbers[4][4])
        )
      
      case 'full':
        // Verificar cartón completo
        return cardNumbers.every(row => row.every(num => isNumberCalled(num)))
      
      default:
        return false
    }
  }

  // Verificar si algún cartón cumple el patrón
  useEffect(() => {
    const hasWinningCard = userCards.some(card => 
      checkPatternComplete(card.numbers, currentPattern)
    )
    setCanClaimBingo(hasWinningCard)
  }, [calledNumbers, currentPattern])

  // Función para reclamar BINGO
  const claimBingo = () => {
    if (canClaimBingo && user) {
      console.log('🎉 ¡BINGO RECLAMADO!', {
        pattern: currentPattern,
        user: user.username,
        gameId: gameId || 'game-1'
      })
      
      // Enviar evento Socket.IO al admin
      playerClaimBingo(currentPattern, user.id || user.username)
      
      alert(`¡BINGO! Has completado el patrón: ${getPatternName(currentPattern)}`)
      
      // Opcional: deshabilitar el botón temporalmente
      setCanClaimBingo(false)
    }
  }

  // Simular datos del juego
  const gameData = {
    id: gameId,
    name: 'Bingo La Perla - Sala Principal',
    status: 'EN PROGRESO',
    cardPrice: 5.00,
    prize: 250.00,
    players: 12
  }

  // Simular cartones del usuario (comprados)
  const userCards = [
    {
      id: 'card-1',
      numbers: [
        [7, 23, 35, 47, 63],
        [12, 18, 31, 52, 67],
        [3, 25, null, 49, 71], // null = FREE
        [14, 29, 38, 56, 69],
        [1, 27, 43, 51, 75]
      ]
    }
  ]

  // URL del stream (se puede configurar desde admin)
  const streamUrl = "https://www.youtube.com/embed/live_stream?channel=UC123456789&autoplay=1&mute=0"

  // Escuchar eventos Socket.IO en tiempo real
  useEffect(() => {
    if (!isConnected) return

    // Escuchar cuando admin canta un número
    const handleNumberCalled = (data: { number: number; gameId: string }) => {
      console.log('🎯 Número cantado por admin:', data.number)
      setCalledNumbers(prev => {
        if (!prev.includes(data.number)) {
          return [...prev, data.number]
        }
        return prev
      })
      setLastCalledNumber(data.number)
    }

    // Escuchar cuando admin reinicia el juego
    const handleGameReset = (data: { gameId: string }) => {
      console.log('🔄 Juego reiniciado por admin')
      setCalledNumbers([])
      setLastCalledNumber(0)
    }

    // Escuchar cambios de estado del juego
    const handleGameStatusChanged = (data: { status: 'active' | 'paused'; gameId: string }) => {
      console.log('🎮 Estado del juego cambiado:', data.status)
      // Aquí puedes mostrar algún indicador visual del estado
    }

    // Escuchar cambios de patrón desde admin
    const handlePatternChanged = (data: { pattern: string; gameId: string }) => {
      console.log('🏆 Patrón cambiado por admin:', data.pattern)
      setCurrentPattern(data.pattern)
    }

    // Configurar listeners
    on('number-called', handleNumberCalled)
    on('game-reset', handleGameReset) 
    on('game-status-changed', handleGameStatusChanged)
    on('pattern-changed', handlePatternChanged)

    // Cleanup
    return () => {
      off('number-called', handleNumberCalled)
      off('game-reset', handleGameReset)
      off('game-status-changed', handleGameStatusChanged)
      off('pattern-changed', handlePatternChanged)
    }
  }, [isConnected, on, off])

  const handleBackToMenu = () => {
    navigate('/menu')
  }

  const handleBackToPlay = () => {
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 text-white px-4 py-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleBackToPlay}
            className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
          >
            <span className="text-xl">←</span>
            <span>Volver a PLAY</span>
          </button>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs">{isConnected ? 'En vivo' : 'Desconectado'}</span>
            </div>
            <span className="text-sm">Balance:</span>
            <span className="text-lg font-bold text-yellow-400">
              {formatBalance(user?.pearlsBalance || 0)} <span className="text-sm text-yellow-300">Perlas</span>
            </span>
          </div>
        </div>

        {/* Título del juego */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">🎰 {gameData.name}</h1>
          <div className="flex justify-center space-x-6 text-sm">
            <span className="bg-green-500/20 px-3 py-1 rounded-full">
              🔴 {gameData.status}
            </span>
            <span className="bg-blue-500/20 px-3 py-1 rounded-full">
              👥 {gameData.players} jugadores
            </span>
            <span className="bg-yellow-500/20 px-3 py-1 rounded-full">
              🏆 Premio: S/ {gameData.prize}
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Panel izquierdo - Streaming + Números cantados */}
          <div className="lg:col-span-1">
            {/* Streaming Video */}
            <StreamingVideo streamUrl={streamUrl} />
            
            {/* Patrón actual */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 mb-4">
              <h3 className="text-lg font-bold mb-2 text-center">🏆 Patrón Actual</h3>
              <div className="text-center">
                <div className="bg-purple-500/30 rounded-lg p-3">
                  <div className="text-yellow-400 font-bold text-lg">
                    {getPatternName(currentPattern)}
                  </div>
                  <div className="text-white/70 text-sm mt-1">
                    {currentPattern === 'horizontal' && 'Completa cualquier fila'}
                    {currentPattern === 'vertical' && 'Completa cualquier columna'}
                    {currentPattern === 'diagonal' && 'Completa una diagonal'}
                    {currentPattern === 'corners' && 'Marca las 4 esquinas'}
                    {currentPattern === 'full' && 'Marca todo el cartón'}
                  </div>
                </div>
              </div>
            </div>

            {/* Botón BINGO */}
            {canClaimBingo && (
              <div className="mb-4">
                <button
                  onClick={claimBingo}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold text-2xl py-4 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200 animate-pulse"
                >
                  🎉 ¡BINGO! 🎉
                </button>
                <div className="text-center text-sm text-yellow-400 mt-2">
                  ¡Has completado el patrón! Haz clic para reclamar
                </div>
              </div>
            )}

            {/* Números cantados */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6">
              <h3 className="text-xl font-bold mb-4 text-center">🎯 Números Cantados</h3>
              <div className="grid grid-cols-5 gap-2">
                {calledNumbers.map((num) => (
                  <div
                    key={num}
                    className="bg-red-500 text-white rounded-lg p-3 text-center font-bold text-lg"
                  >
                    {num}
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  Último: {lastCalledNumber}
                </div>
              </div>
            </div>

            {/* Información del juego */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">ℹ️ Información</h3>
              <div className="space-y-2 text-sm">
                <p>🎫 Cartones comprados: {userCards.length}</p>
                <p>💰 Costo total: S/ {(gameData.cardPrice * userCards.length).toFixed(2)}</p>
                <p>🎯 Para ganar: Completa línea o cartón lleno</p>
                <p>⏰ Próximo número en: 8 segundos</p>
              </div>
            </div>
          </div>

          {/* Panel central - Cartones del usuario */}
          <div className="lg:col-span-2">
            <h3 className="text-xl font-bold mb-4 text-center">🎫 Mis Cartones</h3>
            
            <div className="space-y-6">
              {userCards.map((card, cardIndex) => (
                <div key={card.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold">Cartón #{cardIndex + 1}</h4>
                    <span className="text-green-400 font-bold">✅ ACTIVO</span>
                  </div>
                  
                  {/* Cabecera BINGO */}
                  <div className="grid grid-cols-5 gap-2 mb-2">
                    {['B', 'I', 'N', 'G', 'O'].map((letter) => (
                      <div
                        key={letter}
                        className="bg-purple-600 text-white rounded-lg p-3 text-center font-bold text-xl"
                      >
                        {letter}
                      </div>
                    ))}
                  </div>
                  
                  {/* Números del cartón */}
                  <div className="grid grid-cols-5 gap-2">
                    {card.numbers.map((row, rowIndex) =>
                      row.map((num, colIndex) => (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className={`
                            rounded-lg p-3 text-center font-bold text-lg
                            ${num === null 
                              ? 'bg-yellow-500 text-black' 
                              : calledNumbers.includes(num)
                                ? 'bg-green-500 text-white'
                                : 'bg-white/20 text-white'
                            }
                          `}
                        >
                          {num === null ? 'FREE' : num}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Botones de acción */}
            <div className="mt-8 flex justify-center space-x-4">
              <Button
                onClick={handleBackToMenu}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 font-bold"
              >
                📱 Ir al Menú
              </Button>
              <Button
                onClick={handleBackToPlay}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 font-bold"
              >
                🎯 Comprar Más Cartones
              </Button>
            </div>
          </div>
        </div>

        {/* Footer con instrucciones */}
        <div className="mt-8 text-center">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
            <p className="text-sm text-white/80">
              🎉 <strong>¡Estás jugando en vivo!</strong> Los números se marcan automáticamente. 
              Completa una línea horizontal, vertical, diagonal o el cartón completo para ganar.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimpleGamePage