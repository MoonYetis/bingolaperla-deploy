import httpClient from './httpClient';

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
  lastActiveDate: string;
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
  completionTime: string;
}

export interface RealtimeMetrics {
  timestamp: string;
  activeUsers: number;
  activeGames: number;
  memoryUsage: number;
  cpuUsage: number;
  dbConnections: number;
  socketConnections: number;
}

export interface TrendData {
  date: string;
  value: number;
}

export interface DashboardData {
  businessMetrics: BusinessMetrics;
  realtimeMetrics: RealtimeMetrics[];
  trends: {
    users: TrendData[];
    games: TrendData[];
    revenue: TrendData[];
  };
  lastUpdated: string;
}

export interface BingoKPIs {
  dailyActiveUsers: number;
  conversionRate: number;
  averageSessionDuration: number;
  gamesPerDay: number;
  averagePlayersPerGame: number;
  cardsSoldPerGame: number;
  dailyRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  arpu: number;
  userRetentionRate: number;
  repeatPlayerRate: number;
  socialSharingRate: number;
  systemUptime: number;
  averageLatency: number;
  errorRate: number;
  trendIndicators: {
    usersGrowth: string;
    revenueGrowth: string;
    engagementGrowth: string;
  };
}

export const analyticsApi = {
  // Obtener métricas principales
  async getBusinessMetrics(): Promise<BusinessMetrics> {
    const response = await httpClient.get('/analytics/metrics');
    return response.data.data;
  },

  // Obtener dashboard completo
  async getDashboard(): Promise<DashboardData> {
    const response = await httpClient.get('/analytics/dashboard');
    return response.data.data;
  },

  // Obtener KPIs específicos de Bingo
  async getBingoKPIs(): Promise<BingoKPIs> {
    const response = await httpClient.get('/analytics/kpis');
    return response.data.data;
  },

  // Obtener analytics de usuarios
  async getUserAnalytics(limit: number = 100): Promise<UserAnalytics[]> {
    const response = await httpClient.get(`/analytics/users?limit=${limit}`);
    return response.data.data;
  },

  // Obtener analytics de juegos
  async getGameAnalytics(gameId?: string): Promise<GameAnalytics[]> {
    const url = gameId ? `/analytics/games/${gameId}` : '/analytics/games';
    const response = await httpClient.get(url);
    return response.data.data;
  },

  // Obtener métricas en tiempo real
  async getRealtimeMetrics(hours: number = 1): Promise<RealtimeMetrics[]> {
    const response = await httpClient.get(`/analytics/realtime?hours=${hours}`);
    return response.data.data;
  },

  // Registrar métricas en tiempo real
  async recordRealtimeMetrics(metrics: Omit<RealtimeMetrics, 'timestamp'>): Promise<void> {
    await httpClient.post('/analytics/realtime', metrics);
  },

  // Obtener tendencias
  async getTrends(metric: 'users' | 'games' | 'revenue', days: number = 7): Promise<TrendData[]> {
    const response = await httpClient.get(`/analytics/trends/${metric}?days=${days}`);
    return response.data.data.trends;
  },

  // Generar reporte personalizado
  async generateCustomReport(
    startDate: string,
    endDate: string,
    metrics: string[]
  ): Promise<any> {
    const response = await httpClient.post('/analytics/reports', {
      startDate,
      endDate,
      metrics
    });
    return response.data.data;
  },

  // Exportar datos a CSV
  exportToCSV(data: any[], filename: string): void {
    if (!data.length) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escapar comillas y envolver en comillas si contiene comas
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Formatear números para mostrar
  formatNumber(num: number, decimals: number = 0): string {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  },

  // Formatear moneda
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR' // Cambiar según la moneda usada
    }).format(amount);
  },

  // Formatear porcentaje
  formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
  },

  // Formatear duración en tiempo legible
  formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  },

  // Calcular crecimiento porcentual
  calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  },

  // Obtener color para indicadores
  getIndicatorColor(value: number, isPercentage: boolean = false): string {
    const threshold = isPercentage ? 0 : 1;
    if (value > threshold) return 'text-green-600';
    if (value < -threshold) return 'text-red-600';
    return 'text-yellow-600';
  }
};