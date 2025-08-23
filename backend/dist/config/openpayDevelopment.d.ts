export interface MockPaymentResponse {
    id: string;
    status: 'completed' | 'failed' | 'charge_pending' | 'cancelled';
    amount: number;
    currency: string;
    authorization?: string;
    creation_date: string;
    due_date?: string;
    card?: {
        brand: string;
        card_number: string;
        type: string;
        holder_name: string;
    };
    payment_method?: {
        bank: string;
        clabe: string;
        reference: string;
    };
    error_code?: string;
    error_message?: string;
    order_id?: string;
}
export interface MockCustomerResponse {
    id: string;
    name: string;
    email: string;
    phone_number?: string;
    external_id?: string;
    creation_date: string;
}
/**
 * Mock Openpay client for development and testing
 * This provides realistic responses without making actual API calls
 */
export declare class MockOpenpayClient {
    private config;
    constructor(config: any);
    customers: {
        create: (customerData: any) => Promise<MockCustomerResponse>;
        get: (customerId: string) => Promise<MockCustomerResponse>;
    };
    charges: {
        create: (chargeData: any) => Promise<MockPaymentResponse>;
        get: (chargeId: string) => Promise<MockPaymentResponse>;
    };
    webhooks: {
        verify: (payload: string, signature: string, key: string) => boolean;
    };
    private simulateDelay;
    private mockCardPayment;
    private mockBankTransferPayment;
}
/**
 * Enhanced development mock configuration
 */
export declare const developmentOpenpayConfig: {
    testScenarios: {
        cards: {
            successToken: string;
            failToken: string;
            pendingToken: string;
            fraudToken: string;
        };
        customers: {
            validEmail: string;
            invalidEmail: string;
            notFoundId: string;
        };
        amounts: {
            success: number;
            fail: number;
            pending: number;
        };
    };
    webhookEvents: {
        chargeSucceeded: (chargeId: string) => {
            type: string;
            event_date: string;
            data: {
                object: {
                    id: string;
                    amount: number;
                    status: string;
                    authorization: string;
                    creation_date: string;
                };
            };
        };
        chargeFailed: (chargeId: string) => {
            type: string;
            event_date: string;
            data: {
                object: {
                    id: string;
                    amount: number;
                    status: string;
                    error_code: string;
                    error_message: string;
                };
            };
        };
        chargePending: (chargeId: string) => {
            type: string;
            event_date: string;
            data: {
                object: {
                    id: string;
                    amount: number;
                    status: string;
                    due_date: string;
                };
            };
        };
    };
};
/**
 * Utility functions for development testing
 */
export declare const OpenpayDevUtils: {
    /**
     * Generate a mock webhook signature for testing
     */
    generateMockWebhookSignature(payload: string): string;
    /**
     * Create test charge ID with specific outcome
     */
    createTestChargeId(outcome: "success" | "fail" | "pending"): string;
    /**
     * Create test customer ID
     */
    createTestCustomerId(): string;
    /**
     * Validate that we're in development mode
     */
    validateDevelopmentMode(): boolean;
    /**
     * Get mock environment variables for testing
     */
    getMockEnvironment(): Record<string, string>;
};
export default MockOpenpayClient;
//# sourceMappingURL=openpayDevelopment.d.ts.map