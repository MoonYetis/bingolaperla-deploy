import { GameData, GameStatus } from '../../../shared/types/game';
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
     * Marca automáticamente un número en todos los cartones activos del juego
     */
    private static autoMarkNumber;
    /**
     * Finaliza un juego
     */
    static endGame(gameId: string): Promise<GameData>;
}
export default GameService;
//# sourceMappingURL=gameService.d.ts.map