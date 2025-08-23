import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { GamePlayState, WinningPattern, ColumnLetter, getColumnLetter } from '@/types'

const initialState: GamePlayState = {
  currentBall: null,
  ballsDrawn: [],
  ballHistory: [],
  winners: [],
  isGameActive: false,
  gameStats: {
    totalBalls: 0,
    timeElapsed: 0,
    participantCount: 0,
  },
}

const gamePlaySlice = createSlice({
  name: 'gamePlay',
  initialState,
  reducers: {
    // Acciones para gestión de bolas
    setCurrentBall: (state, action: PayloadAction<number | null>) => {
      state.currentBall = action.payload
    },

    setBallsDrawn: (state, action: PayloadAction<number[]>) => {
      state.ballsDrawn = action.payload
      state.gameStats.totalBalls = action.payload.length
    },

    addBallDrawn: (state, action: PayloadAction<{ ball: number; timestamp?: string }>) => {
      const { ball, timestamp = new Date().toISOString() } = action.payload
      
      // Agregar a bolas cantadas si no existe
      if (!state.ballsDrawn.includes(ball)) {
        state.ballsDrawn.push(ball)
        state.gameStats.totalBalls = state.ballsDrawn.length
      }

      // Agregar al historial con información de columna
      const column = getColumnLetter(getPositionForNumber(ball))
      const historyEntry = {
        ball,
        timestamp,
        column,
      }

      // Evitar duplicados en el historial
      const existingIndex = state.ballHistory.findIndex(entry => entry.ball === ball)
      if (existingIndex === -1) {
        state.ballHistory.unshift(historyEntry) // Agregar al inicio
        
        // Mantener solo las últimas 75 bolas (máximo del juego)
        if (state.ballHistory.length > 75) {
          state.ballHistory = state.ballHistory.slice(0, 75)
        }
      }

      // Actualizar bola actual
      state.currentBall = ball
    },

    clearBallHistory: (state) => {
      state.ballHistory = []
      state.ballsDrawn = []
      state.currentBall = null
      state.gameStats.totalBalls = 0
    },

    // Acciones para gestión de ganadores
    addWinner: (state, action: PayloadAction<{
      cardId: string
      userId: string
      patterns: WinningPattern[]
    }>) => {
      const existingIndex = state.winners.findIndex(winner => winner.cardId === action.payload.cardId)
      
      if (existingIndex === -1) {
        state.winners.push(action.payload)
      } else {
        // Actualizar patrones si el cartón ya es ganador
        const winner = state.winners[existingIndex]
        if (winner) {
          winner.patterns = [
            ...new Set([...winner.patterns, ...action.payload.patterns])
          ]
        }
      }
    },

    removeWinner: (state, action: PayloadAction<string>) => {
      state.winners = state.winners.filter(winner => winner.cardId !== action.payload)
    },

    clearWinners: (state) => {
      state.winners = []
    },

    setWinners: (state, action: PayloadAction<Array<{
      cardId: string
      userId: string
      patterns: WinningPattern[]
    }>>) => {
      state.winners = action.payload
    },

    // Acciones para estado del juego
    setGameActive: (state, action: PayloadAction<boolean>) => {
      state.isGameActive = action.payload
      
      // Si el juego se desactiva, resetear algunos valores
      if (!action.payload) {
        state.currentBall = null
      }
    },

    startGame: (state) => {
      state.isGameActive = true
      state.winners = []
      state.ballsDrawn = []
      state.ballHistory = []
      state.currentBall = null
      state.gameStats = {
        totalBalls: 0,
        timeElapsed: 0,
        participantCount: state.gameStats.participantCount, // Mantener el conteo de participantes
      }
    },

    endGame: (state) => {
      state.isGameActive = false
      state.currentBall = null
    },

    pauseGame: (state) => {
      state.isGameActive = false
    },

    resumeGame: (state) => {
      state.isGameActive = true
    },

    // Acciones para estadísticas del juego
    updateGameStats: (state, action: PayloadAction<Partial<GamePlayState['gameStats']>>) => {
      state.gameStats = { ...state.gameStats, ...action.payload }
    },

    incrementTimeElapsed: (state, action: PayloadAction<number>) => {
      state.gameStats.timeElapsed += action.payload
    },

    setParticipantCount: (state, action: PayloadAction<number>) => {
      state.gameStats.participantCount = action.payload
    },

    // Acción para reset completo
    resetGamePlay: (state) => {
      state.currentBall = null
      state.ballsDrawn = []
      state.ballHistory = []
      state.winners = []
      state.isGameActive = false
      state.gameStats = {
        totalBalls: 0,
        timeElapsed: 0,
        participantCount: 0,
      }
    },

    // Acciones para sincronización con servidor
    syncGameState: (state, action: PayloadAction<{
      ballsDrawn: number[]
      currentBall?: number
      winners: Array<{
        cardId: string
        userId: string
        patterns: WinningPattern[]
      }>
      isActive: boolean
    }>) => {
      const { ballsDrawn, currentBall, winners, isActive } = action.payload
      
      state.ballsDrawn = ballsDrawn
      state.currentBall = currentBall || null
      state.winners = winners
      state.isGameActive = isActive
      state.gameStats.totalBalls = ballsDrawn.length

      // Reconstruir historial basado en bolas cantadas
      state.ballHistory = ballsDrawn.map(ball => ({
        ball,
        timestamp: new Date().toISOString(), // Timestamp aproximado
        column: getColumnLetter(getPositionForNumber(ball)),
      })).reverse() // Las más recientes primero
    },
  },
})

