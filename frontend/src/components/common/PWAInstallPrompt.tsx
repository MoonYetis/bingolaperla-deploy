import { useState } from 'react'
import { Download, Smartphone, X } from 'lucide-react'
import { usePWA } from '@/hooks/usePWA'
import Button from './Button'
import Alert from './Alert'

const PWAInstallPrompt = () => {
  const [isVisible, setIsVisible] = useState(true)
  const [isInstalling, setIsInstalling] = useState(false)
  const { canInstall, installApp, isInstalled } = usePWA()

  // No mostrar si no se puede instalar, ya está instalado, o el usuario cerró el prompt
  if (!canInstall || isInstalled || !isVisible) {
    return null
  }

  const handleInstall = async () => {
    setIsInstalling(true)
    try {
      const success = await installApp()
      if (success) {
        setIsVisible(false)
      }
    } catch (error) {
      console.error('Error al instalar:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    // Guardar en localStorage que el usuario rechazó la instalación
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm">
      <div className="bg-white rounded-lg shadow-lg border p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="bg-primary-100 rounded-full p-2">
              <Smartphone className="h-5 w-5 text-primary-600" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              ¡Instala la App!
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Instala Bingo La Perla en tu dispositivo para una experiencia más rápida y acceso offline.
            </p>
            
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                onClick={handleInstall}
                loading={isInstalling}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-1" />
                Instalar
              </Button>
              
              <button
                onClick={handleDismiss}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PWAInstallPrompt