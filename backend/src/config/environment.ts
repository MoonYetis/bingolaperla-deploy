import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().min(1000).max(65535)).default('3001'),
  
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('24h'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().positive()).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().positive()).default('100'),
  
  IZIPAY_PUBLIC_KEY: z.string().optional(),
  IZIPAY_PRIVATE_KEY: z.string().optional(),
  IZIPAY_ENDPOINT: z.string().url().optional(),
  
  OPENPAY_MERCHANT_ID: z.string().optional(),
  OPENPAY_PRIVATE_KEY: z.string().optional(),
  OPENPAY_PUBLIC_KEY: z.string().optional(),
  OPENPAY_PRODUCTION: z.string().transform((val) => val === 'true').default('false'),
  OPENPAY_WEBHOOK_USERNAME: z.string().optional(),
  OPENPAY_WEBHOOK_PASSWORD: z.string().optional(),
  OPENPAY_MOCK_MODE: z.string().transform((val) => val === 'true').default('false'),
  OPENPAY_MOCK_DELAY_MS: z.string().transform(Number).pipe(z.number().min(0)).default('1000'),
  OPENPAY_MOCK_SUCCESS_RATE: z.string().transform(Number).pipe(z.number().min(0).max(1)).default('0.95'),
  
  AGORA_APP_ID: z.string().optional(),
  AGORA_APP_CERTIFICATE: z.string().optional(),
});

export const env = envSchema.parse(process.env);

export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Development environment validation
export function validateDevelopmentEnvironment(): { valid: boolean; warnings: string[]; errors: string[] } {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Only validate in development/test environments
  if (isProduction) {
    return { valid: true, warnings: [], errors: [] };
  }

  // Check Openpay mock configuration
  if (env.OPENPAY_MOCK_MODE) {
    if (!env.OPENPAY_MERCHANT_ID?.includes('mock')) {
      warnings.push('OPENPAY_MERCHANT_ID should contain "mock" for development');
    }
    
    if (!env.OPENPAY_PRIVATE_KEY?.includes('mock')) {
      warnings.push('OPENPAY_PRIVATE_KEY should contain "mock" for development');
    }
    
    if (!env.OPENPAY_PUBLIC_KEY?.includes('mock')) {
      warnings.push('OPENPAY_PUBLIC_KEY should contain "mock" for development');
    }

    // Validate mock settings are reasonable
    if (env.OPENPAY_MOCK_DELAY_MS > 10000) {
      warnings.push('OPENPAY_MOCK_DELAY_MS is very high (>10s), this may slow down development');
    }

    if (env.OPENPAY_MOCK_SUCCESS_RATE < 0.5) {
      warnings.push('OPENPAY_MOCK_SUCCESS_RATE is low (<50%), this may cause excessive test failures');
    }

    if (env.OPENPAY_MOCK_SUCCESS_RATE > 1.0) {
      errors.push('OPENPAY_MOCK_SUCCESS_RATE cannot be greater than 1.0');
    }
  } else if (isDevelopment) {
    warnings.push('OPENPAY_MOCK_MODE is disabled in development - consider enabling for easier testing');
  }

  // Check database configuration
  if (isDevelopment && !env.DATABASE_URL.includes('dev')) {
    warnings.push('DATABASE_URL should contain "dev" for development environment');
  }

  if (isTest && !env.DATABASE_URL.includes('test')) {
    warnings.push('DATABASE_URL should contain "test" for test environment');
  }

  // Check JWT secrets
  if (env.JWT_SECRET.includes('change_in_production') && !isProduction) {
    // This is actually good for development
  } else if (env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long');
  }

  // Check frontend URL
  if (isDevelopment && !env.FRONTEND_URL.includes('localhost')) {
    warnings.push('FRONTEND_URL should point to localhost in development');
  }

  const valid = errors.length === 0;
  return { valid, warnings, errors };
}

// Log validation results
export function logEnvironmentValidation(): void {
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
  } else if (validation.valid) {
    console.log('✅ Environment configuration is valid (with warnings)');
  }

  // Log current configuration in development
  if (isDevelopment) {
    console.log('🔧 Development configuration:');
    console.log(`  - NODE_ENV: ${env.NODE_ENV}`);
    console.log(`  - OPENPAY_MOCK_MODE: ${env.OPENPAY_MOCK_MODE}`);
    console.log(`  - OPENPAY_MOCK_DELAY_MS: ${env.OPENPAY_MOCK_DELAY_MS}ms`);
    console.log(`  - OPENPAY_MOCK_SUCCESS_RATE: ${env.OPENPAY_MOCK_SUCCESS_RATE * 100}%`);
    console.log(`  - DATABASE_URL: ${env.DATABASE_URL}`);
    console.log(`  - FRONTEND_URL: ${env.FRONTEND_URL}`);
  }
}