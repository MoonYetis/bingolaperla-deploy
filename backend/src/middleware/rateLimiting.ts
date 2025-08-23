import rateLimit from 'express-rate-limit';
import { env, isDevelopment } from '@/config/environment';
import { HTTP_STATUS, ERROR_MESSAGES } from '@/utils/constants';

export const createRateLimit = (windowMs?: number, max?: number) => {
  return rateLimit({
    windowMs: windowMs || env.RATE_LIMIT_WINDOW_MS,
    max: max || env.RATE_LIMIT_MAX_REQUESTS,
    message: {
      error: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
      status: HTTP_STATUS.TOO_MANY_REQUESTS
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Rate limiting específico para autenticación
// En desarrollo: más permisivo para testing
// En producción: restrictivo para seguridad
export const authRateLimit = createRateLimit(
  isDevelopment ? 5 * 60 * 1000 : 15 * 60 * 1000, // 5 min en dev, 15 min en prod
  isDevelopment ? 20 : 5 // 20 intentos en dev, 5 en prod
);

// Rate limiting general para API
export const apiRateLimit = createRateLimit();

// Rate limiting para registro
// En desarrollo: más permisivo para testing
export const registerRateLimit = createRateLimit(
  isDevelopment ? 10 * 60 * 1000 : 60 * 60 * 1000, // 10 min en dev, 1 hora en prod
  isDevelopment ? 10 : 3 // 10 registros en dev, 3 en prod
);