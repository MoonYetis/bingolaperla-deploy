"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsController = exports.AnalyticsController = void 0;
const analyticsService_1 = require("../services/analyticsService");
const logger_1 = require("../utils/logger");
class AnalyticsController {
    /**
     * Obtiene métricas principales de negocio
     * GET /api/analytics/metrics
     */
    async getBusinessMetrics(req, res) {
        try {
            const metrics = await analyticsService_1.analyticsService.getBusinessMetrics();
            res.json({
                success: true,
                data: metrics,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting business metrics:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve business metrics'
            });
        }
    }
    /**
     * Obtiene analytics de usuarios
     * GET /api/analytics/users?limit=100
     */
    async getUserAnalytics(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 100;
            const userAnalytics = await analyticsService_1.analyticsService.getUserAnalytics(limit);
            res.json({
                success: true,
                data: userAnalytics,
                count: userAnalytics.length
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting user analytics:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve user analytics'
            });
        }
    }
    /**
     * Obtiene analytics de juegos
     * GET /api/analytics/games/:gameId?
     */
    async getGameAnalytics(req, res) {
        try {
            const gameId = req.params.gameId;
            const gameAnalytics = await analyticsService_1.analyticsService.getGameAnalytics(gameId);
            res.json({
                success: true,
                data: gameAnalytics,
                count: gameAnalytics.length
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting game analytics:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve game analytics'
            });
        }
    }
    /**
     * Obtiene métricas en tiempo real
     * GET /api/analytics/realtime?hours=1
     */
    async getRealtimeMetrics(req, res) {
        try {
            const hours = parseInt(req.query.hours) || 1;
            const metrics = analyticsService_1.analyticsService.getRealtimeMetrics(hours);
            res.json({
                success: true,
                data: metrics,
                count: metrics.length
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting realtime metrics:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve realtime metrics'
            });
        }
    }
    /**
     * Registra métricas en tiempo real
     * POST /api/analytics/realtime
     */
    async recordRealtimeMetrics(req, res) {
        try {
            const { activeUsers, activeGames, memoryUsage, cpuUsage, dbConnections, socketConnections } = req.body;
            await analyticsService_1.analyticsService.recordRealtimeMetrics({
                activeUsers,
                activeGames,
                memoryUsage,
                cpuUsage,
                dbConnections,
                socketConnections
            });
            res.json({
                success: true,
                message: 'Realtime metrics recorded successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Error recording realtime metrics:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to record realtime metrics'
            });
        }
    }
    /**
     * Genera reporte personalizado
     * POST /api/analytics/reports
     */
    async generateCustomReport(req, res) {
        try {
            const { startDate, endDate, metrics } = req.body;
            if (!startDate || !endDate || !metrics) {
                return res.status(400).json({
                    success: false,
                    error: 'startDate, endDate, and metrics are required'
                });
            }
            const report = await analyticsService_1.analyticsService.generateCustomReport(new Date(startDate), new Date(endDate), metrics);
            res.json({
                success: true,
                data: report
            });
        }
        catch (error) {
            logger_1.logger.error('Error generating custom report:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate custom report'
            });
        }
    }
    /**
     * Obtiene tendencias de métricas
     * GET /api/analytics/trends/:metric?days=7
     */
    async getTrends(req, res) {
        try {
            const metric = req.params.metric;
            const days = parseInt(req.query.days) || 7;
            if (!['users', 'games', 'revenue'].includes(metric)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid metric. Must be: users, games, or revenue'
                });
            }
            const trends = await analyticsService_1.analyticsService.getTrends(metric, days);
            res.json({
                success: true,
                data: {
                    metric,
                    period: `${days} days`,
                    trends
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting trends:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve trends'
            });
        }
    }
    /**
     * Dashboard completo con todas las métricas
     * GET /api/analytics/dashboard
     */
    async getDashboard(req, res) {
        try {
            const [businessMetrics, realtimeMetrics, userTrends, gameTrends, revenueTrends] = await Promise.all([
                analyticsService_1.analyticsService.getBusinessMetrics(),
                analyticsService_1.analyticsService.getRealtimeMetrics(24), // Last 24 hours
                analyticsService_1.analyticsService.getTrends('users', 7),
                analyticsService_1.analyticsService.getTrends('games', 7),
                analyticsService_1.analyticsService.getTrends('revenue', 7)
            ]);
            const dashboard = {
                businessMetrics,
                realtimeMetrics: realtimeMetrics.slice(-24), // Last 24 data points
                trends: {
                    users: userTrends,
                    games: gameTrends,
                    revenue: revenueTrends
                },
                lastUpdated: new Date().toISOString()
            };
            res.json({
                success: true,
                data: dashboard
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting dashboard data:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve dashboard data'
            });
        }
    }
    /**
     * Obtiene KPIs específicos de Bingo
     * GET /api/analytics/kpis
     */
    async getBingoKPIs(req, res) {
        try {
            // KPIs específicos para el negocio de Bingo
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const startOfWeek = new Date(startOfDay.getTime() - 7 * 24 * 60 * 60 * 1000);
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const businessMetrics = await analyticsService_1.analyticsService.getBusinessMetrics();
            // Calcular métricas adicionales específicas del bingo
            const weeklyGames = await analyticsService_1.analyticsService.generateCustomReport(startOfWeek, today, ['games']);
            const monthlyRevenue = await analyticsService_1.analyticsService.generateCustomReport(startOfMonth, today, ['revenue']);
            const kpis = {
                // Core Business KPIs
                dailyActiveUsers: businessMetrics.activeUsers,
                conversionRate: businessMetrics.cardsSoldToday / businessMetrics.activeUsers * 100,
                averageSessionDuration: 25, // Would come from session tracking
                // Game-specific KPIs
                gamesPerDay: businessMetrics.gamesCompletedToday,
                averagePlayersPerGame: 15, // Would be calculated from actual data
                cardsSoldPerGame: businessMetrics.cardsSoldToday / Math.max(businessMetrics.gamesCompletedToday, 1),
                // Revenue KPIs
                dailyRevenue: businessMetrics.revenueToday,
                weeklyRevenue: weeklyGames.data.revenue?._sum?.amount || 0,
                monthlyRevenue: monthlyRevenue.data.revenue?._sum?.amount || 0,
                arpu: businessMetrics.averageRevenuePerUser,
                // Engagement KPIs
                userRetentionRate: businessMetrics.userRetentionRate,
                repeatPlayerRate: 65, // Would be calculated from user behavior
                socialSharingRate: 12, // Would come from social features
                // Technical KPIs
                systemUptime: (businessMetrics.serverUptime / 86400) * 100, // % of day
                averageLatency: businessMetrics.averageResponseTime,
                errorRate: businessMetrics.errorRate * 100,
                // Calculated insights
                trendIndicators: {
                    usersGrowth: '+15%', // Would be calculated from trends
                    revenueGrowth: '+8%',
                    engagementGrowth: '+12%'
                }
            };
            res.json({
                success: true,
                data: kpis,
                generatedAt: new Date().toISOString()
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting Bingo KPIs:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve Bingo KPIs'
            });
        }
    }
}
exports.AnalyticsController = AnalyticsController;
exports.analyticsController = new AnalyticsController();
//# sourceMappingURL=analyticsController.js.map