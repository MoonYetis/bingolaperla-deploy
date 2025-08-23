import { z } from 'zod';
export declare const registerSchema: z.ZodEffects<z.ZodObject<{
    email: z.ZodString;
    username: z.ZodString;
    password: z.ZodString;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    username?: string;
    password?: string;
    email?: string;
    confirmPassword?: string;
}, {
    username?: string;
    password?: string;
    email?: string;
    confirmPassword?: string;
}>, {
    username?: string;
    password?: string;
    email?: string;
    confirmPassword?: string;
}, {
    username?: string;
    password?: string;
    email?: string;
    confirmPassword?: string;
}>;
export declare const loginSchema: z.ZodObject<{
    identifier: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    identifier?: string;
    password?: string;
}, {
    identifier?: string;
    password?: string;
}>;
export declare const updateProfileSchema: z.ZodEffects<z.ZodObject<{
    email: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
    currentPassword: z.ZodOptional<z.ZodString>;
    newPassword: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    username?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
}, {
    username?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
}>, {
    username?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
}, {
    username?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
}>;
export declare const changePasswordSchema: z.ZodEffects<z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    confirmPassword?: string;
    currentPassword?: string;
    newPassword?: string;
}, {
    confirmPassword?: string;
    currentPassword?: string;
    newPassword?: string;
}>, {
    confirmPassword?: string;
    currentPassword?: string;
    newPassword?: string;
}, {
    confirmPassword?: string;
    currentPassword?: string;
    newPassword?: string;
}>;
export declare const updateUserRoleSchema: z.ZodObject<{
    userId: z.ZodString;
    role: z.ZodNativeEnum<{
        ADMIN: "ADMIN";
        USER: "USER";
    }>;
}, "strip", z.ZodTypeAny, {
    role?: "ADMIN" | "USER";
    userId?: string;
}, {
    role?: "ADMIN" | "USER";
    userId?: string;
}>;
export declare const userIdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id?: string;
}, {
    id?: string;
}>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export declare const userResponseSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    username: z.ZodString;
    role: z.ZodNativeEnum<{
        ADMIN: "ADMIN";
        USER: "USER";
    }>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    role?: "ADMIN" | "USER";
    username?: string;
    email?: string;
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
}, {
    role?: "ADMIN" | "USER";
    username?: string;
    email?: string;
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
}>;
export type UserResponse = z.infer<typeof userResponseSchema>;
//# sourceMappingURL=authSchemas.d.ts.map