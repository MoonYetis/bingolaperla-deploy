import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { api } from '@/services/api'
import authReducer from './authSlice'
import gameReducer from './gameSlice'
import bingoCardReducer from './bingoCardSlice'
import gamePlayReducer from './gamePlaySlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    game: gameReducer,
    bingoCard: bingoCardReducer,
    gamePlay: gamePlayReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(api.middleware),
})

// Habilitar refetching automático cuando se reconecta
setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export default store