// Función helper para obtener la posición de un número (aproximada para obtener la columna)
function getPositionForNumber(number: number): number {
  if (number >= 1 && number <= 15) return 0 // Columna B
  if (number >= 16 && number <= 30) return 1 // Columna I
  if (number >= 31 && number <= 45) return 2 // Columna N
  if (number >= 46 && number <= 60) return 3 // Columna G
  if (number >= 61 && number <= 75) return 4 // Columna O
  return 0 // Fallback
}

export const {
  setCurrentBall,
  setBallsDrawn,
  addBallDrawn,
  clearBallHistory,
  addWinner,
  removeWinner,
  clearWinners,
  setWinners,
  setGameActive,
  startGame,
  endGame,
  pauseGame,
  resumeGame,
  updateGameStats,
  incrementTimeElapsed,
  setParticipantCount,
  resetGamePlay,
  syncGameState,
} = gamePlaySlice.actions

// Selectores
export const selectCurrentBall = (state: { gamePlay: GamePlayState }) => state.gamePlay.currentBall
export const selectBallsDrawn = (state: { gamePlay: GamePlayState }) => state.gamePlay.ballsDrawn
export const selectBallHistory = (state: { gamePlay: GamePlayState }) => state.gamePlay.ballHistory
export const selectWinners = (state: { gamePlay: GamePlayState }) => state.gamePlay.winners
export const selectIsGameActive = (state: { gamePlay: GamePlayState }) => state.gamePlay.isGameActive
export const selectGameStats = (state: { gamePlay: GamePlayState }) => state.gamePlay.gameStats

// Selectores derivados
export const selectLastBalls = (count: number) => (state: { gamePlay: GamePlayState }) =>
  state.gamePlay.ballHistory.slice(0, count)

export const selectBallsByColumn = (column: ColumnLetter) => (state: { gamePlay: GamePlayState }) =>
  state.gamePlay.ballHistory.filter(entry => entry.column === column)

export const selectWinnersByPattern = (pattern: WinningPattern) => (state: { gamePlay: GamePlayState }) =>
  state.gamePlay.winners.filter(winner => winner.patterns.includes(pattern))

export const selectHasWinners = (state: { gamePlay: GamePlayState }) =>
  state.gamePlay.winners.length > 0

export const selectBallsRemaining = (state: { gamePlay: GamePlayState }) =>
  75 - state.gamePlay.ballsDrawn.length

export const selectIsBallDrawn = (ball: number) => (state: { gamePlay: GamePlayState }) =>
  state.gamePlay.ballsDrawn.includes(ball)

export const selectCurrentBallInfo = (state: { gamePlay: GamePlayState }) => {
  const currentBall = state.gamePlay.currentBall
  if (!currentBall) return null

  return {
    ball: currentBall,
    column: getColumnLetter(getPositionForNumber(currentBall)),
    isRecent: state.gamePlay.ballHistory[0]?.ball === currentBall,
  }
}

export const selectGameProgress = (state: { gamePlay: GamePlayState }) => ({
  ballsDrawn: state.gamePlay.ballsDrawn.length,
  totalBalls: 75,
  percentage: (state.gamePlay.ballsDrawn.length / 75) * 100,
  timeElapsed: state.gamePlay.gameStats.timeElapsed,
  participantCount: state.gamePlay.gameStats.participantCount,
})

export default gamePlaySlice.reducer