"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMockSuccessRate = exports.getMockDelayMs = exports.isInMockMode = exports.developmentUtils = exports.developmentProfiles = void 0;
exports.getCurrentProfile = getCurrentProfile;
exports.applyDevelopmentProfile = applyDevelopmentProfile;
const environment_1 = require("./environment");
const structuredLogger_1 = require("@/utils/structuredLogger");
// Development configuration profiles
exports.developmentProfiles = {
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
function getCurrentProfile() {
    const profileName = process.env.DEVELOPMENT_PROFILE ||
        (environment_1.isTest ? 'test' : 'development');
    const profile = exports.developmentProfiles[profileName];
    if (!profile) {
        structuredLogger_1.logger.warn(`Unknown development profile: ${profileName}, falling back to development`);
        return exports.developmentProfiles.development;
    }
    structuredLogger_1.logger.info(`Using development profile: ${profile.name}`, {
        profile: profileName,
        description: profile.description
    });
    return profile;
}
// Apply profile configuration to environment
function applyDevelopmentProfile(profileName) {
    const profile = profileName ?
        (exports.developmentProfiles[profileName] || exports.developmentProfiles.development) :
        getCurrentProfile();
    // Override environment variables with profile settings
    if (profile.openpay.mockMode) {
        process.env.OPENPAY_MOCK_MODE = 'true';
        process.env.OPENPAY_MOCK_DELAY_MS = profile.openpay.mockDelayMs.toString();
        process.env.OPENPAY_MOCK_SUCCESS_RATE = profile.openpay.mockSuccessRate.toString();
    }
    structuredLogger_1.logger.info('Development profile applied', {
        profileName: profile.name,
        mockMode: profile.openpay.mockMode,
        mockDelayMs: profile.openpay.mockDelayMs,
        mockSuccessRate: profile.openpay.mockSuccessRate
    });
}
// Development utilities
exports.developmentUtils = {
    // Reset to clean state for testing
    resetMockState: () => {
        structuredLogger_1.logger.info('Resetting mock state for development');
        // Clear any cached mock data
        // Reset counters, etc.
    },
    // Force specific mock behaviors for testing
    setMockBehavior: (behavior) => {
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
        structuredLogger_1.logger.info(`Mock behavior set to: ${behavior}`);
    },
    // Log current configuration for debugging
    logCurrentConfig: () => {
        const profile = getCurrentProfile();
        structuredLogger_1.logger.info('Current development configuration', {
            profile: profile.name,
            openpay: profile.openpay,
            database: profile.database,
            logging: profile.logging,
            env: {
                NODE_ENV: environment_1.env.NODE_ENV,
                OPENPAY_MOCK_MODE: environment_1.env.OPENPAY_MOCK_MODE,
                OPENPAY_MOCK_DELAY_MS: environment_1.env.OPENPAY_MOCK_DELAY_MS,
                OPENPAY_MOCK_SUCCESS_RATE: environment_1.env.OPENPAY_MOCK_SUCCESS_RATE
            }
        });
    }
};
// Export commonly used profile configurations
const isInMockMode = () => getCurrentProfile().openpay.mockMode;
exports.isInMockMode = isInMockMode;
const getMockDelayMs = () => getCurrentProfile().openpay.mockDelayMs;
exports.getMockDelayMs = getMockDelayMs;
const getMockSuccessRate = () => getCurrentProfile().openpay.mockSuccessRate;
exports.getMockSuccessRate = getMockSuccessRate;
exports.default = {
    profiles: exports.developmentProfiles,
    getCurrentProfile,
    applyDevelopmentProfile,
    utils: exports.developmentUtils,
    isInMockMode: exports.isInMockMode,
    getMockDelayMs: exports.getMockDelayMs,
    getMockSuccessRate: exports.getMockSuccessRate
};
//# sourceMappingURL=development.js.map