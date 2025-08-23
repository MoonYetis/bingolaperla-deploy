import { z } from 'zod';

// Schema para registro de usuario
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Formato de email inválido')
    .max(255, 'El email es demasiado largo')
    .toLowerCase()
    .trim(),
  
  username: z
    .string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(30, 'El nombre de usuario no puede tener más de 30 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'El nombre de usuario solo puede contener letras, números y guiones bajos')
    .toLowerCase()
    .trim(),
  
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña es demasiado larga')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una minúscula, una mayúscula y un número'),
  
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

// Schema para login
export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Email o nombre de usuario requerido')
    .trim(),
  
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .max(100, 'La contraseña es demasiado larga'),
});

// Schema para actualizar perfil
export const updateProfileSchema = z.object({
  email: z
    .string()
    .email('Formato de email inválido')
    .max(255, 'El email es demasiado largo')
    .toLowerCase()
    .trim()
    .optional(),
  
  username: z
    .string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(30, 'El nombre de usuario no puede tener más de 30 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'El nombre de usuario solo puede contener letras, números y guiones bajos')
    .toLowerCase()
    .trim()
    .optional(),
  
  currentPassword: z
    .string()
    .min(1, 'La contraseña actual es requerida')
    .optional(),
  
  newPassword: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña es demasiado larga')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una minúscula, una mayúscula y un número')
    .optional(),
}).refine((data) => {
  if (data.newPassword && !data.currentPassword) {
    return false;
  }
  return true;
}, {
  message: 'La contraseña actual es requerida para cambiar la contraseña',
  path: ['currentPassword'],
});

// Schema para cambio de contraseña
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'La contraseña actual es requerida'),
  
  newPassword: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña es demasiado larga')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una minúscula, una mayúscula y un número'),
  
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

// Schema para actualizar rol (solo admin)
export const updateUserRoleSchema = z.object({
  userId: z.string().cuid('ID de usuario inválido'),
  role: z.enum(['USER', 'ADMIN'], {
    errorMap: () => ({ message: 'Rol inválido. Debe ser USER o ADMIN' }),
  }),
});

// Schema para parámetros de ID
export const userIdParamSchema = z.object({
  id: z.string().cuid('ID de usuario inválido'),
});

// Tipos TypeScript derivados de los schemas
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;

// Schema para respuesta de usuario (sin contraseña)
export const userResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  username: z.string(),
  role: z.enum(['USER', 'ADMIN']),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserResponse = z.infer<typeof userResponseSchema>;