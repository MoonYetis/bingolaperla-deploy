/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/__tests__/**/*',
    '!src/server.ts',
    '!src/config/**/*',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    // Specific thresholds for critical components
    './src/services/openpayService.ts': {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './src/controllers/openpayController.ts': {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/middleware/openpaySecurityMiddleware.ts': {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 30000, // 30 seconds for integration tests
  globalSetup: '<rootDir>/src/__tests__/globalSetup.ts',
  globalTeardown: '<rootDir>/src/__tests__/globalTeardown.ts',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/dist/',
  ],
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/logs/',
  ],
  // Separate test environments for different types of tests
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/__tests__/services/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/src/__tests__/integration/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
      testTimeout: 45000,
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/src/__tests__/e2e/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
      testTimeout: 60000,
    },
  ],
  // Performance and memory settings
  maxWorkers: '50%',
  cache: true,
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  // Verbose output for CI
  verbose: process.env.CI === 'true',
  // Custom test results processor for better reporting
  testResultsProcessor: 'jest-sonar-reporter',
  // Error handling
  errorOnDeprecated: true,
  bail: false, // Continue running tests after first failure
  // Mock handling
  clearMocksAfterEach: true,
  resetModulesAfterEach: false,
  // Test file discovery
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};