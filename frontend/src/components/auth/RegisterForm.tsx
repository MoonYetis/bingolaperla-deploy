import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Check, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import Alert from '@/components/common/Alert'
import type { RegisterData } from '@/types'

const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Formato de email inválido')
    .toLowerCase()
    .trim(),
  username: z
    .string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(30, 'El nombre de usuario no puede tener más de 30 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guiones bajos permitidos')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Debe contener al menos una minúscula, una mayúscula y un número'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

const RegisterForm = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { register: registerUser, isLoading, error, clearError } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const password = watch('password', '')

  // Validaciones de contraseña en tiempo real
  const passwordValidations = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
  }

  const onSubmit = async (data: RegisterFormData) => {
    try {
      clearError()
      const result = await registerUser(data as RegisterData)
      
      if (registerUser.fulfilled.match(result)) {
        navigate('/dashboard')
      } else if (registerUser.rejected.match(result)) {
        const errorMessage = result.payload as string
        
        // Manejar errores específicos
        if (errorMessage.includes('email ya está registrado')) {
          setError('email', { 
            type: 'manual', 
            message: 'Este email ya está registrado' 
          })
        } else if (errorMessage.includes('nombre de usuario ya está en uso')) {
          setError('username', { 
            type: 'manual', 
            message: 'Este nombre de usuario ya está en uso' 
          })
        }
      }
    } catch (err) {
      console.error('Error en registro:', err)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="card">
        <div className="card-header text-center">
          <h1 className="card-title">Crear Cuenta</h1>
          <p className="card-description">
            Únete a Bingo La Perla y comienza a jugar
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
              {...register('email')}
              id="email"
              label="Email"
              type="email"
              placeholder="tu@email.com"
              error={errors.email?.message}
              autoComplete="email"
            />

            <Input
              {...register('username')}
              id="username"
              label="Nombre de usuario"
              type="text"
              placeholder="usuario123"
              error={errors.username?.message}
              helperText="3-30 caracteres, solo letras, números y guiones bajos"
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
                autoComplete="new-password"
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

            {/* Indicadores de validación de contraseña */}
            {password && (
              <div className="space-y-2 text-sm">
                <p className="text-gray-600 font-medium">Requisitos de contraseña:</p>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    {passwordValidations.length ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                    <span className={passwordValidations.length ? 'text-green-600' : 'text-red-600'}>
                      Al menos 8 caracteres
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {passwordValidations.lowercase ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                    <span className={passwordValidations.lowercase ? 'text-green-600' : 'text-red-600'}>
                      Una letra minúscula
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {passwordValidations.uppercase ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                    <span className={passwordValidations.uppercase ? 'text-green-600' : 'text-red-600'}>
                      Una letra mayúscula
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {passwordValidations.number ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                    <span className={passwordValidations.number ? 'text-green-600' : 'text-red-600'}>
                      Un número
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="relative">
              <Input
                {...register('confirmPassword')}
                id="confirmPassword"
                label="Confirmar contraseña"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
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
              Crear Cuenta
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">¿Ya tienes una cuenta? </span>
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Inicia sesión aquí
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterForm