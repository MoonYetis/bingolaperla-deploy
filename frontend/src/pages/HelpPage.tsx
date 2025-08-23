import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/common/Button'

const HelpPage = () => {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('faqs')

  const sections = [
    {
      id: 'faqs',
      title: '❓ Preguntas Frecuentes',
      icon: '❓'
    },
    {
      id: 'howto',
      title: '🎯 Cómo Jugar',
      icon: '🎮'
    },
    {
      id: 'quick',
      title: '⚡ Guía Rápida',
      icon: '⚡'
    }
  ]

  const renderContent = () => {
    switch (activeSection) {
      case 'faqs':
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">❓ Preguntas Frecuentes</h3>
            
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-bold text-gray-800 mb-2">¿Cómo compro cartones?</h4>
                <p className="text-gray-600">
                  Ve a "PLAY" en el menú principal, elige cuántos cartones quieres (1, 2 o 3) y presiona "COMPRAR CARTONES".
                </p>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-bold text-gray-800 mb-2">¿Cómo recargo mi saldo?</h4>
                <p className="text-gray-600">
                  Ve a "PERFIL" y presiona los botones de recarga (S/10, S/20, S/50). El saldo se suma automáticamente.
                </p>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-bold text-gray-800 mb-2">¿Cuándo se pagan los premios?</h4>
                <p className="text-gray-600">
                  Los premios se abonan automáticamente en tu cuenta cuando ganas. Puedes verlo en tu perfil.
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-bold text-gray-800 mb-2">¿Qué pasa si pierdo conexión?</h4>
                <p className="text-gray-600">
                  El sistema marca automáticamente tus números. Puedes reconectarte y seguir jugando.
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-bold text-gray-800 mb-2">¿Puedo jugar con varios cartones?</h4>
                <p className="text-gray-600">
                  Sí, puedes jugar con hasta 3 cartones al mismo tiempo para aumentar tus posibilidades.
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-bold text-gray-800 mb-2">¿Cómo gano?</h4>
                <p className="text-gray-600">
                  Completa líneas (horizontal, vertical, diagonal) o llena todo el cartón según el tipo de juego.
                </p>
              </div>
            </div>
          </div>
        )

      case 'howto':
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">🎯 Cómo Jugar</h3>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-3">1️⃣</span>
                  <h4 className="font-bold text-blue-800">Compra cartones</h4>
                </div>
                <p className="text-blue-700 ml-12">
                  Ve a "PLAY" y elige 1, 2 o 3 cartones
                </p>
              </div>
              
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-3">2️⃣</span>
                  <h4 className="font-bold text-green-800">Espera el juego</h4>
                </div>
                <p className="text-green-700 ml-12">
                  Automáticamente entrarás a la sala de juego
                </p>
              </div>
              
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-3">3️⃣</span>
                  <h4 className="font-bold text-yellow-800">Marca números</h4>
                </div>
                <p className="text-yellow-700 ml-12">
                  Toca los números que se van cantando
                </p>
              </div>
              
              <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded-r-lg">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-3">4️⃣</span>
                  <h4 className="font-bold text-purple-800">¡Gana!</h4>
                </div>
                <p className="text-purple-700 ml-12">
                  Completa líneas o llena el cartón para ganar
                </p>
              </div>
            </div>
          </div>
        )

      case 'quick':
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">⚡ Guía Rápida</h3>
            
            <div className="grid gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">💰</div>
                <h4 className="font-bold text-green-800 mb-1">Recargar</h4>
                <p className="text-green-600 text-sm">PERFIL → Botones S/10, S/20, S/50</p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">🎯</div>
                <h4 className="font-bold text-blue-800 mb-1">Jugar</h4>
                <p className="text-blue-600 text-sm">PLAY → Elegir cartones → Comprar</p>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">🏆</div>
                <h4 className="font-bold text-purple-800 mb-1">Ganar</h4>
                <p className="text-purple-600 text-sm">Completa líneas o llena el cartón</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <h4 className="font-bold text-yellow-800 mb-3 text-center">📱 Accesos Rápidos</h4>
              <div className="space-y-2 text-yellow-700">
                <p>• <strong>Ver saldo:</strong> PERFIL</p>
                <p>• <strong>Comprar cartones:</strong> PLAY</p>
                <p>• <strong>Estadísticas:</strong> PERFIL</p>
                <p>• <strong>Ayuda:</strong> Aquí mismo 😊</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <h4 className="font-bold text-red-800 mb-2">⚠️ Importante</h4>
              <p className="text-red-600 text-sm">
                Los números se marcan automáticamente. Los premios se abonan al instante.
              </p>
            </div>
          </div>
        )


      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 px-4 py-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/menu')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <span className="text-xl">←</span>
            <span>Volver al menú</span>
          </button>
        </div>

        {/* Título principal */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ❓ Ayuda y FAQs
          </h1>
          <p className="text-gray-600">
            Respuestas rápidas y sencillas para jugar
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Navegación lateral */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-4 shadow-lg sticky top-6">
              <h3 className="font-bold text-gray-900 mb-4">Secciones</h3>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`
                      w-full text-left px-4 py-3 rounded-xl transition-all duration-200
                      flex items-center space-x-3
                      ${activeSection === section.id
                        ? 'bg-primary-500 text-white shadow-lg'
                        : 'hover:bg-gray-50 text-gray-700'
                      }
                    `}
                  >
                    <span className="text-lg">{section.icon}</span>
                    <span className="font-medium">{section.title}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              {renderContent()}
            </div>
          </div>
        </div>

        {/* Call to action */}
        <div className="mt-8 text-center">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              ¿Listo para jugar?
            </h3>
            <p className="text-gray-600 mb-4">
              ¡Pon en práctica todo lo que has aprendido!
            </p>
            <Button
              onClick={() => navigate('/dashboard')}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 text-lg font-bold"
            >
              🎯 ¡Ir a Jugar!
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HelpPage