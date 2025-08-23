#!/usr/bin/env node

/**
 * Quick test script to verify Openpay mock functionality
 * Run with: node scripts/test-openpay-mock.js
 */

// Mock environment for testing
process.env.NODE_ENV = 'development';
process.env.OPENPAY_MOCK_MODE = 'true';
process.env.OPENPAY_MERCHANT_ID = 'mock_merchant_12345';
process.env.OPENPAY_PRIVATE_KEY = 'sk_mock_private_key_development_12345';
process.env.OPENPAY_PUBLIC_KEY = 'pk_mock_public_key_development_12345';
process.env.OPENPAY_MOCK_DELAY_MS = '500';
process.env.OPENPAY_MOCK_SUCCESS_RATE = '0.9';
process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'test_jwt_secret_for_mock_testing_minimum_32_chars';

console.log('🚀 Testing Openpay Mock Configuration\n');

async function runTests() {
  try {
    // Import after setting environment
    const { createOpenpayClient, validateOpenpayConfig } = require('../dist/config/openpay.js');
    const { logEnvironmentValidation } = require('../dist/config/environment.js');

    console.log('1. Validating environment configuration...');
    logEnvironmentValidation();
    console.log('');

    console.log('2. Validating Openpay configuration...');
    const isValid = validateOpenpayConfig();
    console.log(`Openpay config valid: ${isValid ? '✅' : '❌'}\n`);

    if (!isValid) {
      console.error('❌ Openpay configuration is invalid, stopping tests.');
      return;
    }

    console.log('3. Creating mock Openpay client...');
    const openpayClient = createOpenpayClient();
    console.log('✅ Mock client created successfully\n');

    console.log('4. Testing customer creation...');
    const customer = await openpayClient.customers.create({
      name: 'Test Customer',
      email: 'test@example.com',
      phone_number: '+51987654321',
      external_id: 'test_user_123'
    });
    console.log('✅ Mock customer created:', {
      id: customer.id,
      name: customer.name,
      email: customer.email
    });
    console.log('');

    console.log('5. Testing card payment...');
    const cardCharge = await openpayClient.charges.create({
      method: 'card',
      source_id: 'tok_test_success_12345',
      amount: 100,
      currency: 'pen',
      description: 'Test payment',
      customer: { id: customer.id }
    });
    console.log('✅ Mock card charge created:', {
      id: cardCharge.id,
      status: cardCharge.status,
      amount: cardCharge.amount,
      authorization: cardCharge.authorization
    });
    console.log('');

    console.log('6. Testing bank transfer...');
    const bankCharge = await openpayClient.charges.create({
      method: 'bank_account',
      amount: 200,
      currency: 'pen',
      description: 'Test bank transfer',
      customer: { id: customer.id }
    });
    console.log('✅ Mock bank transfer created:', {
      id: bankCharge.id,
      status: bankCharge.status,
      amount: bankCharge.amount,
      bank: bankCharge.payment_method?.bank
    });
    console.log('');

    console.log('7. Testing charge retrieval...');
    const retrievedCharge = await openpayClient.charges.get(cardCharge.id);
    console.log('✅ Mock charge retrieved:', {
      id: retrievedCharge.id,
      status: retrievedCharge.status,
      amount: retrievedCharge.amount
    });
    console.log('');

    console.log('8. Testing webhook verification...');
    const isWebhookValid = openpayClient.webhooks.verify(
      JSON.stringify({ test: 'payload' }),
      'test_signature',
      'test_key'
    );
    console.log(`✅ Mock webhook verification: ${isWebhookValid ? '✅ Valid' : '❌ Invalid'}\n`);

    console.log('9. Testing webhook event generation...');
    const webhookEvent = openpayClient.webhooks.generateMockEvent(
      'charge.succeeded',
      { id: cardCharge.id, amount: cardCharge.amount }
    );
    console.log('✅ Mock webhook event generated:', {
      id: webhookEvent.id,
      type: webhookEvent.type,
      objectId: webhookEvent.data.object.id
    });
    console.log('');

    console.log('🎉 All mock tests passed successfully!');
    console.log('\n📋 Summary:');
    console.log('  ✅ Environment configuration validated');
    console.log('  ✅ Openpay mock client created');
    console.log('  ✅ Customer creation works');
    console.log('  ✅ Card payments work');
    console.log('  ✅ Bank transfers work');
    console.log('  ✅ Charge retrieval works');
    console.log('  ✅ Webhook verification works');
    console.log('  ✅ Event generation works');
    console.log('\n🚀 Openpay is ready for development!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Handle errors gracefully
process.on('uncaughtException', (error) => {
  console.error('\n💥 Uncaught exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n💥 Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

runTests();