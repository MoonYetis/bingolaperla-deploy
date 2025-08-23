import { clsx } from 'clsx'
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'

interface AlertProps {
  type?: 'error' | 'success' | 'warning' | 'info'
  title?: string
  message: string
  onClose?: () => void
  className?: string
}

const Alert = ({ 
  type = 'info', 
  title, 
  message, 
  onClose, 
  className 
}: AlertProps) => {
  const icons = {
    error: AlertCircle,
    success: CheckCircle,
    warning: AlertTriangle,
    info: Info,
  }

  const colors = {
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }

  const iconColors = {
    error: 'text-red-500',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500',
  }

  const Icon = icons[type]

  return (
    <div
      className={clsx(
        'flex items-start space-x-3 rounded-lg border p-4',
        colors[type],
        className
      )}
    >
      <Icon className={clsx('h-5 w-5 flex-shrink-0 mt-0.5', iconColors[type])} />
      
      <div className="flex-1 min-w-0">
        {title && (
          <h3 className="text-sm font-medium mb-1">
            {title}
          </h3>
        )}
        <p className="text-sm">
          {message}
        </p>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-2 inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition ease-in-out duration-150"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

export default Alert