import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Toast, { ToastProps } from '@/components/common/Toast';

interface ToastContextType {
  showToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => string;
  hideToast: (id: string) => void;
  hideAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
  maxToasts?: number;
}

interface ActiveToast extends ToastProps {
  id: string;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ 
  children, 
  maxToasts = 5 
}) => {
  const [toasts, setToasts] = useState<ActiveToast[]>([]);

  const generateId = () => {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const showToast = useCallback((toastProps: Omit<ToastProps, 'id' | 'onClose'>): string => {
    const id = generateId();
    
    const newToast: ActiveToast = {
      ...toastProps,
      id,
      onClose: hideToast,
    };

    setToasts(prevToasts => {
      // Remove oldest toast if we exceed maxToasts
      const updatedToasts = prevToasts.length >= maxToasts 
        ? prevToasts.slice(1) 
        : prevToasts;
      
      return [...updatedToasts, newToast];
    });

    return id;
  }, [maxToasts]);

  const hideToast = useCallback((id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  const hideAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const contextValue: ToastContextType = {
    showToast,
    hideToast,
    hideAllToasts,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed inset-0 pointer-events-none z-50">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Hook para usar el contexto de toasts
export const useToast = () => {
  const context = useContext(ToastContext);
  
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const { showToast, hideToast, hideAllToasts } = context;

  // Helper functions for different toast types
  const toast = {
    success: (message: string, options?: Partial<Omit<ToastProps, 'id' | 'type' | 'message' | 'onClose'>>) =>
      showToast({ type: 'success', message, ...options }),
    
    error: (message: string, options?: Partial<Omit<ToastProps, 'id' | 'type' | 'message' | 'onClose'>>) =>
      showToast({ type: 'error', message, ...options }),
    
    warning: (message: string, options?: Partial<Omit<ToastProps, 'id' | 'type' | 'message' | 'onClose'>>) =>
      showToast({ type: 'warning', message, ...options }),
    
    info: (message: string, options?: Partial<Omit<ToastProps, 'id' | 'type' | 'message' | 'onClose'>>) =>
      showToast({ type: 'info', message, ...options }),
    
    bingo: (message: string, options?: Partial<Omit<ToastProps, 'id' | 'type' | 'message' | 'onClose'>>) =>
      showToast({ 
        type: 'bingo', 
        message, 
        duration: 6000, // BINGO toasts last longer
        title: '🎉 ¡BINGO!',
        ...options 
      }),
    
    ballDrawn: (ball: number, options?: Partial<Omit<ToastProps, 'id' | 'type' | 'message' | 'onClose'>>) =>
      showToast({ 
        type: 'info', 
        message: `Bola sorteada: ${ball}`, 
        duration: 2000, // Ball toasts are quick
        title: '🎱 Nueva Bola',
        position: 'top-center',
        ...options 
      }),
    
    playerJoined: (playerCount: number, options?: Partial<Omit<ToastProps, 'id' | 'type' | 'message' | 'onClose'>>) =>
      showToast({ 
        type: 'success', 
        message: `${playerCount} jugadores conectados`, 
        duration: 3000,
        title: '👥 Jugador conectado',
        ...options 
      }),
    
    connectionLost: (options?: Partial<Omit<ToastProps, 'id' | 'type' | 'message' | 'onClose'>>) =>
      showToast({ 
        type: 'warning', 
        message: 'Intentando reconectar...', 
        duration: 0, // Don't auto dismiss connection issues
        title: '⚠️ Conexión perdida',
        ...options 
      }),
    
    connectionRestored: (options?: Partial<Omit<ToastProps, 'id' | 'type' | 'message' | 'onClose'>>) =>
      showToast({ 
        type: 'success', 
        message: 'Conexión restablecida', 
        duration: 3000,
        title: '✅ Conectado',
        ...options 
      }),

    // Generic method for custom toasts
    custom: (props: Omit<ToastProps, 'id' | 'onClose'>) => showToast(props),
  };

  return {
    toast,
    hideToast,
    hideAllToasts,
  };
};

export default ToastProvider;