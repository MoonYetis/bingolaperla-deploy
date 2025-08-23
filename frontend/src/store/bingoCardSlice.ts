import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { BingoCardData, BingoCardState, WinningPattern, BINGO_CONSTANTS } from '@/types'

const initialState: BingoCardState = {
  userCards: [],
  activeCards: [],
  isGenerating: false,
  error: null,
}

const bingoCardSlice = createSlice({
  name: 'bingoCard',
  initialState,
  reducers: {
    // Acciones para gestión de cartones del usuario
    setUserCards: (state, action: PayloadAction<BingoCardData[]>) => {
      state.userCards = action.payload
      state.error = null
    },

    addUserCard: (state, action: PayloadAction<BingoCardData>) => {
      const existingIndex = state.userCards.findIndex(card => card.id === action.payload.id)
      if (existingIndex === -1) {
        state.userCards.push(action.payload)
      } else {
        state.userCards[existingIndex] = action.payload
      }
    },

    addUserCards: (state, action: PayloadAction<BingoCardData[]>) => {
      action.payload.forEach(newCard => {
        const existingIndex = state.userCards.findIndex(card => card.id === newCard.id)
        if (existingIndex === -1) {
          state.userCards.push(newCard)
        } else {
          state.userCards[existingIndex] = newCard
        }
      })
    },

    updateUserCard: (state, action: PayloadAction<BingoCardData>) => {
      const index = state.userCards.findIndex(card => card.id === action.payload.id)
      if (index !== -1) {
        state.userCards[index] = action.payload
      }

      // También actualizar en activeCards si está ahí
      const activeIndex = state.activeCards.findIndex(card => card.id === action.payload.id)
      if (activeIndex !== -1) {
        state.activeCards[activeIndex] = action.payload
      }
    },

    removeUserCard: (state, action: PayloadAction<string>) => {
      state.userCards = state.userCards.filter(card => card.id !== action.payload)
      state.activeCards = state.activeCards.filter(card => card.id !== action.payload)
    },

    clearUserCards: (state) => {
      state.userCards = []
      state.activeCards = []
    },

    // Acciones para cartones activos (en juego)
    setActiveCards: (state, action: PayloadAction<BingoCardData[]>) => {
      // Validar que no se excedan los cartones máximos
      const cardsToSet = action.payload.slice(0, BINGO_CONSTANTS.MAX_CARDS_PER_USER)
      state.activeCards = cardsToSet
    },

    addActiveCard: (state, action: PayloadAction<BingoCardData>) => {
      if (state.activeCards.length < BINGO_CONSTANTS.MAX_CARDS_PER_USER) {
        const existingIndex = state.activeCards.findIndex(card => card.id === action.payload.id)
        if (existingIndex === -1) {
          state.activeCards.push(action.payload)
        }
      }
    },

    removeActiveCard: (state, action: PayloadAction<string>) => {
      state.activeCards = state.activeCards.filter(card => card.id !== action.payload)
    },

    clearActiveCards: (state) => {
      state.activeCards = []
    },

    // Acciones para marcado de números
    markNumber: (state, action: PayloadAction<{ cardId: string; number: number; position: number }>) => {
      const { cardId, number, position } = action.payload

      // Función helper para actualizar un cartón
      const updateCard = (card: BingoCardData) => {
        const numberIndex = card.numbers.findIndex(n => n.position === position)
        if (numberIndex !== -1 && !card.numbers[numberIndex]?.isMarked) {
          const numberData = card.numbers[numberIndex]!
          numberData.isMarked = true
          if (!card.markedNumbers.includes(number)) {
            card.markedNumbers.push(number)
          }
        }
      }

      // Actualizar en userCards
      const userCardIndex = state.userCards.findIndex(card => card.id === cardId)
      if (userCardIndex !== -1) {
        const userCard = state.userCards[userCardIndex]
        if (userCard) updateCard(userCard)
      }

      // Actualizar en activeCards
      const activeCardIndex = state.activeCards.findIndex(card => card.id === cardId)
      if (activeCardIndex !== -1) {
        const activeCard = state.activeCards[activeCardIndex]
        if (activeCard) updateCard(activeCard)
      }
    },

    unmarkNumber: (state, action: PayloadAction<{ cardId: string; number: number; position: number }>) => {
      const { cardId, number, position } = action.payload

      // Función helper para actualizar un cartón
      const updateCard = (card: BingoCardData) => {
        const numberIndex = card.numbers.findIndex(n => n.position === position)
        const numberData = card.numbers[numberIndex]
        if (numberIndex !== -1 && numberData?.isMarked && !numberData.isFree) {
          numberData.isMarked = false
          card.markedNumbers = card.markedNumbers.filter(n => n !== number)
        }
      }

      // Actualizar en userCards
      const userCardIndex = state.userCards.findIndex(card => card.id === cardId)
      if (userCardIndex !== -1) {
        const userCard = state.userCards[userCardIndex]
        if (userCard) updateCard(userCard)
      }

      // Actualizar en activeCards
      const activeCardIndex = state.activeCards.findIndex(card => card.id === cardId)
      if (activeCardIndex !== -1) {
        const activeCard = state.activeCards[activeCardIndex]
        if (activeCard) updateCard(activeCard)
      }
    },

    // Marcado automático cuando se canta un número
    autoMarkNumber: (state, action: PayloadAction<number>) => {
      const drawnNumber = action.payload

      // Función helper para marcar automáticamente en un cartón
      const autoMarkCard = (card: BingoCardData) => {
        card.numbers.forEach(number => {
          if (number.number === drawnNumber && !number.isMarked) {
            number.isMarked = true
            if (!card.markedNumbers.includes(drawnNumber)) {
              card.markedNumbers.push(drawnNumber)
            }
          }
        })
      }

      // Marcar en todos los cartones activos
      state.activeCards.forEach(card => autoMarkCard(card))
      
      // También marcar en userCards para mantener consistencia
      state.userCards.forEach(card => autoMarkCard(card))
    },

    // Acciones para estado de ganador
    setCardWinner: (state, action: PayloadAction<{ cardId: string; patterns: WinningPattern[] }>) => {
      const { cardId, patterns } = action.payload
      
      // Función helper para actualizar estado de ganador
      const updateWinnerStatus = (card: BingoCardData) => {
        card.isWinner = true
        card.winningPattern = patterns.join(', ')
      }

      // Actualizar en userCards
      const userCardIndex = state.userCards.findIndex(card => card.id === cardId)
      if (userCardIndex !== -1) {
        const userCard = state.userCards[userCardIndex]
        if (userCard) updateWinnerStatus(userCard)
      }

      // Actualizar en activeCards
      const activeCardIndex = state.activeCards.findIndex(card => card.id === cardId)
      if (activeCardIndex !== -1) {
        const activeCard = state.activeCards[activeCardIndex]
        if (activeCard) updateWinnerStatus(activeCard)
      }
    },

    // Acciones para estado de carga y errores
    setGenerating: (state, action: PayloadAction<boolean>) => {
      state.isGenerating = action.payload
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
      state.isGenerating = false
    },

    clearError: (state) => {
      state.error = null
    },

    // Acción para reset completo
    resetCardState: (state) => {
      state.userCards = []
      state.activeCards = []
      state.isGenerating = false
      state.error = null
    },

    // Filtrar cartones por juego
    filterCardsByGame: (state, action: PayloadAction<string>) => {
      const gameId = action.payload
      state.userCards = state.userCards.filter(card => card.gameId === gameId)
      state.activeCards = state.activeCards.filter(card => card.gameId === gameId)
    },

    // Activar/desactivar cartón
    toggleCardActive: (state, action: PayloadAction<string>) => {
      const cardId = action.payload
      const userCard = state.userCards.find(card => card.id === cardId)
      
      if (userCard) {
        const activeIndex = state.activeCards.findIndex(card => card.id === cardId)
        
        if (activeIndex !== -1) {
          // Está activo, remover de activos
          state.activeCards.splice(activeIndex, 1)
        } else if (state.activeCards.length < BINGO_CONSTANTS.MAX_CARDS_PER_USER) {
          // No está activo y hay espacio, agregar a activos
          state.activeCards.push(userCard)
        }
      }
    },
  },
})

