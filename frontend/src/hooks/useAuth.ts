import { useAppSelector, useAppDispatch } from './redux'
import { useCallback } from 'react'
import { loginUser, registerUser, logoutUser, clearError } from '@/store/authSlice'
import type { LoginCredentials, RegisterData } from '@/types'

export const useAuth = () => {
  const dispatch = useAppDispatch()
  const { user, tokens, isAuthenticated, isLoading, error } = useAppSelector(
    (state) => state.auth
  )

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const result = await dispatch(loginUser(credentials))
      return result
    },
    [dispatch]
  )

  const register = useCallback(
    async (userData: RegisterData) => {
      const result = await dispatch(registerUser(userData))
      return result
    },
    [dispatch]
  )

  const logout = useCallback(async () => {
    const result = await dispatch(logoutUser())
    return result
  }, [dispatch])

  const clear = useCallback(() => {
    dispatch(clearError())
  }, [dispatch])

  const isAdmin = user?.role === 'ADMIN'

  return {
    // Estado
    user,
    tokens,
    isAuthenticated,
    isLoading,
    error,
    isAdmin,

    // Acciones
    login,
    register,
    logout,
    clearError: clear,
  }
}

export default useAuth