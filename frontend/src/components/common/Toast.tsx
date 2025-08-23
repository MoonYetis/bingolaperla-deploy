import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle, Zap } from 'lucide-react';

export interface ToastProps {
  id: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'bingo';
  title?: string;
  message: string;
  duration?: number; // milliseconds, 0 = no auto dismiss
  onClose?: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
  showProgress?: boolean;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type = 'info',
  title,
  message,
  duration = 4000,
  onClose,
  position = 'top-right',
  showProgress = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [progress, setProgress] = useState(100);

  // Icons for different toast types
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
    bingo: Zap,
  };

  // Color schemes for different types
  const colorSchemes = {
    success: {
      bg: 'bg-green-500',
      text: 'text-white',
      icon: 'text-white',
      progress: 'bg-green-300',
    },
    error: {
      bg: 'bg-red-500',
      text: 'text-white',
      icon: 'text-white',
      progress: 'bg-red-300',
    },
    warning: {
      bg: 'bg-yellow-500',
      text: 'text-white',
      icon: 'text-white',
      progress: 'bg-yellow-300',
    },
    info: {
      bg: 'bg-blue-500',
      text: 'text-white',
      icon: 'text-white',
      progress: 'bg-blue-300',
    },
    bingo: {
      bg: 'bg-gradient-to-r from-yellow-400 to-orange-500',
      text: 'text-white',
      icon: 'text-white',
      progress: 'bg-yellow-300',
    },
  };

  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
  };

  // Animation classes
  const getAnimationClasses = () => {
    const base = 'transition-all duration-300 ease-in-out transform';
    
    if (isLeaving) {
      switch (position) {
        case 'top-right':
        case 'bottom-right':
          return `${base} translate-x-full opacity-0 scale-95`;
        case 'top-left':
        case 'bottom-left':
          return `${base} -translate-x-full opacity-0 scale-95`;
        case 'top-center':
          return `${base} -translate-y-full opacity-0 scale-95`;
        default:
          return `${base} translate-x-full opacity-0 scale-95`;
      }
    }
    
    if (isVisible) {
      return `${base} translate-x-0 translate-y-0 opacity-100 scale-100`;
    }
    
    // Initial state
    switch (position) {
      case 'top-right':
      case 'bottom-right':
        return `${base} translate-x-full opacity-0 scale-95`;
      case 'top-left':
      case 'bottom-left':
        return `${base} -translate-x-full opacity-0 scale-95`;
      case 'top-center':
        return `${base} -translate-y-full opacity-0 scale-95`;
      default:
        return `${base} translate-x-full opacity-0 scale-95`;
    }
  };

  const Icon = icons[type];
  const colors = colorSchemes[type];

  // Handle auto dismiss and progress bar
  useEffect(() => {
    // Show toast
    setTimeout(() => setIsVisible(true), 10);

    if (duration > 0) {
      // Progress bar animation
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (duration / 100));
          return newProgress <= 0 ? 0 : newProgress;
        });
      }, 100);

      // Auto dismiss
      const dismissTimer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => {
        clearInterval(progressInterval);
        clearTimeout(dismissTimer);
      };
    }
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose?.(id);
    }, 300);
  };

  return (
    <div
      className={clsx(
        'fixed z-50 max-w-sm w-full pointer-events-auto',
        positionClasses[position],
        getAnimationClasses()
      )}
    >
      <div
        className={clsx(
          'rounded-lg shadow-lg overflow-hidden',
          colors.bg,
          type === 'bingo' && 'animate-pulse'
        )}
      >
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Icon className={clsx('h-5 w-5', colors.icon)} />
            </div>
            
            <div className="ml-3 w-0 flex-1">
              {title && (
                <p className={clsx('text-sm font-medium', colors.text)}>
                  {title}
                </p>
              )}
              <p className={clsx('text-sm', colors.text, title && 'mt-1')}>
                {message}
              </p>
            </div>
            
            <div className="ml-4 flex-shrink-0 flex">
              <button
                onClick={handleClose}
                className={clsx(
                  'rounded-md inline-flex focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors',
                  colors.text,
                  'hover:bg-black hover:bg-opacity-10 p-1'
                )}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        {showProgress && duration > 0 && (
          <div className="h-1 bg-black bg-opacity-20">
            <div
              className={clsx('h-full transition-all duration-100 ease-linear', colors.progress)}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Toast;