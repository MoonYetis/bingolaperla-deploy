import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import VideoBackground from '@/components/common/VideoBackground'
import RegisterForm from '@/components/auth/RegisterForm'

const RegisterPage = () => {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-8">
      {/* Optimized Video Background with Audio Control */}
      <VideoBackground 
        src="/videos/bingo-background.mp4"
        poster="/images/bingo-poster.jpg"
        overlay={true}
        fallbackGradient={true}
        showAudioControl={true}
      />

      {/* Floating Content - Wrapped RegisterForm */}
      <div className="relative z-10 w-full max-w-md">
        {/* Glassmorphism wrapper around RegisterForm */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-6">
          <RegisterForm />
        </div>
      </div>

      {/* Floating elements for ambiance - Different positions than login */}
      <div className="absolute top-16 left-16 text-4xl opacity-20 animate-bounce animation-delay-2000">🎰</div>
      <div className="absolute top-32 right-20 text-3xl opacity-20 animate-bounce animation-delay-4000">🎲</div>
      <div className="absolute bottom-24 left-12 text-5xl opacity-20 animate-bounce animation-delay-1000">🏆</div>
      <div className="absolute bottom-16 right-16 text-4xl opacity-20 animate-bounce animation-delay-3000">🎯</div>
    </div>
  )
}

export default RegisterPage