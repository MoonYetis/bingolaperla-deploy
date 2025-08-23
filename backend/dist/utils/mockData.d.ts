import { GameData } from '@/types/game';
export declare const mockGames: GameData[];
export declare const mockDashboardStats: {
    totalGames: number;
    activeGames: number;
    totalPlayers: number;
    onlinePlayers: number;
    totalPrizes: number;
    todaysPrizes: number;
    averageGameDuration: number;
    mostPopularGame: string;
    recentActivity: {
        id: string;
        type: string;
        message: string;
        timestamp: string;
    }[];
};
export declare const mockUsers: ({
    id: string;
    email: string;
    username: string;
    role: "ADMIN";
    createdAt: string;
    updatedAt: string;
    balance: number;
    gamesPlayed: number;
    gamesWon: number;
    cardsPurchased: number;
    lastLogin: string;
} | {
    id: string;
    email: string;
    username: string;
    role: "USER";
    createdAt: string;
    updatedAt: string;
    balance: number;
    gamesPlayed: number;
    gamesWon: number;
    cardsPurchased: number;
    lastLogin: string;
})[];
export declare const generateMockBingoCard: (cardId: string, gameId: string, userId: string) => {
    id: string;
    gameId: string;
    userId: string;
    cardNumber: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    markedNumbers: number[];
    isWinner: boolean;
    numbers: Array<{
        id: string;
        position: number;
        column: "B" | "I" | "N" | "G" | "O";
        number: number | null;
        isMarked: boolean;
        isFree: boolean;
    }>;
};
declare const _default: {
    mockGames: GameData[];
    mockDashboardStats: {
        totalGames: number;
        activeGames: number;
        totalPlayers: number;
        onlinePlayers: number;
        totalPrizes: number;
        todaysPrizes: number;
        averageGameDuration: number;
        mostPopularGame: string;
        recentActivity: {
            id: string;
            type: string;
            message: string;
            timestamp: string;
        }[];
    };
    mockUsers: ({
        id: string;
        email: string;
        username: string;
        role: "ADMIN";
        createdAt: string;
        updatedAt: string;
        balance: number;
        gamesPlayed: number;
        gamesWon: number;
        cardsPurchased: number;
        lastLogin: string;
    } | {
        id: string;
        email: string;
        username: string;
        role: "USER";
        createdAt: string;
        updatedAt: string;
        balance: number;
        gamesPlayed: number;
        gamesWon: number;
        cardsPurchased: number;
        lastLogin: string;
    })[];
    generateMockBingoCard: (cardId: string, gameId: string, userId: string) => {
        id: string;
        gameId: string;
        userId: string;
        cardNumber: number;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
        markedNumbers: number[];
        isWinner: boolean;
        numbers: Array<{
            id: string;
            position: number;
            column: "B" | "I" | "N" | "G" | "O";
            number: number | null;
            isMarked: boolean;
            isFree: boolean;
        }>;
    };
};
export default _default;
//# sourceMappingURL=mockData.d.ts.map