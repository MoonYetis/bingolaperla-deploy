"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenpayDevUtils = exports.developmentOpenpayConfig = exports.MockOpenpayClient = void 0;
const structuredLogger_1 = require("@/utils/structuredLogger");
const environment_1 = require("./environment");
/**
 * Mock Openpay client for development and testing
 * This provides realistic responses without making actual API calls
 */
class MockOpenpayClient {
    constructor(config) {
        this.customers = {
            create: async (customerData) => {
                structuredLogger_1.logger.info('Mock Openpay: Creating customer', {
                    name: customerData.name,
                    email: customerData.email
                });
                // Simulate API delay
                await this.simulateDelay(200, 500);
                // Simulate occasional failures for testing error handling
                if (customerData.email === 'fail@test.com') {
                    throw {
                        error_code: 'invalid_email',
                        description: 'Invalid email address'
                    };
                }
                return {
                    id: `cust_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: customerData.name,
                    email: customerData.email,
                    phone_number: customerData.phone_number,
                    external_id: customerData.external_id,
                    creation_date: new Date().toISOString()
                };
            },
            get: async (customerId) => {
                structuredLogger_1.logger.info('Mock Openpay: Getting customer', { customerId });
                await this.simulateDelay(100, 300);
                // Simulate not found scenario
                if (customerId.includes('notfound')) {
                    throw {
                        error_code: 'customer_not_found',
                        description: 'Customer not found'
                    };
                }
                return {
                    id: customerId,
                    name: 'Mock Customer',
                    email: 'mock@example.com',
                    phone_number: '+51987654321',
                    creation_date: new Date().toISOString()
                };
            }
        };
        this.charges = {
            create: async (chargeData) => {
                structuredLogger_1.logger.info('Mock Openpay: Creating charge', {
                    method: chargeData.method,
                    amount: chargeData.amount,
                    currency: chargeData.currency,
                    orderId: chargeData.order_id
                });
                // Simulate API delay
                await this.simulateDelay(500, 1500);
                const baseResponse = {
                    id: `charge_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    amount: chargeData.amount,
                    currency: chargeData.currency || 'pen',
                    creation_date: new Date().toISOString(),
                    order_id: chargeData.order_id
                };
                // Simulate different payment methods
                if (chargeData.method === 'card') {
                    return this.mockCardPayment(chargeData, baseResponse);
                }
                else if (chargeData.method === 'bank_account') {
                    return this.mockBankTransferPayment(chargeData, baseResponse);
                }
                else {
                    throw {
                        error_code: 'unsupported_payment_method',
                        description: 'Payment method not supported'
                    };
                }
            },
            get: async (chargeId) => {
                structuredLogger_1.logger.info('Mock Openpay: Getting charge', { chargeId });
                await this.simulateDelay(100, 300);
                // Simulate different charge statuses for testing
                let status = 'completed';
                if (chargeId.includes('pending')) {
                    status = 'charge_pending';
                }
                else if (chargeId.includes('failed')) {
                    status = 'failed';
                }
                else if (chargeId.includes('cancelled')) {
                    status = 'cancelled';
                }
                return {
                    id: chargeId,
                    status,
                    amount: 100,
                    currency: 'pen',
                    authorization: status === 'completed' ? `AUTH${Date.now()}` : undefined,
                    creation_date: new Date().toISOString()
                };
            }
        };
        this.webhooks = {
            verify: (payload, signature, key) => {
                structuredLogger_1.logger.info('Mock Openpay: Verifying webhook signature');
                // In mock mode, always return true for valid development signatures
                // Real implementation would use HMAC verification
                if (environment_1.isDevelopment || environment_1.isTest) {
                    return signature === 'mock_valid_signature' || signature.startsWith('test_');
                }
                return false;
            }
        };
        this.config = config;
        structuredLogger_1.logger.info('Openpay Mock Client initialized', {
            merchantId: config.merchantId,
            production: config.production,
            mockMode: true
        });
    }
    async simulateDelay(minMs, maxMs) {
        const delay = Math.random() * (maxMs - minMs) + minMs;
        return new Promise(resolve => setTimeout(resolve, delay));
    }
    mockCardPayment(chargeData, baseResponse) {
        // Simulate different card scenarios based on test data
        if (chargeData.source_id === 'card_fail_token') {
            return {
                ...baseResponse,
                status: 'failed',
                error_code: 'card_declined',
                error_message: 'Card declined by issuer'
            };
        }
        if (chargeData.source_id === 'card_pending_token') {
            return {
                ...baseResponse,
                status: 'charge_pending',
                card: {
                    brand: 'visa',
                    card_number: '4111',
                    type: 'credit',
                    holder_name: 'TEST USER'
                }
            };
        }
        // Successful card payment
        return {
            ...baseResponse,
            status: 'completed',
            authorization: `AUTH${Date.now()}`,
            card: {
                brand: 'visa',
                card_number: '4111',
                type: 'credit',
                holder_name: 'TEST USER'
            }
        };
    }
    mockBankTransferPayment(chargeData, baseResponse) {
        // Bank transfers are always pending initially
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 2); // 2 days from now
        return {
            ...baseResponse,
            status: 'charge_pending',
            due_date: dueDate.toISOString(),
            payment_method: {
                bank: 'Banco de Crédito del Perú',
                clabe: '0021350100000001234567',
                reference: `REF${Date.now()}`
            }
        };
    }
}
exports.MockOpenpayClient = MockOpenpayClient;
/**
 * Enhanced development mock configuration
 */
