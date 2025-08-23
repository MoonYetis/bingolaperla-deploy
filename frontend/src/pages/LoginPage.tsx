import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/common/Button'
import VideoBackground from '@/components/common/VideoBackground'
import { useToast } from '@/contexts/ToastContext'

const LoginPage = () => {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  // TEMPORALMENTE DESHABILITADO para debugging - problema de redirección
  // Si ya está autenticado, redirigir al MainMenu
  // useEffect(() => {
  //   if (isAuthenticated) {
  //     navigate('/menu')
  //   }
  // }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await login({ identifier: phone, password })
      navigate('/menu')
    } catch (error) {
      toast.error('Teléfono o contraseña incorrectos')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4">
      {/* Optimized Video Background with Audio Control */}
      <VideoBackground 
        src="/videos/bingo-background.mp4"
        poster="/images/bingo-poster.jpg"
        overlay={true}
        fallbackGradient={true}
        showAudioControl={true}
      />

      {/* Floating Content Card */}
      <div className="relative z-10 w-full max-w-sm">
        {/* Glassmorphism Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8 space-y-8">
          {/* Logo */}
          <div className="text-center">
            <div className="text-8xl mb-4 animate-bounce">🎱</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              BINGO LA PERLA
            </h1>
            <p className="text-sm text-gray-600">Bingo en vivo • Premios reales</p>
          </div>

          {/* Formulario Simplificado */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="text"
                placeholder="📱 Teléfono o Email"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-4 text-lg bg-white/80 backdrop-blur border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-300 shadow-sm"
                required
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="🔒 Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-4 text-lg bg-white/80 backdrop-blur border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-300 shadow-sm"
                required
              />
            </div>

            <Button
              type="submit"
              loading={isLoading}
              className="w-full py-4 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              size="lg"
            >
              ENTRAR
            </Button>
          </form>

          {/* Link de Registro */}
          <div className="text-center">
            <p className="text-gray-700">
              ¿No tienes cuenta?{' '}
              <Link
                to="/register"
                className="font-bold text-blue-600 hover:text-purple-600 text-lg transition-colors duration-300"
              >
                REGISTRARSE
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Floating elements for ambiance */}
      <div className="absolute top-10 left-10 text-4xl opacity-20 animate-bounce animation-delay-1000">🎲</div>
      <div className="absolute top-20 right-16 text-3xl opacity-20 animate-bounce animation-delay-3000">🎰</div>
      <div className="absolute bottom-20 left-20 text-5xl opacity-20 animate-bounce animation-delay-5000">🎯</div>
      <div className="absolute bottom-32 right-12 text-4xl opacity-20 animate-bounce animation-delay-2000">🏆</div>
    </div>
  )
}

export default LoginPage