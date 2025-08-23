import { api } from './api'
import {
  GameData,
  GameStatus,
  CreateGameRequest,
  DrawBallResponse,
} from '@/types'

export const gameApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Obtener todos los juegos disponibles
    getGames: builder.query<{
      message: string
      games: GameData[]
      total: number
    }, GameStatus | undefined>({
      query: (status) => ({
        url: '/games',
        params: status ? { status } : undefined,
      }),
      providesTags: ['Game'],
      transformResponse: (response: any) => response,
    }),

    // Obtener juego específico por ID
    getGameById: builder.query<{
      message: string
      game: GameData
    }, string>({
      query: (gameId) => `/games/${gameId}`,
      providesTags: (result, error, gameId) => [{ type: 'Game', id: gameId }],
    }),

    // Crear nuevo juego (solo admin)
    createGame: builder.mutation<{
      message: string
      game: GameData
    }, CreateGameRequest>({
      query: (gameData) => ({
        url: '/games',
        method: 'POST',
        body: gameData,
      }),
      invalidatesTags: ['Game'],
    }),

    // Unirse a un juego
    joinGame: builder.mutation<{
      message: string
    }, string>({
      query: (gameId) => ({
        url: `/games/${gameId}/join`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, gameId) => [
        'Game',
        { type: 'Game', id: gameId },
      ],
      // Optimistic update
      async onQueryStarted(gameId, { dispatch, queryFulfilled }) {
        // Actualizar el cache optimísticamente
        const patchResult = dispatch(
          gameApi.util.updateQueryData('getGames', undefined, (draft) => {
            const game = draft.games.find(g => g.id === gameId)
            if (game && game.participantCount !== undefined) {
              game.participantCount += 1
            }
          })
        )

        try {
          await queryFulfilled
        } catch {
          // Revertir el cambio si la mutación falla
          patchResult.undo()
        }
      },
    }),

    // Iniciar juego (solo admin)
    startGame: builder.mutation<{
      message: string
      game: GameData
    }, string>({
      query: (gameId) => ({
        url: `/games/${gameId}/start`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, gameId) => [
        'Game',
        { type: 'Game', id: gameId },
      ],
    }),

    // Sortear bola (solo admin)
    drawBall: builder.mutation<DrawBallResponse, string>({
      query: (gameId) => ({
        url: `/games/${gameId}/draw-ball`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, gameId) => [
        'Game',
        { type: 'Game', id: gameId },
        'BingoCard', // También invalidar cartones por si hay ganadores
      ],
      // Optimistic update para la bola actual
      async onQueryStarted(gameId, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          
          // Actualizar el juego específico en cache
          dispatch(
            gameApi.util.updateQueryData('getGameById', gameId, (draft) => {
              draft.game.currentBall = data.ball
              draft.game.ballsDrawn = data.game.ballsDrawn
              if (data.winners && data.winners.length > 0) {
                draft.game.winningCards = [
                  ...draft.game.winningCards,
                  ...data.winners.map(w => w.cardId)
                ]
              }
            })
          )

          // También actualizar en la lista de juegos
          dispatch(
            gameApi.util.updateQueryData('getGames', undefined, (draft) => {
              const game = draft.games.find(g => g.id === gameId)
              if (game) {
                game.currentBall = data.ball
                game.ballsDrawn = data.game.ballsDrawn
                if (data.winners && data.winners.length > 0) {
                  game.winningCards = [
                    ...game.winningCards,
                    ...data.winners.map(w => w.cardId)
                  ]
                }
              }
            })
          )
        } catch {
          // Error handling ya se maneja por RTK Query
        }
      },
    }),

    // Finalizar juego (solo admin)
    endGame: builder.mutation<{
      message: string
      game: GameData
    }, string>({
      query: (gameId) => ({
        url: `/games/${gameId}/end`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, gameId) => [
        'Game',
        { type: 'Game', id: gameId },
      ],
    }),

    // Anunciar BINGO
    announceBingo: builder.mutation<{
      success: boolean
      message: string
      isValid: boolean
      card?: any
      winningPattern?: string
      prize?: {
        amount: number
        currency: string
        transactionId: string
        newBalance: number
        description: string
        timestamp: string
      }
    }, { gameId: string; cardId: string }>({
      query: ({ gameId, cardId }) => ({
        url: `/games/${gameId}/announce-bingo`,
        method: 'POST',
        body: { cardId },
      }),
      invalidatesTags: (result, error, { gameId }) => [
        'Game',
        { type: 'Game', id: gameId },
        'BingoCard', // Invalidar cartones por si el cartón se marca como ganador
      ],
      // Optimistic update para marcar cartón como ganador
      async onQueryStarted({ gameId, cardId }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          
          // Si BINGO es válido y hay premio, se manejará via Socket.IO
          // Aquí solo actualizamos el estado del cartón si es válido
          if (data.success && data.isValid) {
            // La actualización del balance se hará via Socket.IO
            // Aquí podríamos actualizar el estado del cartón como ganador
          }
        } catch {
          // Error handling ya se maneja por RTK Query
        }
      },
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetGamesQuery,
  useGetGameByIdQuery,
  useCreateGameMutation,
  useJoinGameMutation,
  useStartGameMutation,
  useDrawBallMutation,
  useEndGameMutation,
  useAnnounceBingoMutation,
  
  // Lazy queries para uso manual
  useLazyGetGamesQuery,
  useLazyGetGameByIdQuery,
} = gameApi

// Selectores adicionales para optimización
export const selectGameById = (gameId: string) =>
  gameApi.endpoints.getGameById.select(gameId)

export const selectGames = (status?: GameStatus) =>
  gameApi.endpoints.getGames.select(status)

// Actions para invalidar cache manualmente
export const invalidateGameCache = gameApi.util.invalidateTags
export const resetGameApi = gameApi.util.resetApiState