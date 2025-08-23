import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import LoadingSpinner from './LoadingSpinner'
import { useEffect, useState } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user, isAdmin } = useAuth()
  const location = useLocation()
  const [gracePeriodActive, setGracePeriodActive] = useState(false)

  // Implementar grace period después de login exitoso
  useEffect(() => {
    // Verificar si hay tokens en localStorage (indica login reciente)
    const tokens = localStorage.getItem('auth_tokens')
    const lastLogin = localStorage.getItem('last_login_time')
    const currentTime = Date.now()
    
    if (tokens && lastLogin) {
      const timeSinceLogin = currentTime - parseInt(lastLogin)
      const gracePeriodMs = 5 * 60 * 1000 // 5 minutos de grace period
      
      if (timeSinceLogin < gracePeriodMs) {
        console.log('🔓 Grace period activo - permitiendo acceso')
        setGracePeriodActive(true)
        
        // Desactivar grace period después del tiempo límite
        setTimeout(() => {
          setGracePeriodActive(false)
        }, gracePeriodMs - timeSinceLogin)
      }
    }
  }, [])

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Permitir acceso si está autenticado O si grace period está activo
  const hasAccess = isAuthenticated || gracePeriodActive
  
  if (!hasAccess) {
    console.log('🔒 Acceso denegado - redirigiendo a login')
    console.log(`   isAuthenticated: ${isAuthenticated}`)
    console.log(`   gracePeriodActive: ${gracePeriodActive}`)
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Verificar permisos de admin si es requerido
  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="card max-w-md">
          <div className="card-content text-center p-8">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Acceso Denegado
            </h2>
            <p className="text-gray-600">
              No tienes permisos de administrador para acceder a esta página.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default ProtectedRoute