import { Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAppDispatch } from '@/hooks/redux'
import { checkAuth } from '@/store/authSlice'
import Layout from '@/components/common/Layout'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import { ToastProvider } from '@/contexts/ToastContext'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import MainMenuPage from '@/pages/MainMenuPage'
import DashboardPage from '@/pages/DashboardPage'
import ProfilePage from '@/pages/ProfilePage'
import HelpPage from '@/pages/HelpPage'
import SimpleGamePage from '@/pages/SimpleGamePage'
import AdminPage from '@/pages/AdminPage'
import PaymentAdminPage from '@/pages/PaymentAdminPage'
import WalletPage from '@/pages/WalletPage'
import NotFoundPage from '@/pages/NotFoundPage'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import RoutingTestComponent from '@/debug/routing-test'
import UserFlowTest from '@/tests/user-flow-test'

function App() {
  const dispatch = useAppDispatch()
  const { isLoading, isAuthenticated } = useSelector((state: RootState) => state.auth)
  const [authInitialized, setAuthInitialized] = useState(false)
  const [forceShow, setForceShow] = useState(false)

  useEffect(() => {
    // Timeout de seguridad: si auth toma más de 3 segundos, mostrar app
    const timeout = setTimeout(() => {
      console.warn('⚠️ Auth timeout - mostrando app sin autenticación')
      setForceShow(true)
    }, 3000)

    dispatch(checkAuth()).finally(() => {
      setAuthInitialized(true)
      clearTimeout(timeout)
    })

    return () => clearTimeout(timeout)
  }, [dispatch])

  // Mostrar loading solo si auth no está inicializada Y no hemos forzado mostrar
  if (isLoading && !authInitialized && !forceShow) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Iniciando Bingo La Perla...</p>
          <p className="mt-2 text-sm text-gray-400">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Optimized: Only log in development and avoid excessive logging
  if (process.env.NODE_ENV === 'development' && !authInitialized) {
    console.log('🎮 App: Renderizando aplicación principal', { authInitialized, isAuthenticated })
  }

  return (
    <ErrorBoundary>
      <ToastProvider maxToasts={5}>
        <RoutingTestComponent />
        <UserFlowTest />
        <Layout>
          {/* Debug info en desarrollo */}
          {process.env.NODE_ENV === 'development' && (
            <div className="fixed bottom-4 right-4 z-50 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
              Auth: {authInitialized ? '✅' : '⏳'} | Force: {forceShow ? '🔴' : '🟢'}
            </div>
          )}
          
          <Routes>
            {/* Ruta principal - Login o Menu Principal si está autenticado */}
            <Route path="/" element={isAuthenticated ? <MainMenuPage /> : <LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Menu Principal */}
            <Route
              path="/menu"
              element={
                <ProtectedRoute>
                  <MainMenuPage />
                </ProtectedRoute>
              }
            />
            
            {/* Dashboard (Play) - TEMPORALMENTE SIN PROTECCIÓN para debugging */}
            <Route
              path="/dashboard"
              element={<DashboardPage />}
            />

            {/* Perfil del usuario */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Página de ayuda */}
            <Route
              path="/help"
              element={
                <ProtectedRoute>
                  <HelpPage />
                </ProtectedRoute>
              }
            />
            
            {/* Página de juego */}
            <Route
              path="/game/:gameId"
              element={
                <ProtectedRoute>
                  <SimpleGamePage />
                </ProtectedRoute>
              }
            />
            
            {/* Página de juego simple (compatibilidad) */}
            <Route
              path="/game-simple/:gameId"
              element={
                <ProtectedRoute>
                  <SimpleGamePage />
                </ProtectedRoute>
              }
            />

            {/* Página de administrador */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              }
            />

            {/* Panel admin de pagos */}
            <Route
              path="/admin/payments"
              element={
                <ProtectedRoute>
                  <PaymentAdminPage />
                </ProtectedRoute>
              }
            />

            {/* Billetera de usuario */}
            <Route
              path="/wallet"
              element={
                <ProtectedRoute>
                  <WalletPage />
                </ProtectedRoute>
              }
            />
            
            {/* Catch all route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App