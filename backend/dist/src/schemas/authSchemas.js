"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userResponseSchema = exports.userIdParamSchema = exports.updateUserRoleSchema = exports.changePasswordSchema = exports.updateProfileSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
// Schema para registro de usuario
exports.registerSchema = zod_1.z.object({
    email: zod_1.z
        .string()
        .min(1, 'El email es requerido')
        .email('Formato de email inválido')
        .max(255, 'El email es demasiado largo')
        .toLowerCase()
        .trim(),
    username: zod_1.z
        .string()
        .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
        .max(30, 'El nombre de usuario no puede tener más de 30 caracteres')
        .regex(/^[a-zA-Z0-9_]+$/, 'El nombre de usuario solo puede contener letras, números y guiones bajos')
        .toLowerCase()
        .trim(),
    password: zod_1.z
        .string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .max(100, 'La contraseña es demasiado larga')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una minúscula, una mayúscula y un número'),
    confirmPassword: zod_1.z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
});
// Schema para login
exports.loginSchema = zod_1.z.object({
    identifier: zod_1.z
        .string()
        .min(1, 'Email o nombre de usuario requerido')
        .trim(),
    password: zod_1.z
        .string()
        .min(1, 'La contraseña es requerida')
        .max(100, 'La contraseña es demasiado larga'),
});
// Schema para actualizar perfil
exports.updateProfileSchema = zod_1.z.object({
    email: zod_1.z
        .string()
        .email('Formato de email inválido')
        .max(255, 'El email es demasiado largo')
        .toLowerCase()
        .trim()
        .optional(),
    username: zod_1.z
        .string()
        .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
        .max(30, 'El nombre de usuario no puede tener más de 30 caracteres')
        .regex(/^[a-zA-Z0-9_]+$/, 'El nombre de usuario solo puede contener letras, números y guiones bajos')
        .toLowerCase()
        .trim()
        .optional(),
    currentPassword: zod_1.z
        .string()
        .min(1, 'La contraseña actual es requerida')
        .optional(),
    newPassword: zod_1.z
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
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z
        .string()
        .min(1, 'La contraseña actual es requerida'),
    newPassword: zod_1.z
        .string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .max(100, 'La contraseña es demasiado larga')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una minúscula, una mayúscula y un número'),
    confirmPassword: zod_1.z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
});
// Schema para actualizar rol (solo admin)
exports.updateUserRoleSchema = zod_1.z.object({
    userId: zod_1.z.string().cuid('ID de usuario inválido'),
    role: zod_1.z.nativeEnum(client_1.UserRole, {
        errorMap: () => ({ message: 'Rol inválido' }),
    }),
});
// Schema para parámetros de ID
exports.userIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().cuid('ID de usuario inválido'),
});
// Schema para respuesta de usuario (sin contraseña)
exports.userResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    email: zod_1.z.string(),
    username: zod_1.z.string(),
    role: zod_1.z.nativeEnum(client_1.UserRole),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
//# sourceMappingURL=authSchemas.js.map