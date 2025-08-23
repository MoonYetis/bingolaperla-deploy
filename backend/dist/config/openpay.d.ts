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
export declare const openpayConfig: OpenpayConfig;
export declare function validateOpenpayConfig(): boolean;
export declare function createOpenpayClient(): {
    customers: {
        create: (customerData: any) => Promise<{
            id: string;
            name: any;
            email: any;
            phone_number: any;
            external_id: any;
            creation_date: string;
            status: string;
            balance: number;
        }>;
        get: (customerId: string) => Promise<{
            id: string;
            name: string;
            email: string;
            phone_number: string;
            status: string;
            balance: number;
            creation_date: string;
        }>;
    };
    charges: {
        create: (chargeData: any) => Promise<{
            id: string;
            status: string;
            amount: any;
            currency: any;
            authorization: string;
            creation_date: string;
            card: {
                brand: string;
                card_number: string;
                type: string;
                holder_name: string;
            };
            order_id: any;
            description: any;
            customer: any;
            fee: {
                amount: number;
                currency: any;
            };
            method?: undefined;
            due_date?: undefined;
            payment_method?: undefined;
        } | {
            id: string;
            status: string;
            amount: any;
            currency: any;
            method: string;
            creation_date: string;
            due_date: string;
            payment_method: {
                bank: string;
                clabe: string;
                reference: string;
            };
            order_id: any;
            description: any;
            customer: any;
            authorization?: undefined;
            card?: undefined;
            fee?: undefined;
        }>;
        get: (chargeId: string) => Promise<{
            payment_method: {
                bank: string;
                clabe: string;
                reference: string;
            };
            authorization: string;
            card: {
                brand: string;
                card_number: string;
                type: string;
                holder_name: string;
            };
            id: string;
            status: string;
            amount: number;
            currency: string;
            description: string;
            creation_date: string;
        }>;
    };
    webhooks: {
        verify: (payload: string, signature: string, key: string) => boolean;
        generateMockEvent: (eventType: string, objectData: any) => {
            id: string;
            type: string;
            event_date: string;
            data: {
                object: any;
            };
            request: string;
        };
    };
};
export default openpayConfig;
//# sourceMappingURL=openpay.d.ts.map