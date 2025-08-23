import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useGetGamesQuery } from '@/services/gameApi'
import Button from '@/components/common/Button'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import Alert from '@/components/common/Alert'
import { GameStatus } from '@/types'
import { cn } from '@/utils/cn'

interface GameDashboardProps {
  className?: string
}

const GameDashboard: React.FC<GameDashboardProps> = ({ className }) => {
  const [selectedStatus, setSelectedStatus] = useState<GameStatus | undefined>(GameStatus.OPEN)
  const { data: gamesData, isLoading, error } = useGetGamesQuery(selectedStatus)

  const statusOptions = [
    { value: undefined, label: 'Todos', icon: '🎯' },
    { value: GameStatus.OPEN, label: 'Esperando', icon: '⏳' },
    { value: GameStatus.IN_PROGRESS, label: 'En Vivo', icon: '🔴' },
    { value: GameStatus.COMPLETED, label: 'Finalizados', icon: '🏁' },
  ]

  const games = gamesData?.games || []

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Salas de Juego</h2>
          <p className="text-gray-600">Únete a una partida de bingo en vivo</p>
        </div>
        
        <Link to="/lobby">
          <Button size="lg">
            Ver Lobby Completo
          </Button>
        </Link>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        {statusOptions.map((option) => (
          <button
            key={option.value || 'all'}
            onClick={() => setSelectedStatus(option.value)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              'flex items-center gap-2',
              selectedStatus === option.value
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            <span>{option.icon}</span>
            {option.label}
          </button>
        ))}
      </div>

      {/* Games List */}
      <div className="space-y-4">
        {isLoading && (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        )}

        {error && (
          <Alert
            type="error"
            message="Error al cargar los juegos. Intenta nuevamente."
          />
        )}

        {!isLoading && !error && games.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-4xl mb-4">🎲</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay juegos disponibles
            </h3>
            <p className="text-gray-600 mb-4">
              {selectedStatus === GameStatus.OPEN && 'No hay juegos esperando jugadores en este momento.'}
              {selectedStatus === GameStatus.IN_PROGRESS && 'No hay juegos activos en este momento.'}
              {selectedStatus === GameStatus.COMPLETED && 'No hay juegos finalizados recientes.'}
              {!selectedStatus && 'No hay juegos programados en este momento.'}
            </p>
            <p className="text-sm text-gray-500">
              Revisa más tarde o contacta al administrador
            </p>
          </div>
        )}

        {!isLoading && !error && games.length > 0 && (
          <div className="grid gap-4">
            {games.slice(0, 3).map((game) => (
              <div
                key={game.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:border-primary-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        Juego #{game.gameNumber || game.id.slice(-4)}
                      </h3>
                      <span className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        game.status === GameStatus.OPEN && 'bg-yellow-100 text-yellow-800',
                        game.status === GameStatus.IN_PROGRESS && 'bg-green-100 text-green-800',
                        game.status === GameStatus.COMPLETED && 'bg-gray-100 text-gray-800'
                      )}>
                        {game.status === GameStatus.OPEN && '⏳ Esperando'}
                        {game.status === GameStatus.IN_PROGRESS && '🔴 En Vivo'}
                        {game.status === GameStatus.COMPLETED && '🏁 Finalizado'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <span>👥</span>
                        <span>{game.participantCount || 0} jugadores</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <span>💰</span>
                        <span>S/ {game.prizePool || '0.00'}</span>
                      </div>
                      
                      {game.status === GameStatus.IN_PROGRESS && game.currentBall && (
                        <div className="flex items-center gap-1">
                          <span>🎱</span>
                          <span>Bola: {game.currentBall}</span>
                        </div>
                      )}
                      
                      {game.scheduledFor && (
                        <div className="flex items-center gap-1">
                          <span>🕐</span>
                          <span>{new Date(game.scheduledFor).toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {game.status === GameStatus.OPEN && (
                      <Link to={`/games/${game.id}/select-cards`}>
                        <Button size="sm">
                          Unirse
                        </Button>
                      </Link>
                    )}
                    
                    {game.status === GameStatus.IN_PROGRESS && (
                      <Link to={`/games/${game.id}`}>
                        <Button size="sm" variant="outline">
                          Ver Juego
                        </Button>
                      </Link>
                    )}
                    
                    {game.status === GameStatus.COMPLETED && (
                      <Link to={`/games/${game.id}/results`}>
                        <Button size="sm" variant="outline">
                          Resultados
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {games.length > 3 && (
          <div className="text-center">
            <Link to="/lobby">
              <Button variant="outline">
                Ver todos los juegos ({games.length})
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/lobby">
            <Button 
              variant="outline" 
              className="h-20 flex-col w-full border-primary-200 hover:border-primary-400 hover:bg-primary-50"
            >
              <div className="text-2xl mb-2">🎯</div>
              <span>Sala de Juego</span>
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            disabled 
            className="h-20 flex-col border-gray-200"
          >
            <div className="text-2xl mb-2">🛒</div>
            <span>Comprar Créditos</span>
          </Button>
          
          <Button 
            variant="outline" 
            disabled 
            className="h-20 flex-col border-gray-200"
          >
            <div className="text-2xl mb-2">📊</div>
            <span>Mis Estadísticas</span>
          </Button>
          
          <Button 
            variant="outline" 
            disabled 
            className="h-20 flex-col border-gray-200"
          >
            <div className="text-2xl mb-2">🏆</div>
            <span>Historial</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default GameDashboard