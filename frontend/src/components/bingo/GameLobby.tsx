import React, { useState, useEffect } from 'react'
import { cn } from '@/utils/cn'
import { GameData, GameStatus } from '@/types'
import { useGetGamesQuery, useJoinGameMutation } from '@/services/gameApi'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import Button from '@/components/common/Button'
import { Clock, Users, DollarSign, Trophy, Calendar, Play, UserPlus } from 'lucide-react'

interface GameLobbyProps {
  onGameJoin?: (gameId: string) => void
  onGameSelect?: (game: GameData) => void
  filterStatus?: GameStatus
  refreshInterval?: number
  className?: string
}

// Mock data para demostración y fallback
// Se usa cuando no hay datos del API disponibles
const createMockGames = (): GameData[] => [
  {
    id: 'game-1',
    title: 'Bingo Nocturno Premium',
    description: 'Gran premio nocturno con múltiples patrones ganadores',
    maxPlayers: 100,
    cardPrice: 15.00,
    totalPrize: 1500.00,
    status: GameStatus.OPEN,
    scheduledAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 min
    ballsDrawn: [],
    currentBall: undefined,
    winningCards: [],
    participantCount: 23,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'game-2', 
    title: 'Bingo Express',
    description: 'Juego rápido de 15 minutos con premios instantáneos',
    maxPlayers: 50,
    cardPrice: 8.00,
    totalPrize: 400.00,
    status: GameStatus.IN_PROGRESS,
    scheduledAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // Started 10 min ago
    startedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    ballsDrawn: [7, 23, 34, 52, 68, 15, 41],
    currentBall: 41,
    winningCards: [],
    participantCount: 42,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'game-3',
    title: 'Mega Bingo Weekend',
    description: 'El premio más grande del fin de semana',
    maxPlayers: 200,
    cardPrice: 25.00,
    totalPrize: 5000.00,
    status: GameStatus.SCHEDULED,
    scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
    ballsDrawn: [],
    currentBall: undefined,
    winningCards: [],
    participantCount: 87,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'game-4',
    title: 'Bingo Familiar',
    description: 'Diversión para toda la familia con premios especiales',
    maxPlayers: 75,
    cardPrice: 5.00,
    totalPrize: 375.00,
    status: GameStatus.COMPLETED,
    scheduledAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    startedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    endedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    ballsDrawn: Array.from({length: 45}, (_, i) => i + 1),
    winningCards: ['card-123', 'card-456'],
    participantCount: 75,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
]

export const GameLobby: React.FC<GameLobbyProps> = ({
  onGameJoin,
  onGameSelect,
  filterStatus,
  refreshInterval = 30000,
  className,
}) => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [joinGame, { isLoading: isJoining }] = useJoinGameMutation()
  
  // Usar datos reales del API
  const { data: apiGamesResponse, error, isLoading, refetch } = useGetGamesQuery(filterStatus)
  const [mockGames] = useState(createMockGames())
  
  // Extraer games del response del API o usar mock
  const apiGames = apiGamesResponse?.games || []
  const allGames = apiGames.length > 0 ? apiGames : mockGames
  const games = allGames.filter((game: GameData) => !filterStatus || game.status === filterStatus)

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
    }, refreshInterval)
    return () => clearInterval(interval)
  }, [refetch, refreshInterval])

  const handleGameSelect = (game: GameData) => {
    setSelectedGame(selectedGame === game.id ? null : game.id)
    onGameSelect?.(game)
  }

  const handleJoinGame = async (gameId: string) => {
    try {
      await joinGame(gameId).unwrap()
      console.log('Successfully joined game:', gameId)
      onGameJoin?.(gameId)
    } catch (error) {
      console.error('Error joining game:', error)
      // En caso de error, mantener comportamiento de demo
      alert(`Error al unirse al juego ${gameId}. Intenta nuevamente.`)
    }
  }

  const getStatusColor = (status: GameStatus) => {
    switch (status) {
      case GameStatus.OPEN: return 'bg-green-100 text-green-800 border-green-200'
      case GameStatus.SCHEDULED: return 'bg-blue-100 text-blue-800 border-blue-200'
      case GameStatus.IN_PROGRESS: return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case GameStatus.COMPLETED: return 'bg-gray-100 text-gray-800 border-gray-200'
      case GameStatus.CANCELLED: return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: GameStatus) => {
    switch (status) {
      case GameStatus.OPEN: return 'Abierto'
      case GameStatus.SCHEDULED: return 'Programado'
      case GameStatus.IN_PROGRESS: return 'En Vivo'
      case GameStatus.COMPLETED: return 'Finalizado'
      case GameStatus.CANCELLED: return 'Cancelado'
      default: return status
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    
    if (Math.abs(diff) < 60000) { // Less than 1 minute
      return 'Ahora'
    } else if (diff > 0) { // Future
      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(minutes / 60)
      if (hours > 0) {
        return `En ${hours}h ${minutes % 60}m`
      } else {
        return `En ${minutes}m`
      }
    } else { // Past
      const minutes = Math.floor(Math.abs(diff) / 60000)
      const hours = Math.floor(minutes / 60)
      if (hours > 0) {
        return `Hace ${hours}h ${minutes % 60}m`
      } else {
        return `Hace ${minutes}m`
      }
    }
  }

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Cargando juegos...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('text-center p-8', className)}>
        <div className="text-red-600 mb-4">Error al cargar los juegos</div>
        <Button variant="outline" onClick={() => window.location.reload()}>
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
          <h2 className="text-2xl font-bold text-gray-900">Sala de Juegos</h2>
          <p className="text-gray-600 mt-1">{games.length} juegos disponibles</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Status Filter Pills */}
          <div className="flex gap-2">
            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              {games.filter((g: GameData) => g.status === GameStatus.OPEN).length} Abiertos
            </div>
            <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
              {games.filter((g: GameData) => g.status === GameStatus.IN_PROGRESS).length} En Vivo
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            Actualizar
          </Button>
        </div>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game: GameData) => (
          <div
            key={game.id}
            className={cn(
              'bg-white rounded-xl shadow-sm border-2 p-6 transition-all duration-200 cursor-pointer hover:shadow-lg',
              selectedGame === game.id 
                ? 'border-blue-500 ring-2 ring-blue-200' 
                : 'border-gray-200 hover:border-gray-300'
            )}
            onClick={() => handleGameSelect(game)}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {game.title}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {game.description}
                </p>
              </div>
              
              <div className={cn(
                'px-2 py-1 rounded-full text-xs font-medium border',
                getStatusColor(game.status)
              )}>
                {getStatusText(game.status)}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-600" />
                <div>
                  <div className="text-lg font-bold text-yellow-600">
                    S/ {game.totalPrize.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">Premio Total</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="text-lg font-bold text-blue-600">
                    {game.participantCount}/{game.maxPlayers}
                  </div>
                  <div className="text-xs text-gray-500">Jugadores</div>
                </div>
              </div>
            </div>

            {/* Game Info */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <DollarSign className="w-4 h-4" />
                <span>S/ {game.cardPrice.toFixed(2)} por cartón</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{formatTime(game.scheduledAt)}</span>
              </div>
              
              {game.status === GameStatus.IN_PROGRESS && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Play className="w-4 h-4" />
                  <span>Bola actual: {game.currentBall || 'N/A'}</span>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Ocupación</span>
                <span>{Math.round((game.participantCount! / game.maxPlayers) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(game.participantCount! / game.maxPlayers) * 100}%` }}
                />
              </div>
            </div>

            {/* Action Button */}
            <div className="space-y-2">
              {game.status === GameStatus.OPEN && (
                <Button
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleJoinGame(game.id)
                  }}
                  disabled={isJoining || game.participantCount! >= game.maxPlayers}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {game.participantCount! >= game.maxPlayers ? 'Completo' : 'Unirse al Juego'}
                </Button>
              )}
              
              {game.status === GameStatus.SCHEDULED && (
                <Button variant="outline" className="w-full" disabled>
                  <Calendar className="w-4 h-4 mr-2" />
                  Programado
                </Button>
              )}
              
              {game.status === GameStatus.IN_PROGRESS && (
                <Button variant="outline" className="w-full">
                  <Play className="w-4 h-4 mr-2" />
                  Ver Juego
                </Button>
              )}
              
              {game.status === GameStatus.COMPLETED && (
                <Button variant="ghost" className="w-full" disabled>
                  <Trophy className="w-4 h-4 mr-2" />
                  Finalizado
                </Button>
              )}
            </div>

            {/* Winner Info */}
            {game.status === GameStatus.COMPLETED && game.winningCards.length > 0 && (
              <div className="mt-3 p-2 bg-gold-50 border border-gold-200 rounded-lg">
                <div className="text-xs text-gold-800 font-medium">
                  🏆 {game.winningCards.length} ganador(es)
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {games.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay juegos disponibles
          </h3>
          <p className="text-gray-600">
            {filterStatus 
              ? `No hay juegos con estado "${getStatusText(filterStatus)}" en este momento.`
              : 'No hay juegos programados en este momento.'
            }
          </p>
        </div>
      )}
    </div>
  )
}

export default GameLobby