"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenpayTestUtils = exports.mockPaymentScenarios = void 0;
const development_1 = require("@/config/development");
const structuredLogger_1 = require("@/utils/structuredLogger");
// Predefined test scenarios
exports.mockPaymentScenarios = {
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
class OpenpayTestUtils {
    /**
     * Generate test customer data
     */
    static generateTestCustomer(userId) {
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
    static generateCardPaymentData(scenario = 'successfulCard', userId) {
        const testScenario = exports.mockPaymentScenarios[scenario] || exports.mockPaymentScenarios.successfulCard;
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
    static generateBankTransferData(userId) {
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
    static setupMockScenario(scenarioName) {
        const scenario = exports.mockPaymentScenarios[scenarioName];
        if (!scenario) {
            throw new Error(`Unknown test scenario: ${scenarioName}`);
        }
        // Set mock behavior based on scenario
        if (scenario.shouldSucceed) {
            development_1.developmentUtils.setMockBehavior('success');
        }
        else {
            development_1.developmentUtils.setMockBehavior('failure');
        }
        // Set custom delay if specified
        if (scenario.delayMs) {
            process.env.OPENPAY_MOCK_DELAY_MS = scenario.delayMs.toString();
        }
        structuredLogger_1.logger.info('Mock scenario set up', {
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
    static generateMockWebhookEvent(eventType, chargeData) {
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
    static createTestWebhookPayload(eventType, chargeData) {
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
        development_1.developmentUtils.resetMockState();
        development_1.developmentUtils.setMockBehavior('random');
        // Reset to default delays
        process.env.OPENPAY_MOCK_DELAY_MS = '1000';
        structuredLogger_1.logger.info('Mock environment reset to defaults');
    }
    /**
     * Validate mock response format
     */
    static validateMockResponse(response, expectedType) {
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
        }
        else if (expectedType === 'bank_transfer') {
            return response.status === 'charge_pending' &&
                response.payment_method &&
                response.payment_method.bank;
        }
        return true;
    }
    /**
     * Get available test scenarios
     */
    static getAvailableScenarios() {
        return Object.keys(exports.mockPaymentScenarios);
    }
    /**
     * Get scenario details
     */
    static getScenario(name) {
        return exports.mockPaymentScenarios[name];
    }
    /**
     * Run a quick mock payment test
     */
    static async runQuickTest(scenarioName = 'successfulCard') {
        const scenario = this.setupMockScenario(scenarioName);
        const paymentData = this.generateCardPaymentData(scenarioName);
        structuredLogger_1.logger.info('Running quick mock payment test', {
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
    static async runStressTest(iterations = 10) {
        const results = [];
        const scenarios = this.getAvailableScenarios();
        structuredLogger_1.logger.info(`Starting stress test with ${iterations} iterations`);
        for (let i = 0; i < iterations; i++) {
            const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
            try {
                const result = await this.runQuickTest(randomScenario);
                results.push({ iteration: i + 1, ...result });
            }
            catch (error) {
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
        structuredLogger_1.logger.info('Stress test completed', {
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
exports.OpenpayTestUtils = OpenpayTestUtils;
exports.default = OpenpayTestUtils;
//# sourceMappingURL=openpayTestUtils.js.map