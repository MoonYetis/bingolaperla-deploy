import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import Alert from '@/components/common/Alert'
import type { LoginCredentials } from '@/types'

const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Email o nombre de usuario requerido')
    .trim(),
  password: z
    .string()
    .min(1, 'La contraseña es requerida'),
})

type LoginFormData = z.infer<typeof loginSchema>

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading, error, clearError } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearError()
      const result = await login(data as LoginCredentials)
      
      if (login.fulfilled.match(result)) {
        navigate('/dashboard')
      } else if (login.rejected.match(result)) {
        const errorMessage = result.payload as string
        
        // Manejar errores específicos
        if (errorMessage.includes('Credenciales inválidas')) {
          setError('password', { 
            type: 'manual', 
            message: 'Email/usuario o contraseña incorrectos' 
          })
        }
      }
    } catch (err) {
      console.error('Error en login:', err)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="card">
        <div className="card-header text-center">
          <h1 className="card-title">Iniciar Sesión</h1>
          <p className="card-description">
            Ingresa a tu cuenta de Bingo La Perla
          </p>
        </div>

        <div className="card-content">
          {error && (
            <Alert
              type="error"
              message={error}
              onClose={clearError}
              className="mb-6"
            />
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              {...register('identifier')}
              id="identifier"
              label="Email o nombre de usuario"
              type="text"
              placeholder="tu@email.com o usuario123"
              error={errors.identifier?.message}
              autoComplete="username"
            />

            <div className="relative">
              <Input
                {...register('password')}
                id="password"
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                error={errors.password?.message}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={isLoading}
              size="lg"
            >
              Iniciar Sesión
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">¿No tienes una cuenta? </span>
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Regístrate aquí
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginForm