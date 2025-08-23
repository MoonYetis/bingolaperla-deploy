export interface MockPaymentScenario {
    name: string;
    description: string;
    cardToken?: string;
    shouldSucceed: boolean;
    expectedError?: string;
    delayMs?: number;
}
export declare const mockPaymentScenarios: Record<string, MockPaymentScenario>;
export declare class OpenpayTestUtils {
    /**
     * Generate test customer data
     */
    static generateTestCustomer(userId?: string): {
        userId: string;
        name: string;
        email: string;
        phone: string;
    };
    /**
     * Generate test card payment data
     */
    static generateCardPaymentData(scenario?: string, userId?: string): {
        userId: string;
        amount: number;
        token: string;
        deviceSessionId: string;
        customerEmail: string;
        customerName: string;
        customerPhone: string;
    };
    /**
     * Generate test bank transfer data
     */
    static generateBankTransferData(userId?: string): {
        userId: string;
        amount: number;
        customerEmail: string;
        customerName: string;
    };
    /**
     * Set up mock environment for specific test scenario
     */
    static setupMockScenario(scenarioName: string): MockPaymentScenario;
    /**
     * Generate mock webhook event for testing
     */
    static generateMockWebhookEvent(eventType: string, chargeData: any): {
        id: string;
        type: string;
        event_date: string;
        data: {
            object: {
                authorization: any;
                card: any;
                id: any;
                amount: any;
                status: string;
                creation_date: string;
                customer: {
                    id: any;
                    email: any;
                };
            };
        };
        request: string;
    };
    /**
     * Create test webhook payload with signature
     */
    static createTestWebhookPayload(eventType: string, chargeData: any): {
        event: {
            id: string;
            type: string;
            event_date: string;
            data: {
                object: {
                    authorization: any;
                    card: any;
                    id: any;
                    amount: any;
                    status: string;
                    creation_date: string;
                    customer: {
                        id: any;
                        email: any;
                    };
                };
            };
            request: string;
        };
        payload: string;
        signature: string;
        headers: {
            'Content-Type': string;
            'X-Openpay-Signature': string;
        };
    };
    /**
     * Reset mock environment to default state
     */
    static resetMockEnvironment(): void;
    /**
     * Validate mock response format
     */
    static validateMockResponse(response: any, expectedType: 'card' | 'bank_transfer'): boolean;
    /**
     * Get available test scenarios
     */
    static getAvailableScenarios(): string[];
    /**
     * Get scenario details
     */
    static getScenario(name: string): MockPaymentScenario | undefined;
    /**
     * Run a quick mock payment test
     */
    static runQuickTest(scenarioName?: string): Promise<{
        success: boolean;
        scenario: string;
        paymentData: {
            userId: string;
            amount: number;
            token: string;
            deviceSessionId: string;
            customerEmail: string;
            customerName: string;
            customerPhone: string;
        };
        message: string;
    }>;
    /**
     * Stress test with multiple scenarios
     */
    static runStressTest(iterations?: number): Promise<{
        totalIterations: number;
        successes: number;
        failures: number;
        successRate: number;
        results: any[];
    }>;
}
export default OpenpayTestUtils;
//# sourceMappingURL=openpayTestUtils.d.ts.map