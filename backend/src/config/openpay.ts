import { env } from './environment';
import { logger } from '@/utils/structuredLogger';
import axios, { AxiosInstance } from 'axios';

export interface OpenpayConfig {
  merchantId: string;
  privateKey: string;
  publicKey: string;
  production: boolean;
  country: 'PE';
  currency: 'PEN';
  webhookUsername?: string;
  webhookPassword?: string;
  mockMode: boolean;
  mockDelayMs: number;
  mockSuccessRate: number;
}

export const openpayConfig: OpenpayConfig = {
  merchantId: env.OPENPAY_MERCHANT_ID || '',
  privateKey: env.OPENPAY_PRIVATE_KEY || '',
  publicKey: env.OPENPAY_PUBLIC_KEY || '',
  production: env.OPENPAY_PRODUCTION,
  country: 'PE',
  currency: 'PEN',
  webhookUsername: env.OPENPAY_WEBHOOK_USERNAME,
  webhookPassword: env.OPENPAY_WEBHOOK_PASSWORD,
  mockMode: env.OPENPAY_MOCK_MODE,
  mockDelayMs: env.OPENPAY_MOCK_DELAY_MS,
  mockSuccessRate: env.OPENPAY_MOCK_SUCCESS_RATE
};

// Validate Openpay configuration
export function validateOpenpayConfig(): boolean {
  // In mock mode, we don't need real credentials
  if (openpayConfig.mockMode) {
    logger.info('Openpay configuration validated successfully (MOCK MODE)', {
      merchantId: openpayConfig.merchantId,
      production: openpayConfig.production,
      mockMode: openpayConfig.mockMode,
      mockDelayMs: openpayConfig.mockDelayMs,
      mockSuccessRate: openpayConfig.mockSuccessRate,
      country: openpayConfig.country
    });
    return true;
  }

  const required = ['merchantId', 'privateKey', 'publicKey'];
  
  for (const field of required) {
    if (!openpayConfig[field as keyof OpenpayConfig]) {
      logger.error(`Missing required Openpay configuration: ${field}`);
      return false;
    }
  }
  
  logger.info('Openpay configuration validated successfully', {
    merchantId: openpayConfig.merchantId.substring(0, 8) + '...',
    production: openpayConfig.production,
    country: openpayConfig.country
  });
  
  return true;
}

// Enhanced mock delay function that simulates network latency
async function mockDelay(): Promise<void> {
  const delay = openpayConfig.mockDelayMs;
  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

// Enhanced mock success/failure determination
function shouldMockSucceed(): boolean {
  return Math.random() < openpayConfig.mockSuccessRate;
}

// Mock error responses for testing
function generateMockError(type: 'validation' | 'card' | 'network' | 'fraud' = 'network') {
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
export function createOpenpayClient() {
  if (!validateOpenpayConfig()) {
    throw new Error('Invalid Openpay configuration');
  }

  // If not in mock mode, create real HTTP client (for production/sandbox)
  if (!openpayConfig.mockMode) {
    // Base URL for Openpay API
    const baseURL = openpayConfig.production 
      ? 'https://api.openpay.pe/v1'
      : 'https://sandbox-api.openpay.pe/v1';

    // Create axios instance with auth
    const httpClient: AxiosInstance = axios.create({
      baseURL: `${baseURL}/${openpayConfig.merchantId}`,
      auth: {
        username: openpayConfig.privateKey,
        password: ''
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // TODO: Implement real Openpay API calls
    logger.warn('Real Openpay API not implemented yet - falling back to mock mode');
  }

  // Enhanced Mock Openpay client interface
  return {
    customers: {
      create: async (customerData: any) => {
        await mockDelay();
        logger.info('Mock Openpay: Creating customer', {
          name: customerData.name,
          email: customerData.email,
          mockMode: true
        });

        if (!shouldMockSucceed()) {
          const error = generateMockError('validation');
          logger.warn('Mock Openpay: Customer creation failed', error);
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
      
      get: async (customerId: string) => {
        await mockDelay();
        logger.info('Mock Openpay: Getting customer', { customerId, mockMode: true });
        
        if (!shouldMockSucceed()) {
          const error = generateMockError('network');
          logger.warn('Mock Openpay: Customer retrieval failed', error);
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
      create: async (chargeData: any) => {
        await mockDelay();
        logger.info('Mock Openpay: Creating charge', { 
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
            logger.warn('Mock Openpay: Card charge failed', error);
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
        } else if (chargeData.method === 'bank_account') {
          if (!shouldSucceed) {
            const error = generateMockError('validation');
            logger.warn('Mock Openpay: Bank transfer failed', error);
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
        logger.warn('Mock Openpay: Unsupported payment method', error);
        throw error;
      },
      
      get: async (chargeId: string) => {
        await mockDelay();
        logger.info('Mock Openpay: Getting charge', { chargeId, mockMode: true });
        
        if (!shouldMockSucceed()) {
          const error = generateMockError('network');
          logger.warn('Mock Openpay: Charge retrieval failed', error);
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
      verify: (payload: string, signature: string, key: string) => {
        logger.info('Mock Openpay: Verifying webhook signature', { 
          mockMode: true,
          payloadLength: payload.length
        });
        
        // In mock mode, always return true unless testing failure scenarios
        if (openpayConfig.mockMode) {
          return shouldMockSucceed();
        }
        
        // In production, implement actual HMAC verification
        return true;
      },

      // Helper to generate mock webhook events
      generateMockEvent: (eventType: string, objectData: any) => {
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

export default openpayConfig;