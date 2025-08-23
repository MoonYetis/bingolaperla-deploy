export interface DevelopmentProfile {
    name: string;
    description: string;
    openpay: {
        mockMode: boolean;
        mockDelayMs: number;
        mockSuccessRate: number;
        logLevel: 'info' | 'debug' | 'warn';
        enableWebhookSimulation: boolean;
    };
    database: {
        seedData: boolean;
        resetOnStart: boolean;
    };
    logging: {
        level: 'debug' | 'info' | 'warn' | 'error';
        enableSQLLogs: boolean;
    };
}
export declare const developmentProfiles: Record<string, DevelopmentProfile>;
export declare function getCurrentProfile(): DevelopmentProfile;
export declare function applyDevelopmentProfile(profileName?: string): void;
export declare const developmentUtils: {
    resetMockState: () => void;
    setMockBehavior: (behavior: "success" | "failure" | "random") => void;
    logCurrentConfig: () => void;
};
export declare const isInMockMode: () => boolean;
export declare const getMockDelayMs: () => number;
export declare const getMockSuccessRate: () => number;
declare const _default: {
    profiles: Record<string, DevelopmentProfile>;
    getCurrentProfile: typeof getCurrentProfile;
    applyDevelopmentProfile: typeof applyDevelopmentProfile;
    utils: {
        resetMockState: () => void;
        setMockBehavior: (behavior: "success" | "failure" | "random") => void;
        logCurrentConfig: () => void;
    };
    isInMockMode: () => boolean;
    getMockDelayMs: () => number;
    getMockSuccessRate: () => number;
};
export default _default;
//# sourceMappingURL=development.d.ts.map