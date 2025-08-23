import { openpayConfig } from '@/config/openpay';
import { developmentUtils } from '@/config/development';
import { logger } from '@/utils/structuredLogger';

// Mock payment scenarios for testing
export interface MockPaymentScenario {
  name: string;
  description: string;
  cardToken?: string;
  shouldSucceed: boolean;
  expectedError?: string;
  delayMs?: number;
}

// Predefined test scenarios
export const mockPaymentScenarios: Record<string, MockPaymentScenario> = {
  // Successful payment scenarios
  successfulCard: {
    name: 'Successful Card Payment',
    description: 'Standard successful credit card payment',
    cardToken: 'tok_test_success_12345',
    shouldSucceed: true
  },

  successfulDebit: {
    name: 'Successful Debit Payment',
    description: 'Successful debit card payment',
    cardToken: 'tok_test_debit_success_12345',
    shouldSucceed: true
  },

  // Failure scenarios
  cardDeclined: {
    name: 'Card Declined',
    description: 'Card payment declined by issuer',
    cardToken: 'tok_test_declined_12345',
    shouldSucceed: false,
    expectedError: 'CARD_DECLINED'
  },

  fraudDetected: {
    name: 'Fraud Detected',
    description: 'Payment blocked by fraud detection',
    cardToken: 'tok_test_fraud_12345',
    shouldSucceed: false,
    expectedError: 'FRAUD_DETECTED'
  },

  invalidCard: {
    name: 'Invalid Card',
    description: 'Invalid card token or format',
    cardToken: 'tok_test_invalid_12345',
    shouldSucceed: false,
    expectedError: 'INVALID_REQUEST'
  },

  networkError: {
    name: 'Network Error',
    description: 'Network communication error',
    cardToken: 'tok_test_network_error_12345',
    shouldSucceed: false,
    expectedError: 'NETWORK_ERROR'
  },

  // Slow payment for timeout testing
  slowPayment: {
    name: 'Slow Payment',
    description: 'Payment with longer processing time',
    cardToken: 'tok_test_slow_12345',
    shouldSucceed: true,
    delayMs: 5000
  }
};

// Test payment data generators
export class OpenpayTestUtils {
  
  /**
   * Generate test customer data
   */
  static generateTestCustomer(userId?: string) {
    const timestamp = Date.now();
    return {
      userId: userId || `test_user_${timestamp}`,
      name: `Test Customer ${timestamp}`,
      email: `test.customer.${timestamp}@example.com`,
      phone: '+51987654321'
    };
  }

  /**
   * Generate test card payment data
   */
  static generateCardPaymentData(scenario: string = 'successfulCard', userId?: string) {
    const testScenario = mockPaymentScenarios[scenario] || mockPaymentScenarios.successfulCard;
    const customer = this.generateTestCustomer(userId);
    
    return {
      userId: customer.userId,
      amount: 100 + Math.floor(Math.random() * 900), // Random amount 100-1000
      token: testScenario.cardToken || 'tok_test_default_12345',
      deviceSessionId: `device_session_${Date.now()}`,
      customerEmail: customer.email,
      customerName: customer.name,
      customerPhone: customer.phone
    };
  }

  /**
   * Generate test bank transfer data
   */
  static generateBankTransferData(userId?: string) {
    const customer = this.generateTestCustomer(userId);
    
    return {
      userId: customer.userId,
      amount: 100 + Math.floor(Math.random() * 900),
      customerEmail: customer.email,
      customerName: customer.name
    };
  }

  /**
   * Set up mock environment for specific test scenario
   */
  static setupMockScenario(scenarioName: string) {
    const scenario = mockPaymentScenarios[scenarioName];
    if (!scenario) {
      throw new Error(`Unknown test scenario: ${scenarioName}`);
    }

    // Set mock behavior based on scenario
    if (scenario.shouldSucceed) {
      developmentUtils.setMockBehavior('success');
    } else {
      developmentUtils.setMockBehavior('failure');
    }

    // Set custom delay if specified
    if (scenario.delayMs) {
      process.env.OPENPAY_MOCK_DELAY_MS = scenario.delayMs.toString();
    }

    logger.info('Mock scenario set up', {
      scenario: scenario.name,
      description: scenario.description,
      shouldSucceed: scenario.shouldSucceed,
      expectedError: scenario.expectedError
    });

    return scenario;
  }

