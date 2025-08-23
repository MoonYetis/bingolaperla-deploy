import { useAuth } from '@/hooks/useAuth'
import { useGetGamesQuery } from '@/services/gameApi'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import Alert from '@/components/common/Alert'
import { GameStatus } from '@/types'
import { formatBalance } from '@/utils/balance'

interface UserStatsProps {
  className?: string
}

const UserStats: React.FC<UserStatsProps> = ({ className }) => {
  const { user } = useAuth()
  const { data: gamesData, isLoading, error } = useGetGamesQuery(undefined)

  // Calcular estadísticas básicas
  const games = gamesData?.games || []
  const activeGames = games.filter(g => g.status === GameStatus.IN_PROGRESS).length
  const waitingGames = games.filter(g => g.status === GameStatus.OPEN).length
  const totalPlayers = games.reduce((sum, game) => sum + (game.participantCount || 0), 0)

  if (isLoading) {
    return (
      <div className={className}>
        <div className="flex justify-center py-4">
          <LoadingSpinner size="sm" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={className}>
        <Alert
          type="error"
          message="Error al cargar estadísticas"
        />
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-4">
        {/* Juegos Activos */}
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{activeGames}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">En Vivo</div>
        </div>

        {/* Juegos Esperando */}
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{waitingGames}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Esperando</div>
        </div>

        {/* Total de Jugadores */}
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{totalPlayers}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Jugadores</div>
        </div>

        {/* Balance del Usuario */}
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {formatBalance(user?.pearlsBalance || 0)}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Perlas</div>
        </div>
      </div>

      {/* Estadísticas adicionales del usuario */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Partidas jugadas:</span>
            <span className="font-medium">{user?.gamesPlayed || 0}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Partidas ganadas:</span>
            <span className="font-medium">{user?.gamesWon || 0}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Cartones comprados:</span>
            <span className="font-medium">{user?.cardsPurchased || 0}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Última conexión:</span>
            <span className="font-medium">
              {user?.lastLogin 
                ? new Date(user.lastLogin).toLocaleDateString('es-ES')
                : 'Hoy'
              }
            </span>
          </div>
        </div>
      </div>

      {/* Indicador de nivel de actividad */}
      <div className="mt-4 p-3 bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-primary-800">
              Estado: {activeGames > 0 ? 'Juegos Disponibles' : 'Sin Juegos Activos'}
            </div>
            <div className="text-xs text-primary-600">
              {activeGames > 0 
                ? `${activeGames} juego${activeGames > 1 ? 's' : ''} en vivo ahora`
                : waitingGames > 0 
                  ? `${waitingGames} juego${waitingGames > 1 ? 's' : ''} esperando jugadores`
                  : 'Revisa más tarde para nuevos juegos'
              }
            </div>
          </div>
          <div className="text-2xl">
            {activeGames > 0 ? '🔴' : waitingGames > 0 ? '⏳' : '😴'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserStats