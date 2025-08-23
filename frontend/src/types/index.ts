// Tipos de usuario
export interface User {
  id: string
  email: string
  username: string
  role: 'ADMIN' | 'USER'
  createdAt: string
  updatedAt: string
  // Estadísticas opcionales del usuario
  balance?: number
  gamesPlayed?: number
  gamesWon?: number
  cardsPurchased?: number
  lastLogin?: string
}

// Tipos de autenticación
export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: string
}

export interface LoginCredentials {
  identifier: string
  password: string
}

export interface RegisterData {
  email: string
  username: string
  password: string
  confirmPassword: string
}

export interface UpdateProfileData {
  email?: string
  username?: string
  currentPassword?: string
  newPassword?: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// Respuestas de la API
export interface AuthResponse {
  message: string
  user: User
  tokens: AuthTokens
}

export interface ApiError {
  error: string
  message?: string
  details?: Array<{
    field: string
    message: string
  }>
}

// Estados de la aplicación
export interface AuthState {
  user: User | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

// Tipos de formularios
export interface FormErrors {
  [key: string]: string[]
}

// Tipos de componentes
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

// Utilidades
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>> 
  & {
      [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
  }[Keys]

// Re-exportar tipos de bingo para facilidad de uso
export * from './bingo'