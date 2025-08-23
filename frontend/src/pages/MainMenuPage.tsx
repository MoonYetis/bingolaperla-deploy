import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import VideoBackground from '@/components/common/VideoBackground'
import Button from '@/components/common/Button'
import { formatBalance } from '@/utils/balance'

const MainMenuPage = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  // Opciones base del menú
  const baseMenuOptions = [
    {
      id: 'play',
      title: 'PLAY',
      subtitle: 'Unirse al juego',
      icon: '🎯',
      gradient: 'from-green-500 to-emerald-600',
      hoverGradient: 'hover:from-green-600 hover:to-emerald-700',
      action: () => navigate('/dashboard')
    },
    {
      id: 'wallet',
      title: 'BILLETERA',
      subtitle: 'Mis Perlas',
      icon: '💰',
      gradient: 'from-yellow-500 to-amber-600',
      hoverGradient: 'hover:from-yellow-600 hover:to-amber-700',
      action: () => navigate('/wallet')
    },
    {
      id: 'profile',
      title: 'PERFIL',
      subtitle: 'Mi información',
      icon: '👤',
      gradient: 'from-blue-500 to-blue-600',
      hoverGradient: 'hover:from-blue-600 hover:to-blue-700',
      action: () => navigate('/profile')
    },
    {
      id: 'help',
      title: 'AYUDA',
      subtitle: 'Cómo jugar',
      icon: '❓',
      gradient: 'from-purple-500 to-purple-600',
      hoverGradient: 'hover:from-purple-600 hover:to-purple-700',
      action: () => navigate('/help')
    }
  ]

  // Agregar opción de admin SOLO para administrador específico (seguridad mejorada)
  const isSpecificAdmin = user?.username === 'admin' // Solo este usuario específico
  const menuOptions = isSpecificAdmin 
    ? [
        ...baseMenuOptions,
        {
          id: 'admin',
          title: 'ADMIN',
          subtitle: 'Control manual',
          icon: '👨‍💼',
          gradient: 'from-red-500 to-orange-600',
          hoverGradient: 'hover:from-red-600 hover:to-orange-700',
          action: () => navigate('/admin')
        }
      ]
    : baseMenuOptions

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video de fondo */}
      <VideoBackground 
        src="/videos/bingo-background.mp4"
        overlay={true}
        showAudioControl={true}
        className="z-0"
      />
      
      {/* Contenido principal */}
      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        
        {/* Header con información del usuario */}
        <div className="text-center mb-8 bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">👋</div>
              <div className="text-left">
                <h2 className="text-xl font-bold text-white">
                  {user?.username || 'Usuario'}
                </h2>
                <p className="text-white/70 text-sm">¡Bienvenido de vuelta!</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="text-white/60 hover:text-white/90 text-2xl transition-colors"
              title="Cerrar sesión"
            >
              ↗️
            </button>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-white/80 text-sm">Balance actual</p>
            <p className="text-2xl font-bold text-white">
              {formatBalance(user?.pearlsBalance || 0)} 
              <span className="text-lg text-white/70 ml-1">Perlas</span>
            </p>
            <p className="text-xs text-white/60 mt-1">
              1 Perla = 1 Sol
            </p>
          </div>
        </div>

        {/* Logo/Título */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
            🎰 BINGO LA PERLA
          </h1>
          <p className="text-white/80 text-lg drop-shadow">
            ¿Qué deseas hacer?
          </p>
        </div>

        {/* Botones del menú principal */}
        <div className="space-y-6">
          {menuOptions.map((option, index) => (
            <div
              key={option.id}
              className={`
                opacity-0 translate-y-8 
                animate-fade-in-up
                animation-delay-${(index + 1) * 200}ms
              `}
              style={{
                animationDelay: `${(index + 1) * 200}ms`,
                animationFillMode: 'forwards'
              }}
            >
              <Button
                onClick={option.action}
                className={`
                  w-full py-6 text-xl font-bold 
                  bg-gradient-to-r ${option.gradient} ${option.hoverGradient}
                  text-white rounded-2xl 
                  transform transition-all duration-300 
                  hover:scale-105 hover:shadow-2xl
                  border border-white/20 backdrop-blur-sm
                  flex items-center justify-between px-8
                  group
                `}
                size="lg"
              >
                <div className="flex items-center space-x-4">
                  <span className="text-3xl group-hover:scale-110 transition-transform duration-300">
                    {option.icon}
                  </span>
                  <div className="text-left">
                    <div className="text-xl font-bold">{option.title}</div>
                    <div className="text-sm text-white/80">{option.subtitle}</div>
                  </div>
                </div>
                <div className="text-2xl opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                  →
                </div>
              </Button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-white/60">
          <p className="text-sm">¡Que tengas suerte! 🍀</p>
        </div>
      </div>

      {/* Estilos personalizados para animaciones */}
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(2rem);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
      `}</style>
    </div>
  )
}

export default MainMenuPage