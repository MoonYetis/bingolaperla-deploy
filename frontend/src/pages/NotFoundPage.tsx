import { Link } from 'react-router-dom'
import Button from '@/components/common/Button'

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="card max-w-lg">
        <div className="card-content text-center p-8">
          <div className="text-8xl mb-4">🎯</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Página no encontrada
          </h2>
          <p className="text-gray-600 mb-8">
            ¡Ups! La página que buscas no existe o ha sido movida. 
            Pero no te preocupes, siempre puedes volver al bingo.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/menu">
              <Button size="lg">
                Volver al Inicio
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" size="lg">
                Ir al Dashboard
              </Button>
            </Link>
          </div>
          
          <div className="mt-8 text-sm text-gray-500">
            <p>¿Perdido? Contacta a nuestro soporte si necesitas ayuda.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage