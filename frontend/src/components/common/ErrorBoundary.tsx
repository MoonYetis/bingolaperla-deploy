import React from 'react'
import Button from './Button'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; onRetry: () => void }>
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} onRetry={this.handleRetry} />
      }

      return <DefaultErrorFallback error={this.state.error} onRetry={this.handleRetry} />
    }

    return this.props.children
  }
}

const DefaultErrorFallback = ({ error, onRetry }: { error?: Error; onRetry: () => void }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="card max-w-lg">
        <div className="card-content text-center p-8">
          <div className="text-6xl mb-4">😵</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Ups! Algo salió mal
          </h2>
          <p className="text-gray-600 mb-6">
            Ha ocurrido un error inesperado. Por favor, intenta recargar la página o contacta al soporte si el problema persiste.
          </p>
          
          {error && process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Error Details:</h3>
              <pre className="text-xs text-gray-600 overflow-auto">
                {error.message}
              </pre>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={onRetry}>
              Intentar de Nuevo
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Recargar Página
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ErrorBoundary