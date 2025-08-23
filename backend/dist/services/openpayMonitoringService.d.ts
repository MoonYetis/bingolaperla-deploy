export interface PaymentMetrics {
    totalTransactions: number;
    successfulTransactions: number;
    failedTransactions: number;
    pendingTransactions: number;
    totalAmount: number;
    averageAmount: number;
    successRate: number;
    averageProcessingTime: number;
}
export interface SecurityAlert {
    type: 'FRAUD_DETECTION' | 'HIGH_FAILURE_RATE' | 'UNUSUAL_ACTIVITY' | 'SYSTEM_ERROR';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    details: any;
    timestamp: Date;
}
export declare class OpenpayMonitoringService {
    private notificationService;
    private alertThresholds;
    constructor();
    /**
     * Get real-time payment metrics
     */
    getPaymentMetrics(timeframe?: 'hour' | 'day' | 'week' | 'month'): Promise<PaymentMetrics>;
    /**
     * Monitor for anomalies and send alerts
     */
    checkForAnomalies(): Promise<SecurityAlert[]>;
    /**
     * Get payment system health status
     */
    getSystemHealth(): Promise<{
        status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
        metrics: PaymentMetrics;
        issues: string[];
        lastChecked: Date;
    }>;
    /**
     * Generate comprehensive monitoring report
     */
    generateReport(timeframe?: 'day' | 'week' | 'month'): Promise<{
        period: string;
        metrics: PaymentMetrics;
        trends: any;
        topIssues: string[];
        recommendations: string[];
    }>;
    private getTimeframeMs;
    private getStuckPendingCount;
    private getSuspiciousActivityCount;
    private getSystemErrorCount;
    private checkUnusualVolume;
    private getAverageHourlyVolume;
    private getPreviousPeriodMetrics;
    private calculatePercentageChange;
    private sendAlerts;
    private initializeCronJobs;
}
export default OpenpayMonitoringService;
//# sourceMappingURL=openpayMonitoringService.d.ts.map