  /**
   * Generate mock webhook event for testing
   */
  static generateMockWebhookEvent(eventType: string, chargeData: any) {
    return {
      id: `evt_test_${Date.now()}`,
      type: eventType,
      event_date: new Date().toISOString(),
      data: {
        object: {
          id: chargeData.id,
          amount: chargeData.amount,
          status: eventType.includes('succeeded') ? 'completed' : 'failed',
          creation_date: new Date().toISOString(),
          customer: {
            id: chargeData.customerId,
            email: chargeData.customerEmail
          },
          ...(chargeData.card && { card: chargeData.card }),
          ...(chargeData.authorization && { authorization: chargeData.authorization })
        }
      },
      request: `req_test_${Date.now()}`
    };
  }

  /**
   * Create test webhook payload with signature
   */
  static createTestWebhookPayload(eventType: string, chargeData: any) {
    const event = this.generateMockWebhookEvent(eventType, chargeData);
    const payload = JSON.stringify(event);
    const signature = `test_signature_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      event,
      payload,
      signature,
      headers: {
        'Content-Type': 'application/json',
        'X-Openpay-Signature': signature
      }
    };
  }

  /**
   * Reset mock environment to default state
   */
  static resetMockEnvironment() {
    developmentUtils.resetMockState();
    developmentUtils.setMockBehavior('random');
    
    // Reset to default delays
    process.env.OPENPAY_MOCK_DELAY_MS = '1000';
    
    logger.info('Mock environment reset to defaults');
  }

  /**
   * Validate mock response format
   */
  static validateMockResponse(response: any, expectedType: 'card' | 'bank_transfer'): boolean {
    if (!response || !response.id) {
      return false;
    }

    // Common fields
    const hasCommonFields = response.amount && response.currency && response.creation_date;
    if (!hasCommonFields) {
      return false;
    }

    // Type-specific validation
    if (expectedType === 'card') {
      return response.status === 'completed' && 
             response.authorization && 
             response.card;
    } else if (expectedType === 'bank_transfer') {
      return response.status === 'charge_pending' && 
             response.payment_method && 
             response.payment_method.bank;
    }

    return true;
  }

  /**
   * Get available test scenarios
   */
  static getAvailableScenarios(): string[] {
    return Object.keys(mockPaymentScenarios);
  }

  /**
   * Get scenario details
   */
  static getScenario(name: string): MockPaymentScenario | undefined {
    return mockPaymentScenarios[name];
  }

  /**
   * Run a quick mock payment test
   */
  static async runQuickTest(scenarioName: string = 'successfulCard') {
    const scenario = this.setupMockScenario(scenarioName);
    const paymentData = this.generateCardPaymentData(scenarioName);
    
    logger.info('Running quick mock payment test', {
      scenario: scenario.name,
      paymentData: {
        amount: paymentData.amount,
        customerEmail: paymentData.customerEmail
      }
    });

    // This would typically call the actual OpenpayService
    // For now, just log the test setup
    return {
      success: true,
      scenario: scenario.name,
      paymentData,
      message: `Mock test setup complete for ${scenario.name}`
    };
  }

  /**
   * Stress test with multiple scenarios
   */
  static async runStressTest(iterations: number = 10) {
    const results: any[] = [];
    const scenarios = this.getAvailableScenarios();
    
    logger.info(`Starting stress test with ${iterations} iterations`);
    
    for (let i = 0; i < iterations; i++) {
      const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
      try {
        const result = await this.runQuickTest(randomScenario);
        results.push({ iteration: i + 1, ...result });
      } catch (error) {
        results.push({
          iteration: i + 1,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          scenario: randomScenario
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;
    
    logger.info('Stress test completed', {
      totalIterations: iterations,
      successes: successCount,
      failures: failureCount,
      successRate: (successCount / iterations) * 100
    });
    
    return {
      totalIterations: iterations,
      successes: successCount,
      failures: failureCount,
      successRate: (successCount / iterations) * 100,
      results
    };
  }
}

export default OpenpayTestUtils;