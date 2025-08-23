"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRateLimit = exports.apiRateLimit = exports.authRateLimit = exports.createRateLimit = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const environment_1 = require("@/config/environment");
const constants_1 = require("@/utils/constants");
const createRateLimit = (windowMs, max) => {
    return (0, express_rate_limit_1.default)({
        windowMs: windowMs || environment_1.env.RATE_LIMIT_WINDOW_MS,
        max: max || environment_1.env.RATE_LIMIT_MAX_REQUESTS,
        message: {
            error: constants_1.ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
            status: constants_1.HTTP_STATUS.TOO_MANY_REQUESTS
        },
        standardHeaders: true,
        legacyHeaders: false,
    });
};
exports.createRateLimit = createRateLimit;
// Rate limiting específico para autenticación
// En desarrollo: más permisivo para testing
// En producción: restrictivo para seguridad
exports.authRateLimit = (0, exports.createRateLimit)(environment_1.isDevelopment ? 5 * 60 * 1000 : 15 * 60 * 1000, // 5 min en dev, 15 min en prod
environment_1.isDevelopment ? 20 : 5 // 20 intentos en dev, 5 en prod
);
// Rate limiting general para API
exports.apiRateLimit = (0, exports.createRateLimit)();
// Rate limiting para registro
// En desarrollo: más permisivo para testing
exports.registerRateLimit = (0, exports.createRateLimit)(environment_1.isDevelopment ? 10 * 60 * 1000 : 60 * 60 * 1000, // 10 min en dev, 1 hora en prod
environment_1.isDevelopment ? 10 : 3 // 10 registros en dev, 3 en prod
);
//# sourceMappingURL=rateLimiting.js.map