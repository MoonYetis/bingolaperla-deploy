import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/structuredLogger';
import { openpayConfig } from '@/config/openpay';
import crypto from 'crypto';
import { prisma } from '@/config/database';

// Rate limiting tracking
const rateLimitTracker = new Map<string, { attempts: number; lastAttempt: Date }>();

// Suspicious activity patterns
interface SuspiciousActivity {
  userId?: string;
  ip: string;
  userAgent?: string;
  pattern: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export class OpenpaySecurityMiddleware {
  
  /**
   * Validate and sanitize payment request inputs
   */
  static validatePaymentInputs(req: Request, res: Response, next: NextFunction) {
    const { amount, customerEmail, customerName } = req.body;

    // Validate amount
    if (!amount || typeof amount !== 'number' || isNaN(amount)) {
      logger.warn('Invalid payment amount provided', { 
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
      logger.warn('Payment amount outside allowed range', { 
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
      logger.warn('Invalid email format in payment request', { 
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
      logger.warn('Invalid customer name in payment request', { 
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
  static async fraudDetection(req: Request, res: Response, next: NextFunction) {
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
    } catch (error) {
      logger.error('Error in fraud detection middleware', error as Error, { userId, ip });
      next(); // Don't block legitimate requests due to detection errors
    }
  }

  /**
   * Enhanced webhook signature verification
   */
  static verifyWebhookSignature(req: Request, res: Response, next: NextFunction) {
    const signature = req.headers['x-openpay-signature'] as string;
    const timestamp = req.headers['x-openpay-timestamp'] as string;

    if (!openpayConfig.webhookPassword) {
      logger.warn('Webhook password not configured, skipping signature verification');
      return next();
    }

    if (!signature || !timestamp) {
      logger.warn('Missing webhook signature or timestamp', { 
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
      logger.warn('Webhook timestamp outside tolerance', { 
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
    const expectedSignature = crypto
      .createHmac('sha256', openpayConfig.webhookPassword)
      .update(`${timestamp}.${payload}`)
      .digest('hex');

    const providedSignature = signature.replace('sha256=', '');

    try {
      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(providedSignature, 'hex')
      );

      if (!isValid) {
        logger.warn('Invalid webhook signature', { 
          providedSignature: providedSignature.substring(0, 8) + '...',
          ip: req.ip 
        });
        return res.status(401).json({
          success: false,
          error: 'Invalid webhook signature',
          code: 'INVALID_SIGNATURE'
        });
      }
    } catch (error) {
      logger.error('Error verifying webhook signature', error as Error, { ip: req.ip });
      return res.status(400).json({
        success: false,
        error: 'Signature verification failed',
        code: 'SIGNATURE_VERIFICATION_ERROR'
      });
    }

    logger.info('Webhook signature verified successfully', { ip: req.ip });
    next();
  }

  /**
   * Check for suspicious patterns in input strings
   */
  private static hasSuspiciousPatterns(input: string): boolean {
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
  private static async getRecentPaymentAttempts(userId: string): Promise<number> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const attempts = await prisma.openpayTransaction.count({
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
  private static async getUserCreationDate(userId: string): Promise<Date> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true }
    });

    return user?.createdAt || new Date();
  }

  /**
   * Get payment methods used from specific IP
   */
  private static async getPaymentMethodsFromIP(ip: string): Promise<string[]> {
    const transactions = await prisma.openpayTransaction.findMany({
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
  private static isSuspiciousUserAgent(userAgent: string): boolean {
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
  private static logSuspiciousActivity(activity: SuspiciousActivity) {
    logger.warn('Suspicious payment activity detected', {
      ...activity,
      timestamp: new Date().toISOString(),
      component: 'OpenpaySecurityMiddleware'
    });

    // Store in database for analysis
    this.storeSuspiciousActivity(activity).catch(error => {
      logger.error('Failed to store suspicious activity', error as Error);
    });
  }

  /**
   * Store suspicious activity in database
   */
  private static async storeSuspiciousActivity(activity: SuspiciousActivity): Promise<void> {
    try {
      // For now, we'll use the existing audit system
      // In production, you might want a dedicated suspicious_activities table
      logger.info('Storing suspicious activity for analysis', {
        pattern: activity.pattern,
        risk: activity.risk,
        userId: activity.userId,
        ip: activity.ip
      });
    } catch (error) {
      logger.error('Error storing suspicious activity', error as Error);
    }
  }
}

/**
 * Apply security measures to payment routes
 */
export const applyPaymentSecurity = [
  OpenpaySecurityMiddleware.validatePaymentInputs,
  OpenpaySecurityMiddleware.fraudDetection
];

/**
 * Apply security measures to webhook routes
 */
export const applyWebhookSecurity = [
  OpenpaySecurityMiddleware.verifyWebhookSignature
];