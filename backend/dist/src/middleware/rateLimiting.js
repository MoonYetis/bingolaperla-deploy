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
// Rate limiting específico para autenticación (más restrictivo)
exports.authRateLimit = (0, exports.createRateLimit)(15 * 60 * 1000, // 15 minutos
5 // máximo 5 intentos por IP
);
// Rate limiting general para API
exports.apiRateLimit = (0, exports.createRateLimit)();
// Rate limiting para registro (muy restrictivo)
exports.registerRateLimit = (0, exports.createRateLimit)(60 * 60 * 1000, // 1 hora
3 // máximo 3 registros por IP por hora
);
//# sourceMappingURL=rateLimiting.js.map