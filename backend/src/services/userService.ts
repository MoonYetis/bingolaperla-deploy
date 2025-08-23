import { prisma } from '@/config/database';
import { Prisma, User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logger } from '@/utils/logger';
import { 
  RegisterInput, 
  UpdateProfileInput, 
  ChangePasswordInput,
  UserResponse 
} from '@/schemas/authSchemas';

export class UserService {
  // Crear un nuevo usuario
  static async createUser(userData: Omit<RegisterInput, 'confirmPassword'>): Promise<UserResponse> {
    try {
      // Verificar si el email ya existe
      const existingUserByEmail = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUserByEmail) {
        throw new Error('El email ya está registrado');
      }

      // Verificar si el username ya existe
      const existingUserByUsername = await prisma.user.findUnique({
        where: { username: userData.username },
      });

      if (existingUserByUsername) {
        throw new Error('El nombre de usuario ya está en uso');
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Crear el usuario
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          username: userData.username,
          password: hashedPassword,
          role: 'USER', // Por defecto todos son usuarios normales
        },
      });

      logger.info(`Usuario creado exitosamente: ${user.email}`);

      // Retornar sin la contraseña
      return this.sanitizeUser(user);
    } catch (error) {
      logger.error('Error al crear usuario:', error);
      throw error;
    }
  }

  // Buscar usuario por email o username
  static async findUserByIdentifier(identifier: string): Promise<User | null> {
    try {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: identifier.toLowerCase() },
            { username: identifier.toLowerCase() },
          ],
        },
      });

      return user;
    } catch (error) {
      logger.error('Error al buscar usuario:', error);
      throw error;
    }
  }

  // Buscar usuario por ID
  static async findUserById(id: string): Promise<UserResponse | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });

      return user ? this.sanitizeUser(user) : null;
    } catch (error) {
      logger.error('Error al buscar usuario por ID:', error);
      throw error;
    }
  }

  // Verificar contraseña
  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      logger.error('Error al verificar contraseña:', error);
      return false;
    }
  }

  // Actualizar perfil de usuario
  static async updateUserProfile(userId: string, updateData: UpdateProfileInput): Promise<UserResponse> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Verificar contraseña actual si se va a cambiar la contraseña
      if (updateData.newPassword) {
        if (!updateData.currentPassword) {
          throw new Error('La contraseña actual es requerida');
        }

        const isCurrentPasswordValid = await this.verifyPassword(
          updateData.currentPassword,
          user.password
        );

        if (!isCurrentPasswordValid) {
          throw new Error('La contraseña actual es incorrecta');
        }
      }

      // Verificar unicidad de email si se está actualizando
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: updateData.email },
        });

        if (existingUser) {
          throw new Error('El email ya está en uso');
        }
      }

      // Verificar unicidad de username si se está actualizando
      if (updateData.username && updateData.username !== user.username) {
        const existingUser = await prisma.user.findUnique({
          where: { username: updateData.username },
        });

        if (existingUser) {
          throw new Error('El nombre de usuario ya está en uso');
        }
      }

      // Preparar datos de actualización
      const updateFields: Partial<User> = {};
      
      if (updateData.email) updateFields.email = updateData.email;
      if (updateData.username) updateFields.username = updateData.username;
      if (updateData.newPassword) {
        updateFields.password = await bcrypt.hash(updateData.newPassword, 12);
      }

      // Actualizar usuario
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateFields,
      });

      logger.info(`Perfil actualizado para usuario: ${updatedUser.email}`);

      return this.sanitizeUser(updatedUser);
    } catch (error) {
      logger.error('Error al actualizar perfil:', error);
      throw error;
    }
  }

  // Cambiar contraseña
  static async changePassword(userId: string, passwordData: ChangePasswordInput): Promise<void> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Verificar contraseña actual
      const isCurrentPasswordValid = await this.verifyPassword(
        passwordData.currentPassword,
        user.password
      );

      if (!isCurrentPasswordValid) {
        throw new Error('La contraseña actual es incorrecta');
      }

      // Hash de la nueva contraseña
      const hashedNewPassword = await bcrypt.hash(passwordData.newPassword, 12);

      // Actualizar contraseña
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });

      logger.info(`Contraseña cambiada para usuario: ${user.email}`);
    } catch (error) {
      logger.error('Error al cambiar contraseña:', error);
      throw error;
    }
  }

  // Actualizar rol de usuario (solo admin)
  static async updateUserRole(userId: string, newRole: string): Promise<UserResponse> {
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role: newRole },
      });

      logger.info(`Rol actualizado para usuario ${updatedUser.email}: ${newRole}`);

      return this.sanitizeUser(updatedUser);
    } catch (error) {
      logger.error('Error al actualizar rol:', error);
      throw error;
    }
  }

  // Obtener todos los usuarios (con paginación)
  static async getAllUsers(page: number = 1, limit: number = 20): Promise<{
    users: UserResponse[];
    total: number;
    pages: number;
    currentPage: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count(),
      ]);

      const sanitizedUsers = users.map(user => this.sanitizeUser(user));

      return {
        users: sanitizedUsers,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      };
    } catch (error) {
      logger.error('Error al obtener usuarios:', error);
      throw error;
    }
  }

  // Eliminar usuario
  static async deleteUser(userId: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      await prisma.user.delete({ where: { id: userId } });

      logger.info(`Usuario eliminado: ${user.email}`);
    } catch (error) {
      logger.error('Error al eliminar usuario:', error);
      throw error;
    }
  }

  // Función helper para remover la contraseña del objeto usuario
  private static sanitizeUser(user: User): UserResponse {
    const { password, ...sanitizedUser } = user;
    return {
      ...sanitizedUser,
      role: user.role as 'USER' | 'ADMIN'
    };
  }

  // Verificar si un usuario es admin
  static async isAdmin(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      return user?.role === 'ADMIN';
    } catch (error) {
      logger.error('Error al verificar rol de admin:', error);
      return false;
    }
  }
}

export default UserService;