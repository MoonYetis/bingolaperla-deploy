import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGetMyAllCardsQuery } from '@/services/bingoCardApi'
import { useToast } from '@/contexts/ToastContext'
import Button from '@/components/common/Button'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { GameStatus } from '@/types'

interface GameWithCards {
  id: string
  title: string
  cardPrice: number
  status: string
  scheduledAt: string
  totalPrize: number
  participantCount: number
  maxPlayers: number
  description?: string
  userCards: Array<{
    id: string
    cardNumber: number
    gameId: string
    isActive: boolean
    isWinner: boolean
    winningPattern?: string
    createdAt: string
  }>
  totalCards: number
}

export const MyGameCards = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { data: myCardsData, isLoading: loadingCards, error } = useGetMyAllCardsQuery()

  // Manejar errores de la API
  useEffect(() => {
    if (error) {
      console.error('Error loading user cards:', error)
      toast.error('Error cargando tus cartones')
    }
  }, [error, toast])

  const gamesWithCards = myCardsData?.games || []

  const handleEnterGame = (game: GameWithCards) => {
    if (game.status === GameStatus.IN_PROGRESS) {
      navigate(`/game/${game.id}`)
    } else if (game.status === GameStatus.OPEN || game.status === GameStatus.SCHEDULED) {
      toast.info(`El juego "${game.title}" aún no ha comenzado`)
    } else {
      toast.error('Este juego ya ha finalizado')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case GameStatus.OPEN:
        return 'text-green-600 bg-green-50'
      case GameStatus.SCHEDULED:
        return 'text-blue-600 bg-blue-50'
      case GameStatus.IN_PROGRESS:
        return 'text-orange-600 bg-orange-50 animate-pulse'
      case GameStatus.COMPLETED:
        return 'text-gray-600 bg-gray-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case GameStatus.OPEN:
        return 'Abierto'
      case GameStatus.SCHEDULED:
        return 'Programado'
      case GameStatus.IN_PROGRESS:
        return '🔴 EN VIVO'
      case GameStatus.COMPLETED:
        return 'Finalizado'
      default:
        return status
    }
  }

  const getButtonText = (status: string) => {
    switch (status) {
      case GameStatus.IN_PROGRESS:
        return '🎯 ENTRAR AL JUEGO'
      case GameStatus.OPEN:
      case GameStatus.SCHEDULED:
        return '⏱️ Esperando inicio'
      case GameStatus.COMPLETED:
        return '✅ Juego finalizado'
      default:
        return 'Ver detalles'
    }
  }

  const canEnterGame = (status: string) => {
    return status === GameStatus.IN_PROGRESS
  }

  if (loadingCards) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="md" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">🎮 Mis Cartones</h2>
        <p className="text-sm text-gray-600">Cartones comprados para juegos de bingo</p>
      </div>

      {/* No cards message */}
      {gamesWithCards.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <span className="text-4xl">🎫</span>
          <h3 className="text-lg font-medium text-gray-900 mt-4">No tienes cartones</h3>
          <p className="text-gray-600 mt-2 mb-4">
            Compra cartones desde tu billetera para poder jugar.
          </p>
          <Button
            onClick={() => navigate('/wallet')}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2"
          >
            <span className="mr-2">💰</span>
            Ir a Billetera
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {gamesWithCards.map((game) => (
            <div 
              key={game.id} 
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              {/* Game Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{game.title}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(game.status)}`}>
                      {getStatusText(game.status)}
                    </span>
                  </div>
                  {game.description && (
                    <p className="text-gray-600 text-sm">{game.description}</p>
                  )}
                </div>
              </div>

              {/* Cards Info */}
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Tus cartones</p>
                    <p className="text-2xl font-bold text-blue-800">{game.totalCards}</p>
                    <p className="text-xs text-blue-600">
                      {game.userCards.map(card => `#${card.cardNumber}`).join(', ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-700">Premio del juego</p>
                    <p className="text-xl font-bold text-yellow-600">S/ {game.totalPrize.toFixed(0)}</p>
                    <p className="text-xs text-blue-600">{game.participantCount} jugadores</p>
                  </div>
                </div>
              </div>

              {/* Game Time */}
              <div className="text-sm text-gray-600 mb-4">
                {game.status === GameStatus.IN_PROGRESS ? (
                  <p className="text-orange-600 font-medium">
                    🔴 Juego en curso - ¡Puedes entrar ahora!
                  </p>
                ) : game.status === GameStatus.SCHEDULED ? (
                  <p>
                    📅 Programado para: {new Date(game.scheduledAt).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                ) : game.status === GameStatus.OPEN ? (
                  <p className="text-green-600">
                    ✅ Juego abierto - Esperando que inicie
                  </p>
                ) : (
                  <p>
                    ✅ Juego finalizado
                  </p>
                )}
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {game.userCards.map((card) => (
                  <div 
                    key={card.id}
                    className={`text-center p-3 rounded-lg border-2 ${
                      card.isWinner 
                        ? 'border-yellow-500 bg-yellow-50' 
                        : card.isActive 
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    <span className="text-lg">🎫</span>
                    <p className="text-sm font-bold">#{card.cardNumber}</p>
                    {card.isWinner && (
                      <p className="text-xs text-yellow-600 font-medium">
                        🏆 Ganador
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <Button
                onClick={() => handleEnterGame(game)}
                disabled={!canEnterGame(game.status)}
                className={`w-full py-3 rounded-xl font-medium ${
                  canEnterGame(game.status)
                    ? 'bg-orange-500 hover:bg-orange-600 text-white animate-pulse'
                    : game.status === GameStatus.COMPLETED
                      ? 'bg-gray-500 text-white cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white cursor-not-allowed'
                }`}
                size="lg"
              >
                {getButtonText(game.status)}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Info message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">ℹ️ ¿Cómo funciona?</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Compra cartones desde tu <strong>Billetera</strong></li>
          <li>• Cuando el juego esté <strong>EN VIVO</strong>, puedes entrar a jugar</li>
          <li>• Marca números en tus cartones para ganar premios</li>
          <li>• Los premios se acreditan automáticamente en Perlas</li>
        </ul>
      </div>
    </div>
  )
}

export default MyGameCards