#!/usr/bin/env node

/**
 * Simple script to verify Openpay environment configuration
 * Run with: node scripts/verify-openpay-env.js
 */

console.log('🚀 Verifying Openpay Development Configuration\n');

// Load environment variables
require('dotenv').config();

console.log('📋 Environment Variables:');
console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`  OPENPAY_MOCK_MODE: ${process.env.OPENPAY_MOCK_MODE || 'not set'}`);
console.log(`  OPENPAY_MERCHANT_ID: ${process.env.OPENPAY_MERCHANT_ID || 'not set'}`);
console.log(`  OPENPAY_PRIVATE_KEY: ${process.env.OPENPAY_PRIVATE_KEY?.substring(0, 20)}... (truncated)`);
console.log(`  OPENPAY_PUBLIC_KEY: ${process.env.OPENPAY_PUBLIC_KEY?.substring(0, 20)}... (truncated)`);
console.log(`  OPENPAY_PRODUCTION: ${process.env.OPENPAY_PRODUCTION || 'not set'}`);
console.log(`  OPENPAY_MOCK_DELAY_MS: ${process.env.OPENPAY_MOCK_DELAY_MS || 'not set'}`);
console.log(`  OPENPAY_MOCK_SUCCESS_RATE: ${process.env.OPENPAY_MOCK_SUCCESS_RATE || 'not set'}\n`);

// Validation checks
const validationResults = [];

if (process.env.OPENPAY_MOCK_MODE === 'true') {
  validationResults.push('✅ Mock mode enabled');
  
  if (process.env.OPENPAY_MERCHANT_ID?.includes('mock')) {
    validationResults.push('✅ Merchant ID contains "mock"');
  } else {
    validationResults.push('⚠️  Merchant ID should contain "mock" for development');
  }
  
  if (process.env.OPENPAY_PRIVATE_KEY?.includes('mock')) {
    validationResults.push('✅ Private key contains "mock"');
  } else {
    validationResults.push('⚠️  Private key should contain "mock" for development');
  }
  
  if (process.env.OPENPAY_PUBLIC_KEY?.includes('mock')) {
    validationResults.push('✅ Public key contains "mock"');
  } else {
    validationResults.push('⚠️  Public key should contain "mock" for development');
  }
  
  const delayMs = parseInt(process.env.OPENPAY_MOCK_DELAY_MS || '0');
  if (delayMs >= 0 && delayMs <= 10000) {
    validationResults.push(`✅ Mock delay is reasonable (${delayMs}ms)`);
  } else {
    validationResults.push(`⚠️  Mock delay might be too high (${delayMs}ms)`);
  }
  
  const successRate = parseFloat(process.env.OPENPAY_MOCK_SUCCESS_RATE || '0');
  if (successRate >= 0.5 && successRate <= 1.0) {
    validationResults.push(`✅ Mock success rate is reasonable (${successRate * 100}%)`);
  } else {
    validationResults.push(`⚠️  Mock success rate might be too low (${successRate * 100}%)`);
  }
  
  if (process.env.OPENPAY_PRODUCTION === 'false') {
    validationResults.push('✅ Production mode disabled');
  } else {
    validationResults.push('❌ Production mode should be false for development');
  }
} else {
  validationResults.push('❌ Mock mode not enabled - set OPENPAY_MOCK_MODE=true');
}

console.log('🔍 Validation Results:');
validationResults.forEach(result => console.log(`  ${result}`));

// Summary
const errors = validationResults.filter(r => r.startsWith('❌')).length;
const warnings = validationResults.filter(r => r.startsWith('⚠️')).length;
const successes = validationResults.filter(r => r.startsWith('✅')).length;

console.log(`\n📊 Summary:`);
console.log(`  ✅ Passed: ${successes}`);
console.log(`  ⚠️  Warnings: ${warnings}`);
console.log(`  ❌ Errors: ${errors}`);

if (errors === 0) {
  console.log('\n🎉 Openpay development configuration is ready!');
  console.log('\n📚 Next steps:');
  console.log('  1. Run: npm run dev');
  console.log('  2. Check logs for "MOCK MODE" indicators');
  console.log('  3. Test payments using the mock endpoints');
  console.log('  4. Review: docs/OPENPAY_DEVELOPMENT_SETUP.md');
} else {
  console.log('\n❌ Please fix configuration errors before proceeding.');
  process.exit(1);
}

console.log('\n💡 Development Tips:');
console.log('  - Use different DEVELOPMENT_PROFILE for various test scenarios');
console.log('  - Adjust OPENPAY_MOCK_SUCCESS_RATE to test error handling');
console.log('  - Set OPENPAY_MOCK_DELAY_MS=0 for faster tests');
console.log('  - Check logs for detailed mock operation information');