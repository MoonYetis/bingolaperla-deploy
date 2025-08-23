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
    AGORA_APP_ID?: string;
    AGORA_APP_CERTIFICATE?: string;
};
export declare const isDevelopment: boolean;
export declare const isProduction: boolean;
export declare const isTest: boolean;
//# sourceMappingURL=environment.d.ts.map