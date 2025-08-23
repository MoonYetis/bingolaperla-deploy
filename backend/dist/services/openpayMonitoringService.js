"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenpayMonitoringService = void 0;
const structuredLogger_1 = require("@/utils/structuredLogger");
const database_1 = require("@/config/database");
const notificationService_1 = require("./notificationService");
const node_cron_1 = __importDefault(require("node-cron"));
class OpenpayMonitoringService {
    constructor() {
        this.alertThresholds = {
            failureRate: 0.15, // 15% failure rate triggers alert
            pendingTimeMinutes: 30, // Transactions pending > 30 min trigger alert
            suspiciousActivityCount: 5, // 5+ suspicious activities per hour
            systemErrorCount: 10, // 10+ system errors per hour
            unusualVolumeMultiplier: 3 // 3x normal volume triggers alert
        };
        this.notificationService = new notificationService_1.NotificationService();
        this.initializeCronJobs();
    }
    /**
     * Get real-time payment metrics
     */
    async getPaymentMetrics(timeframe = 'day') {
        const timeframeMs = this.getTimeframeMs(timeframe);
        const startDate = new Date(Date.now() - timeframeMs);
        try {
            const transactions = await database_1.prisma.openpayTransaction.findMany({
                where: {
                    createdAt: {
                        gte: startDate
                    }
                },
                select: {
                    amount: true,
                    openpayStatus: true,
                    createdAt: true,
                    chargedAt: true
                }
            });
            const totalTransactions = transactions.length;
            const successfulTransactions = transactions.filter(t => t.openpayStatus === 'completed').length;
            const failedTransactions = transactions.filter(t => ['failed', 'cancelled', 'expired'].includes(t.openpayStatus)).length;
            const pendingTransactions = transactions.filter(t => ['pending', 'charge_pending'].includes(t.openpayStatus)).length;
            const totalAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
            const averageAmount = totalTransactions > 0 ? totalAmount / totalTransactions : 0;
            const successRate = totalTransactions > 0 ? successfulTransactions / totalTransactions : 0;
            // Calculate average processing time for successful transactions
            const successfulWithTiming = transactions.filter(t => t.openpayStatus === 'completed' && t.chargedAt && t.createdAt);
            const averageProcessingTime = successfulWithTiming.length > 0
                ? successfulWithTiming.reduce((sum, t) => {
                    const processingTime = t.chargedAt.getTime() - t.createdAt.getTime();
                    return sum + processingTime;
                }, 0) / successfulWithTiming.length / 1000 // Convert to seconds
                : 0;
            const metrics = {
                totalTransactions,
                successfulTransactions,
                failedTransactions,
                pendingTransactions,
                totalAmount,
                averageAmount,
                successRate,
                averageProcessingTime
            };
            structuredLogger_1.logger.info('Payment metrics calculated', {
                timeframe,
                metrics,
                component: 'OpenpayMonitoringService'
            });
            return metrics;
        }
        catch (error) {
            structuredLogger_1.logger.error('Error calculating payment metrics', error);
            throw new Error('Failed to calculate payment metrics');
        }
    }
    /**
     * Monitor for anomalies and send alerts
     */
    async checkForAnomalies() {
        const alerts = [];
        try {
            // Check failure rate
            const hourlyMetrics = await this.getPaymentMetrics('hour');
            if (hourlyMetrics.totalTransactions > 10 &&
                (1 - hourlyMetrics.successRate) > this.alertThresholds.failureRate) {
                alerts.push({
                    type: 'HIGH_FAILURE_RATE',
                    severity: 'HIGH',
                    message: `High payment failure rate detected: ${((1 - hourlyMetrics.successRate) * 100).toFixed(1)}%`,
                    details: hourlyMetrics,
                    timestamp: new Date()
                });
            }
            // Check for stuck pending transactions
            const stuckPendingCount = await this.getStuckPendingCount();
            if (stuckPendingCount > 0) {
                alerts.push({
                    type: 'UNUSUAL_ACTIVITY',
                    severity: stuckPendingCount > 5 ? 'HIGH' : 'MEDIUM',
                    message: `${stuckPendingCount} transactions have been pending for over ${this.alertThresholds.pendingTimeMinutes} minutes`,
                    details: { stuckPendingCount },
                    timestamp: new Date()
                });
            }
            // Check for suspicious activity
            const suspiciousActivityCount = await this.getSuspiciousActivityCount();
            if (suspiciousActivityCount > this.alertThresholds.suspiciousActivityCount) {
                alerts.push({
                    type: 'FRAUD_DETECTION',
                    severity: suspiciousActivityCount > 20 ? 'CRITICAL' : 'HIGH',
                    message: `High number of suspicious activities detected: ${suspiciousActivityCount} in the last hour`,
                    details: { suspiciousActivityCount },
                    timestamp: new Date()
                });
            }
            // Check for system errors
            const systemErrorCount = await this.getSystemErrorCount();
            if (systemErrorCount > this.alertThresholds.systemErrorCount) {
                alerts.push({
                    type: 'SYSTEM_ERROR',
                    severity: systemErrorCount > 50 ? 'CRITICAL' : 'HIGH',
                    message: `High number of system errors: ${systemErrorCount} in the last hour`,
                    details: { systemErrorCount },
                    timestamp: new Date()
                });
            }
            // Check for unusual volume
            const unusualVolumeAlert = await this.checkUnusualVolume();
            if (unusualVolumeAlert) {
                alerts.push(unusualVolumeAlert);
            }
            // Log and send alerts
            if (alerts.length > 0) {
                structuredLogger_1.logger.warn('Payment system anomalies detected', {
                    alertCount: alerts.length,
                    alerts: alerts.map(a => ({ type: a.type, severity: a.severity })),
                    component: 'OpenpayMonitoringService'
                });
                await this.sendAlerts(alerts);
            }
            return alerts;
        }
        catch (error) {
            structuredLogger_1.logger.error('Error checking for anomalies', error);
            return [];
        }
    }
    /**
     * Get payment system health status
     */
    async getSystemHealth() {
        try {
            const metrics = await this.getPaymentMetrics('hour');
            const alerts = await this.checkForAnomalies();
            const issues = [];
            // Determine health status
            let status = 'HEALTHY';
            if (alerts.some(a => a.severity === 'CRITICAL')) {
                status = 'CRITICAL';
                issues.push('Critical alerts detected');
            }
            else if (alerts.some(a => a.severity === 'HIGH')) {
                status = 'WARNING';
                issues.push('High severity alerts detected');
            }
            if (metrics.successRate < 0.9 && metrics.totalTransactions > 5) {
                status = status === 'HEALTHY' ? 'WARNING' : status;
                issues.push(`Low success rate: ${(metrics.successRate * 100).toFixed(1)}%`);
            }
            if (metrics.pendingTransactions > metrics.successfulTransactions && metrics.totalTransactions > 10) {
                status = status === 'HEALTHY' ? 'WARNING' : status;
                issues.push('High number of pending transactions');
            }
            return {
                status,
                metrics,
                issues,
                lastChecked: new Date()
            };
        }
        catch (error) {
            structuredLogger_1.logger.error('Error getting system health', error);
            return {
                status: 'CRITICAL',
                metrics: {
                    totalTransactions: 0,
                    successfulTransactions: 0,
                    failedTransactions: 0,
                    pendingTransactions: 0,
                    totalAmount: 0,
                    averageAmount: 0,
                    successRate: 0,
                    averageProcessingTime: 0
                },
                issues: ['System health check failed'],
                lastChecked: new Date()
            };
        }
    }
    /**
     * Generate comprehensive monitoring report
     */
    async generateReport(timeframe = 'day') {
        try {
            const currentMetrics = await this.getPaymentMetrics(timeframe);
            const previousMetrics = await this.getPreviousPeriodMetrics(timeframe);
            // Calculate trends
            const trends = {
                volumeChange: this.calculatePercentageChange(currentMetrics.totalTransactions, previousMetrics.totalTransactions),
                successRateChange: this.calculatePercentageChange(currentMetrics.successRate, previousMetrics.successRate),
                averageAmountChange: this.calculatePercentageChange(currentMetrics.averageAmount, previousMetrics.averageAmount),
                processingTimeChange: this.calculatePercentageChange(currentMetrics.averageProcessingTime, previousMetrics.averageProcessingTime)
            };
            // Identify top issues
            const topIssues = [];
            if (currentMetrics.failedTransactions > 0) {
                topIssues.push(`${currentMetrics.failedTransactions} failed transactions`);
            }
            if (currentMetrics.pendingTransactions > 10) {
                topIssues.push(`${currentMetrics.pendingTransactions} pending transactions`);
            }
            if (currentMetrics.successRate < 0.95) {
                topIssues.push(`Success rate below 95%: ${(currentMetrics.successRate * 100).toFixed(1)}%`);
            }
            // Generate recommendations
            const recommendations = [];
            if (currentMetrics.successRate < 0.9) {
                recommendations.push('Investigate payment failures and improve error handling');
            }
            if (currentMetrics.averageProcessingTime > 60) {
                recommendations.push('Optimize payment processing speed (currently > 60 seconds average)');
            }
            if (trends.volumeChange < -20) {
                recommendations.push('Payment volume decreased significantly - investigate user experience');
            }
            return {
                period: `${timeframe} (${new Date().toLocaleDateString('es-PE')})`,
                metrics: currentMetrics,
                trends,
                topIssues,
                recommendations
            };
        }
        catch (error) {
            structuredLogger_1.logger.error('Error generating monitoring report', error);
            throw new Error('Failed to generate monitoring report');
        }
    }
    // Private helper methods
    getTimeframeMs(timeframe) {
        const timeframes = {
            hour: 60 * 60 * 1000,
            day: 24 * 60 * 60 * 1000,
            week: 7 * 24 * 60 * 60 * 1000,
            month: 30 * 24 * 60 * 60 * 1000
        };
        return timeframes[timeframe] || timeframes.day;
    }
    async getStuckPendingCount() {
        const cutoffTime = new Date(Date.now() - this.alertThresholds.pendingTimeMinutes * 60 * 1000);
        return await database_1.prisma.openpayTransaction.count({
            where: {
                openpayStatus: {
                    in: ['pending', 'charge_pending']
                },
                createdAt: {
                    lte: cutoffTime
                }
            }
        });
    }
    async getSuspiciousActivityCount() {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        // This would require implementing suspicious activity logging
        // For now, we'll simulate based on failed transactions patterns
        const rapidFailures = await database_1.prisma.openpayTransaction.count({
            where: {
                openpayStatus: 'failed',
                createdAt: {
                    gte: oneHourAgo
                }
            }
        });
        // Estimate suspicious activity as a percentage of rapid failures
        return Math.floor(rapidFailures * 0.3);
    }
    async getSystemErrorCount() {
        // This would typically come from error logging system
        // For now, we'll estimate from transaction errors
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const errorsCount = await database_1.prisma.openpayTransaction.count({
            where: {
                openpayStatus: 'failed',
                openpayErrorCode: {
                    not: null
                },
                createdAt: {
                    gte: oneHourAgo
                }
            }
        });
        return errorsCount;
    }
    async checkUnusualVolume() {
        try {
            const currentHourMetrics = await this.getPaymentMetrics('hour');
            const averageHourlyVolume = await this.getAverageHourlyVolume();
            if (currentHourMetrics.totalTransactions >
                averageHourlyVolume * this.alertThresholds.unusualVolumeMultiplier) {
                return {
                    type: 'UNUSUAL_ACTIVITY',
                    severity: 'HIGH',
                    message: `Unusual payment volume detected: ${currentHourMetrics.totalTransactions} transactions (${this.alertThresholds.unusualVolumeMultiplier}x normal)`,
                    details: {
                        currentVolume: currentHourMetrics.totalTransactions,
                        averageVolume: averageHourlyVolume
                    },
                    timestamp: new Date()
                };
            }
            return null;
        }
        catch (error) {
            structuredLogger_1.logger.error('Error checking unusual volume', error);
            return null;
        }
    }
    async getAverageHourlyVolume() {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const totalTransactions = await database_1.prisma.openpayTransaction.count({
            where: {
                createdAt: {
                    gte: sevenDaysAgo
                }
            }
        });
        return Math.floor(totalTransactions / (7 * 24)); // Average per hour over 7 days
    }
    async getPreviousPeriodMetrics(timeframe) {
        const timeframeMs = this.getTimeframeMs(timeframe);
        const startDate = new Date(Date.now() - 2 * timeframeMs);
        const endDate = new Date(Date.now() - timeframeMs);
        const transactions = await database_1.prisma.openpayTransaction.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            select: {
                amount: true,
                openpayStatus: true,
                createdAt: true,
                chargedAt: true
            }
        });
        // Calculate metrics similar to getPaymentMetrics
        const totalTransactions = transactions.length;
        const successfulTransactions = transactions.filter(t => t.openpayStatus === 'completed').length;
        const failedTransactions = transactions.filter(t => ['failed', 'cancelled', 'expired'].includes(t.openpayStatus)).length;
        const pendingTransactions = transactions.filter(t => ['pending', 'charge_pending'].includes(t.openpayStatus)).length;
        const totalAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
        const averageAmount = totalTransactions > 0 ? totalAmount / totalTransactions : 0;
        const successRate = totalTransactions > 0 ? successfulTransactions / totalTransactions : 0;
        const successfulWithTiming = transactions.filter(t => t.openpayStatus === 'completed' && t.chargedAt && t.createdAt);
        const averageProcessingTime = successfulWithTiming.length > 0
            ? successfulWithTiming.reduce((sum, t) => {
                const processingTime = t.chargedAt.getTime() - t.createdAt.getTime();
                return sum + processingTime;
            }, 0) / successfulWithTiming.length / 1000
            : 0;
        return {
            totalTransactions,
            successfulTransactions,
            failedTransactions,
            pendingTransactions,
            totalAmount,
            averageAmount,
            successRate,
            averageProcessingTime
        };
    }
    calculatePercentageChange(current, previous) {
        if (previous === 0)
            return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    }
    async sendAlerts(alerts) {
        try {
            for (const alert of alerts) {
                structuredLogger_1.logger.warn('Sending security alert', {
                    type: alert.type,
                    severity: alert.severity,
                    message: alert.message
                });
                // In production, you would send these alerts via email, Slack, SMS, etc.
                // For now, we'll just log them
                if (alert.severity === 'CRITICAL') {
                    // Send immediate notification to admin
                    console.log(`🚨 CRITICAL ALERT: ${alert.message}`);
                }
            }
        }
        catch (error) {
            structuredLogger_1.logger.error('Error sending alerts', error);
        }
    }
    initializeCronJobs() {
        // Check for anomalies every 15 minutes
        node_cron_1.default.schedule('*/15 * * * *', async () => {
            try {
                await this.checkForAnomalies();
            }
            catch (error) {
                structuredLogger_1.logger.error('Error in scheduled anomaly check', error);
            }
        });
        // Generate daily report at 9 AM
        node_cron_1.default.schedule('0 9 * * *', async () => {
            try {
                const report = await this.generateReport('day');
                structuredLogger_1.logger.info('Daily Openpay monitoring report', report);
            }
            catch (error) {
                structuredLogger_1.logger.error('Error generating daily report', error);
            }
        });
        structuredLogger_1.logger.info('Openpay monitoring cron jobs initialized');
    }
}
exports.OpenpayMonitoringService = OpenpayMonitoringService;
exports.default = OpenpayMonitoringService;
//# sourceMappingURL=openpayMonitoringService.js.map