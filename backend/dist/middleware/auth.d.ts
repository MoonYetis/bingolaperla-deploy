import { Request, Response, NextFunction } from 'express';
import '@/types/auth';
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare const optionalAuthenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare const requireOwnershipOrAdmin: (userIdParam?: string) => (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare const verifyUserExists: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare const fullAuthentication: ((req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>)[];
export declare const adminAuthentication: ((req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>)[];
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare const getCurrentUser: (req: Request) => Promise<any>;
export declare const authMiddleware: (options?: any) => (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=auth.d.ts.map