exports.developmentOpenpayConfig = {
    // Mock response scenarios for testing different outcomes
    testScenarios: {
        cards: {
            successToken: 'card_success_token',
            failToken: 'card_fail_token',
            pendingToken: 'card_pending_token',
            fraudToken: 'card_fraud_token'
        },
        customers: {
            validEmail: 'success@test.com',
            invalidEmail: 'fail@test.com',
            notFoundId: 'customer_notfound_123'
        },
        amounts: {
            success: 100,
            fail: 1, // Amounts under minimum for testing
            pending: 500
        }
    },
    // Mock webhook events
    webhookEvents: {
        chargeSucceeded: (chargeId) => ({
            type: 'charge.succeeded',
            event_date: new Date().toISOString(),
            data: {
                object: {
                    id: chargeId,
                    amount: 100,
                    status: 'completed',
                    authorization: `AUTH${Date.now()}`,
                    creation_date: new Date().toISOString()
                }
            }
        }),
        chargeFailed: (chargeId) => ({
            type: 'charge.failed',
            event_date: new Date().toISOString(),
            data: {
                object: {
                    id: chargeId,
                    amount: 100,
                    status: 'failed',
                    error_code: 'card_declined',
                    error_message: 'Insufficient funds'
                }
            }
        }),
        chargePending: (chargeId) => ({
            type: 'charge.created',
            event_date: new Date().toISOString(),
            data: {
                object: {
                    id: chargeId,
                    amount: 100,
                    status: 'charge_pending',
                    due_date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
                }
            }
        })
    }
};
/**
 * Utility functions for development testing
 */
exports.OpenpayDevUtils = {
    /**
     * Generate a mock webhook signature for testing
     */
    generateMockWebhookSignature(payload) {
        if (environment_1.isDevelopment || environment_1.isTest) {
            return 'mock_valid_signature';
        }
        return 'invalid_signature';
    },
    /**
     * Create test charge ID with specific outcome
     */
    createTestChargeId(outcome) {
        return `charge_mock_${outcome}_${Date.now()}`;
    },
    /**
     * Create test customer ID
     */
    createTestCustomerId() {
        return `cust_mock_${Date.now()}`;
    },
    /**
     * Validate that we're in development mode
     */
    validateDevelopmentMode() {
        if (!environment_1.isDevelopment && !environment_1.isTest) {
            structuredLogger_1.logger.error('Mock Openpay client should only be used in development/test mode');
            return false;
        }
        return true;
    },
    /**
     * Get mock environment variables for testing
     */
    getMockEnvironment() {
        return {
            OPENPAY_MERCHANT_ID: 'mock_merchant_dev',
            OPENPAY_PRIVATE_KEY: 'mock_private_key_dev',
            OPENPAY_PUBLIC_KEY: 'mock_public_key_dev',
            OPENPAY_PRODUCTION: 'false',
            OPENPAY_WEBHOOK_USERNAME: 'mock_user',
            OPENPAY_WEBHOOK_PASSWORD: 'mock_pass'
        };
    }
};
exports.default = MockOpenpayClient;
//# sourceMappingURL=openpayDevelopment.js.map