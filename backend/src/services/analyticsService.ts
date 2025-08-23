import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface BusinessMetrics {
  // User metrics
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  userRetentionRate: number;
  
  // Game metrics
  totalGames: number;
  activeGames: number;
  gamesCompletedToday: number;
  averageGameDuration: number;
  
  // Revenue metrics
  totalRevenue: number;
  revenueToday: number;
  averageRevenuePerUser: number;
  cardsSoldToday: number;
  
  // Performance metrics
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

class AnalyticsService {
  private realtimeMetrics: RealtimeMetrics[] = [];
  private metricsRetentionHours = 24;

  /**
   * Obtiene métricas de negocio principales
   */
  async getBusinessMetrics(): Promise<BusinessMetrics> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const yesterday = new Date(startOfDay.getTime() - 24 * 60 * 60 * 1000);

      // User metrics
      const [
        totalUsers,
        activeUsersCount,
        newUsersToday,
        usersYesterday
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({
          where: {
            updatedAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          }
        }),
        prisma.user.count({
          where: {
            createdAt: {
              gte: startOfDay
            }
          }
        }),
        prisma.user.count({
          where: {
            createdAt: {
              gte: yesterday,
              lt: startOfDay
            }
          }
        })
      ]);

      // Game metrics
      const [
        totalGames,
        activeGames,
        gamesCompletedToday,
        averageGameDurationResult
      ] = await Promise.all([
        prisma.game.count(),
        prisma.game.count({
          where: {
            status: 'IN_PROGRESS'
          }
        }),
        prisma.game.count({
          where: {
            status: 'COMPLETED',
            endedAt: {
              gte: startOfDay
            }
          }
        }),
        prisma.game.aggregate({
          where: {
            status: 'COMPLETED',
            startedAt: { not: null },
            endedAt: { not: null }
          },
          _avg: {
            // Calculamos duración en el servicio
          }
        })
      ]);

      // Revenue metrics
      const [
        totalRevenueResult,
        revenueTodayResult,
        cardsSoldToday
      ] = await Promise.all([
        prisma.transaction.aggregate({
          where: {
            type: 'CARD_PURCHASE',
            status: 'COMPLETED'
          },
          _sum: {
            amount: true
          }
        }),
        prisma.transaction.aggregate({
          where: {
            type: 'CARD_PURCHASE',
            status: 'COMPLETED',
            createdAt: {
              gte: startOfDay
            }
          },
          _sum: {
            amount: true
          }
        }),
        prisma.bingoCard.count({
          where: {
            createdAt: {
              gte: startOfDay
            }
          }
        })
      ]);

      // Calculate derived metrics
      const userRetentionRate = usersYesterday > 0 
        ? (activeUsersCount / usersYesterday) * 100 
        : 0;

      const totalRevenue = Number(totalRevenueResult._sum.amount || 0);
      const revenueToday = Number(revenueTodayResult._sum.amount || 0);
      const averageRevenuePerUser = totalUsers > 0 ? totalRevenue / totalUsers : 0;

      // Performance metrics (estos vendrían de monitoring)
      const performanceMetrics = await this.getPerformanceMetrics();

      return {
        totalUsers,
        activeUsers: activeUsersCount,
        newUsersToday,
        userRetentionRate,
        totalGames,
        activeGames,
        gamesCompletedToday,
        averageGameDuration: 0, // Will be calculated from actual game data
        totalRevenue,
        revenueToday,
        averageRevenuePerUser,
        cardsSoldToday,
        ...performanceMetrics
      };
    } catch (error) {
      logger.error('Error getting business metrics:', error);
      throw error;
    }
  }

  /**
   * Obtiene analytics detallados de usuarios
   */
  async getUserAnalytics(limit: number = 100): Promise<UserAnalytics[]> {
    try {
      const users = await prisma.user.findMany({
        take: limit,
        include: {
          gameParticipations: {
            include: {
              game: true
            }
          },
          bingoCards: true,
          transactions: {
            where: {
              type: 'CARD_PURCHASE',
              status: 'COMPLETED'
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });

      return users.map(user => {
        const totalGamesPlayed = user.gameParticipations.length;
        const totalCardsPlayed = user.bingoCards.length;
        const totalSpent = user.transactions.reduce(
          (sum, transaction) => sum + Number(transaction.amount), 
          0
        );
        const wins = user.gameParticipations.filter(p => p.hasWon).length;
        const winRate = totalGamesPlayed > 0 ? (wins / totalGamesPlayed) * 100 : 0;

        return {
          userId: user.id,
          totalGamesPlayed,
          totalCardsPlayed,
          totalSpent,
          winRate,
          lastActiveDate: user.updatedAt,
          favoriteGameTime: this.calculateFavoriteGameTime(user.gameParticipations),
          deviceType: 'web', // Would be tracked in real implementation
          location: undefined // Would be tracked if needed
        };
      });
    } catch (error) {
      logger.error('Error getting user analytics:', error);
      throw error;
    }
  }

  /**
   * Obtiene analytics de juegos específicos
   */
  async getGameAnalytics(gameId?: string): Promise<GameAnalytics[]> {
    try {
      const whereClause = gameId ? { id: gameId } : {};
      
      const games = await prisma.game.findMany({
        where: {
          ...whereClause,
          status: 'COMPLETED'
        },
        include: {
          participants: true,
          bingoCards: true
        },
        orderBy: {
          endedAt: 'desc'
        },
        take: gameId ? 1 : 50
      });

      return games.map(game => {
        const duration = game.startedAt && game.endedAt 
          ? game.endedAt.getTime() - game.startedAt.getTime()
          : 0;
        
        const revenue = game.participants.reduce(
          (sum, participant) => sum + Number(participant.totalSpent),
          0
        );

        const winnerCount = game.participants.filter(p => p.hasWon).length;
        const averageCardsPerPlayer = game.participants.length > 0 
          ? game.bingoCards.length / game.participants.length 
          : 0;

        return {
          gameId: game.id,
          playerCount: game.participants.length,
          duration,
          cardsGenerated: game.bingoCards.length,
          revenue,
          winnerCount,
          averageCardsPerPlayer,
          completionTime: game.endedAt || new Date()
        };
      });
    } catch (error) {
      logger.error('Error getting game analytics:', error);
      throw error;
    }
  }

  /**
   * Registra métricas en tiempo real
   */
  async recordRealtimeMetrics(metrics: Omit<RealtimeMetrics, 'timestamp'>) {
    const realtimeMetric: RealtimeMetrics = {
      ...metrics,
      timestamp: new Date()
    };

    this.realtimeMetrics.push(realtimeMetric);

    // Limpiar métricas antiguas
    const cutoff = new Date(Date.now() - this.metricsRetentionHours * 60 * 60 * 1000);
    this.realtimeMetrics = this.realtimeMetrics.filter(
      metric => metric.timestamp > cutoff
    );

    logger.info('Realtime metrics recorded', realtimeMetric);
  }

  /**
   * Obtiene métricas en tiempo real
   */
  getRealtimeMetrics(hoursBack: number = 1): RealtimeMetrics[] {
    const cutoff = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    return this.realtimeMetrics.filter(metric => metric.timestamp > cutoff);
  }

  /**
   * Genera reportes personalizados
   */
  async generateCustomReport(
    startDate: Date,
    endDate: Date,
    metrics: string[]
  ): Promise<any> {
    try {
      const report: any = {
        period: {
          start: startDate,
          end: endDate
        },
        data: {}
      };

      // Users report
      if (metrics.includes('users')) {
        report.data.users = await prisma.user.aggregate({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          },
          _count: true
        });
      }

      // Games report
      if (metrics.includes('games')) {
        report.data.games = await prisma.game.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          },
          include: {
            participants: true
          }
        });
      }

      // Revenue report
      if (metrics.includes('revenue')) {
        report.data.revenue = await prisma.transaction.aggregate({
          where: {
            type: 'CARD_PURCHASE',
            status: 'COMPLETED',
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          },
          _sum: {
            amount: true
          },
          _count: true
        });
      }

      return report;
    } catch (error) {
      logger.error('Error generating custom report:', error);
      throw error;
    }
  }

  /**
   * Calcula métricas de performance básicas
   */
  private async getPerformanceMetrics() {
    // En una implementación real, esto vendría de monitoring tools
    return {
      serverUptime: process.uptime(),
      averageResponseTime: 150, // ms - vendría de monitoring
      errorRate: 0.01, // 1% - vendría de logs
      concurrentUsers: this.realtimeMetrics.length > 0 
        ? this.realtimeMetrics[this.realtimeMetrics.length - 1].activeUsers 
        : 0
    };
  }

  /**
   * Calcula la hora favorita de juego del usuario
   */
  private calculateFavoriteGameTime(participations: any[]): string {
    if (participations.length === 0) return 'No data';

    const hourCounts: { [hour: number]: number } = {};
    
    participations.forEach(participation => {
      const hour = participation.joinedAt.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const favoriteHour = Object.entries(hourCounts)
      .reduce((max, [hour, count]) => 
        count > max.count ? { hour: parseInt(hour), count } : max,
        { hour: 0, count: 0 }
      ).hour;

    return `${favoriteHour}:00`;
  }

  /**
   * Obtiene tendencias de métricas
   */
  async getTrends(metric: string, days: number = 7): Promise<any[]> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    
    const trends = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      
      let value = 0;
      
      switch (metric) {
        case 'users':
          value = await prisma.user.count({
            where: {
              createdAt: {
                gte: date,
                lt: nextDate
              }
            }
          });
          break;
          
        case 'games':
          value = await prisma.game.count({
            where: {
              createdAt: {
                gte: date,
                lt: nextDate
              }
            }
          });
          break;
          
        case 'revenue':
          const result = await prisma.transaction.aggregate({
            where: {
              type: 'CARD_PURCHASE',
              status: 'COMPLETED',
              createdAt: {
                gte: date,
                lt: nextDate
              }
            },
            _sum: {
              amount: true
            }
          });
          value = Number(result._sum.amount || 0);
          break;
      }
      
      trends.push({
        date: date.toISOString().split('T')[0],
        value
      });
    }
    
    return trends;
  }
}

export const analyticsService = new AnalyticsService();