import React, { useState, useEffect } from 'react'
import { cn } from '@/utils/cn'
import Button from '@/components/common/Button'

interface WalletNotification {
  id: string
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR'
  title: string
  message: string
  timestamp: string
  read: boolean
}

interface WalletNotificationsProps {
  notifications: WalletNotification[]
  onMarkAsRead: (notificationId: string) => void
  onClearAll: () => void
  className?: string
}

const notificationStyles = {
  SUCCESS: {
    bg: 'bg-green-50 border-green-200',
    icon: '✅',
    titleColor: 'text-green-800',
    messageColor: 'text-green-600'
  },
  INFO: {
    bg: 'bg-blue-50 border-blue-200',
    icon: 'ℹ️',
    titleColor: 'text-blue-800',
    messageColor: 'text-blue-600'
  },
  WARNING: {
    bg: 'bg-yellow-50 border-yellow-200',
    icon: '⚠️',
    titleColor: 'text-yellow-800',
    messageColor: 'text-yellow-600'
  },
  ERROR: {
    bg: 'bg-red-50 border-red-200',
    icon: '❌',
    titleColor: 'text-red-800',
    messageColor: 'text-red-600'
  }
}

export const WalletNotifications: React.FC<WalletNotificationsProps> = ({
  notifications,
  onMarkAsRead,
  onClearAll,
  className
}) => {
  const [visibleNotifications, setVisibleNotifications] = useState<string[]>([])
  const unreadCount = notifications.filter(n => !n.read).length

  // Mostrar notificaciones nuevas con animación
  useEffect(() => {
    const newNotifications = notifications
      .filter(n => !visibleNotifications.includes(n.id))
      .map(n => n.id)
    
    if (newNotifications.length > 0) {
      setVisibleNotifications(prev => [...prev, ...newNotifications])
    }
  }, [notifications, visibleNotifications])

  // Auto-ocultar notificaciones después de un tiempo
  const removeNotification = (notificationId: string) => {
    setVisibleNotifications(prev => prev.filter(id => id !== notificationId))
  }

  if (notifications.length === 0) {
    return null
  }

  return (
    <div className={cn('fixed top-20 right-4 z-50 space-y-2 max-w-sm', className)}>
      {/* Header con contador */}
      {unreadCount > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 mb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                💎 Notificaciones de Perlas
              </span>
              <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            </div>
            
            <Button
              onClick={onClearAll}
              variant="ghost"
              size="sm"
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Limpiar
            </Button>
          </div>
        </div>
      )}

      {/* Lista de notificaciones */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {notifications
          .filter(notification => visibleNotifications.includes(notification.id))
          .slice(0, 5) // Mostrar máximo 5
          .map(notification => {
            const styles = notificationStyles[notification.type]
            
            return (
              <div
                key={notification.id}
                className={cn(
                  'border rounded-lg shadow-lg transition-all duration-300 transform',
                  'hover:scale-105 cursor-pointer',
                  styles.bg,
                  notification.read ? 'opacity-70' : 'opacity-100',
                  'animate-slide-in-right'
                )}
                onClick={() => onMarkAsRead(notification.id)}
              >
                <div className="p-3">
                  <div className="flex items-start gap-3">
                    {/* Icono */}
                    <div className="text-lg flex-shrink-0">
                      {styles.icon}
                    </div>
                    
                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={cn('text-sm font-semibold truncate', styles.titleColor)}>
                          {notification.title}
                        </h4>
                        
                        {/* Botón cerrar */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeNotification(notification.id)
                          }}
                          className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2"
                        >
                          ×
                        </button>
                      </div>
                      
                      <p className={cn('text-xs mb-2 line-clamp-2', styles.messageColor)}>
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {new Date(notification.timestamp).toLocaleTimeString('es-PE', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
      </div>

      {/* Indicador de más notificaciones */}
      {notifications.length > 5 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 text-center">
          <span className="text-xs text-gray-500">
            +{notifications.length - 5} notificaciones más
          </span>
        </div>
      )}
    </div>
  )
}

export default WalletNotifications