"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openpayConfig = void 0;
exports.validateOpenpayConfig = validateOpenpayConfig;
exports.createOpenpayClient = createOpenpayClient;
const environment_1 = require("./environment");
const structuredLogger_1 = require("@/utils/structuredLogger");
const axios_1 = __importDefault(require("axios"));
exports.openpayConfig = {
    merchantId: environment_1.env.OPENPAY_MERCHANT_ID || '',
    privateKey: environment_1.env.OPENPAY_PRIVATE_KEY || '',
    publicKey: environment_1.env.OPENPAY_PUBLIC_KEY || '',
    production: environment_1.env.OPENPAY_PRODUCTION,
    country: 'PE',
    currency: 'PEN',
    webhookUsername: environment_1.env.OPENPAY_WEBHOOK_USERNAME,
    webhookPassword: environment_1.env.OPENPAY_WEBHOOK_PASSWORD,
    mockMode: environment_1.env.OPENPAY_MOCK_MODE,
    mockDelayMs: environment_1.env.OPENPAY_MOCK_DELAY_MS,
    mockSuccessRate: environment_1.env.OPENPAY_MOCK_SUCCESS_RATE
};
// Validate Openpay configuration
function validateOpenpayConfig() {
    // In mock mode, we don't need real credentials
    if (exports.openpayConfig.mockMode) {
        structuredLogger_1.logger.info('Openpay configuration validated successfully (MOCK MODE)', {
            merchantId: exports.openpayConfig.merchantId,
            production: exports.openpayConfig.production,
            mockMode: exports.openpayConfig.mockMode,
            mockDelayMs: exports.openpayConfig.mockDelayMs,
            mockSuccessRate: exports.openpayConfig.mockSuccessRate,
            country: exports.openpayConfig.country
        });
        return true;
    }
    const required = ['merchantId', 'privateKey', 'publicKey'];
    for (const field of required) {
        if (!exports.openpayConfig[field]) {
            structuredLogger_1.logger.error(`Missing required Openpay configuration: ${field}`);
            return false;
        }
    }
    structuredLogger_1.logger.info('Openpay configuration validated successfully', {
        merchantId: exports.openpayConfig.merchantId.substring(0, 8) + '...',
        production: exports.openpayConfig.production,
        country: exports.openpayConfig.country
    });
    return true;
}
// Enhanced mock delay function that simulates network latency
async function mockDelay() {
    const delay = exports.openpayConfig.mockDelayMs;
    if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
    }
}
// Enhanced mock success/failure determination
function shouldMockSucceed() {
    return Math.random() < exports.openpayConfig.mockSuccessRate;
}
// Mock error responses for testing
function generateMockError(type = 'network') {
    const errors = {
        validation: {
            error_code: 'INVALID_REQUEST',
            description: 'Invalid card token or request format',
            request_id: `req_${Date.now()}`
        },
        card: {
            error_code: 'CARD_DECLINED',
            description: 'The card was declined by the issuing bank',
            request_id: `req_${Date.now()}`
        },
        network: {
            error_code: 'NETWORK_ERROR',
            description: 'Network communication error',
            request_id: `req_${Date.now()}`
        },
        fraud: {
            error_code: 'FRAUD_DETECTED',
            description: 'Transaction blocked by fraud detection',
            request_id: `req_${Date.now()}`
        }
    };
    return errors[type];
}
// Mock Openpay client implementation for development/testing
function createOpenpayClient() {
    if (!validateOpenpayConfig()) {
        throw new Error('Invalid Openpay configuration');
    }
    // If not in mock mode, create real HTTP client (for production/sandbox)
    if (!exports.openpayConfig.mockMode) {
        // Base URL for Openpay API
        const baseURL = exports.openpayConfig.production
            ? 'https://api.openpay.pe/v1'
            : 'https://sandbox-api.openpay.pe/v1';
        // Create axios instance with auth
        const httpClient = axios_1.default.create({
            baseURL: `${baseURL}/${exports.openpayConfig.merchantId}`,
            auth: {
                username: exports.openpayConfig.privateKey,
                password: ''
            },
            headers: {
                'Content-Type': 'application/json'
            }
        });
        // TODO: Implement real Openpay API calls
        structuredLogger_1.logger.warn('Real Openpay API not implemented yet - falling back to mock mode');
    }
    // Enhanced Mock Openpay client interface
    return {
        customers: {
            create: async (customerData) => {
                await mockDelay();
                structuredLogger_1.logger.info('Mock Openpay: Creating customer', {
                    name: customerData.name,
                    email: customerData.email,
                    mockMode: true
                });
                if (!shouldMockSucceed()) {
                    const error = generateMockError('validation');
                    structuredLogger_1.logger.warn('Mock Openpay: Customer creation failed', error);
                    throw error;
                }
                return {
                    id: `cust_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: customerData.name,
                    email: customerData.email,
                    phone_number: customerData.phone_number,
                    external_id: customerData.external_id,
                    creation_date: new Date().toISOString(),
                    status: 'active',
                    balance: 0
                };
            },
            get: async (customerId) => {
                await mockDelay();
                structuredLogger_1.logger.info('Mock Openpay: Getting customer', { customerId, mockMode: true });
                if (!shouldMockSucceed()) {
                    const error = generateMockError('network');
                    structuredLogger_1.logger.warn('Mock Openpay: Customer retrieval failed', error);
                    throw error;
                }
                return {
                    id: customerId,
                    name: 'Mock Customer',
                    email: 'mock@example.com',
                    phone_number: '+51987654321',
                    status: 'active',
                    balance: 0,
                    creation_date: new Date().toISOString()
                };
            }
        },
        charges: {
            create: async (chargeData) => {
                await mockDelay();
                structuredLogger_1.logger.info('Mock Openpay: Creating charge', {
                    method: chargeData.method,
                    amount: chargeData.amount,
                    mockMode: true
                });
                // Determine success/failure
                const shouldSucceed = shouldMockSucceed();
                const chargeId = `charge_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                // Mock different payment methods
                if (chargeData.method === 'card') {
                    if (!shouldSucceed) {
                        const errorType = Math.random() < 0.5 ? 'card' : 'fraud';
                        const error = generateMockError(errorType);
                        structuredLogger_1.logger.warn('Mock Openpay: Card charge failed', error);
                        throw error;
                    }
                    return {
                        id: chargeId,
                        status: 'completed',
                        amount: chargeData.amount,
                        currency: chargeData.currency || 'pen',
                        authorization: `AUTH_MOCK_${Date.now()}`,
                        creation_date: new Date().toISOString(),
                        card: {
                            brand: ['visa', 'mastercard', 'amex'][Math.floor(Math.random() * 3)],
                            card_number: '****' + Math.floor(1000 + Math.random() * 9000),
                            type: Math.random() < 0.7 ? 'credit' : 'debit',
                            holder_name: 'MOCK CARD HOLDER'
                        },
                        order_id: chargeData.order_id,
                        description: chargeData.description,
                        customer: chargeData.customer,
                        fee: {
                            amount: parseFloat((chargeData.amount * 0.035).toFixed(2)), // 3.5% fee
                            currency: chargeData.currency || 'pen'
                        }
                    };
                }
                else if (chargeData.method === 'bank_account') {
                    if (!shouldSucceed) {
                        const error = generateMockError('validation');
                        structuredLogger_1.logger.warn('Mock Openpay: Bank transfer failed', error);
                        throw error;
                    }
                    const transferId = `transfer_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    return {
                        id: transferId,
                        status: 'charge_pending',
                        amount: chargeData.amount,
                        currency: chargeData.currency || 'pen',
                        method: 'bank_account',
                        creation_date: new Date().toISOString(),
                        due_date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
                        payment_method: {
                            bank: ['Banco de Crédito del Perú', 'BBVA', 'Interbank', 'Scotiabank'][Math.floor(Math.random() * 4)],
                            clabe: `002135010000000${Math.floor(1000000 + Math.random() * 9000000)}`,
                            reference: `REF_MOCK_${Date.now()}`
                        },
                        order_id: chargeData.order_id,
                        description: chargeData.description,
                        customer: chargeData.customer
                    };
                }
                // Unsupported method
                const error = {
                    error_code: 'UNSUPPORTED_METHOD',
                    description: `Payment method ${chargeData.method} is not supported`,
                    request_id: `req_${Date.now()}`
                };
                structuredLogger_1.logger.warn('Mock Openpay: Unsupported payment method', error);
                throw error;
            },
            get: async (chargeId) => {
                await mockDelay();
                structuredLogger_1.logger.info('Mock Openpay: Getting charge', { chargeId, mockMode: true });
                if (!shouldMockSucceed()) {
                    const error = generateMockError('network');
                    structuredLogger_1.logger.warn('Mock Openpay: Charge retrieval failed', error);
                    throw error;
                }
                // Generate mock charge data based on ID pattern
                const isCardCharge = chargeId.includes('charge_mock');
                const isBankTransfer = chargeId.includes('transfer_mock');
                return {
                    id: chargeId,
                    status: Math.random() < 0.9 ? 'completed' : 'charge_pending',
                    amount: 100 + Math.floor(Math.random() * 900), // Random amount between 100-1000
                    currency: 'pen',
                    description: 'Mock charge for testing',
                    creation_date: new Date().toISOString(),
                    ...(isCardCharge && {
                        authorization: `AUTH_MOCK_${Date.now()}`,
                        card: {
                            brand: 'visa',
                            card_number: '****1234',
                            type: 'credit',
                            holder_name: 'MOCK HOLDER'
                        }
                    }),
                    ...(isBankTransfer && {
                        payment_method: {
                            bank: 'Banco de Crédito del Perú',
                            clabe: '0021350100000001234567',
                            reference: `REF_MOCK_${Date.now()}`
                        }
                    })
                };
            }
        },
        // Enhanced webhook utilities
        webhooks: {
            verify: (payload, signature, key) => {
                structuredLogger_1.logger.info('Mock Openpay: Verifying webhook signature', {
                    mockMode: true,
                    payloadLength: payload.length
                });
                // In mock mode, always return true unless testing failure scenarios
                if (exports.openpayConfig.mockMode) {
                    return shouldMockSucceed();
                }
                // In production, implement actual HMAC verification
                return true;
            },
            // Helper to generate mock webhook events
            generateMockEvent: (eventType, objectData) => {
                return {
                    id: `evt_mock_${Date.now()}`,
                    type: eventType,
                    event_date: new Date().toISOString(),
                    data: {
                        object: {
                            ...objectData,
                            id: objectData.id || `obj_mock_${Date.now()}`,
                            creation_date: new Date().toISOString()
                        }
                    },
                    request: `req_mock_${Date.now()}`
                };
            }
        }
    };
}
exports.default = exports.openpayConfig;
//# sourceMappingURL=openpay.js.map