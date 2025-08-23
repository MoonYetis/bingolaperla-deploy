import { Request, Response } from 'express';
export declare class AuthController {
    static register(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static login(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static refreshToken(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static logout(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getProfile(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static updateProfile(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static changePassword(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static logoutAllDevices(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
export default AuthController;
//# sourceMappingURL=authController.d.ts.map