export const {
  setUserCards,
  addUserCard,
  addUserCards,
  updateUserCard,
  removeUserCard,
  clearUserCards,
  setActiveCards,
  addActiveCard,
  removeActiveCard,
  clearActiveCards,
  markNumber,
  unmarkNumber,
  autoMarkNumber,
  setCardWinner,
  setGenerating,
  setError,
  clearError,
  resetCardState,
  filterCardsByGame,
  toggleCardActive,
} = bingoCardSlice.actions

// Selectores
export const selectUserCards = (state: { bingoCard: BingoCardState }) => state.bingoCard.userCards
export const selectActiveCards = (state: { bingoCard: BingoCardState }) => state.bingoCard.activeCards
export const selectIsGenerating = (state: { bingoCard: BingoCardState }) => state.bingoCard.isGenerating
export const selectCardError = (state: { bingoCard: BingoCardState }) => state.bingoCard.error

// Selectores derivados
export const selectCardsByGame = (gameId: string) => (state: { bingoCard: BingoCardState }) =>
  state.bingoCard.userCards.filter(card => card.gameId === gameId)

export const selectActiveCardsByGame = (gameId: string) => (state: { bingoCard: BingoCardState }) =>
  state.bingoCard.activeCards.filter(card => card.gameId === gameId)

export const selectWinningCards = (state: { bingoCard: BingoCardState }) =>
  state.bingoCard.activeCards.filter(card => card.isWinner)

export const selectCardById = (cardId: string) => (state: { bingoCard: BingoCardState }) =>
  state.bingoCard.userCards.find(card => card.id === cardId) ||
  state.bingoCard.activeCards.find(card => card.id === cardId)

export const selectCanGenerateMore = (gameId: string) => (state: { bingoCard: BingoCardState }) => {
  const gameCards = state.bingoCard.userCards.filter(card => card.gameId === gameId)
  return gameCards.length < BINGO_CONSTANTS.MAX_CARDS_PER_USER
}

export const selectActiveCardCount = (state: { bingoCard: BingoCardState }) =>
  state.bingoCard.activeCards.length

export const selectTotalMarkedNumbers = (state: { bingoCard: BingoCardState }) =>
  state.bingoCard.activeCards.reduce((total, card) => total + card.markedNumbers.length, 0)

export default bingoCardSlice.reducer