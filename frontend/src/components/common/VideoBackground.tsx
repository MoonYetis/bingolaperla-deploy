import { useEffect, useRef, useState } from 'react'

interface VideoBackgroundProps {
  src?: string
  poster?: string
  className?: string
  overlay?: boolean
  fallbackGradient?: boolean
  showAudioControl?: boolean
}

const VideoBackground: React.FC<VideoBackgroundProps> = ({
  src = '/videos/bingo-background.mp4',
  poster = '/images/bingo-poster.jpg',
  className = '',
  overlay = true,
  fallbackGradient = true,
  showAudioControl = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isTabActive, setIsTabActive] = useState(true)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [showControls, setShowControls] = useState(false)

  // Detectar si el usuario prefiere motion reducido (accessibility)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    
    const handler = () => setPrefersReducedMotion(mediaQuery.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // Pausar video cuando la tab no está activa (battery optimization)
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isActive = !document.hidden
      setIsTabActive(isActive)
      
      if (videoRef.current && isVideoLoaded && !hasError) {
        if (isActive && !prefersReducedMotion) {
          videoRef.current.play().catch(() => {
            // Ignore autoplay errors
          })
        } else {
          videoRef.current.pause()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isVideoLoaded, hasError, prefersReducedMotion])

  // Manejar carga del video
  const handleVideoLoad = () => {
    setIsVideoLoaded(true)
    setHasError(false)
    
    // Mostrar controles después de un pequeño delay si está habilitado
    if (showAudioControl) {
      setTimeout(() => setShowControls(true), 1000)
    }
  }

  const handleVideoError = () => {
    setHasError(true)
    setIsVideoLoaded(false)
    setShowControls(false)
  }

  // Toggle función para mute/unmute
  const toggleMute = () => {
    if (videoRef.current) {
      const newMutedState = !isMuted
      videoRef.current.muted = newMutedState
      setIsMuted(newMutedState)
      
      // Guardar preferencia en localStorage
      localStorage.setItem('bingo-video-muted', newMutedState.toString())
    }
  }

  // Cargar preferencia de audio del localStorage
  useEffect(() => {
    const savedMutedState = localStorage.getItem('bingo-video-muted')
    if (savedMutedState !== null) {
      const isSavedMuted = savedMutedState === 'true'
      setIsMuted(isSavedMuted)
      if (videoRef.current) {
        videoRef.current.muted = isSavedMuted
      }
    }
  }, [isVideoLoaded])

  // No mostrar video si usuario prefiere motion reducido
  const shouldShowVideo = !prefersReducedMotion && !hasError && src

  return (
    <div className={`absolute inset-0 w-full h-full ${className}`}>
      {shouldShowVideo ? (
        <video
          ref={videoRef}
          autoPlay
          muted={isMuted}
          loop
          playsInline
          poster={poster}
          className="absolute inset-0 w-full h-full object-cover"
          onLoadedData={handleVideoLoad}
          onError={handleVideoError}
          preload="metadata" // Carga solo metadata inicialmente para performance
        >
          <source src={src} type="video/mp4" />
        </video>
      ) : fallbackGradient ? (
        /* Animated gradient fallback */
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/20 via-transparent to-blue-500/20 animate-pulse animation-delay-2000"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-purple-500/10 to-pink-500/20 animate-pulse animation-delay-4000"></div>
        </div>
      ) : null}
      
      {/* Overlay for text readability */}
      {overlay && (
        <div className="absolute inset-0 bg-black bg-opacity-40 video-overlay"></div>
      )}

      {/* Audio Control Button */}
      {showAudioControl && showControls && shouldShowVideo && (
        <button
          onClick={toggleMute}
          className={`
            absolute top-4 right-4 z-20 
            w-12 h-12 rounded-full 
            bg-white/20 backdrop-blur-md border border-white/30
            flex items-center justify-center
            text-white text-xl
            hover:bg-white/30 hover:scale-110
            transition-all duration-300 ease-out
            shadow-lg hover:shadow-xl
            focus:outline-none focus:ring-2 focus:ring-white/50
            ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
          `}
          aria-label={isMuted ? 'Activar audio' : 'Silenciar audio'}
          title={isMuted ? 'Activar audio' : 'Silenciar audio'}
        >
          {isMuted ? (
            /* Muted Icon */
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" 
              />
            </svg>
          ) : (
            /* Unmuted Icon */
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" 
              />
            </svg>
          )}
        </button>
      )}
    </div>
  )
}

export default VideoBackground