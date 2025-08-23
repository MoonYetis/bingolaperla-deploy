import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { GameData, GameStatus, GameState } from '@/types'

const initialState: GameState = {
  availableGames: [],
  currentGame: null,
  gameHistory: [],
  isLoading: false,
  error: null,
}

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    // Acciones para gestión de juegos disponibles
    setAvailableGames: (state, action: PayloadAction<GameData[]>) => {
      state.availableGames = action.payload
      state.error = null
    },

    addGame: (state, action: PayloadAction<GameData>) => {
      state.availableGames.push(action.payload)
    },

    updateGame: (state, action: PayloadAction<GameData>) => {
      const index = state.availableGames.findIndex(game => game.id === action.payload.id)
      if (index !== -1) {
        state.availableGames[index] = action.payload
      }
      
      // También actualizar currentGame si es el mismo
      if (state.currentGame?.id === action.payload.id) {
        state.currentGame = action.payload
      }
    },

    removeGame: (state, action: PayloadAction<string>) => {
      state.availableGames = state.availableGames.filter(game => game.id !== action.payload)
      
      // Si es el juego actual, limpiarlo
      if (state.currentGame?.id === action.payload) {
        state.currentGame = null
      }
    },

    // Acciones para juego actual
    setCurrentGame: (state, action: PayloadAction<GameData | null>) => {
      state.currentGame = action.payload
      state.error = null
    },

    updateCurrentGameStatus: (state, action: PayloadAction<GameStatus>) => {
      if (state.currentGame) {
        state.currentGame.status = action.payload
      }
    },

    updateCurrentGameBall: (state, action: PayloadAction<{ ball: number; ballsDrawn: number[] }>) => {
      if (state.currentGame) {
        state.currentGame.currentBall = action.payload.ball
        state.currentGame.ballsDrawn = action.payload.ballsDrawn
      }
    },

    addGameWinner: (state, action: PayloadAction<string>) => {
      if (state.currentGame) {
        if (!state.currentGame.winningCards.includes(action.payload)) {
          state.currentGame.winningCards.push(action.payload)
        }
      }
    },

    updateGameParticipants: (state, action: PayloadAction<number>) => {
      if (state.currentGame) {
        state.currentGame.participantCount = action.payload
      }
    },

    // Acciones para historial
    addToHistory: (state, action: PayloadAction<GameData>) => {
      // Solo agregar juegos completados al historial
      if (action.payload.status === GameStatus.COMPLETED) {
        const existingIndex = state.gameHistory.findIndex(game => game.id === action.payload.id)
        if (existingIndex === -1) {
          state.gameHistory.unshift(action.payload) // Agregar al inicio
          // Mantener solo los últimos 50 juegos
          if (state.gameHistory.length > 50) {
            state.gameHistory = state.gameHistory.slice(0, 50)
          }
        } else {
          state.gameHistory[existingIndex] = action.payload
        }
      }
    },

    clearHistory: (state) => {
      state.gameHistory = []
    },

    // Acciones para estado de carga y errores
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
      state.isLoading = false
    },

    clearError: (state) => {
      state.error = null
    },

    // Acción para limpiar todo el estado
    resetGameState: (state) => {
      state.availableGames = []
      state.currentGame = null
      state.gameHistory = []
      state.isLoading = false
      state.error = null
    },

    // Filtrar juegos por estado
    filterGamesByStatus: (state, action: PayloadAction<GameStatus | null>) => {
      if (action.payload === null) {
        // No filtrar, mostrar todos
        return
      }
      
      state.availableGames = state.availableGames.filter(
        game => game.status === action.payload
      )
    },

    // Acciones para unirse/salir de juegos
    joinGameOptimistic: (state, action: PayloadAction<string>) => {
      const game = state.availableGames.find(g => g.id === action.payload)
      if (game && game.participantCount !== undefined) {
        game.participantCount += 1
      }
    },

    leaveGameOptimistic: (state, action: PayloadAction<string>) => {
      const game = state.availableGames.find(g => g.id === action.payload)
      if (game && game.participantCount !== undefined && game.participantCount > 0) {
        game.participantCount -= 1
      }
    },
  },
})

export const {
  setAvailableGames,
  addGame,
  updateGame,
  removeGame,
  setCurrentGame,
  updateCurrentGameStatus,
  updateCurrentGameBall,
  addGameWinner,
  updateGameParticipants,
  addToHistory,
  clearHistory,
  setLoading,
  setError,
  clearError,
  resetGameState,
  filterGamesByStatus,
  joinGameOptimistic,
  leaveGameOptimistic,
} = gameSlice.actions

// Selectores
export const selectAvailableGames = (state: { game: GameState }) => state.game.availableGames
export const selectCurrentGame = (state: { game: GameState }) => state.game.currentGame
export const selectGameHistory = (state: { game: GameState }) => state.game.gameHistory
export const selectGameLoading = (state: { game: GameState }) => state.game.isLoading
export const selectGameError = (state: { game: GameState }) => state.game.error

// Selectores derivados
export const selectGamesByStatus = (status: GameStatus) => (state: { game: GameState }) =>
  state.game.availableGames.filter(game => game.status === status)

export const selectOpenGames = (state: { game: GameState }) =>
  state.game.availableGames.filter(game => 
    game.status === GameStatus.OPEN || game.status === GameStatus.SCHEDULED
  )

export const selectActiveGames = (state: { game: GameState }) =>
  state.game.availableGames.filter(game => game.status === GameStatus.IN_PROGRESS)

export const selectGameById = (gameId: string) => (state: { game: GameState }) =>
  state.game.availableGames.find(game => game.id === gameId) ||
  state.game.gameHistory.find(game => game.id === gameId)

export const selectIsInGame = (state: { game: GameState }) => 
  state.game.currentGame !== null && state.game.currentGame.status === GameStatus.IN_PROGRESS

export const selectCanJoinGame = (gameId: string) => (state: { game: GameState }) => {
  const game = state.game.availableGames.find(g => g.id === gameId)
  if (!game) return false
  
  return (
    (game.status === GameStatus.OPEN || game.status === GameStatus.SCHEDULED) &&
    (game.participantCount || 0) < game.maxPlayers
  )
}

export default gameSlice.reducer