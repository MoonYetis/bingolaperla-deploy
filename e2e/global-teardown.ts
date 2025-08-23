import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting E2E test teardown...');
  
  // Cleanup test data, close connections, etc.
  // This runs after all tests are completed
  
  console.log('✅ E2E test teardown completed');
}

export default globalTeardown;