"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTest = exports.isProduction = exports.isDevelopment = exports.env = void 0;
exports.validateDevelopmentEnvironment = validateDevelopmentEnvironment;
exports.logEnvironmentValidation = logEnvironmentValidation;
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
    OPENPAY_MERCHANT_ID: zod_1.z.string().optional(),
    OPENPAY_PRIVATE_KEY: zod_1.z.string().optional(),
    OPENPAY_PUBLIC_KEY: zod_1.z.string().optional(),
    OPENPAY_PRODUCTION: zod_1.z.string().transform((val) => val === 'true').default('false'),
    OPENPAY_WEBHOOK_USERNAME: zod_1.z.string().optional(),
    OPENPAY_WEBHOOK_PASSWORD: zod_1.z.string().optional(),
    OPENPAY_MOCK_MODE: zod_1.z.string().transform((val) => val === 'true').default('false'),
    OPENPAY_MOCK_DELAY_MS: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(0)).default('1000'),
    OPENPAY_MOCK_SUCCESS_RATE: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(0).max(1)).default('0.95'),
    AGORA_APP_ID: zod_1.z.string().optional(),
    AGORA_APP_CERTIFICATE: zod_1.z.string().optional(),
});
exports.env = envSchema.parse(process.env);
exports.isDevelopment = exports.env.NODE_ENV === 'development';
exports.isProduction = exports.env.NODE_ENV === 'production';
exports.isTest = exports.env.NODE_ENV === 'test';
// Development environment validation
function validateDevelopmentEnvironment() {
    const warnings = [];
    const errors = [];
    // Only validate in development/test environments
    if (exports.isProduction) {
        return { valid: true, warnings: [], errors: [] };
    }
    // Check Openpay mock configuration
    if (exports.env.OPENPAY_MOCK_MODE) {
        if (!exports.env.OPENPAY_MERCHANT_ID?.includes('mock')) {
            warnings.push('OPENPAY_MERCHANT_ID should contain "mock" for development');
        }
        if (!exports.env.OPENPAY_PRIVATE_KEY?.includes('mock')) {
            warnings.push('OPENPAY_PRIVATE_KEY should contain "mock" for development');
        }
        if (!exports.env.OPENPAY_PUBLIC_KEY?.includes('mock')) {
            warnings.push('OPENPAY_PUBLIC_KEY should contain "mock" for development');
        }
        // Validate mock settings are reasonable
        if (exports.env.OPENPAY_MOCK_DELAY_MS > 10000) {
            warnings.push('OPENPAY_MOCK_DELAY_MS is very high (>10s), this may slow down development');
        }
        if (exports.env.OPENPAY_MOCK_SUCCESS_RATE < 0.5) {
            warnings.push('OPENPAY_MOCK_SUCCESS_RATE is low (<50%), this may cause excessive test failures');
        }
        if (exports.env.OPENPAY_MOCK_SUCCESS_RATE > 1.0) {
            errors.push('OPENPAY_MOCK_SUCCESS_RATE cannot be greater than 1.0');
        }
    }
    else if (exports.isDevelopment) {
        warnings.push('OPENPAY_MOCK_MODE is disabled in development - consider enabling for easier testing');
    }
    // Check database configuration
    if (exports.isDevelopment && !exports.env.DATABASE_URL.includes('dev')) {
        warnings.push('DATABASE_URL should contain "dev" for development environment');
    }
    if (exports.isTest && !exports.env.DATABASE_URL.includes('test')) {
        warnings.push('DATABASE_URL should contain "test" for test environment');
    }
    // Check JWT secrets
    if (exports.env.JWT_SECRET.includes('change_in_production') && !exports.isProduction) {
        // This is actually good for development
    }
    else if (exports.env.JWT_SECRET.length < 32) {
        errors.push('JWT_SECRET must be at least 32 characters long');
    }
    // Check frontend URL
    if (exports.isDevelopment && !exports.env.FRONTEND_URL.includes('localhost')) {
        warnings.push('FRONTEND_URL should point to localhost in development');
    }
    const valid = errors.length === 0;
    return { valid, warnings, errors };
}
// Log validation results
function logEnvironmentValidation() {
    const validation = validateDevelopmentEnvironment();
    if (validation.errors.length > 0) {
        console.error('❌ Environment configuration errors:');
        validation.errors.forEach(error => console.error(`  - ${error}`));
    }
    if (validation.warnings.length > 0) {
        console.warn('⚠️  Environment configuration warnings:');
        validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
    if (validation.valid && validation.warnings.length === 0) {
        console.log('✅ Environment configuration is valid');
    }
    else if (validation.valid) {
        console.log('✅ Environment configuration is valid (with warnings)');
    }
    // Log current configuration in development
    if (exports.isDevelopment) {
        console.log('🔧 Development configuration:');
        console.log(`  - NODE_ENV: ${exports.env.NODE_ENV}`);
        console.log(`  - OPENPAY_MOCK_MODE: ${exports.env.OPENPAY_MOCK_MODE}`);
        console.log(`  - OPENPAY_MOCK_DELAY_MS: ${exports.env.OPENPAY_MOCK_DELAY_MS}ms`);
        console.log(`  - OPENPAY_MOCK_SUCCESS_RATE: ${exports.env.OPENPAY_MOCK_SUCCESS_RATE * 100}%`);
        console.log(`  - DATABASE_URL: ${exports.env.DATABASE_URL}`);
        console.log(`  - FRONTEND_URL: ${exports.env.FRONTEND_URL}`);
    }
}
//# sourceMappingURL=environment.js.map