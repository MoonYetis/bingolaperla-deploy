export interface DailyReport {
    date: string;
    summary: {
        totalUsers: number;
        newUsers: number;
        activeUsers: number;
        totalGames: number;
        completedGames: number;
        totalRevenue: number;
        cardsSold: number;
    };
    performance: {
        averageResponseTime: number;
        errorRate: number;
        systemUptime: number;
    };
    topMetrics: {
        peakConcurrentUsers: number;
        longestGame: number;
        mostActiveUser: string;
        popularGameTime: string;
    };
}
export interface WeeklyReport {
    weekStart: string;
    weekEnd: string;
    summary: {
        totalUsers: number;
        newUsers: number;
        retentionRate: number;
        totalGames: number;
        averagePlayersPerGame: number;
        totalRevenue: number;
        revenueGrowth: number;
    };
    trends: {
        dailyActiveUsers: number[];
        dailyRevenue: number[];
        gameCompletionRate: number;
        userEngagement: number;
    };
}
export interface MonthlyReport {
    month: string;
    year: number;
    summary: {
        totalUsers: number;
        newUsers: number;
        churnRate: number;
        totalGames: number;
        totalRevenue: number;
        profitMargin: number;
    };
    growth: {
        userGrowthRate: number;
        revenueGrowthRate: number;
        gameGrowthRate: number;
        engagementGrowthRate: number;
    };
    insights: {
        bestPerformingDay: string;
        peakHours: string[];
        userSegments: any[];
        recommendedActions: string[];
    };
}
export interface KPIAlert {
    id: string;
    type: 'critical' | 'warning' | 'info';
    category: 'performance' | 'business' | 'technical' | 'user';
    title: string;
    description: string;
    value: number;
    threshold: number;
    timestamp: Date;
    resolved: boolean;
}
declare class ReportService {
    /**
     * Generar reporte diario automático
     */
    generateDailyReport(date?: Date): Promise<DailyReport>;
    /**
     * Generar reporte semanal automático
     */
    generateWeeklyReport(weekStart?: Date): Promise<WeeklyReport>;
    /**
     * Generar reporte mensual automático
     */
    generateMonthlyReport(month?: number, year?: number): Promise<MonthlyReport>;
    /**
     * Verificar KPIs y generar alertas automáticas
     */
    checkKPIsAndGenerateAlerts(): Promise<KPIAlert[]>;
    private calculateDailyRevenue;
    private calculateWeeklyRevenue;
    private calculatePreviousWeekRevenue;
    private getDailyTopMetrics;
    private getWeekStart;
    private getWeeklyTrends;
    private calculateRetentionRate;
    private calculateAveragePlayersPerGame;
    private getMonthlyMetrics;
    private getPreviousMonthMetrics;
    private calculateGrowthRate;
    private calculateChurnRate;
    private calculateProfitMargin;
    private calculateEngagementGrowthRate;
    private generateMonthlyInsights;
    private getMonthName;
}
export declare const reportService: ReportService;
export {};
//# sourceMappingURL=reportService.d.ts.map