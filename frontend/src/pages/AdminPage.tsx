import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useGetGamesQuery } from '@/services/gameApi'
import Button from '@/components/common/Button'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { useBingoSocket } from '@/hooks/useBingoSocket'
import { GameStatus } from '@/types'

// Generar grid completo de números de bingo (B1-O75)
const generateBingoNumbers = () => {
  const numbers = []
  const letters = ['B', 'I', 'N', 'G', 'O']
  
  for (let i = 0; i < 5; i++) {
    for (let j = 1; j <= 15; j++) {
      const number = i * 15 + j
      numbers.push({
        letter: letters[i],
        number: number,
        fullNumber: `${letters[i]}${number}`
      })
    }
  }
  
  return numbers
}

const AdminPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  // Estado del selector de juegos
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  const { data: gamesData, isLoading: loadingGames } = useGetGamesQuery(undefined)
  
  // Estados del juego
  const [calledNumbers, setCalledNumbers] = useState<number[]>([])
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null)
  const [gameActive, setGameActive] = useState(true)
  const [streamUrl, setStreamUrl] = useState("https://www.youtube.com/embed/live_stream?channel=UC123456789&autoplay=1&mute=0")
  
  // Estado para patrón de juego
  const [selectedPattern, setSelectedPattern] = useState('horizontal')
  const [bingoClaims, setBingoClaims] = useState<Array<{userId: string, pattern: string, timestamp: string}>>([])
  
  // Patrones disponibles
  const bingoPatterns = [
    { id: 'horizontal', name: 'Línea horizontal', description: 'Cualquier fila completa' },
    { id: 'vertical', name: 'Línea vertical', description: 'Cualquier columna completa' },
    { id: 'diagonal', name: 'Diagonal', description: 'Esquina a esquina' },
    { id: 'corners', name: '4 esquinas', description: 'Números en las 4 esquinas' },
    { id: 'full', name: 'Cartón lleno', description: 'Todos los números marcados' }
  ]

  // Obtener juegos activos disponibles
  const availableGames = gamesData?.games?.filter(game => 
    game.status === GameStatus.IN_PROGRESS || 
    game.status === GameStatus.OPEN || 
    game.status === GameStatus.SCHEDULED
  ) || []

  // Auto-seleccionar primer juego EN VIVO, o primer juego disponible
  useEffect(() => {
    if (availableGames.length > 0 && !selectedGameId) {
      // Priorizar juegos EN VIVO
      const liveGame = availableGames.find(game => game.status === GameStatus.IN_PROGRESS)
      const gameToSelect = liveGame || availableGames[0]
      setSelectedGameId(gameToSelect.id)
    }
  }, [availableGames, selectedGameId])

  // Conectar Socket.IO como administrador - usar gameId seleccionado
  const { isConnected, adminCallNumber, adminResetGame, adminTogileGame, adminSetPattern, on, off } = useBingoSocket({
    gameId: selectedGameId || undefined,
    isAdmin: true
  })

  // Escuchar claims de BINGO
  useEffect(() => {
    if (!isConnected) return

    const handleBingoClaimed = (data: { pattern: string; userId: string; gameId: string; timestamp: string }) => {
      console.log('🎉 BINGO reclamado:', data)
      setBingoClaims(prev => [...prev, data])
    }

    on('bingo-claimed', handleBingoClaimed)

    return () => {
      off('bingo-claimed', handleBingoClaimed)
    }
  }, [isConnected, on, off])

  const allNumbers = generateBingoNumbers()

  const callNumber = (number: number) => {
    if (!selectedGameId) {
      console.warn('⚠️ No hay juego seleccionado')
      return
    }
    
    if (!calledNumbers.includes(number)) {
      setCalledNumbers(prev => [...prev, number])
      setSelectedNumber(number)
      
      // Emitir evento Socket.IO a todos los jugadores
      adminCallNumber(number)
      console.log(`📢 Admin cantó número: ${number} para juego ${selectedGameId}`)
    }
  }

  const resetGame = () => {
    if (!selectedGameId) {
      console.warn('⚠️ No hay juego seleccionado')
      return
    }
    
    setCalledNumbers([])
    setSelectedNumber(null)
    setGameActive(true)
    
    // Emitir evento Socket.IO
    adminResetGame()
    console.log(`🔄 Admin reinició el juego ${selectedGameId}`)
  }

  const toggleGame = () => {
    if (!selectedGameId) {
      console.warn('⚠️ No hay juego seleccionado')
      return
    }
    
    const newStatus = gameActive ? 'paused' : 'active'
    setGameActive(!gameActive)
    
    // Emitir evento Socket.IO
    adminTogileGame(newStatus)
    console.log(`🎮 Juego ${gameActive ? 'pausado' : 'reanudado'} para ${selectedGameId}`)
  }

  const updatePattern = (patternId: string) => {
    if (!selectedGameId) {
      console.warn('⚠️ No hay juego seleccionado')
      return
    }
    
    setSelectedPattern(patternId)
    
    // Emitir evento Socket.IO para actualizar patrón en todos los jugadores
    adminSetPattern(patternId)
    console.log(`🏆 Admin cambió patrón a: ${patternId} para juego ${selectedGameId}`)
  }

  const getNumberColor = (number: number) => {
    if (calledNumbers.includes(number)) {
      return 'bg-red-500 text-white' // Número ya cantado
    }
    if (selectedNumber === number) {
      return 'bg-yellow-500 text-black animate-pulse' // Número seleccionado
    }
    return 'bg-white/20 text-white hover:bg-white/30' // Número disponible
  }

  const getLetterColor = (letter: string) => {
    switch (letter) {
      case 'B': return 'text-blue-400'
      case 'I': return 'text-green-400'
      case 'N': return 'text-yellow-400'
      case 'G': return 'text-orange-400'
      case 'O': return 'text-red-400'
      default: return 'text-white'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white px-4 py-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header de Admin */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">👨‍💼 Panel de Administrador</h1>
            <p className="text-white/80">Control manual de números para Bingo La Perla</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => navigate('/admin/payments')}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2"
            >
              💰 Sistema Perlas
            </Button>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-sm">{isConnected ? 'Conectado' : 'Desconectado'}</span>
            </div>
            <span className="text-sm">Admin:</span>
            <span className="text-lg font-bold text-yellow-400">{user?.username}</span>
          </div>
        </div>

        {/* Selector de Juego */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">🎮 Seleccionar Juego a Controlar</h3>
          
          {loadingGames ? (
            <div className="flex justify-center">
              <LoadingSpinner size="md" />
            </div>
          ) : availableGames.length === 0 ? (
            <div className="text-center text-white/60 py-8">
              <div className="text-4xl mb-2">🚫</div>
              <p>No hay juegos activos disponibles</p>
              <p className="text-sm">Crea un nuevo juego desde el sistema</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableGames.map((game) => {
                  const isSelected = selectedGameId === game.id
                  const statusColor = 
                    game.status === GameStatus.IN_PROGRESS ? 'border-orange-500 bg-orange-500/20' :
                    game.status === GameStatus.OPEN ? 'border-green-500 bg-green-500/20' :
                    'border-blue-500 bg-blue-500/20'
                  
                  return (
                    <button
                      key={game.id}
                      onClick={() => setSelectedGameId(game.id)}
                      className={`
                        p-4 rounded-xl border-2 transition-all text-left
                        ${isSelected 
                          ? `${statusColor} ring-2 ring-white` 
                          : 'border-white/20 bg-white/5 hover:bg-white/10'
                        }
                      `}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-white truncate">{game.title}</h4>
                        <div className={`px-2 py-1 text-xs rounded-full font-bold ${
                          game.status === GameStatus.IN_PROGRESS ? 'bg-orange-500 text-white animate-pulse' :
                          game.status === GameStatus.OPEN ? 'bg-green-500 text-white' :
                          'bg-blue-500 text-white'
                        }`}>
                          {game.status === GameStatus.IN_PROGRESS ? '🔴 EN VIVO' :
                           game.status === GameStatus.OPEN ? '🟢 ABIERTO' :
                           '📅 PROGRAMADO'}
                        </div>
                      </div>
                      
                      <div className="text-sm text-white/80 space-y-1">
                        <p>🎫 Participantes: {game.participantCount}/{game.maxPlayers}</p>
                        <p>💰 Premio: S/ {game.totalPrize.toFixed(0)}</p>
                        <p>💎 Precio: {game.cardPrice.toFixed(2)} Perlas</p>
                        {game.status === GameStatus.SCHEDULED && (
                          <p>⏰ {new Date(game.scheduledAt).toLocaleString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</p>
                        )}
                      </div>
                      
                      {isSelected && (
                        <div className="mt-3 flex items-center text-green-400 text-sm font-bold">
                          <span className="mr-2">✓</span>
                          CONTROLANDO ESTE JUEGO
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
              
              {selectedGameId && (
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
                  <div className="flex items-center text-green-400 font-bold">
                    <span className="mr-2">🎯</span>
                    Controlando: {availableGames.find(g => g.id === selectedGameId)?.title}
                  </div>
                  <div className="text-sm text-green-300 mt-1">
                    Los números que cantes se sincronizarán automáticamente con los jugadores de este juego
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controles principales */}
        <div className="grid lg:grid-cols-4 gap-6 mb-8">
          
          {/* Estado del juego */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4">🎮 Estado del Juego</h3>
            <div className="space-y-3">
              <div className={`p-3 rounded-lg text-center font-bold ${gameActive ? 'bg-green-500' : 'bg-red-500'}`}>
                {gameActive ? '🟢 ACTIVO' : '🔴 PAUSADO'}
              </div>
              <Button
                onClick={toggleGame}
                disabled={!selectedGameId}
                className={`w-full ${
                  !selectedGameId ? 'bg-gray-500 cursor-not-allowed' :
                  gameActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {gameActive ? '⏸️ Pausar Juego' : '▶️ Reanudar Juego'}
              </Button>
            </div>
          </div>

          {/* Último número cantado */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4">🎯 Último Número</h3>
            <div className="text-center">
              {selectedNumber ? (
                <div className="text-6xl font-bold text-yellow-400 animate-pulse">
                  {selectedNumber}
                </div>
              ) : (
                <div className="text-3xl text-white/50">
                  Sin números
                </div>
              )}
            </div>
          </div>

          {/* Estadísticas */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4">📊 Estadísticas</h3>
            <div className="space-y-2 text-sm">
              <p>🎫 Números cantados: <span className="font-bold text-green-400">{calledNumbers.length}</span></p>
              <p>📋 Números restantes: <span className="font-bold text-blue-400">{75 - calledNumbers.length}</span></p>
              <p>⏱️ Duración: <span className="font-bold text-yellow-400">--:--</span></p>
              <p>👥 Jugadores activos: <span className="font-bold text-purple-400">12</span></p>
            </div>
          </div>

          {/* Streaming Control */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4">📺 Stream Control</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                placeholder="URL del stream en vivo"
                className="w-full p-2 rounded-lg bg-white/20 text-white placeholder-white/50 text-xs"
              />
              <div className="text-xs text-white/60">
                YouTube, Twitch, RTMP, etc.
              </div>
            </div>
          </div>
        </div>

        {/* Selector de Patrón de Juego */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold">🏆 Patrón de Juego Actual</h3>
            <div className="text-lg font-bold text-yellow-400">
              {bingoPatterns.find(p => p.id === selectedPattern)?.name}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {bingoPatterns.map((pattern) => (
              <label
                key={pattern.id}
                className={`
                  flex items-center space-x-3 p-4 rounded-xl cursor-pointer transition-all
                  ${selectedPattern === pattern.id 
                    ? 'bg-green-500/30 border-2 border-green-400' 
                    : 'bg-white/10 border-2 border-transparent hover:bg-white/20'
                  }
                `}
              >
                <input
                  type="radio"
                  name="pattern"
                  value={pattern.id}
                  checked={selectedPattern === pattern.id}
                  onChange={(e) => setSelectedPattern(e.target.value)}
                  className="w-4 h-4 text-green-500"
                />
                <div className="flex-1">
                  <div className="font-bold text-white">{pattern.name}</div>
                  <div className="text-sm text-white/70">{pattern.description}</div>
                </div>
                {selectedPattern === pattern.id && (
                  <div className="text-green-400 text-xl">✓</div>
                )}
              </label>
            ))}
          </div>

          <div className="flex justify-center">
            <Button
              onClick={() => updatePattern(selectedPattern)}
              disabled={!selectedGameId}
              className={`px-8 py-3 font-bold text-lg ${
                !selectedGameId 
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              🏆 Actualizar Patrón
            </Button>
          </div>

          <div className="mt-4 text-center text-sm text-white/60">
            💡 Los jugadores verán el patrón actualizado automáticamente
          </div>
        </div>

        {/* Grid de números */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold">🎲 Seleccionar Número a Cantar</h3>
            <Button
              onClick={resetGame}
              disabled={!selectedGameId}
              className={`px-6 py-2 font-bold ${
                !selectedGameId 
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              🔄 Reiniciar Juego
            </Button>
          </div>

          {/* Mensaje cuando no hay juego seleccionado */}
          {!selectedGameId && (
            <div className="text-center text-white/60 py-12 mb-6">
              <div className="text-6xl mb-4">🎮</div>
              <h3 className="text-xl font-bold text-white mb-2">Selecciona un juego primero</h3>
              <p>Debes seleccionar un juego activo antes de poder cantar números</p>
            </div>
          )}

          {/* Cabeceras B-I-N-G-O */}
          {selectedGameId && (
            <div className="grid grid-cols-5 gap-4 mb-4">
              {['B', 'I', 'N', 'G', 'O'].map((letter) => (
                <div key={letter} className={`text-center text-4xl font-bold ${getLetterColor(letter)}`}>
                  {letter}
                </div>
              ))}
            </div>
          )}

          {/* Grid de números */}
          {selectedGameId && (
            <div className="grid grid-cols-5 gap-4">
              {Array.from({ length: 5 }, (_, colIndex) => (
                <div key={colIndex} className="space-y-2">
                  {Array.from({ length: 15 }, (_, rowIndex) => {
                    const number = colIndex * 15 + rowIndex + 1
                    return (
                      <button
                        key={number}
                        onClick={() => gameActive && selectedGameId && callNumber(number)}
                        disabled={!gameActive || !selectedGameId || calledNumbers.includes(number)}
                        className={`
                          w-full aspect-square rounded-lg font-bold text-lg
                          transition-all duration-200 transform
                          ${getNumberColor(number)}
                          ${gameActive && selectedGameId && !calledNumbers.includes(number) 
                            ? 'hover:scale-105 cursor-pointer shadow-lg' 
                            : calledNumbers.includes(number) 
                              ? 'cursor-not-allowed opacity-70' 
                              : 'cursor-not-allowed opacity-50'
                          }
                        `}
                      >
                        {number}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Lista de números cantados */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4">📝 Historial de Números Cantados</h3>
            {calledNumbers.length > 0 ? (
              <div className="grid grid-cols-8 gap-2">
                {calledNumbers.map((num, index) => (
                  <div
                    key={num}
                    className="bg-red-500 text-white rounded-lg p-2 text-center font-bold text-sm"
                  >
                    {num}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-white/50 py-8">
                <div className="text-4xl mb-2">🔢</div>
                <p>No hay números cantados aún</p>
                <p className="text-sm">Haz clic en un número para empezar</p>
              </div>
            )}
          </div>

          {/* Claims de BINGO */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4">🎉 Claims de BINGO</h3>
            {bingoClaims.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {bingoClaims.map((claim, index) => (
                  <div
                    key={index}
                    className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold text-yellow-400">
                          👤 {claim.userId}
                        </div>
                        <div className="text-sm text-white/80">
                          Patrón: {bingoPatterns.find(p => p.id === claim.pattern)?.name || claim.pattern}
                        </div>
                      </div>
                      <div className="text-xs text-white/60">
                        {new Date(claim.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-white/50 py-8">
                <div className="text-4xl mb-2">🎯</div>
                <p>No hay claims de BINGO aún</p>
                <p className="text-sm">Los jugadores pueden reclamar cuando completen el patrón</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer con instrucciones */}
        <div className="mt-8 text-center">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
            <p className="text-sm text-white/80">
              💡 <strong>Instrucciones:</strong> Haz clic en los números para cantarlos en vivo. 
              Los jugadores verán los números automáticamente en sus pantallas.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPage