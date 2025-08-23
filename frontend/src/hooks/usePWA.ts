import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export const usePWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Detectar si la app ya está instalada
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches
      const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches
      
      setIsInstalled(isStandalone || isFullscreen || isMinimalUI)
    }

    // Manejar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevenir que Chrome 67 y anteriores muestren automáticamente el prompt
      e.preventDefault()
      
      const event = e as BeforeInstallPromptEvent
      setDeferredPrompt(event)
      setIsInstallable(true)
    }

    // Manejar cuando la app es instalada
    const handleAppInstalled = () => {
      console.log('PWA fue instalada')
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    checkIfInstalled()

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const installApp = async () => {
    if (!deferredPrompt) {
      return false
    }

    try {
      // Mostrar el prompt de instalación
      await deferredPrompt.prompt()
      
      // Esperar a que el usuario responda
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('Usuario aceptó instalar la PWA')
        setIsInstallable(false)
        setDeferredPrompt(null)
        return true
      } else {
        console.log('Usuario rechazó instalar la PWA')
        return false
      }
    } catch (error) {
      console.error('Error al instalar la PWA:', error)
      return false
    }
  }

  const canInstall = isInstallable && !isInstalled && deferredPrompt !== null

  return {
    isInstallable: canInstall,
    isInstalled,
    installApp,
    canInstall,
  }
}

export default usePWA