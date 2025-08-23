"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const database_1 = require("@/config/database");
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const logger_1 = require("@/utils/logger");
class UserService {
    // Crear un nuevo usuario
    static async createUser(userData) {
        try {
            // Verificar si el email ya existe
            const existingUserByEmail = await database_1.prisma.user.findUnique({
                where: { email: userData.email },
            });
            if (existingUserByEmail) {
                throw new Error('El email ya está registrado');
            }
            // Verificar si el username ya existe
            const existingUserByUsername = await database_1.prisma.user.findUnique({
                where: { username: userData.username },
            });
            if (existingUserByUsername) {
                throw new Error('El nombre de usuario ya está en uso');
            }
            // Hash de la contraseña
            const hashedPassword = await bcryptjs_1.default.hash(userData.password, 12);
            // Crear el usuario
            const user = await database_1.prisma.user.create({
                data: {
                    email: userData.email,
                    username: userData.username,
                    password: hashedPassword,
                    role: client_1.UserRole.USER, // Por defecto todos son usuarios normales
                },
            });
            logger_1.logger.info(`Usuario creado exitosamente: ${user.email}`);
            // Retornar sin la contraseña
            return this.sanitizeUser(user);
        }
        catch (error) {
            logger_1.logger.error('Error al crear usuario:', error);
            throw error;
        }
    }
    // Buscar usuario por email o username
    static async findUserByIdentifier(identifier) {
        try {
            const user = await database_1.prisma.user.findFirst({
                where: {
                    OR: [
                        { email: identifier.toLowerCase() },
                        { username: identifier.toLowerCase() },
                    ],
                },
            });
            return user;
        }
        catch (error) {
            logger_1.logger.error('Error al buscar usuario:', error);
            throw error;
        }
    }
    // Buscar usuario por ID
    static async findUserById(id) {
        try {
            const user = await database_1.prisma.user.findUnique({
                where: { id },
            });
            return user ? this.sanitizeUser(user) : null;
        }
        catch (error) {
            logger_1.logger.error('Error al buscar usuario por ID:', error);
            throw error;
        }
    }
    // Verificar contraseña
    static async verifyPassword(plainPassword, hashedPassword) {
        try {
            return await bcryptjs_1.default.compare(plainPassword, hashedPassword);
        }
        catch (error) {
            logger_1.logger.error('Error al verificar contraseña:', error);
            return false;
        }
    }
    // Actualizar perfil de usuario
    static async updateUserProfile(userId, updateData) {
        try {
            const user = await database_1.prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                throw new Error('Usuario no encontrado');
            }
            // Verificar contraseña actual si se va a cambiar la contraseña
            if (updateData.newPassword) {
                if (!updateData.currentPassword) {
                    throw new Error('La contraseña actual es requerida');
                }
                const isCurrentPasswordValid = await this.verifyPassword(updateData.currentPassword, user.password);
                if (!isCurrentPasswordValid) {
                    throw new Error('La contraseña actual es incorrecta');
                }
            }
            // Verificar unicidad de email si se está actualizando
            if (updateData.email && updateData.email !== user.email) {
                const existingUser = await database_1.prisma.user.findUnique({
                    where: { email: updateData.email },
                });
                if (existingUser) {
                    throw new Error('El email ya está en uso');
                }
            }
            // Verificar unicidad de username si se está actualizando
            if (updateData.username && updateData.username !== user.username) {
                const existingUser = await database_1.prisma.user.findUnique({
                    where: { username: updateData.username },
                });
                if (existingUser) {
                    throw new Error('El nombre de usuario ya está en uso');
                }
            }
            // Preparar datos de actualización
            const updateFields = {};
            if (updateData.email)
                updateFields.email = updateData.email;
            if (updateData.username)
                updateFields.username = updateData.username;
            if (updateData.newPassword) {
                updateFields.password = await bcryptjs_1.default.hash(updateData.newPassword, 12);
            }
            // Actualizar usuario
            const updatedUser = await database_1.prisma.user.update({
                where: { id: userId },
                data: updateFields,
            });
            logger_1.logger.info(`Perfil actualizado para usuario: ${updatedUser.email}`);
            return this.sanitizeUser(updatedUser);
        }
        catch (error) {
            logger_1.logger.error('Error al actualizar perfil:', error);
            throw error;
        }
    }
    // Cambiar contraseña
    static async changePassword(userId, passwordData) {
        try {
            const user = await database_1.prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                throw new Error('Usuario no encontrado');
            }
            // Verificar contraseña actual
            const isCurrentPasswordValid = await this.verifyPassword(passwordData.currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                throw new Error('La contraseña actual es incorrecta');
            }
            // Hash de la nueva contraseña
            const hashedNewPassword = await bcryptjs_1.default.hash(passwordData.newPassword, 12);
            // Actualizar contraseña
            await database_1.prisma.user.update({
                where: { id: userId },
                data: { password: hashedNewPassword },
            });
            logger_1.logger.info(`Contraseña cambiada para usuario: ${user.email}`);
        }
        catch (error) {
            logger_1.logger.error('Error al cambiar contraseña:', error);
            throw error;
        }
    }
    // Actualizar rol de usuario (solo admin)
    static async updateUserRole(userId, newRole) {
        try {
            const updatedUser = await database_1.prisma.user.update({
                where: { id: userId },
                data: { role: newRole },
            });
            logger_1.logger.info(`Rol actualizado para usuario ${updatedUser.email}: ${newRole}`);
            return this.sanitizeUser(updatedUser);
        }
        catch (error) {
            logger_1.logger.error('Error al actualizar rol:', error);
            throw error;
        }
    }
    // Obtener todos los usuarios (con paginación)
    static async getAllUsers(page = 1, limit = 20) {
        try {
            const skip = (page - 1) * limit;
            const [users, total] = await Promise.all([
                database_1.prisma.user.findMany({
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                }),
                database_1.prisma.user.count(),
            ]);
            const sanitizedUsers = users.map(user => this.sanitizeUser(user));
            return {
                users: sanitizedUsers,
                total,
                pages: Math.ceil(total / limit),
                currentPage: page,
            };
        }
        catch (error) {
            logger_1.logger.error('Error al obtener usuarios:', error);
            throw error;
        }
    }
    // Eliminar usuario
    static async deleteUser(userId) {
        try {
            const user = await database_1.prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                throw new Error('Usuario no encontrado');
            }
            await database_1.prisma.user.delete({ where: { id: userId } });
            logger_1.logger.info(`Usuario eliminado: ${user.email}`);
        }
        catch (error) {
            logger_1.logger.error('Error al eliminar usuario:', error);
            throw error;
        }
    }
    // Función helper para remover la contraseña del objeto usuario
    static sanitizeUser(user) {
        const { password, ...sanitizedUser } = user;
        return sanitizedUser;
    }
    // Verificar si un usuario es admin
    static async isAdmin(userId) {
        try {
            const user = await database_1.prisma.user.findUnique({ where: { id: userId } });
            return user?.role === client_1.UserRole.ADMIN;
        }
        catch (error) {
            logger_1.logger.error('Error al verificar rol de admin:', error);
            return false;
        }
    }
}
exports.UserService = UserService;
exports.default = UserService;
//# sourceMappingURL=userService.js.map