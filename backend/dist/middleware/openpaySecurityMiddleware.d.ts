import { Request, Response, NextFunction } from 'express';
export declare class OpenpaySecurityMiddleware {
    /**
     * Validate and sanitize payment request inputs
     */
    static validatePaymentInputs(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>>;
    /**
     * Detect and prevent fraud attempts
     */
    static fraudDetection(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    /**
     * Enhanced webhook signature verification
     */
    static verifyWebhookSignature(req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>>;
    /**
     * Check for suspicious patterns in input strings
     */
    private static hasSuspiciousPatterns;
    /**
     * Get recent payment attempts for user
     */
    private static getRecentPaymentAttempts;
    /**
     * Get user creation date
     */
    private static getUserCreationDate;
    /**
     * Get payment methods used from specific IP
     */
    private static getPaymentMethodsFromIP;
    /**
     * Check if user agent looks suspicious
     */
    private static isSuspiciousUserAgent;
    /**
     * Log suspicious activity
     */
    private static logSuspiciousActivity;
    /**
     * Store suspicious activity in database
     */
    private static storeSuspiciousActivity;
}
/**
 * Apply security measures to payment routes
 */
export declare const applyPaymentSecurity: (typeof OpenpaySecurityMiddleware.validatePaymentInputs | typeof OpenpaySecurityMiddleware.fraudDetection)[];
/**
 * Apply security measures to webhook routes
 */
export declare const applyWebhookSecurity: (typeof OpenpaySecurityMiddleware.verifyWebhookSignature)[];
//# sourceMappingURL=openpaySecurityMiddleware.d.ts.map