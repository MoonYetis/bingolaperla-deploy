import { GameData, GameStatus, BingoCardData } from '@/types/game';
export declare class GameService {
    /**
     * Obtiene todos los juegos disponibles
     */
    static getAllGames(status?: GameStatus): Promise<GameData[]>;
    /**
     * Obtiene un juego específico por ID
     */
    static getGameById(gameId: string): Promise<GameData | null>;
    /**
     * Crea un nuevo juego
     */
    static createGame(gameData: {
        title: string;
        description?: string;
        maxPlayers: number;
        cardPrice: number;
        scheduledAt: Date;
    }): Promise<GameData>;
    /**
     * Inscribe un usuario en un juego
     */
    static joinGame(userId: string, gameId: string): Promise<void>;
    /**
     * Inicia un juego
     */
    static startGame(gameId: string): Promise<GameData>;
    /**
     * Sortea una bola en el juego
     */
    static drawBall(gameId: string): Promise<{
        ball: number;
        gameData: GameData;
        winners?: {
            cardId: string;
            userId: string;
            patterns: string[];
        }[];
    }>;
    /**
     * DEPRECATED: Marca automáticamente un número en todos los cartones activos del juego
     * Ya no se usa en el modo BINGO TRADICIONAL - mantenido solo como referencia
     */
    private static autoMarkNumber;
    /**
     * Verifica y procesa un anuncio de BINGO manual
     */
    static announceBingo(gameId: string, cardId: string, userId: string): Promise<{
        isValid: boolean;
        message: string;
        card?: BingoCardData;
        winningPattern?: string;
    }>;
    /**
     * Finaliza un juego
     */
    static endGame(gameId: string): Promise<GameData>;
    /**
     * MOCK: Obtiene todos los juegos disponibles (versión mock)
     */
    static getAllGamesMock(status?: GameStatus): Promise<GameData[]>;
    /**
     * MOCK: Obtiene un juego específico por ID (versión mock)
     */
    static getGameByIdMock(gameId: string): Promise<GameData | null>;
    /**
     * MOCK: Obtiene estadísticas del dashboard
     */
    static getDashboardStatsMock(): Promise<{
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
    }>;
    /**
     * MOCK: Crear nuevo juego (versión mock)
     */
    static createGameMock(gameData: {
        title: string;
        description?: string;
        maxPlayers: number;
        cardPrice: number;
        scheduledAt: Date;
    }): Promise<GameData>;
    /**
     * MOCK: Unirse a un juego (versión mock)
     */
    static joinGameMock(userId: string, gameId: string): Promise<void>;
    private static demoTimers;
    /**
     * MOCK: Iniciar demo automático con sorteo de bolas cada 4 segundos
     */
    static startDemoMock(gameId: string): Promise<{
        gameId: string;
        status: string;
        demoStarted: boolean;
        ballInterval: number;
        message: string;
    }>;
    /**
     * MOCK: Detener demo automático
     */
    static stopDemoMock(gameId: string): Promise<{
        gameId: string;
        status: string;
        demoStopped: boolean;
        ballsDrawn: number;
        message: string;
    }>;
    /**
     * Limpiar todos los demos al reiniciar servidor
     */
    static cleanupAllDemos(): void;
}
export default GameService;
//# sourceMappingURL=gameService.d.ts.map