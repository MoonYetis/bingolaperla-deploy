import { z } from 'zod';
import { GameStatus } from '../../../shared/types/game';
export declare const createGameSchema: {
    body: z.ZodObject<{
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        maxPlayers: z.ZodEffects<z.ZodString, number, string>;
        cardPrice: z.ZodEffects<z.ZodString, number, string>;
        scheduledAt: z.ZodEffects<z.ZodString, Date, string>;
    }, "strip", z.ZodTypeAny, {
        description?: string;
        title?: string;
        maxPlayers?: number;
        cardPrice?: number;
        scheduledAt?: Date;
    }, {
        description?: string;
        title?: string;
        maxPlayers?: string;
        cardPrice?: string;
        scheduledAt?: string;
    }>;
};
export declare const getGamesSchema: {
    query: z.ZodObject<{
        status: z.ZodOptional<z.ZodNativeEnum<typeof GameStatus>>;
    }, "strip", z.ZodTypeAny, {
        status?: GameStatus;
    }, {
        status?: GameStatus;
    }>;
};
export declare const gameParamsSchema: {
    params: z.ZodObject<{
        gameId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        gameId?: string;
    }, {
        gameId?: string;
    }>;
};
export declare const joinGameSchema: {
    params: z.ZodObject<{
        gameId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        gameId?: string;
    }, {
        gameId?: string;
    }>;
};
export type CreateGameInput = z.infer<typeof createGameSchema>;
export type GetGamesInput = z.infer<typeof getGamesSchema>;
export type GameParamsInput = z.infer<typeof gameParamsSchema>;
export type JoinGameInput = z.infer<typeof joinGameSchema>;
//# sourceMappingURL=gameSchemas.d.ts.map