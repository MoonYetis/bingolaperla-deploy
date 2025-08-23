import { api } from './api'
import {
  BingoCardData,
  GenerateCardsRequest,
  GenerateCardsResponse,
  MarkNumberRequest,
  MarkNumberResponse,
  GamePatternsResponse,
} from '@/types'

export const bingoCardApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Generar cartones para un juego
    generateCards: builder.mutation<GenerateCardsResponse, GenerateCardsRequest>({
      query: ({ gameId, count }) => ({
        url: '/cards/generate',
        method: 'POST',
        body: { gameId, count },
      }),
      invalidatesTags: ['BingoCard'],
      // Optimistic update
      async onQueryStarted({ gameId }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          
          // Actualizar cache de cartones del usuario
          dispatch(
            bingoCardApi.util.updateQueryData('getMyCards', gameId, (draft) => {
              draft.cards.push(...data.cards)
              draft.count = draft.cards.length
            })
          )
        } catch {
          // Error handling ya se maneja por RTK Query
        }
      },
    }),

    // Obtener cartones del usuario para un juego específico
    getUserCards: builder.query<{
      message: string
      cards: BingoCardData[]
      count: number
    }, { userId: string; gameId: string }>({
      query: ({ userId, gameId }) => `/cards/user/${userId}/game/${gameId}`,
      providesTags: (result, error, { userId, gameId }) => [
        'BingoCard',
        { type: 'BingoCard', id: `${userId}-${gameId}` },
      ],
    }),

    // Obtener mis cartones para un juego
    getMyCards: builder.query<{
      message: string
      cards: BingoCardData[]
      count: number
    }, string>({
      query: (gameId) => `/cards/my/${gameId}`,
      providesTags: (result, error, gameId) => [
        'BingoCard',
        { type: 'BingoCard', id: `my-${gameId}` },
      ],
    }),

    // Obtener todos mis cartones agrupados por juego
    getMyAllCards: builder.query<{
      message: string
      games: Array<{
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
      }>
      totalGames: number
      totalCards: number
    }, void>({
      query: () => '/cards/my-all',
      providesTags: ['BingoCard'],
    }),

    // Marcar número en cartón
    markNumber: builder.mutation<MarkNumberResponse, MarkNumberRequest & { cardId: string }>({
      query: ({ cardId, number }) => ({
        url: `/cards/${cardId}/mark`,
        method: 'PUT',
        body: { number },
      }),
      invalidatesTags: (result, error, { cardId }) => [
        'BingoCard',
        { type: 'BingoCard', id: cardId },
      ],
      // Optimistic update
      async onQueryStarted({ cardId, number }, { dispatch, queryFulfilled, getState }) {
        // Encontrar el cartón en cualquier query cache y actualizar optimísticamente
        const patches: any[] = []

        // Actualizar en getMyCards para cualquier gameId
        api.util.selectInvalidatedBy(getState(), ['BingoCard']).forEach((cache) => {
          if (cache.endpointName === 'getMyCards') {
            const patch = dispatch(
              bingoCardApi.util.updateQueryData('getMyCards', cache.originalArgs, (draft) => {
                const card = draft.cards.find(c => c.id === cardId)
                if (card) {
                  const numberCell = card.numbers.find(n => n.number === number)
                  if (numberCell && !numberCell.isMarked) {
                    numberCell.isMarked = true
                    if (!card.markedNumbers.includes(number)) {
                      card.markedNumbers.push(number)
                    }
                  }
                }
              })
            )
            patches.push(patch)
          }
        })

        try {
          const { data } = await queryFulfilled
          
          // Si hay patrones ganadores, actualizar el estado del cartón
          if (data.isWinner && data.winningPatterns.length > 0) {
            patches.forEach(patch => {
              dispatch(
                bingoCardApi.util.updateQueryData('getMyCards', patch.originalArgs, (draft) => {
                  const card = draft.cards.find(c => c.id === cardId)
                  if (card) {
                    card.isWinner = true
                    card.winningPattern = data.winningPatterns.join(', ')
                  }
                })
              )
            })
          }
        } catch {
          // Revertir cambios optimistas si falla
          patches.forEach(patch => patch.undo())
        }
      },
    }),

    // Obtener patrones del cartón
    getCardPatterns: builder.query<GamePatternsResponse, string>({
      query: (cardId) => `/cards/${cardId}/patterns`,
      providesTags: (result, error, cardId) => [
        { type: 'BingoCard', id: `patterns-${cardId}` },
      ],
    }),

    // Validar estructura de cartón
    validateCard: builder.mutation<{
      message: string
      isValid: boolean
      isUnique: boolean
      details: {
        hasCorrectSize: boolean
        hasValidFreeCell: boolean
        hasValidRanges: boolean
        hasUniqueNumbers: boolean
      }
    }, { cardNumbers: any[] }>({
      query: ({ cardNumbers }) => ({
        url: '/cards/validate',
        method: 'POST',
        body: { cardNumbers },
      }),
    }),

    // Eliminar/desactivar cartón
    deleteCard: builder.mutation<{
      message: string
    }, string>({
      query: (cardId) => ({
        url: `/cards/${cardId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, cardId) => [
        'BingoCard',
        { type: 'BingoCard', id: cardId },
      ],
      // Optimistic update
      async onQueryStarted(cardId, { dispatch, queryFulfilled, getState }) {
        const patches: any[] = []

        // Remover de todos los caches relevantes
        api.util.selectInvalidatedBy(getState(), ['BingoCard']).forEach((cache) => {
          if (cache.endpointName === 'getMyCards') {
            const patch = dispatch(
              bingoCardApi.util.updateQueryData('getMyCards', cache.originalArgs, (draft) => {
                draft.cards = draft.cards.filter(card => card.id !== cardId)
                draft.count = draft.cards.length
              })
            )
            patches.push(patch)
          }
        })

        try {
          await queryFulfilled
        } catch {
          // Revertir cambios si falla
          patches.forEach(patch => patch.undo())
        }
      },
    }),
  }),
  overrideExisting: false,
})

export const {
  useGenerateCardsMutation,
  useGetUserCardsQuery,
  useGetMyCardsQuery,
  useGetMyAllCardsQuery,
  useMarkNumberMutation,
  useGetCardPatternsQuery,
  useValidateCardMutation,
  useDeleteCardMutation,
  
  // Lazy queries
  useLazyGetUserCardsQuery,
  useLazyGetMyCardsQuery,
  useLazyGetMyAllCardsQuery,
  useLazyGetCardPatternsQuery,
} = bingoCardApi

// Selectores adicionales
export const selectMyCards = (gameId: string) =>
  bingoCardApi.endpoints.getMyCards.select(gameId)

export const selectUserCards = (userId: string, gameId: string) =>
  bingoCardApi.endpoints.getUserCards.select({ userId, gameId })

export const selectCardPatterns = (cardId: string) =>
  bingoCardApi.endpoints.getCardPatterns.select(cardId)

// Helper para prefetch de cartones
export const prefetchMyCards = (gameId: string) =>
  bingoCardApi.util.prefetch('getMyCards', gameId, { force: false })

// Actions para manejo manual de cache
export const invalidateCardCache = bingoCardApi.util.invalidateTags
export const resetCardApi = bingoCardApi.util.resetApiState

// Utility para optimizar subscripciones
export const subscribeToMyCards = (gameId: string) =>
  bingoCardApi.endpoints.getMyCards.initiate(gameId, { 
    subscribe: true, 
    forceRefetch: false 
  })