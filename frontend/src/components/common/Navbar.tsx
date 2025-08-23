import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, User, LogOut, Home, TestTube, BarChart3 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import Button from './Button'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isAuthenticated, user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl">🎱</span>
            <span className="text-xl font-bold text-gray-900">
              Bingo La Perla
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>Inicio</span>
            </Link>
            
            <Link
              to="/lobby"
              className="flex items-center space-x-1 text-green-600 hover:text-green-700 transition-colors"
            >
              <span className="text-lg">🎯</span>
              <span>Sala de Juego</span>
            </Link>
            
            <Link
              to="/test"
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <TestTube className="h-4 w-4" />
              <span>Demo Bingo</span>
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Dashboard
                </Link>

                {isAdmin && (
                  <>
                    <Link
                      to="/analytics"
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors font-medium"
                    >
                      <BarChart3 className="h-4 w-4" />
                      <span>Analytics</span>
                    </Link>
                    
                    <Link
                      to="/admin"
                      className="text-purple-600 hover:text-purple-700 transition-colors font-medium"
                    >
                      Admin
                    </Link>
                  </>
                )}

                {/* User Menu */}
                <div className="relative flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-gray-700">
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">{user?.username}</span>
                  </div>
                  
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-1" />
                    Salir
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">
                    Registrarse
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                to="/"
                className="flex items-center space-x-2 block px-3 py-2 text-gray-600 hover:text-gray-900"
                onClick={() => setIsMenuOpen(false)}
              >
                <Home className="h-4 w-4" />
                <span>Inicio</span>
              </Link>
              
              <Link
                to="/lobby"
                className="flex items-center space-x-2 block px-3 py-2 text-green-600 hover:text-green-700"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="text-lg">🎯</span>
                <span>Sala de Juego</span>
              </Link>
              
              <Link
                to="/test"
                className="flex items-center space-x-2 block px-3 py-2 text-blue-600 hover:text-blue-700"
                onClick={() => setIsMenuOpen(false)}
              >
                <TestTube className="h-4 w-4" />
                <span>Demo Bingo</span>
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="block px-3 py-2 text-gray-600 hover:text-gray-900"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>

                  {isAdmin && (
                    <>
                      <Link
                        to="/analytics"
                        className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:text-blue-700 font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <BarChart3 className="h-4 w-4" />
                        <span>Analytics</span>
                      </Link>
                      
                      <Link
                        to="/admin"
                        className="block px-3 py-2 text-purple-600 hover:text-purple-700 font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Admin
                      </Link>
                    </>
                  )}

                  <div className="border-t pt-2 mt-2">
                    <div className="flex items-center px-3 py-2">
                      <User className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium text-gray-700">
                        {user?.username}
                      </span>
                    </div>
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-3 py-2 text-red-600 hover:text-red-700"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar Sesión
                    </button>
                  </div>
                </>
              ) : (
                <div className="border-t pt-2 mt-2 space-y-1">
                  <Link
                    to="/login"
                    className="block px-3 py-2 text-gray-600 hover:text-gray-900"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2 bg-primary-600 text-white rounded-md mx-3"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Registrarse
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar