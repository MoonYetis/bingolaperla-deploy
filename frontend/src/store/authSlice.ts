import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { apiGet, apiPost } from '@/utils/api'
import type { 
  AuthState, 
  User, 
  AuthTokens, 
  LoginCredentials, 
  RegisterData,
  AuthResponse 
} from '@/types'

// Thunks asíncronos
export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    const maxRetries = 3
    const retryDelay = 1000 // 1 segundo
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const tokens = localStorage.getItem('auth_tokens')
        const lastLogin = localStorage.getItem('last_login_time')
        
        if (!tokens) {
          console.log('🔒 No hay tokens - usuario no autenticado')
          return rejectWithValue('No authenticated')
        }

        // Verificar si el login es muy reciente (grace period)
        const currentTime = Date.now()
        if (lastLogin) {
          const timeSinceLogin = currentTime - parseInt(lastLogin)
          const gracePeriodMs = 5 * 60 * 1000 // 5 minutos
          
          if (timeSinceLogin < gracePeriodMs) {
            console.log(`🔓 Grace period activo (${Math.round(timeSinceLogin/1000)}s desde login)`)
            const parsedTokens: AuthTokens = JSON.parse(tokens)
            return { 
              user: { id: 'temp', username: 'temp', email: 'temp@temp.com', role: 'USER' }, 
              tokens: parsedTokens 
            }
          }
        }

        const parsedTokens: AuthTokens = JSON.parse(tokens)
        console.log(`🔍 Verificando auth - intento ${attempt}/${maxRetries}`)
        
        const data = await apiGet('/auth/me')
        console.log('✅ Auth verificada exitosamente')
        return { user: data.user, tokens: parsedTokens }
        
      } catch (error) {
        if (attempt < maxRetries) {
          console.log(`⚠️ Error de conexión - reintentando en ${retryDelay}ms...`)
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          continue
        }
        
        console.log('❌ Error de conexión final - limpiando storage')
        localStorage.removeItem('auth_tokens')
        localStorage.removeItem('last_login_time')
        return rejectWithValue('Connection error')
      }
    }
    
    return rejectWithValue('Max retries reached')
  }
)

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      console.log('🔐 Intentando login con:', credentials.identifier)
      
      const data = await apiPost<AuthResponse>('/auth/login', credentials)
      
      console.log('✅ Login exitoso')

      // Guardar tokens en localStorage
      localStorage.setItem('auth_tokens', JSON.stringify(data.tokens))
      localStorage.setItem('last_login_time', Date.now().toString())

      return data
    } catch (error: any) {
      console.error('❌ Error en login:', error)
      
      if (error.response?.data?.error) {
        return rejectWithValue(error.response.data.error)
      }
      
      return rejectWithValue('Error de conexión')
    }
  }
)

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: RegisterData, { rejectWithValue }) => {
    try {
      console.log('📝 Intentando registro con:', userData.email)
      
      const data = await apiPost<AuthResponse>('/auth/register', userData)
      
      console.log('✅ Registro exitoso')

      // Guardar tokens en localStorage
      localStorage.setItem('auth_tokens', JSON.stringify(data.tokens))
      localStorage.setItem('last_login_time', Date.now().toString())

      return data
    } catch (error: any) {
      console.error('❌ Error en registro:', error)
      
      if (error.response?.data?.error) {
        return rejectWithValue(error.response.data.error)
      }
      
      return rejectWithValue('Error de conexión')
    }
  }
)

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🚪 Cerrando sesión...')
      
      // Intentar logout en servidor usando interceptor
      await apiPost('/auth/logout')
      
      console.log('✅ Logout exitoso')
    } catch (error) {
      console.warn('⚠️ Error en logout del servidor (continuando con limpieza local):', error)
    } finally {
      // Siempre limpiar el local storage
      localStorage.removeItem('auth_tokens')
      localStorage.removeItem('last_login_time')
      console.log('🧹 Local storage limpiado')
    }
    
    return null
  }
)

const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false, // Comenzar sin loading, verificar auth después
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setTokens: (state, action: PayloadAction<AuthTokens>) => {
      state.tokens = action.payload
      localStorage.setItem('auth_tokens', JSON.stringify(action.payload))
    },
    logout: (state) => {
      state.user = null
      state.tokens = null
      state.isAuthenticated = false
      state.error = null
      localStorage.removeItem('auth_tokens')
      localStorage.removeItem('last_login_time')
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.tokens = action.payload.tokens
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.isLoading = false
        state.user = null
        state.tokens = null
        state.isAuthenticated = false
        state.error = action.payload as string
      })

      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.tokens = action.payload.tokens
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.tokens = action.payload.tokens
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.tokens = null
        state.isAuthenticated = false
        state.error = null
      })
  },
})

export const { clearError, setTokens, logout, updateUser } = authSlice.actions
export default authSlice.reducer