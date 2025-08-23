"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyWebhookSecurity = exports.applyPaymentSecurity = exports.OpenpaySecurityMiddleware = void 0;
const structuredLogger_1 = require("@/utils/structuredLogger");
const openpay_1 = require("@/config/openpay");
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("@/config/database");
// Rate limiting tracking
const rateLimitTracker = new Map();
class OpenpaySecurityMiddleware {
    /**
     * Validate and sanitize payment request inputs
     */
    static validatePaymentInputs(req, res, next) {
        const { amount, customerEmail, customerName } = req.body;
        // Validate amount
        if (!amount || typeof amount !== 'number' || isNaN(amount)) {
            structuredLogger_1.logger.warn('Invalid payment amount provided', {
                amount,
                userId: req.user?.userId,
                ip: req.ip
            });
            return res.status(400).json({
                success: false,
                error: 'Invalid amount provided',
                code: 'INVALID_AMOUNT'
            });
        }
        if (amount < 1 || amount > 10000) {
            structuredLogger_1.logger.warn('Payment amount outside allowed range', {
                amount,
                userId: req.user?.userId,
                ip: req.ip
            });
            return res.status(400).json({
                success: false,
                error: 'Amount must be between 1 and 10,000 PEN',
                code: 'AMOUNT_OUT_OF_RANGE'
            });
        }
        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!customerEmail || !emailRegex.test(customerEmail)) {
            structuredLogger_1.logger.warn('Invalid email format in payment request', {
                customerEmail,
                userId: req.user?.userId,
                ip: req.ip
            });
            return res.status(400).json({
                success: false,
                error: 'Valid email address is required',
                code: 'INVALID_EMAIL'
            });
        }
        // Validate customer name (sanitize and check length)
        if (!customerName || typeof customerName !== 'string' || customerName.trim().length < 2) {
            structuredLogger_1.logger.warn('Invalid customer name in payment request', {
                customerName,
                userId: req.user?.userId,
                ip: req.ip
            });
            return res.status(400).json({
                success: false,
                error: 'Valid customer name is required (minimum 2 characters)',
                code: 'INVALID_CUSTOMER_NAME'
            });
        }
        // Sanitize customer name (remove harmful characters)
        req.body.customerName = customerName.trim().replace(/[<>\"'&]/g, '');
        // Check for suspicious patterns in name
        if (this.hasSuspiciousPatterns(req.body.customerName)) {
            this.logSuspiciousActivity({
                userId: req.user?.userId,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                pattern: 'SUSPICIOUS_CUSTOMER_NAME',
                risk: 'MEDIUM'
            });
        }
        next();
    }
    /**
     * Detect and prevent fraud attempts
     */
    static async fraudDetection(req, res, next) {
        const userId = req.user?.userId;
        const ip = req.ip;
        const userAgent = req.get('User-Agent');
        const { amount } = req.body;
        try {
            // Check for rapid successive payment attempts
            if (userId) {
                const recentAttempts = await this.getRecentPaymentAttempts(userId);
                if (recentAttempts >= 5) {
                    this.logSuspiciousActivity({
                        userId,
                        ip,
                        userAgent,
                        pattern: 'RAPID_PAYMENT_ATTEMPTS',
                        risk: 'HIGH'
                    });
                    return res.status(429).json({
                        success: false,
                        error: 'Too many payment attempts. Please wait before trying again.',
                        code: 'RATE_LIMIT_EXCEEDED'
                    });
                }
            }
            // Check for unusually large amounts for new users
            if (userId && amount > 1000) {
                const userCreatedAt = await this.getUserCreationDate(userId);
                const daysSinceRegistration = (Date.now() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24);
                if (daysSinceRegistration < 7) {
                    this.logSuspiciousActivity({
                        userId,
                        ip,
                        userAgent,
                        pattern: 'LARGE_AMOUNT_NEW_USER',
                        risk: 'HIGH'
                    });
                    // Don't block, but flag for manual review
                    req.body.requireManualReview = true;
                }
            }
            // Check for multiple different payment methods from same IP
            const ipPaymentMethods = await this.getPaymentMethodsFromIP(ip);
            if (ipPaymentMethods.length > 3) {
                this.logSuspiciousActivity({
                    userId,
                    ip,
                    userAgent,
                    pattern: 'MULTIPLE_PAYMENT_METHODS_SAME_IP',
                    risk: 'MEDIUM'
                });
            }
            // Device fingerprinting - check for suspicious user agent patterns
            if (userAgent && this.isSuspiciousUserAgent(userAgent)) {
                this.logSuspiciousActivity({
                    userId,
                    ip,
                    userAgent,
                    pattern: 'SUSPICIOUS_USER_AGENT',
                    risk: 'MEDIUM'
                });
            }
            next();
        }
        catch (error) {
            structuredLogger_1.logger.error('Error in fraud detection middleware', error, { userId, ip });
            next(); // Don't block legitimate requests due to detection errors
        }
    }
    /**
     * Enhanced webhook signature verification
     */
    static verifyWebhookSignature(req, res, next) {
        const signature = req.headers['x-openpay-signature'];
        const timestamp = req.headers['x-openpay-timestamp'];
        if (!openpay_1.openpayConfig.webhookPassword) {
            structuredLogger_1.logger.warn('Webhook password not configured, skipping signature verification');
            return next();
        }
        if (!signature || !timestamp) {
            structuredLogger_1.logger.warn('Missing webhook signature or timestamp', {
                hasSignature: !!signature,
                hasTimestamp: !!timestamp,
                ip: req.ip
            });
            return res.status(400).json({
                success: false,
                error: 'Missing webhook signature or timestamp',
                code: 'MISSING_WEBHOOK_DATA'
            });
        }
        // Check timestamp to prevent replay attacks (5 minutes tolerance)
        const webhookTimestamp = parseInt(timestamp, 10);
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const timestampTolerance = 5 * 60; // 5 minutes
        if (Math.abs(currentTimestamp - webhookTimestamp) > timestampTolerance) {
            structuredLogger_1.logger.warn('Webhook timestamp outside tolerance', {
                webhookTimestamp,
                currentTimestamp,
                difference: Math.abs(currentTimestamp - webhookTimestamp),
                ip: req.ip
            });
            return res.status(400).json({
                success: false,
                error: 'Webhook timestamp outside acceptable range',
                code: 'INVALID_TIMESTAMP'
            });
        }
        // Verify signature
        const payload = JSON.stringify(req.body);
        const expectedSignature = crypto_1.default
            .createHmac('sha256', openpay_1.openpayConfig.webhookPassword)
            .update(`${timestamp}.${payload}`)
            .digest('hex');
        const providedSignature = signature.replace('sha256=', '');
        try {
            const isValid = crypto_1.default.timingSafeEqual(Buffer.from(expectedSignature, 'hex'), Buffer.from(providedSignature, 'hex'));
            if (!isValid) {
                structuredLogger_1.logger.warn('Invalid webhook signature', {
                    providedSignature: providedSignature.substring(0, 8) + '...',
                    ip: req.ip
                });
                return res.status(401).json({
                    success: false,
                    error: 'Invalid webhook signature',
                    code: 'INVALID_SIGNATURE'
                });
            }
        }
        catch (error) {
            structuredLogger_1.logger.error('Error verifying webhook signature', error, { ip: req.ip });
            return res.status(400).json({
                success: false,
                error: 'Signature verification failed',
                code: 'SIGNATURE_VERIFICATION_ERROR'
            });
        }
        structuredLogger_1.logger.info('Webhook signature verified successfully', { ip: req.ip });
        next();
    }
    /**
     * Check for suspicious patterns in input strings
     */
    static hasSuspiciousPatterns(input) {
        const suspiciousPatterns = [
            /script/i,
            /javascript/i,
            /vbscript/i,
            /onload/i,
            /onerror/i,
            /<.*>/,
            /\{.*\}/,
            /SELECT.*FROM/i,
            /INSERT.*INTO/i,
            /DROP.*TABLE/i,
            /UNION.*SELECT/i,
            /--/,
            /\/\*/,
            /\*\//
        ];
        return suspiciousPatterns.some(pattern => pattern.test(input));
    }
    /**
     * Get recent payment attempts for user
     */
    static async getRecentPaymentAttempts(userId) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const attempts = await database_1.prisma.openpayTransaction.count({
            where: {
                depositRequest: {
                    userId
                },
                createdAt: {
                    gte: fiveMinutesAgo
                }
            }
        });
        return attempts;
    }
    /**
     * Get user creation date
     */
    static async getUserCreationDate(userId) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            select: { createdAt: true }
        });
        return user?.createdAt || new Date();
    }
    /**
     * Get payment methods used from specific IP
     */
    static async getPaymentMethodsFromIP(ip) {
        const transactions = await database_1.prisma.openpayTransaction.findMany({
            where: {
                ipAddress: ip,
                createdAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                }
            },
            select: {
                paymentMethod: true
            },
            distinct: ['paymentMethod']
        });
        return transactions.map(t => t.paymentMethod);
    }
    /**
     * Check if user agent looks suspicious
     */
    static isSuspiciousUserAgent(userAgent) {
        const suspiciousPatterns = [
            /bot/i,
            /crawler/i,
            /spider/i,
            /scraper/i,
            /curl/i,
            /wget/i,
            /python/i,
            /php/i,
            /java/i,
            /^$/,
            /null/i,
            /undefined/i
        ];
        return suspiciousPatterns.some(pattern => pattern.test(userAgent));
    }
    /**
     * Log suspicious activity
     */
    static logSuspiciousActivity(activity) {
        structuredLogger_1.logger.warn('Suspicious payment activity detected', {
            ...activity,
            timestamp: new Date().toISOString(),
            component: 'OpenpaySecurityMiddleware'
        });
        // Store in database for analysis
        this.storeSuspiciousActivity(activity).catch(error => {
            structuredLogger_1.logger.error('Failed to store suspicious activity', error);
        });
    }
    /**
     * Store suspicious activity in database
     */
    static async storeSuspiciousActivity(activity) {
        try {
            // For now, we'll use the existing audit system
            // In production, you might want a dedicated suspicious_activities table
            structuredLogger_1.logger.info('Storing suspicious activity for analysis', {
                pattern: activity.pattern,
                risk: activity.risk,
                userId: activity.userId,
                ip: activity.ip
            });
        }
        catch (error) {
            structuredLogger_1.logger.error('Error storing suspicious activity', error);
        }
    }
}
exports.OpenpaySecurityMiddleware = OpenpaySecurityMiddleware;
/**
 * Apply security measures to payment routes
 */
exports.applyPaymentSecurity = [
    OpenpaySecurityMiddleware.validatePaymentInputs,
    OpenpaySecurityMiddleware.fraudDetection
];
/**
 * Apply security measures to webhook routes
 */
exports.applyWebhookSecurity = [
    OpenpaySecurityMiddleware.verifyWebhookSignature
];
//# sourceMappingURL=openpaySecurityMiddleware.js.map