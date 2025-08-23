"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenpayService = void 0;
const database_1 = require("@/config/database");
const openpay_1 = require("@/config/openpay");
const structuredLogger_1 = require("@/utils/structuredLogger");
const notificationService_1 = require("./notificationService");
const walletService_1 = require("./walletService");
const crypto_1 = __importDefault(require("crypto"));
class OpenpayService {
    constructor() {
        this.openpay = (0, openpay_1.createOpenpayClient)();
        this.notificationService = new notificationService_1.NotificationService();
        this.walletService = new walletService_1.WalletService();
    }
    /**
     * Process credit/debit card payment
     */
    async processCardPayment(paymentData) {
        try {
            structuredLogger_1.logger.info('Processing Openpay card payment', {
                userId: paymentData.userId,
                amount: paymentData.amount,
                deviceSessionId: paymentData.deviceSessionId
            });
            // 1. Create or get Openpay customer
            const customer = await this.ensureOpenpayCustomer(paymentData.userId, paymentData.customerEmail, paymentData.customerName, paymentData.customerPhone);
            // 2. Create deposit request
            const depositRequest = await this.createDepositRequest({
                userId: paymentData.userId,
                amount: paymentData.amount,
                integrationMethod: 'openpay',
                autoApprovalEligible: true,
                paymentMethod: 'OPENPAY_CARD'
            });
            // 3. Create Openpay charge
            const chargeRequest = {
                source_id: paymentData.token,
                method: 'card',
                amount: paymentData.amount,
                currency: 'pen',
                description: `Depósito Bingo La Perla - ${depositRequest.referenceCode}`,
                device_session_id: paymentData.deviceSessionId,
                customer: {
                    id: customer.openpayCustomerId
                },
                confirm: true,
                send_email: false,
                order_id: depositRequest.referenceCode
            };
            const charge = await this.openpay.charges.create(chargeRequest);
            structuredLogger_1.logger.info('Openpay charge created', { chargeId: charge.id, status: charge.status });
            // 4. Save transaction record
            const transaction = await this.saveOpenpayTransaction({
                depositRequestId: depositRequest.id,
                openpayTransactionId: charge.id,
                openpayChargeId: charge.id,
                amount: paymentData.amount,
                paymentMethod: 'card',
                paymentMethodDetails: JSON.stringify({
                    cardBrand: charge.card?.brand,
                    cardLast4: charge.card?.card_number,
                    cardType: charge.card?.type,
                    cardHolderName: charge.card?.holder_name
                }),
                openpayStatus: charge.status,
                customerId: customer.id,
                customerEmail: paymentData.customerEmail,
                customerPhone: paymentData.customerPhone,
                authorizationCode: charge.authorization,
                operationType: 'card',
                deviceSessionId: paymentData.deviceSessionId,
                chargedAt: charge.creation_date ? new Date(charge.creation_date) : null,
                expiresAt: charge.due_date ? new Date(charge.due_date) : null
            });
            // 5. If charge successful, auto-approve deposit
            if (charge.status === 'completed') {
                await this.autoApproveDeposit(depositRequest.id, transaction.id);
            }
            else if (charge.status === 'charge_pending') {
                // Payment is pending - will be processed via webhook
                structuredLogger_1.logger.info('Payment is pending, waiting for webhook notification', {
                    transactionId: transaction.id
                });
            }
            return {
                success: true,
                transactionId: transaction.id,
                openpayChargeId: charge.id,
                status: charge.status,
                authorizationCode: charge.authorization
            };
        }
        catch (error) {
            structuredLogger_1.logger.error('Openpay card payment processing failed', error, {
                userId: paymentData.userId,
                amount: paymentData.amount
            });
            return {
                success: false,
                errorMessage: error.description || error.message || 'Payment processing failed',
                errorCode: error.error_code || 'PAYMENT_ERROR'
            };
        }
    }
    /**
     * Process bank transfer payment
     */
    async processBankTransfer(paymentData) {
        try {
            structuredLogger_1.logger.info('Processing Openpay bank transfer', {
                userId: paymentData.userId,
                amount: paymentData.amount
            });
            // 1. Create or get Openpay customer
            const customer = await this.ensureOpenpayCustomer(paymentData.userId, paymentData.customerEmail, paymentData.customerName);
            // 2. Create deposit request
            const depositRequest = await this.createDepositRequest({
                userId: paymentData.userId,
                amount: paymentData.amount,
                integrationMethod: 'openpay',
                autoApprovalEligible: false, // Bank transfers need confirmation
                paymentMethod: 'OPENPAY_BANK_TRANSFER'
            });
            // 3. Create Openpay bank transfer charge
            const chargeRequest = {
                method: 'bank_account',
                amount: paymentData.amount,
                currency: 'pen',
                description: `Depósito Bingo La Perla - ${depositRequest.referenceCode}`,
                customer: {
                    id: customer.openpayCustomerId
                },
                order_id: depositRequest.referenceCode
            };
            const charge = await this.openpay.charges.create(chargeRequest);
            structuredLogger_1.logger.info('Openpay bank transfer created', { chargeId: charge.id });
            // 4. Save transaction record
            const transaction = await this.saveOpenpayTransaction({
                depositRequestId: depositRequest.id,
                openpayTransactionId: charge.id,
                openpayChargeId: charge.id,
                amount: paymentData.amount,
                paymentMethod: 'bank_transfer',
                paymentMethodDetails: JSON.stringify({
                    bankName: charge.payment_method?.bank,
                    reference: charge.payment_method?.reference,
                    clabe: charge.payment_method?.clabe
                }),
                openpayStatus: charge.status,
                customerId: customer.id,
                customerEmail: paymentData.customerEmail,
                operationType: 'bank_transfer',
                chargedAt: null,
                expiresAt: charge.due_date ? new Date(charge.due_date) : null
            });
            // Return payment instructions to user
            return {
                success: true,
                transactionId: transaction.id,
                openpayChargeId: charge.id,
                status: charge.status,
                paymentInstructions: {
                    bankName: charge.payment_method?.bank,
                    accountNumber: charge.payment_method?.clabe,
                    reference: charge.payment_method?.reference,
                    expirationDate: charge.due_date
                }
            };
        }
        catch (error) {
            structuredLogger_1.logger.error('Openpay bank transfer processing failed', error, {
                userId: paymentData.userId,
                amount: paymentData.amount
            });
            return {
                success: false,
                errorMessage: error.description || error.message || 'Bank transfer creation failed',
                errorCode: error.error_code || 'BANK_TRANSFER_ERROR'
            };
        }
    }
    /**
     * Ensure Openpay customer exists
     */
    async ensureOpenpayCustomer(userId, email, name, phone) {
        // Check if customer exists
        let customer = await database_1.prisma.openpayCustomer.findUnique({
            where: { userId }
        });
        if (!customer) {
            structuredLogger_1.logger.info('Creating new Openpay customer', { userId, email });
            // Create new Openpay customer
            const openpayCustomer = await this.openpay.customers.create({
                name,
                email,
                phone_number: phone,
                external_id: userId
            });
            customer = await database_1.prisma.openpayCustomer.create({
                data: {
                    userId,
                    openpayCustomerId: openpayCustomer.id,
                    email,
                    name,
                    phone
                }
            });
            structuredLogger_1.logger.info('Openpay customer created', {
                customerId: customer.id,
                openpayCustomerId: customer.openpayCustomerId
            });
        }
        return customer;
    }
    /**
     * Create deposit request
     */
    async createDepositRequest(data) {
        const referenceCode = this.generateReferenceCode();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        const depositRequest = await database_1.prisma.depositRequest.create({
            data: {
                userId: data.userId,
                amount: data.amount,
                pearlsAmount: data.amount, // 1:1 conversion
                currency: 'PEN',
                paymentMethod: data.paymentMethod,
                referenceCode,
                integrationMethod: data.integrationMethod,
                autoApprovalEligible: data.autoApprovalEligible,
                expiresAt,
                status: 'PENDING'
            }
        });
        structuredLogger_1.logger.info('Deposit request created', {
            depositRequestId: depositRequest.id,
            referenceCode,
            amount: data.amount
        });
        return depositRequest;
    }
    /**
     * Save Openpay transaction
     */
    async saveOpenpayTransaction(data) {
        const transaction = await database_1.prisma.openpayTransaction.create({
            data: {
                depositRequestId: data.depositRequestId,
                openpayTransactionId: data.openpayTransactionId,
                openpayChargeId: data.openpayChargeId,
                amount: data.amount,
                currency: data.currency || 'PEN',
                paymentMethod: data.paymentMethod,
                paymentMethodDetails: data.paymentMethodDetails,
                openpayStatus: data.openpayStatus,
                openpayErrorCode: data.openpayErrorCode,
                openpayErrorMessage: data.openpayErrorMessage,
                customerId: data.customerId,
                customerEmail: data.customerEmail,
                customerPhone: data.customerPhone,
                authorizationCode: data.authorizationCode,
                operationType: data.operationType,
                deviceSessionId: data.deviceSessionId,
                riskScore: data.riskScore,
                fraudIndicators: data.fraudIndicators,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                chargedAt: data.chargedAt,
                expiresAt: data.expiresAt
            }
        });
        structuredLogger_1.logger.info('Openpay transaction saved', {
            transactionId: transaction.id,
            openpayChargeId: transaction.openpayChargeId,
            status: transaction.openpayStatus
        });
        return transaction;
    }
    /**
     * Auto-approve deposit and add Perlas to user account
     */
    async autoApproveDeposit(depositRequestId, openpayTransactionId) {
        try {
            await database_1.prisma.$transaction(async (tx) => {
                // Update deposit request
                const depositRequest = await tx.depositRequest.update({
                    where: { id: depositRequestId },
                    data: {
                        status: 'APPROVED',
                        validatedAt: new Date(),
                        validatedBy: 'SYSTEM_OPENPAY',
                        adminNotes: 'Auto-aprobado por pago exitoso Openpay',
                        openpayTransactionId
                    },
                    include: { user: true }
                });
                // Create transaction record
                await tx.transaction.create({
                    data: {
                        userId: depositRequest.userId,
                        type: 'PEARL_PURCHASE',
                        amount: depositRequest.amount,
                        pearlsAmount: depositRequest.pearlsAmount,
                        description: `Depósito automático Openpay - ${depositRequest.referenceCode}`,
                        status: 'COMPLETED',
                        paymentMethod: 'OPENPAY',
                        referenceId: depositRequest.referenceCode
                    }
                });
                // Update user's pearls balance
                await tx.user.update({
                    where: { id: depositRequest.userId },
                    data: {
                        pearlsBalance: {
                            increment: depositRequest.pearlsAmount
                        }
                    }
                });
                // Update wallet record
                await tx.wallet.upsert({
                    where: { userId: depositRequest.userId },
                    create: {
                        userId: depositRequest.userId,
                        balance: depositRequest.pearlsAmount
                    },
                    update: {
                        balance: {
                            increment: depositRequest.pearlsAmount
                        }
                    }
                });
                structuredLogger_1.logger.info('Deposit auto-approved successfully', {
                    depositRequestId,
                    userId: depositRequest.userId,
                    amount: depositRequest.amount,
                    pearlsAmount: depositRequest.pearlsAmount
                });
            });
            // Send real-time notification
            const depositRequest = await database_1.prisma.depositRequest.findUnique({
                where: { id: depositRequestId },
                include: { user: true }
            });
            if (depositRequest) {
                await this.notificationService.sendDepositConfirmation(depositRequest.userId, {
                    amount: parseFloat(depositRequest.amount.toString()),
                    pearlsAmount: parseFloat(depositRequest.pearlsAmount.toString()),
                    method: 'Openpay',
                    instant: true,
                    referenceCode: depositRequest.referenceCode
                });
            }
        }
        catch (error) {
            structuredLogger_1.logger.error('Failed to auto-approve deposit', error, {
                depositRequestId,
                openpayTransactionId
            });
            throw error;
        }
    }
    /**
     * Generate unique reference code
     */
    generateReferenceCode() {
        const timestamp = Date.now().toString(36);
        const random = crypto_1.default.randomBytes(4).toString('hex');
        return `BINGO-${timestamp}-${random}`.toUpperCase();
    }
    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(signature, payload) {
        if (!openpay_1.openpayConfig.webhookUsername || !openpay_1.openpayConfig.webhookPassword) {
            structuredLogger_1.logger.warn('Webhook credentials not configured, skipping signature verification');
            return true; // Skip verification if no credentials configured
        }
        try {
            const expectedSignature = crypto_1.default
                .createHmac('sha256', openpay_1.openpayConfig.webhookPassword)
                .update(JSON.stringify(payload))
                .digest('hex');
            return crypto_1.default.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
        }
        catch (error) {
            structuredLogger_1.logger.error('Error verifying webhook signature', error);
            return false;
        }
    }
    /**
     * Get transaction by Openpay charge ID
     */
    async getTransactionByChargeId(chargeId) {
        return await database_1.prisma.openpayTransaction.findUnique({
            where: { openpayChargeId: chargeId },
            include: {
                depositRequest: {
                    include: { user: true }
                }
            }
        });
    }
    /**
     * Update transaction status
     */
    async updateTransactionStatus(transactionId, status, additionalData) {
        const updateData = {
            openpayStatus: status,
            updatedAt: new Date()
        };
        if (additionalData) {
            if (additionalData.authorizationCode) {
                updateData.authorizationCode = additionalData.authorizationCode;
            }
            if (additionalData.chargedAt) {
                updateData.chargedAt = new Date(additionalData.chargedAt);
            }
            if (additionalData.errorCode) {
                updateData.openpayErrorCode = additionalData.errorCode;
            }
            if (additionalData.errorMessage) {
                updateData.openpayErrorMessage = additionalData.errorMessage;
            }
        }
        return await database_1.prisma.openpayTransaction.update({
            where: { id: transactionId },
            data: updateData
        });
    }
    /**
     * Get user's Openpay customer record
     */
    async getUserCustomer(userId) {
        return await database_1.prisma.openpayCustomer.findUnique({
            where: { userId }
        });
    }
    /**
     * Get customer's payment methods
     */
    async getCustomerPaymentMethods(customerId) {
        return await database_1.prisma.openpayPaymentMethod.findMany({
            where: {
                customerId,
                isActive: true
            },
            orderBy: [
                { isDefault: 'desc' },
                { createdAt: 'desc' }
            ]
        });
    }
    /**
     * Get transaction by ID (for specific user)
     */
    async getTransaction(transactionId, userId) {
        return await database_1.prisma.openpayTransaction.findFirst({
            where: {
                id: transactionId,
                depositRequest: {
                    userId
                }
            },
            include: {
                depositRequest: true
            }
        });
    }
    /**
     * Get user's transaction history
     */
    async getTransactionHistory(userId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [transactions, total] = await Promise.all([
            database_1.prisma.openpayTransaction.findMany({
                where: {
                    depositRequest: {
                        userId
                    }
                },
                include: {
                    depositRequest: true
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip,
                take: limit
            }),
            database_1.prisma.openpayTransaction.count({
                where: {
                    depositRequest: {
                        userId
                    }
                }
            })
        ]);
        return { transactions, total };
    }
}
exports.OpenpayService = OpenpayService;
exports.default = OpenpayService;
//# sourceMappingURL=openpayService.js.map