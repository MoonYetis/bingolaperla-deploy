import { env, isDevelopment, isTest } from './environment';
import { logger } from '@/utils/structuredLogger';

// Development-specific configuration profiles
export interface DevelopmentProfile {
  name: string;
  description: string;
  openpay: {
    mockMode: boolean;
    mockDelayMs: number;
    mockSuccessRate: number;
    logLevel: 'info' | 'debug' | 'warn';
    enableWebhookSimulation: boolean;
  };
  database: {
    seedData: boolean;
    resetOnStart: boolean;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableSQLLogs: boolean;
  };
}

// Development configuration profiles
export const developmentProfiles: Record<string, DevelopmentProfile> = {
  // Standard development mode - balanced testing
  development: {
    name: 'Development',
    description: 'Standard development environment with mock payments',
    openpay: {
      mockMode: true,
      mockDelayMs: 1000,
      mockSuccessRate: 0.95,
      logLevel: 'info',
      enableWebhookSimulation: true
    },
    database: {
      seedData: true,
      resetOnStart: false
    },
    logging: {
      level: 'debug',
      enableSQLLogs: true
    }
  },

  // Testing mode - faster, more predictable
  test: {
    name: 'Testing',
    description: 'Fast testing environment with minimal delays',
    openpay: {
      mockMode: true,
      mockDelayMs: 0, // No delays for tests
      mockSuccessRate: 1.0, // Always succeed unless explicitly testing failures
      logLevel: 'warn', // Reduce test noise
      enableWebhookSimulation: false
    },
    database: {
      seedData: false,
      resetOnStart: true
    },
    logging: {
      level: 'warn',
      enableSQLLogs: false
    }
  },

  // Demo mode - realistic but controlled
  demo: {
    name: 'Demo',
    description: 'Demo environment with realistic payment simulation',
    openpay: {
      mockMode: true,
      mockDelayMs: 2000, // Slightly longer delays for realism
      mockSuccessRate: 0.98, // Very high success rate for demos
      logLevel: 'info',
      enableWebhookSimulation: true
    },
    database: {
      seedData: true,
      resetOnStart: false
    },
    logging: {
      level: 'info',
      enableSQLLogs: false
    }
  },

  // Stress testing mode - include failures
  stress: {
    name: 'Stress Testing',
    description: 'Environment for testing error handling and edge cases',
    openpay: {
      mockMode: true,
      mockDelayMs: 500,
      mockSuccessRate: 0.75, // Include more failures
      logLevel: 'debug',
      enableWebhookSimulation: true
    },
    database: {
      seedData: true,
      resetOnStart: false
    },
    logging: {
      level: 'debug',
      enableSQLLogs: true
    }
  }
};

// Get current profile based on environment
export function getCurrentProfile(): DevelopmentProfile {
  const profileName = process.env.DEVELOPMENT_PROFILE || 
    (isTest ? 'test' : 'development');
  
  const profile = developmentProfiles[profileName];
  
  if (!profile) {
    logger.warn(`Unknown development profile: ${profileName}, falling back to development`);
    return developmentProfiles.development;
  }
  
  logger.info(`Using development profile: ${profile.name}`, {
    profile: profileName,
    description: profile.description
  });
  
  return profile;
}

// Apply profile configuration to environment
export function applyDevelopmentProfile(profileName?: string): void {
  const profile = profileName ? 
    (developmentProfiles[profileName] || developmentProfiles.development) :
    getCurrentProfile();

  // Override environment variables with profile settings
  if (profile.openpay.mockMode) {
    process.env.OPENPAY_MOCK_MODE = 'true';
    process.env.OPENPAY_MOCK_DELAY_MS = profile.openpay.mockDelayMs.toString();
    process.env.OPENPAY_MOCK_SUCCESS_RATE = profile.openpay.mockSuccessRate.toString();
  }

  logger.info('Development profile applied', {
    profileName: profile.name,
    mockMode: profile.openpay.mockMode,
    mockDelayMs: profile.openpay.mockDelayMs,
    mockSuccessRate: profile.openpay.mockSuccessRate
  });
}

// Development utilities
export const developmentUtils = {
  // Reset to clean state for testing
  resetMockState: () => {
    logger.info('Resetting mock state for development');
    // Clear any cached mock data
    // Reset counters, etc.
  },

  // Force specific mock behaviors for testing
  setMockBehavior: (behavior: 'success' | 'failure' | 'random') => {
    switch (behavior) {
      case 'success':
        process.env.OPENPAY_MOCK_SUCCESS_RATE = '1.0';
        break;
      case 'failure':
        process.env.OPENPAY_MOCK_SUCCESS_RATE = '0.0';
        break;
      case 'random':
        process.env.OPENPAY_MOCK_SUCCESS_RATE = '0.95';
        break;
    }
    logger.info(`Mock behavior set to: ${behavior}`);
  },

  // Log current configuration for debugging
  logCurrentConfig: () => {
    const profile = getCurrentProfile();
    logger.info('Current development configuration', {
      profile: profile.name,
      openpay: profile.openpay,
      database: profile.database,
      logging: profile.logging,
      env: {
        NODE_ENV: env.NODE_ENV,
        OPENPAY_MOCK_MODE: env.OPENPAY_MOCK_MODE,
        OPENPAY_MOCK_DELAY_MS: env.OPENPAY_MOCK_DELAY_MS,
        OPENPAY_MOCK_SUCCESS_RATE: env.OPENPAY_MOCK_SUCCESS_RATE
      }
    });
  }
};

// Export commonly used profile configurations
export const isInMockMode = () => getCurrentProfile().openpay.mockMode;
export const getMockDelayMs = () => getCurrentProfile().openpay.mockDelayMs;
export const getMockSuccessRate = () => getCurrentProfile().openpay.mockSuccessRate;

export default {
  profiles: developmentProfiles,
  getCurrentProfile,
  applyDevelopmentProfile,
  utils: developmentUtils,
  isInMockMode,
  getMockDelayMs,
  getMockSuccessRate
};