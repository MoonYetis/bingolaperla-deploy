export declare const env: {
    NODE_ENV?: "development" | "production" | "test";
    PORT?: number;
    DATABASE_URL?: string;
    REDIS_URL?: string;
    JWT_SECRET?: string;
    JWT_EXPIRES_IN?: string;
    JWT_REFRESH_SECRET?: string;
    JWT_REFRESH_EXPIRES_IN?: string;
    FRONTEND_URL?: string;
    RATE_LIMIT_WINDOW_MS?: number;
    RATE_LIMIT_MAX_REQUESTS?: number;
    IZIPAY_PUBLIC_KEY?: string;
    IZIPAY_PRIVATE_KEY?: string;
    IZIPAY_ENDPOINT?: string;
    OPENPAY_MERCHANT_ID?: string;
    OPENPAY_PRIVATE_KEY?: string;
    OPENPAY_PUBLIC_KEY?: string;
    OPENPAY_PRODUCTION?: boolean;
    OPENPAY_WEBHOOK_USERNAME?: string;
    OPENPAY_WEBHOOK_PASSWORD?: string;
    OPENPAY_MOCK_MODE?: boolean;
    OPENPAY_MOCK_DELAY_MS?: number;
    OPENPAY_MOCK_SUCCESS_RATE?: number;
    AGORA_APP_ID?: string;
    AGORA_APP_CERTIFICATE?: string;
};
export declare const isDevelopment: boolean;
export declare const isProduction: boolean;
export declare const isTest: boolean;
export declare function validateDevelopmentEnvironment(): {
    valid: boolean;
    warnings: string[];
    errors: string[];
};
export declare function logEnvironmentValidation(): void;
//# sourceMappingURL=environment.d.ts.map