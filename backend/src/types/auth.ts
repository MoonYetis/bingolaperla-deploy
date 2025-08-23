import { Request } from 'express';
import { TokenPayload } from '@/services/authService';

// Extender la interfaz Express Request para incluir el usuario autenticado
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

// Interfaz para requests que requieren autenticación
export interface AuthRequest extends Request {
  user: TokenPayload;
}

// Re-exportar TokenPayload para facilidad de importación
export { TokenPayload } from '@/services/authService';