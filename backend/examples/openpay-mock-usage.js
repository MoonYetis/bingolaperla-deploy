/**
 * Example: Using Openpay Mock Mode for Development
 * 
 * This example shows how to:
 * 1. Set up mock scenarios
 * 2. Test different payment methods
 * 3. Handle success and error cases
 * 4. Use test utilities
 */

// This would typically be in a test file or development script
const mockExamples = {

  // Example 1: Basic successful card payment
  async successfulCardPayment() {
    console.log('📱 Example 1: Successful Card Payment');
    
    // Mock payment data (in real code, this would come from your frontend)
    const paymentData = {
      userId: 'user_123',
      amount: 150.00,
      token: 'tok_test_success_12345', // Mock token
      deviceSessionId: 'device_session_123',
      customerEmail: 'test@example.com',
      customerName: 'Test Customer',
      customerPhone: '+51987654321'
    };

    /* In your actual service:
    
    const openpayService = new OpenpayService();
    const result = await openpayService.processCardPayment(paymentData);
    
    Expected response:
    {
      success: true,
      transactionId: "trans_mock_...",
      openpayChargeId: "charge_mock_...",
      status: "completed",
      authorizationCode: "AUTH_MOCK_..."
    }
    */

    console.log('✅ Mock card payment would succeed with realistic delay and response');
  },

  // Example 2: Testing error scenarios
  async testErrorScenarios() {
    console.log('💳 Example 2: Testing Error Scenarios');

    const errorScenarios = [
      {
        name: 'Card Declined',
        token: 'tok_test_declined_12345',
        expectedError: 'CARD_DECLINED'
      },
      {
        name: 'Fraud Detection',
        token: 'tok_test_fraud_12345', 
        expectedError: 'FRAUD_DETECTED'
      },
      {
        name: 'Invalid Card',
        token: 'tok_test_invalid_12345',
        expectedError: 'INVALID_REQUEST'
      }
    ];

    for (const scenario of errorScenarios) {
      console.log(`  Testing: ${scenario.name}`);
      
      /* In actual code:
      
      const paymentData = {
        ...basePaymentData,
        token: scenario.token
      };

      try {
        const result = await openpayService.processCardPayment(paymentData);
        console.log('Unexpected success:', result);
      } catch (error) {
        console.log('Expected error:', error.error_code);
        // Should match scenario.expectedError
      }
      */
    }

    console.log('✅ All error scenarios can be tested predictably');
  },

  // Example 3: Bank transfer
  async bankTransferExample() {
    console.log('🏦 Example 3: Bank Transfer');

    const transferData = {
      userId: 'user_123',
      amount: 300.00,
      customerEmail: 'test@example.com', 
      customerName: 'Test Customer'
    };

    /* In actual service:
    
    const result = await openpayService.processBankTransfer(transferData);
    
    Expected response:
    {
      success: true,
      transactionId: "trans_mock_...",
      openpayChargeId: "transfer_mock_...",
      status: "charge_pending",
      paymentInstructions: {
        bankName: "Banco de Crédito del Perú",
        accountNumber: "0021350100000001234567", 
        reference: "REF_MOCK_...",
        expirationDate: "..."
      }
    }
    */

    console.log('✅ Mock bank transfer provides realistic payment instructions');
  },

  // Example 4: Using test utilities
  async usingTestUtilities() {
    console.log('🛠️  Example 4: Using Test Utilities');

    /* In actual test code:
    
    import OpenpayTestUtils from '@/utils/openpayTestUtils';
    
    // Set up specific scenario
    OpenpayTestUtils.setupMockScenario('cardDeclined');
    
    // Generate test data
    const paymentData = OpenpayTestUtils.generateCardPaymentData('cardDeclined');
    
    // Run quick test
    const result = await OpenpayTestUtils.runQuickTest('successfulCard');
    
    // Run stress test
    const stressResults = await OpenpayTestUtils.runStressTest(10);
    console.log(`Success rate: ${stressResults.successRate}%`);
    
    // Generate webhook for testing
    const webhookEvent = OpenpayTestUtils.generateMockWebhookEvent(
      'charge.succeeded',
      { id: 'charge_123', amount: 100 }
    );
    */

    console.log('✅ Test utilities make scenario testing easy');
  },

  // Example 5: Development profiles
  async developmentProfiles() {
    console.log('⚙️  Example 5: Development Profiles');

    /* Environment configuration:
    
    // Fast testing (no delays)
    DEVELOPMENT_PROFILE=test npm run dev
    
    // Realistic demo (longer delays, high success rate)  
    DEVELOPMENT_PROFILE=demo npm run dev
    
    // Stress testing (more failures)
    DEVELOPMENT_PROFILE=stress npm run dev
    
    // Or programmatically:
    import { applyDevelopmentProfile } from '@/config/development';
    applyDevelopmentProfile('test'); // Fast tests
    applyDevelopmentProfile('stress'); // Include failures
    */

    console.log('✅ Different profiles for various development needs');
  },

  // Example 6: Webhook testing
  async webhookTesting() {
    console.log('🔗 Example 6: Webhook Testing');

    /* In webhook test:
    
    import request from 'supertest';
    import OpenpayTestUtils from '@/utils/openpayTestUtils';
    
    const webhookData = OpenpayTestUtils.createTestWebhookPayload(
      'charge.succeeded',
      { 
        id: 'charge_123', 
        amount: 100,
        customerId: 'cust_456'
      }
    );
    
    const response = await request(app)
      .post('/api/webhooks/openpay')
      .set(webhookData.headers)
      .send(webhookData.payload);
      
    expect(response.status).toBe(200);
    */

    console.log('✅ Webhook events can be simulated and tested');
  },

  // Example 7: Integration with your business logic
  async businessLogicIntegration() {
    console.log('💼 Example 7: Business Logic Integration');

    /* In your actual deposit flow:
    
    async function processUserDeposit(userId, amount, paymentMethod) {
      try {
        // 1. Create deposit request
        const depositRequest = await createDepositRequest({
          userId,
          amount, 
          paymentMethod: 'OPENPAY_CARD'
        });
        
        // 2. Process payment with Openpay (mock mode in dev)
        const paymentResult = await openpayService.processCardPayment({
          userId,
          amount,
          token: paymentMethod.token,
          deviceSessionId: paymentMethod.deviceId,
          customerEmail: user.email,
          customerName: user.fullName
        });
        
        // 3. Handle success
        if (paymentResult.success) {
          await autoApproveDeposit(
            depositRequest.id, 
            paymentResult.transactionId
          );
          
          // 4. Update user balance
          await updateUserPearlsBalance(userId, amount);
          
          return { success: true, depositId: depositRequest.id };
        }
        
      } catch (error) {
        // Handle various error types
        switch (error.error_code) {
          case 'CARD_DECLINED':
            return { success: false, error: 'Card was declined' };
          case 'FRAUD_DETECTED':
            return { success: false, error: 'Payment blocked for security' };
          default:
            return { success: false, error: 'Payment failed' };
        }
      }
    }
    */

    console.log('✅ Mock mode integrates seamlessly with business logic');
  }
};

// Example runner
async function runExamples() {
  console.log('🚀 Openpay Mock Mode Usage Examples\n');
  console.log('Note: These are code examples - see comments for actual implementation\n');
  
  await mockExamples.successfulCardPayment();
  console.log('');
  
  await mockExamples.testErrorScenarios();
  console.log('');
  
  await mockExamples.bankTransferExample();
  console.log('');
  
  await mockExamples.usingTestUtilities();
  console.log('');
  
  await mockExamples.developmentProfiles();
  console.log('');
  
  await mockExamples.webhookTesting();
  console.log('');
  
  await mockExamples.businessLogicIntegration();
  
  console.log('\n📚 For complete implementation details, see:');
  console.log('  - docs/OPENPAY_DEVELOPMENT_SETUP.md');
  console.log('  - src/config/openpay.ts (mock client)');
  console.log('  - src/utils/openpayTestUtils.ts (test utilities)');
  console.log('  - src/config/development.ts (profiles)');
  console.log('\n✨ Happy coding with Openpay mock mode!');
}

// Auto-run if executed directly
if (require.main === module) {
  runExamples();
}

module.exports = mockExamples;