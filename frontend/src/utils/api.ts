import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

// Crear instancia de axios con configuración base
export const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para requests - añadir token automáticamente
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const tokens = localStorage.getItem('auth_tokens')
    
    if (tokens) {
      try {
        const parsedTokens = JSON.parse(tokens)
        config.headers.Authorization = `Bearer ${parsedTokens.accessToken}`
        console.log('🔐 Token añadido automáticamente a request')
      } catch (error) {
        console.error('❌ Error parsing tokens:', error)
        localStorage.removeItem('auth_tokens')
        localStorage.removeItem('last_login_time')
      }
    }
    
    return config
  },
  (error) => {
    console.error('❌ Error en request interceptor:', error)
    return Promise.reject(error)
  }
)

// Interceptor para responses - manejar errores 401 automáticamente
api.interceptors.response.use(
  (response) => {
    // Response exitosa - no hacer nada
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('🔒 Token expirado (401) - intentando recovery')
      
      // Marcar request como reintentado
      originalRequest._retry = true
      
      // Verificar si tenemos grace period activo
      const lastLogin = localStorage.getItem('last_login_time')
      if (lastLogin) {
        const timeSinceLogin = Date.now() - parseInt(lastLogin)
        const gracePeriodMs = 5 * 60 * 1000 // 5 minutos
        
        if (timeSinceLogin < gracePeriodMs) {
          console.log('🔓 Grace period activo - reintentando request')
          // Reintentar el request original
          return api(originalRequest)
        }
      }
      
      // Si no hay grace period, limpiar storage y redirigir
      console.log('⏰ Grace period expirado - limpiando sesión')
      localStorage.removeItem('auth_tokens')
      localStorage.removeItem('last_login_time')
      
      // Redirigir a login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error)
  }
)

// Función helper para hacer requests con manejo automático de errores
export const apiRequest = async <T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  data?: any,
  config?: any
): Promise<T> => {
  try {
    const response = await api({
      method,
      url,
      data,
      ...config,
    })
    return response.data
  } catch (error) {
    console.error(`❌ API Error [${method} ${url}]:`, error)
    throw error
  }
}

// Funciones específicas para cada método HTTP
export const apiGet = <T>(url: string, config?: any): Promise<T> => 
  apiRequest<T>('GET', url, undefined, config)

export const apiPost = <T>(url: string, data?: any, config?: any): Promise<T> => 
  apiRequest<T>('POST', url, data, config)

export const apiPut = <T>(url: string, data?: any, config?: any): Promise<T> => 
  apiRequest<T>('PUT', url, data, config)

export const apiDelete = <T>(url: string, config?: any): Promise<T> => 
  apiRequest<T>('DELETE', url, undefined, config)

export default api