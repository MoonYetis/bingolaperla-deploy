import { prisma } from '@/config/database';
import { analyticsLogger } from '@/utils/structuredLogger';
import { analyticsService } from './analyticsService';

// Interfaces para reports
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

class ReportService {
  /**
   * Generar reporte diario automático
   */
  async generateDailyReport(date?: Date): Promise<DailyReport> {
    try {
      const targetDate = date || new Date();
      const dateStr = targetDate.toISOString().split('T')[0];
      
      analyticsLogger.info('Generating daily report', { date: dateStr });

      // Obtener métricas básicas
      const businessMetrics = await analyticsService.getBusinessMetrics();
      
      // Obtener estadísticas específicas del día
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Usuarios del día
      const usersToday = await prisma.user.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });

      // Juegos del día
      const gamesToday = await prisma.game.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });

      const completedGamesToday = await prisma.game.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          },
          status: 'COMPLETED'
        }
      });

      // Revenue del día (simulado por ahora)
      const revenueToday = await this.calculateDailyRevenue(startOfDay, endOfDay);
      
      // Cartas vendidas del día
      const cardsSoldToday = await prisma.bingoCard.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });

      // Métricas adicionales
      const topMetrics = await this.getDailyTopMetrics(startOfDay, endOfDay);

      const report: DailyReport = {
        date: dateStr,
        summary: {
          totalUsers: businessMetrics.totalUsers,
          newUsers: usersToday,
          activeUsers: businessMetrics.activeUsers,
          totalGames: gamesToday,
          completedGames: completedGamesToday,
          totalRevenue: revenueToday,
          cardsSold: cardsSoldToday
        },
        performance: {
          averageResponseTime: businessMetrics.averageResponseTime,
          errorRate: businessMetrics.errorRate,
          systemUptime: businessMetrics.serverUptime
        },
        topMetrics
      };

      analyticsLogger.info('Daily report generated successfully', { 
        date: dateStr,
        newUsers: usersToday,
        revenue: revenueToday
      });

      return report;
    } catch (error) {
      analyticsLogger.error('Error generating daily report', error as Error, { date });
      throw error;
    }
  }

  /**
   * Generar reporte semanal automático
   */
  async generateWeeklyReport(weekStart?: Date): Promise<WeeklyReport> {
    try {
      const startDate = weekStart || this.getWeekStart(new Date());
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);

      analyticsLogger.info('Generating weekly report', { 
        weekStart: startDate.toISOString(),
        weekEnd: endDate.toISOString()
      });

      // Obtener métricas básicas
      const businessMetrics = await analyticsService.getBusinessMetrics();

      // Usuarios de la semana
      const newUsersWeek = await prisma.user.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      // Juegos de la semana
      const gamesWeek = await prisma.game.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      // Revenue de la semana
      const revenueWeek = await this.calculateWeeklyRevenue(startDate, endDate);
      const previousWeekRevenue = await this.calculatePreviousWeekRevenue(startDate);
      const revenueGrowth = previousWeekRevenue > 0 ? 
        ((revenueWeek - previousWeekRevenue) / previousWeekRevenue) * 100 : 0;

      // Tendencias diarias
      const dailyTrends = await this.getWeeklyTrends(startDate, endDate);

      const report: WeeklyReport = {
        weekStart: startDate.toISOString().split('T')[0],
        weekEnd: endDate.toISOString().split('T')[0],
        summary: {
          totalUsers: businessMetrics.totalUsers,
          newUsers: newUsersWeek,
          retentionRate: await this.calculateRetentionRate(startDate, endDate),
          totalGames: gamesWeek,
          averagePlayersPerGame: await this.calculateAveragePlayersPerGame(startDate, endDate),
          totalRevenue: revenueWeek,
          revenueGrowth
        },
        trends: dailyTrends
      };

      analyticsLogger.info('Weekly report generated successfully', { 
        weekStart: startDate.toISOString().split('T')[0],
        newUsers: newUsersWeek,
        revenue: revenueWeek,
        growth: revenueGrowth
      });

      return report;
    } catch (error) {
      analyticsLogger.error('Error generating weekly report', error as Error, { weekStart });
      throw error;
    }
  }

  /**
   * Generar reporte mensual automático
   */
  async generateMonthlyReport(month?: number, year?: number): Promise<MonthlyReport> {
    try {
      const targetDate = new Date();
      const targetMonth = month || targetDate.getMonth() + 1;
      const targetYear = year || targetDate.getFullYear();

      const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
      const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

      analyticsLogger.info('Generating monthly report', { 
        month: targetMonth,
        year: targetYear
      });

      // Obtener métricas del mes
      const monthlyMetrics = await this.getMonthlyMetrics(startOfMonth, endOfMonth);
      const previousMonthMetrics = await this.getPreviousMonthMetrics(startOfMonth);

      // Calcular tasas de crecimiento
      const userGrowthRate = this.calculateGrowthRate(
        monthlyMetrics.newUsers, 
        previousMonthMetrics.newUsers
      );
      const revenueGrowthRate = this.calculateGrowthRate(
        monthlyMetrics.totalRevenue, 
        previousMonthMetrics.totalRevenue
      );

      // Generar insights y recomendaciones
      const insights = await this.generateMonthlyInsights(startOfMonth, endOfMonth);

      const report: MonthlyReport = {
        month: this.getMonthName(targetMonth),
        year: targetYear,
        summary: {
          totalUsers: monthlyMetrics.totalUsers,
          newUsers: monthlyMetrics.newUsers,
          churnRate: await this.calculateChurnRate(startOfMonth, endOfMonth),
          totalGames: monthlyMetrics.totalGames,
          totalRevenue: monthlyMetrics.totalRevenue,
          profitMargin: await this.calculateProfitMargin(monthlyMetrics.totalRevenue)
        },
        growth: {
          userGrowthRate,
          revenueGrowthRate,
          gameGrowthRate: this.calculateGrowthRate(
            monthlyMetrics.totalGames, 
            previousMonthMetrics.totalGames
          ),
          engagementGrowthRate: await this.calculateEngagementGrowthRate(startOfMonth, endOfMonth)
        },
        insights
      };

      analyticsLogger.info('Monthly report generated successfully', { 
        month: targetMonth,
        year: targetYear,
        newUsers: monthlyMetrics.newUsers,
        revenue: monthlyMetrics.totalRevenue
      });

      return report;
    } catch (error) {
      analyticsLogger.error('Error generating monthly report', error as Error, { month, year });
      throw error;
    }
  }

  /**
   * Verificar KPIs y generar alertas automáticas
   */
  async checkKPIsAndGenerateAlerts(): Promise<KPIAlert[]> {
    try {
      const alerts: KPIAlert[] = [];
      const businessMetrics = await analyticsService.getBusinessMetrics();

      // Alert: Error rate crítico
      if (businessMetrics.errorRate > 5) {
        alerts.push({
          id: `error-rate-${Date.now()}`,
          type: 'critical',
          category: 'performance',
          title: 'High Error Rate Detected',
          description: `Error rate is ${businessMetrics.errorRate.toFixed(2)}%, exceeding the 5% threshold`,
          value: businessMetrics.errorRate,
          threshold: 5,
          timestamp: new Date(),
          resolved: false
        });
      }

      // Alert: Tiempo de respuesta elevado
      if (businessMetrics.averageResponseTime > 2000) {
        alerts.push({
          id: `response-time-${Date.now()}`,
          type: 'warning',
          category: 'performance',
          title: 'Slow Response Time',
          description: `Average response time is ${businessMetrics.averageResponseTime}ms, exceeding the 2000ms threshold`,
          value: businessMetrics.averageResponseTime,
          threshold: 2000,
          timestamp: new Date(),
          resolved: false
        });
      }

      // Alert: Usuarios concurrentes bajos
      if (businessMetrics.concurrentUsers < 10 && new Date().getHours() >= 19 && new Date().getHours() <= 23) {
        alerts.push({
          id: `low-concurrent-users-${Date.now()}`,
          type: 'warning',
          category: 'business',
          title: 'Low Concurrent Users During Peak Hours',
          description: `Only ${businessMetrics.concurrentUsers} concurrent users during peak hours`,
          value: businessMetrics.concurrentUsers,
          threshold: 10,
          timestamp: new Date(),
          resolved: false
        });
      }

      // Alert: Sin nuevos usuarios hoy
      if (businessMetrics.newUsersToday === 0) {
        alerts.push({
          id: `no-new-users-${Date.now()}`,
          type: 'warning',
          category: 'business',
          title: 'No New Users Today',
          description: 'No new user registrations detected today',
          value: 0,
          threshold: 1,
          timestamp: new Date(),
          resolved: false
        });
      }

      // Alert: Retención de usuarios baja
      if (businessMetrics.userRetentionRate < 30) {
        alerts.push({
          id: `low-retention-${Date.now()}`,
          type: 'critical',
          category: 'business',
          title: 'Low User Retention Rate',
          description: `User retention rate is ${businessMetrics.userRetentionRate.toFixed(1)}%, critical level`,
          value: businessMetrics.userRetentionRate,
          threshold: 30,
          timestamp: new Date(),
          resolved: false
        });
      }

      if (alerts.length > 0) {
        analyticsLogger.warn('KPI alerts generated', { 
          alertCount: alerts.length,
          criticalAlerts: alerts.filter(a => a.type === 'critical').length
        });
      }

      return alerts;
    } catch (error) {
      analyticsLogger.error('Error checking KPIs and generating alerts', error as Error);
      throw error;
    }
  }

  // Métodos privados auxiliares
  private async calculateDailyRevenue(startDate: Date, endDate: Date): Promise<number> {
    try {
      const cards = await prisma.bingoCard.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          game: true
        }
      });

      return cards.reduce((total, card) => {
        return total + parseFloat(card.game.cardPrice.toString());
      }, 0);
    } catch (error) {
      return 0;
    }
  }

  private async calculateWeeklyRevenue(startDate: Date, endDate: Date): Promise<number> {
    return this.calculateDailyRevenue(startDate, endDate);
  }

  private async calculatePreviousWeekRevenue(currentWeekStart: Date): Promise<number> {
    const previousWeekStart = new Date(currentWeekStart);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);
    const previousWeekEnd = new Date(currentWeekStart);
    previousWeekEnd.setDate(previousWeekEnd.getDate() - 1);

    return this.calculateDailyRevenue(previousWeekStart, previousWeekEnd);
  }

  private async getDailyTopMetrics(startDate: Date, endDate: Date) {
    return {
      peakConcurrentUsers: 25, // Placeholder
      longestGame: 45, // minutes
      mostActiveUser: 'user_123',
      popularGameTime: '20:00-21:00'
    };
  }

  private getWeekStart(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = result.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
    result.setDate(diff);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  private async getWeeklyTrends(startDate: Date, endDate: Date) {
    // Placeholder implementation
    return {
      dailyActiveUsers: [45, 52, 48, 61, 55, 73, 82],
      dailyRevenue: [125.50, 156.25, 98.75, 203.00, 178.50, 245.75, 312.25],
      gameCompletionRate: 87.5,
      userEngagement: 92.3
    };
  }

  private async calculateRetentionRate(startDate: Date, endDate: Date): Promise<number> {
    // Placeholder implementation
    return 78.5;
  }

  private async calculateAveragePlayersPerGame(startDate: Date, endDate: Date): Promise<number> {
    try {
      const games = await prisma.game.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          _count: {
            select: {
              participants: true
            }
          }
        }
      });

      if (games.length === 0) return 0;

      const totalPlayers = games.reduce((sum, game) => sum + (game._count?.participants || 0), 0);
      return totalPlayers / games.length;
    } catch (error) {
      return 0;
    }
  }

  private async getMonthlyMetrics(startDate: Date, endDate: Date) {
    const newUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const totalGames = await prisma.game.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const totalRevenue = await this.calculateDailyRevenue(startDate, endDate);
    const totalUsers = await prisma.user.count();

    return {
      newUsers,
      totalGames,
      totalRevenue,
      totalUsers
    };
  }

  private async getPreviousMonthMetrics(currentMonthStart: Date) {
    const previousMonthStart = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() - 1, 1);
    const previousMonthEnd = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth(), 0, 23, 59, 59, 999);

    return this.getMonthlyMetrics(previousMonthStart, previousMonthEnd);
  }

  private calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private async calculateChurnRate(startDate: Date, endDate: Date): Promise<number> {
    // Placeholder implementation
    return 12.5;
  }

  private async calculateProfitMargin(revenue: number): Promise<number> {
    // Assuming 60% profit margin
    return revenue * 0.6;
  }

  private async calculateEngagementGrowthRate(startDate: Date, endDate: Date): Promise<number> {
    // Placeholder implementation
    return 15.3;
  }

  private async generateMonthlyInsights(startDate: Date, endDate: Date) {
    return {
      bestPerformingDay: 'Saturday',
      peakHours: ['19:00-20:00', '20:00-21:00', '21:00-22:00'],
      userSegments: [
        { name: 'Regular Players', count: 145, engagement: 'High' },
        { name: 'Casual Players', count: 89, engagement: 'Medium' },
        { name: 'New Players', count: 34, engagement: 'Learning' }
      ],
      recommendedActions: [
        'Increase marketing during peak hours',
        'Create retention campaigns for casual players',
        'Implement tutorial improvements for new players',
        'Consider weekend special events'
      ]
    };
  }

  private getMonthName(month: number): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  }
}

export const reportService = new ReportService();