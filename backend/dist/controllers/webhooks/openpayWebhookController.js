"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenpayWebhookController = void 0;
const database_1 = require("@/config/database");
const structuredLogger_1 = require("@/utils/structuredLogger");
const openpayService_1 = require("@/services/openpayService");
const notificationService_1 = require("@/services/notificationService");
class OpenpayWebhookController {
    constructor() {
        this.openpayService = new openpayService_1.OpenpayService();
        this.notificationService = new notificationService_1.NotificationService();
    }
    /**
     * Handle Openpay webhook notifications
     */
    async handleWebhook(req, res) {
        try {
            const signature = req.headers['x-openpay-signature'];
            const payload = req.body;
            structuredLogger_1.logger.info('Received Openpay webhook', {
                eventType: payload.type,
                eventId: payload.id
            });
            // 1. Verify webhook signature
            if (!this.openpayService.verifyWebhookSignature(signature, payload)) {
                structuredLogger_1.logger.warn('Invalid Openpay webhook signature', { eventId: payload.id });
                res.status(401).json({ error: 'Invalid signature' });
                return;
            }
            // 2. Check if event already processed
            const existingEvent = await database_1.prisma.openpayWebhookEvent.findUnique({
                where: { openpayEventId: payload.id }
            });
            if (existingEvent?.processingStatus === 'processed') {
                structuredLogger_1.logger.info('Webhook event already processed', { eventId: payload.id });
                res.status(200).json({ status: 'already_processed' });
                return;
            }
            // 3. Save webhook event
            const webhookEvent = await database_1.prisma.openpayWebhookEvent.create({
                data: {
                    openpayEventId: payload.id,
                    eventType: payload.type,
                    webhookSignature: signature,
                    payload: payload,
                    processingStatus: 'pending'
                }
            });
            // 4. Process event based on type
            await this.processWebhookEvent(payload, webhookEvent.id);
            // 5. Mark as processed
            await database_1.prisma.openpayWebhookEvent.update({
                where: { id: webhookEvent.id },
                data: {
                    processingStatus: 'processed',
                    processedAt: new Date()
                }
            });
            structuredLogger_1.logger.info('Webhook processed successfully', {
                eventId: payload.id,
                eventType: payload.type
            });
            res.status(200).json({ status: 'processed' });
        }
        catch (error) {
            structuredLogger_1.logger.error('Webhook processing error', error, {
                eventId: req.body?.id,
                eventType: req.body?.type
            });
            // Mark as failed if we have the event ID
            if (req.body?.id) {
                await database_1.prisma.openpayWebhookEvent.updateMany({
                    where: { openpayEventId: req.body.id },
                    data: {
                        processingStatus: 'failed',
                        errorMessage: error.message
                    }
                });
            }
            res.status(500).json({ error: 'Webhook processing failed' });
        }
    }
    /**
     * Process specific webhook event types
     */
    async processWebhookEvent(payload, webhookEventId) {
        const eventData = payload.data || payload;
        switch (payload.type) {
            case 'charge.succeeded':
                await this.handleChargeSucceeded(eventData);
                break;
            case 'charge.failed':
                await this.handleChargeFailed(eventData);
                break;
            case 'charge.cancelled':
                await this.handleChargeCancelled(eventData);
                break;
            case 'charge.created':
                await this.handleChargeCreated(eventData);
                break;
            case 'charge.refunded':
                await this.handleChargeRefunded(eventData);
                break;
            case 'payout.created':
                await this.handlePayoutCreated(eventData);
                break;
            case 'payout.succeeded':
                await this.handlePayoutSucceeded(eventData);
                break;
            case 'payout.failed':
                await this.handlePayoutFailed(eventData);
                break;
            default:
                structuredLogger_1.logger.info(`Unhandled webhook event type: ${payload.type}`, {
                    eventId: payload.id,
                    eventType: payload.type
                });
        }
    }
    /**
     * Handle successful charge
     */
    async handleChargeSucceeded(chargeData) {
        structuredLogger_1.logger.info('Processing charge.succeeded webhook', { chargeId: chargeData.id });
        const transaction = await this.openpayService.getTransactionByChargeId(chargeData.id);
        if (!transaction) {
            structuredLogger_1.logger.warn(`Transaction not found for charge ID: ${chargeData.id}`);
            return;
        }
        // Update transaction status
        await this.openpayService.updateTransactionStatus(transaction.id, 'completed', {
            authorizationCode: chargeData.authorization,
            chargedAt: chargeData.creation_date
        });
        // Auto-approve deposit if not already approved
        if (transaction.depositRequest.status === 'PENDING') {
            await this.openpayService.autoApproveDeposit(transaction.depositRequestId, transaction.id);
            structuredLogger_1.logger.info('Deposit auto-approved via webhook', {
                depositRequestId: transaction.depositRequestId,
                amount: chargeData.amount
            });
        }
        // Send real-time notification via WebSocket
        if (global.socketIO) {
            global.socketIO.to(`user-${transaction.depositRequest.userId}`).emit('payment_success', {
                transactionId: transaction.id,
                amount: chargeData.amount,
                pearlsAdded: transaction.depositRequest.pearlsAmount,
                authorizationCode: chargeData.authorization,
                timestamp: new Date().toISOString()
            });
        }
    }
    /**
     * Handle failed charge
     */
    async handleChargeFailed(chargeData) {
        structuredLogger_1.logger.info('Processing charge.failed webhook', {
            chargeId: chargeData.id,
            errorCode: chargeData.error_code
        });
        const transaction = await this.openpayService.getTransactionByChargeId(chargeData.id);
        if (!transaction) {
            structuredLogger_1.logger.warn(`Transaction not found for charge ID: ${chargeData.id}`);
            return;
        }
        // Update transaction status
        await this.openpayService.updateTransactionStatus(transaction.id, 'failed', {
            errorCode: chargeData.error_code,
            errorMessage: chargeData.description
        });
        // Update deposit request status
        await database_1.prisma.depositRequest.update({
            where: { id: transaction.depositRequestId },
            data: {
                status: 'REJECTED',
                adminNotes: `Pago falló en Openpay: ${chargeData.description} (${chargeData.error_code})`
            }
        });
        // Send failure notification
        await this.notificationService.sendPaymentFailureNotification(transaction.depositRequest.userId, {
            amount: parseFloat(transaction.amount.toString()),
            method: 'Openpay',
            errorMessage: chargeData.description || 'Payment failed',
            errorCode: chargeData.error_code || 'UNKNOWN_ERROR'
        });
        // Send real-time notification via WebSocket
        if (global.socketIO) {
            global.socketIO.to(`user-${transaction.depositRequest.userId}`).emit('payment_failed', {
                transactionId: transaction.id,
                errorMessage: chargeData.description,
                errorCode: chargeData.error_code,
                timestamp: new Date().toISOString()
            });
        }
    }
    /**
     * Handle cancelled charge
     */
    async handleChargeCancelled(chargeData) {
        structuredLogger_1.logger.info('Processing charge.cancelled webhook', { chargeId: chargeData.id });
        const transaction = await this.openpayService.getTransactionByChargeId(chargeData.id);
        if (!transaction) {
            structuredLogger_1.logger.warn(`Transaction not found for charge ID: ${chargeData.id}`);
            return;
        }
        // Update transaction status
        await this.openpayService.updateTransactionStatus(transaction.id, 'cancelled');
        // Update deposit request status
        await database_1.prisma.depositRequest.update({
            where: { id: transaction.depositRequestId },
            data: {
                status: 'CANCELLED',
                adminNotes: 'Pago cancelado en Openpay'
            }
        });
        // Send real-time notification via WebSocket
        if (global.socketIO) {
            global.socketIO.to(`user-${transaction.depositRequest.userId}`).emit('payment_cancelled', {
                transactionId: transaction.id,
                timestamp: new Date().toISOString()
            });
        }
    }
    /**
     * Handle charge created (for bank transfers or OXXO payments)
     */
    async handleChargeCreated(chargeData) {
        structuredLogger_1.logger.info('Processing charge.created webhook', {
            chargeId: chargeData.id,
            method: chargeData.method
        });
        // This is typically for bank transfers or cash payments
        // No specific action needed - just log for tracking
    }
    /**
     * Handle charge refunded
     */
    async handleChargeRefunded(chargeData) {
        structuredLogger_1.logger.info('Processing charge.refunded webhook', {
            chargeId: chargeData.id,
            refundAmount: chargeData.refund?.amount
        });
        const transaction = await this.openpayService.getTransactionByChargeId(chargeData.id);
        if (!transaction) {
            structuredLogger_1.logger.warn(`Transaction not found for charge ID: ${chargeData.id}`);
            return;
        }
        // Create refund transaction record
        const refundAmount = chargeData.refund?.amount || transaction.amount;
        await database_1.prisma.transaction.create({
            data: {
                userId: transaction.depositRequest.userId,
                type: 'REFUND',
                amount: refundAmount,
                pearlsAmount: refundAmount,
                description: `Reembolso Openpay - ${transaction.depositRequest.referenceCode}`,
                status: 'COMPLETED',
                paymentMethod: 'OPENPAY_REFUND',
                referenceId: chargeData.refund?.id || chargeData.id
            }
        });
        // Update user's pearls balance (add back refunded amount)
        await database_1.prisma.user.update({
            where: { id: transaction.depositRequest.userId },
            data: {
                pearlsBalance: {
                    increment: refundAmount
                }
            }
        });
        // Send refund notification
        if (global.socketIO) {
            global.socketIO.to(`user-${transaction.depositRequest.userId}`).emit('refund_processed', {
                transactionId: transaction.id,
                refundAmount,
                timestamp: new Date().toISOString()
            });
        }
    }
    /**
     * Handle payout created (for withdrawals)
     */
    async handlePayoutCreated(payoutData) {
        structuredLogger_1.logger.info('Processing payout.created webhook', { payoutId: payoutData.id });
        // TODO: Implement withdrawal handling when withdrawal feature is added
    }
    /**
     * Handle payout succeeded
     */
    async handlePayoutSucceeded(payoutData) {
        structuredLogger_1.logger.info('Processing payout.succeeded webhook', { payoutId: payoutData.id });
        // TODO: Implement withdrawal success handling
    }
    /**
     * Handle payout failed
     */
    async handlePayoutFailed(payoutData) {
        structuredLogger_1.logger.info('Processing payout.failed webhook', {
            payoutId: payoutData.id,
            errorCode: payoutData.error_code
        });
        // TODO: Implement withdrawal failure handling
    }
}
exports.OpenpayWebhookController = OpenpayWebhookController;
exports.default = OpenpayWebhookController;
//# sourceMappingURL=openpayWebhookController.js.map