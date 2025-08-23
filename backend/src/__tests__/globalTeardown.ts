import fs from 'fs';
import path from 'path';

export default async function globalTeardown() {
  console.log('🧹 Starting global test teardown...');
  
  try {
    // Remove test database
    const testDbPath = path.join(process.cwd(), 'test_openpay.db');
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
      console.log('🗑️  Removed test database');
    }
    
    // Remove test logs directory if empty
    const logsDir = path.join(process.cwd(), 'test_logs');
    if (fs.existsSync(logsDir)) {
      try {
        const files = fs.readdirSync(logsDir);
        if (files.length === 0) {
          fs.rmdirSync(logsDir);
          console.log('📁 Removed empty test logs directory');
        } else {
          console.log('📁 Test logs directory contains files, keeping it');
        }
      } catch (error) {
        console.warn('⚠️  Could not clean test logs directory:', error);
      }
    }
    
    // Clean up any temporary files
    const tempFiles = [
      'test_openpay.db-journal',
      'test_openpay.db-wal',
      'test_openpay.db-shm'
    ];
    
    for (const file of tempFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Removed ${file}`);
      }
    }
    
    console.log('✅ Global test teardown completed successfully');
    
  } catch (error) {
    console.error('❌ Global test teardown failed:', error);
    // Don't exit with error code as this might prevent test results from being reported
  }
}