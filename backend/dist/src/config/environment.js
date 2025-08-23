"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTest = exports.isProduction = exports.isDevelopment = exports.env = void 0;
const dotenv_1 = require("dotenv");
const zod_1 = require("zod");
(0, dotenv_1.config)();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1000).max(65535)).default('3001'),
    DATABASE_URL: zod_1.z.string().url(),
    REDIS_URL: zod_1.z.string().url(),
    JWT_SECRET: zod_1.z.string().min(32),
    JWT_EXPIRES_IN: zod_1.z.string().default('24h'),
    JWT_REFRESH_SECRET: zod_1.z.string().min(32),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default('7d'),
    FRONTEND_URL: zod_1.z.string().url().default('http://localhost:3000'),
    RATE_LIMIT_WINDOW_MS: zod_1.z.string().transform(Number).pipe(zod_1.z.number().positive()).default('900000'),
    RATE_LIMIT_MAX_REQUESTS: zod_1.z.string().transform(Number).pipe(zod_1.z.number().positive()).default('100'),
    IZIPAY_PUBLIC_KEY: zod_1.z.string().optional(),
    IZIPAY_PRIVATE_KEY: zod_1.z.string().optional(),
    IZIPAY_ENDPOINT: zod_1.z.string().url().optional(),
    AGORA_APP_ID: zod_1.z.string().optional(),
    AGORA_APP_CERTIFICATE: zod_1.z.string().optional(),
});
exports.env = envSchema.parse(process.env);
exports.isDevelopment = exports.env.NODE_ENV === 'development';
exports.isProduction = exports.env.NODE_ENV === 'production';
exports.isTest = exports.env.NODE_ENV === 'test';
//# sourceMappingURL=environment.js.map