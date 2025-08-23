import { User } from '@prisma/client';
import { RegisterInput, UpdateProfileInput, ChangePasswordInput, UserResponse } from '@/schemas/authSchemas';
export declare class UserService {
    static createUser(userData: Omit<RegisterInput, 'confirmPassword'>): Promise<UserResponse>;
    static findUserByIdentifier(identifier: string): Promise<User | null>;
    static findUserById(id: string): Promise<UserResponse | null>;
    static verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
    static updateUserProfile(userId: string, updateData: UpdateProfileInput): Promise<UserResponse>;
    static changePassword(userId: string, passwordData: ChangePasswordInput): Promise<void>;
    static updateUserRole(userId: string, newRole: string): Promise<UserResponse>;
    static getAllUsers(page?: number, limit?: number): Promise<{
        users: UserResponse[];
        total: number;
        pages: number;
        currentPage: number;
    }>;
    static deleteUser(userId: string): Promise<void>;
    private static sanitizeUser;
    static isAdmin(userId: string): Promise<boolean>;
}
export default UserService;
//# sourceMappingURL=userService.d.ts.map