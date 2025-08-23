import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
  showCloseButton?: boolean
  closeOnClickOutside?: boolean
}

const Modal = ({ 
  isOpen, 
  onClose, 
  children, 
  className = '', 
  showCloseButton = true,
  closeOnClickOutside = true 
}: ModalProps) => {
  useEffect(() => {
    if (isOpen) {
      // Bloquear scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden'
      
      // Listener para cerrar con Escape
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }
      
      document.addEventListener('keydown', handleEscape)
      
      return () => {
        document.body.style.overflow = 'unset'
        document.removeEventListener('keydown', handleEscape)
      }
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnClickOutside && e.target === e.currentTarget) {
      onClose()
    }
  }

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300" />
      
      {/* Modal Content */}
      <div 
        className={`
          relative max-h-[90vh] overflow-y-auto
          transform transition-all duration-300 
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        {showCloseButton && (
          <button
            onClick={onClose}
            className="
              absolute top-4 right-4 z-10
              w-8 h-8 rounded-full 
              bg-black/20 hover:bg-black/40
              text-white hover:text-gray-200
              flex items-center justify-center
              transition-colors duration-200
              text-lg font-bold
            "
            aria-label="Cerrar modal"
          >
            ×
          </button>
        )}
        
        {children}
      </div>
    </div>,
    document.body
  )
}

export default Modal