import { useState, useEffect } from 'react'
import { useGetGamesQuery } from '@/services/gameApi'
import { walletApi } from '@/services/walletApi'
import { useToast } from '@/contexts/ToastContext'
import Button from '@/components/common/Button'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import CardPurchaseModal from '@/components/game/CardPurchaseModal'
import { GameStatus } from '@/types'
import { formatCurrency } from '@/utils/currency'

interface Game {
  id: string
  title: string
  cardPrice: number
  status: string
  scheduledAt: string
  totalPrize: number
  participantCount: number
  maxPlayers: number
  description?: string
}

interface GameCardsShopProps {
  onPurchaseSuccess?: () => void
}

export const GameCardsShop = ({ onPurchaseSuccess }: GameCardsShopProps) => {
  const { toast } = useToast()
  const { data: gamesData, isLoading } = useGetGamesQuery(undefined)
  const [userBalance, setUserBalance] = useState<number>(0)
  const [loadingBalance, setLoadingBalance] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)

  // Cargar balance de usuario
  useEffect(() => {
    loadUserBalance()
  }, [])

  const loadUserBalance = async () => {
    try {
      setLoadingBalance(true)
      const balanceData = await walletApi.getBalance()
      setUserBalance(balanceData.balance)
    } catch (error) {
      console.error('Error loading balance:', error)
      toast.error('Error cargando balance')
    } finally {
      setLoadingBalance(false)
    }
  }

  const games = gamesData?.games || []
  const availableGames = games.filter(g => 
    g.status === GameStatus.OPEN || 
    g.status === GameStatus.SCHEDULED ||
    g.status === GameStatus.IN_PROGRESS
  )

  const handleBuyCards = (game: Game) => {
    setSelectedGame(game)
    setShowPurchaseModal(true)
  }

  const handlePurchaseSuccess = (result: any) => {
    // Actualizar balance local
    setUserBalance(result.data.wallet.newBalance)
    setShowPurchaseModal(false)
    
    // Llamar callback si existe
    if (onPurchaseSuccess) {
      onPurchaseSuccess()
    }
    
    toast.success(`¡${result.data.purchase.cardsPurchased} cartón${result.data.purchase.cardsPurchased > 1 ? 'es' : ''} comprado${result.data.purchase.cardsPurchased > 1 ? 's' : ''}!`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case GameStatus.OPEN:
        return 'text-green-600 bg-green-50'
      case GameStatus.SCHEDULED:
        return 'text-blue-600 bg-blue-50'
      case GameStatus.IN_PROGRESS:
        return 'text-orange-600 bg-orange-50'
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
        return 'En Vivo'
      default:
        return status
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="md" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">🎯 Comprar Cartones</h2>
          <p className="text-sm text-gray-600">Compra cartones para los juegos disponibles</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Tu balance:</p>
          <p className="text-lg font-bold text-green-600">
            {loadingBalance ? (
              <LoadingSpinner size="sm" />
            ) : (
              `${userBalance.toFixed(2)} Perlas`
            )}
          </p>
          <p className="text-xs text-gray-500">≈ {formatCurrency(userBalance)}</p>
        </div>
      </div>

      {/* Games List */}
      {availableGames.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <span className="text-4xl">🎮</span>
          <h3 className="text-lg font-medium text-gray-900 mt-4">No hay juegos disponibles</h3>
          <p className="text-gray-600 mt-2">
            No hay juegos abiertos para comprar cartones en este momento.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {availableGames.map((game) => (
            <div 
              key={game.id} 
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{game.title}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(game.status)}`}>
                      {getStatusText(game.status)}
                    </span>
                  </div>
                  {game.description && (
                    <p className="text-gray-600 text-sm mb-3">{game.description}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center bg-gray-50 rounded-lg p-3">
                  <span className="text-2xl">💰</span>
                  <p className="text-sm text-gray-600 mt-1">Premio</p>
                  <p className="font-bold text-yellow-600">S/ {game.totalPrize.toFixed(0)}</p>
                </div>
                <div className="text-center bg-gray-50 rounded-lg p-3">
                  <span className="text-2xl">👥</span>
                  <p className="text-sm text-gray-600 mt-1">Jugadores</p>
                  <p className="font-bold">{game.participantCount} / {game.maxPlayers}</p>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Precio por cartón</p>
                    <p className="text-xl font-bold text-blue-800">{game.cardPrice.toFixed(2)} Perlas</p>
                    <p className="text-xs text-blue-600">≈ {formatCurrency(game.cardPrice)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-700">
                      {game.status === GameStatus.IN_PROGRESS ? 'EN VIVO' : 
                       game.status === GameStatus.OPEN ? 'Disponible ahora' :
                       'Programado'}
                    </p>
                    {game.status !== GameStatus.IN_PROGRESS && (
                      <p className="text-xs text-blue-600">
                        {new Date(game.scheduledAt).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Button
                onClick={() => handleBuyCards(game)}
                disabled={userBalance < game.cardPrice}
                className={`w-full py-3 rounded-xl font-medium ${
                  userBalance >= game.cardPrice
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                size="lg"
              >
                {userBalance >= game.cardPrice ? (
                  <>
                    <span className="text-lg mr-2">🎯</span>
                    Comprar Cartones
                  </>
                ) : (
                  'Saldo Insuficiente'
                )}
              </Button>

              {userBalance < game.cardPrice && (
                <p className="text-center text-red-600 text-sm mt-2">
                  ⚠️ Necesitas {(game.cardPrice - userBalance).toFixed(2)} Perlas más
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Purchase Modal */}
      <CardPurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => {
          setShowPurchaseModal(false)
          setSelectedGame(null)
        }}
        game={selectedGame}
        onSuccess={handlePurchaseSuccess}
      />
    </div>
  )
}

export default GameCardsShop