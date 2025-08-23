"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMockBingoCard = exports.mockUsers = exports.mockDashboardStats = exports.mockGames = void 0;
const game_1 = require("@/types/game");
// Datos mock para juegos de bingo
exports.mockGames = [
    {
        id: 'game-1',
        title: 'Bingo La Perla - Noche Especial',
        description: 'Juego especial de la noche con premios aumentados',
        maxPlayers: 100,
        cardPrice: 15.00,
        totalPrize: 1500.00,
        status: game_1.GameStatus.OPEN,
        scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // En 2 horas
        ballsDrawn: [],
        currentBall: undefined,
        winningCards: [],
        participantCount: 23,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'game-2',
        title: 'Bingo Matutino Premium',
        description: 'Inicio perfecto para el día con grandes premios',
        maxPlayers: 80,
        cardPrice: 12.00,
        totalPrize: 960.00,
        status: game_1.GameStatus.SCHEDULED,
        scheduledAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // En 12 horas
        ballsDrawn: [],
        currentBall: undefined,
        winningCards: [],
        participantCount: 0,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'game-3',
        title: 'Super Bingo Fin de Semana',
        description: 'El juego más grande de la semana con jackpot acumulado',
        maxPlayers: 200,
        cardPrice: 25.00,
        totalPrize: 5000.00,
        status: game_1.GameStatus.IN_PROGRESS,
        scheduledAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // Hace 30 minutos
        startedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // Hace 15 minutos
        ballsDrawn: [7, 23, 45, 12, 56, 33, 8, 67, 19, 42, 71, 14, 38, 52, 29],
        currentBall: 29,
        winningCards: [],
        participantCount: 156,
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    },
    {
        id: 'game-4',
        title: 'Bingo Express Mediodía',
        description: 'Juego rápido perfecto para el almuerzo',
        maxPlayers: 50,
        cardPrice: 8.00,
        totalPrize: 400.00,
        status: game_1.GameStatus.COMPLETED,
        scheduledAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // Hace 3 horas
        startedAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
        endedAt: new Date(Date.now() - 2.2 * 60 * 60 * 1000).toISOString(),
        ballsDrawn: [15, 32, 47, 8, 61, 29, 43, 18, 56, 71, 4, 38, 52, 67, 11, 35, 49, 73, 26, 44, 58, 7, 21, 36, 50, 64, 13, 27, 41, 55, 69, 2, 16, 30, 45, 59, 72, 9, 24, 37, 51, 65, 14, 28, 42],
        currentBall: 42,
        winningCards: ['card-123', 'card-456'],
        participantCount: 47,
        createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2.2 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'game-5',
        title: 'Bingo de la Tarde',
        description: 'Diversión vespertina con premios garantizados',
        maxPlayers: 75,
        cardPrice: 10.00,
        totalPrize: 750.00,
        status: game_1.GameStatus.OPEN,
        scheduledAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // En 4 horas
        ballsDrawn: [],
        currentBall: undefined,
        winningCards: [],
        participantCount: 12,
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'game-6',
        title: 'Bingo Nocturno VIP',
        description: 'Experiencia premium para jugadores selectos',
        maxPlayers: 30,
        cardPrice: 50.00,
        totalPrize: 1500.00,
        status: game_1.GameStatus.SCHEDULED,
        scheduledAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // En 8 horas
        ballsDrawn: [],
        currentBall: undefined,
        winningCards: [],
        participantCount: 0,
        createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
    }
];
// Estadísticas del dashboard mock
exports.mockDashboardStats = {
    totalGames: 156,
    activeGames: 3,
    totalPlayers: 2847,
    onlinePlayers: 234,
    totalPrizes: 125670.50,
    todaysPrizes: 8450.00,
    averageGameDuration: 18.5, // minutos
    mostPopularGame: 'Super Bingo Fin de Semana',
    recentActivity: [
        {
            id: 'activity-1',
            type: 'game_completed',
            message: 'Bingo Express Mediodía finalizado - 2 ganadores',
            timestamp: new Date(Date.now() - 2.2 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 'activity-2',
            type: 'player_joined',
            message: '5 nuevos jugadores se unieron a Bingo La Perla',
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        },
        {
            id: 'activity-3',
            type: 'game_started',
            message: 'Super Bingo Fin de Semana iniciado con 156 participantes',
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        },
        {
            id: 'activity-4',
            type: 'prize_awarded',
            message: 'Premio de S/400.00 otorgado en Bingo Express',
            timestamp: new Date(Date.now() - 2.2 * 60 * 60 * 1000).toISOString(),
        }
    ]
};
// Datos mock de usuarios
exports.mockUsers = [
    {
        id: 'user-admin',
        email: 'admin@bingollaperla.com',
        username: 'admin',
        role: 'ADMIN',
        createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        balance: 1000.00,
        gamesPlayed: 245,
        gamesWon: 23,
        cardsPurchased: 1200,
        lastLogin: new Date().toISOString(),
    },
    {
        id: 'user-demo',
        email: 'jugador@ejemplo.com',
        username: 'jugador_demo',
        role: 'USER',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        balance: 85.50,
        gamesPlayed: 42,
        gamesWon: 3,
        cardsPurchased: 126,
        lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    }
];
// Función helper para generar un cartón de bingo aleatorio
const generateMockBingoCard = (cardId, gameId, userId) => {
    const card = {
        id: cardId,
        gameId,
        userId,
        cardNumber: Math.floor(Math.random() * 10000) + 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        markedNumbers: [],
        isWinner: false,
        numbers: []
    };
    // Generar números para cada columna
    let position = 0;
    const columns = ['B', 'I', 'N', 'G', 'O'];
    for (let col = 0; col < 5; col++) {
        const columnNumbers = new Set();
        const min = col * 15 + 1;
        const max = (col + 1) * 15;
        // Generar 5 números únicos para esta columna
        while (columnNumbers.size < 5) {
            const num = Math.floor(Math.random() * (max - min + 1)) + min;
            columnNumbers.add(num);
        }
        const numbers = Array.from(columnNumbers);
        for (let row = 0; row < 5; row++) {
            const isFree = col === 2 && row === 2; // Centro es espacio libre
            card.numbers.push({
                id: `${cardId}-${position}`,
                position,
                column: columns[col],
                number: isFree ? null : numbers[row],
                isMarked: isFree,
                isFree
            });
            position++;
        }
    }
    return card;
};
exports.generateMockBingoCard = generateMockBingoCard;
exports.default = {
    mockGames: exports.mockGames,
    mockDashboardStats: exports.mockDashboardStats,
    mockUsers: exports.mockUsers,
    generateMockBingoCard: exports.generateMockBingoCard
};
//# sourceMappingURL=mockData.js.map