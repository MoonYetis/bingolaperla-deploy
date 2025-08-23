import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export default async function globalSetup() {
  console.log('🚀 Starting global test setup...');
  
  try {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'file:./test_openpay.db';
    
    // Remove existing test database
    const testDbPath = path.join(process.cwd(), 'test_openpay.db');
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
      console.log('🗑️  Removed existing test database');
    }
    
    // Create test database schema
    try {
      execSync('npx prisma db push --force-reset', {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: 'file:./test_openpay.db' }
      });
      console.log('📊 Test database schema created');
    } catch (error) {
      console.warn('⚠️  Prisma setup failed, database might need manual setup:', error);
    }
    
    // Create test logs directory
    const logsDir = path.join(process.cwd(), 'test_logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
      console.log('📁 Created test logs directory');
    }
    
    // Set up test-specific environment variables
    process.env.JWT_SECRET = 'test_jwt_secret_for_global_setup';
    process.env.OPENPAY_MERCHANT_ID = 'test_merchant_global';
    process.env.OPENPAY_PRIVATE_KEY = 'test_private_key_global';
    process.env.OPENPAY_PUBLIC_KEY = 'test_public_key_global';
    process.env.OPENPAY_PRODUCTION = 'false';
    process.env.OPENPAY_WEBHOOK_USERNAME = 'test_webhook_user_global';
    process.env.OPENPAY_WEBHOOK_PASSWORD = 'test_webhook_password_global';
    
    console.log('✅ Global test setup completed successfully');
    
  } catch (error) {
    console.error('❌ Global test setup failed:', error);
    process.exit(1);
  }
}