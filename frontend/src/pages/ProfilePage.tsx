import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import { useToast } from '@/contexts/ToastContext'

const ProfilePage = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { toast } = useToast()
  
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    // Aquí iría la lógica para actualizar el perfil
    // Por ahora solo simulamos
    toast.success('Perfil actualizado correctamente')
    setEditing(false)
  }

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      email: user?.email || ''
    })
    setEditing(false)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 px-4 py-6">
      <div className="max-w-md mx-auto space-y-6">
        
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

        {/* Header con Usuario */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">👤</div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {user?.username || 'Usuario'}
                </h2>
                <p className="text-gray-600 text-sm">{user?.email}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="text-gray-400 hover:text-gray-600"
              title="Cerrar sesión"
            >
              ↗️
            </button>
          </div>
        </div>

        {/* Información del perfil */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">Mi Información</h3>
            {!editing ? (
              <Button
                onClick={() => setEditing(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2"
                size="sm"
              >
                ✏️ Editar
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button
                  onClick={handleCancel}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2"
                  size="sm"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-2"
                  size="sm"
                >
                  Guardar
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Nombre de usuario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de usuario
              </label>
              {editing ? (
                <Input
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="Ingresa tu nombre de usuario"
                />
              ) : (
                <div className="bg-gray-50 rounded-lg p-3 text-gray-700">
                  {formData.username || 'No especificado'}
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico
              </label>
              {editing ? (
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Ingresa tu correo"
                />
              ) : (
                <div className="bg-gray-50 rounded-lg p-3 text-gray-700">
                  {formData.email || 'No especificado'}
                </div>
              )}
            </div>

            {/* Fecha de registro */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Miembro desde
              </label>
              <div className="bg-gray-50 rounded-lg p-3 text-gray-700">
                {user?.createdAt ? 
                  new Date(user.createdAt).toLocaleDateString('es-ES') : 
                  'No especificado'
                }
              </div>
            </div>

            {/* Último acceso */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Último acceso
              </label>
              <div className="bg-gray-50 rounded-lg p-3 text-gray-700">
                {user?.lastLogin ? 
                  new Date(user.lastLogin).toLocaleDateString('es-ES') : 
                  'Ahora'
                }
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas de juego */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Mis Estadísticas</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center bg-blue-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-blue-600">{user?.gamesPlayed || 0}</p>
              <p className="text-sm text-gray-600">Juegos jugados</p>
            </div>
            <div className="text-center bg-green-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-green-600">{user?.gamesWon || 0}</p>
              <p className="text-sm text-gray-600">Juegos ganados</p>
            </div>
            <div className="text-center bg-yellow-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-yellow-600">
                {((user?.gamesWon || 0) / Math.max(user?.gamesPlayed || 1, 1) * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600">% de victorias</p>
            </div>
            <div className="text-center bg-purple-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-purple-600">{user?.cardsPurchased || 0}</p>
              <p className="text-sm text-gray-600">Cartones comprados</p>
            </div>
          </div>
        </div>

        {/* Configuraciones */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Configuraciones</h3>
          
          <div className="space-y-3">
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">⚙️</div>
              <p>Configuraciones del perfil</p>
              <p className="text-sm">Próximamente: notificaciones, privacidad, preferencias</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default ProfilePage