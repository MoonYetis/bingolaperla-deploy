export interface BusinessMetrics {
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    userRetentionRate: number;
    totalGames: number;
    activeGames: number;
    gamesCompletedToday: number;
    averageGameDuration: number;
    totalRevenue: number;
    revenueToday: number;
    averageRevenuePerUser: number;
    cardsSoldToday: number;
    serverUptime: number;
    averageResponseTime: number;
    errorRate: number;
    concurrentUsers: number;
}
export interface UserAnalytics {
    userId: string;
    totalGamesPlayed: number;
    totalCardsPlayed: number;
    totalSpent: number;
    winRate: number;
    lastActiveDate: Date;
    favoriteGameTime: string;
    deviceType: string;
    location?: string;
}
export interface GameAnalytics {
    gameId: string;
    playerCount: number;
    duration: number;
    cardsGenerated: number;
    revenue: number;
    winnerCount: number;
    averageCardsPerPlayer: number;
    completionTime: Date;
}
export interface RealtimeMetrics {
    timestamp: Date;
    activeUsers: number;
    activeGames: number;
    memoryUsage: number;
    cpuUsage: number;
    dbConnections: number;
    socketConnections: number;
}
declare class AnalyticsService {
    private realtimeMetrics;
    private metricsRetentionHours;
    /**
     * Obtiene métricas de negocio principales
     */
    getBusinessMetrics(): Promise<BusinessMetrics>;
    /**
     * Obtiene analytics detallados de usuarios
     */
    getUserAnalytics(limit?: number): Promise<UserAnalytics[]>;
    /**
     * Obtiene analytics de juegos específicos
     */
    getGameAnalytics(gameId?: string): Promise<GameAnalytics[]>;
    /**
     * Registra métricas en tiempo real
     */
    recordRealtimeMetrics(metrics: Omit<RealtimeMetrics, 'timestamp'>): Promise<void>;
    /**
     * Obtiene métricas en tiempo real
     */
    getRealtimeMetrics(hoursBack?: number): RealtimeMetrics[];
    /**
     * Genera reportes personalizados
     */
    generateCustomReport(startDate: Date, endDate: Date, metrics: string[]): Promise<any>;
    /**
     * Calcula métricas de performance básicas
     */
    private getPerformanceMetrics;
    /**
     * Calcula la hora favorita de juego del usuario
     */
    private calculateFavoriteGameTime;
    /**
     * Obtiene tendencias de métricas
     */
    getTrends(metric: string, days?: number): Promise<any[]>;
}
export declare const analyticsService: AnalyticsService;
export {};
//# sourceMappingURL=analyticsService.d.ts.map