import { Request } from 'express';
import { TokenPayload } from '@/services/authService';
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}
export interface AuthRequest extends Request {
    user: TokenPayload;
}
export { TokenPayload } from '@/services/authService';
//# sourceMappingURL=auth.d.ts.map