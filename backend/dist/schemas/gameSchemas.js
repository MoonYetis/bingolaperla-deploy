"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinGameSchema = exports.gameParamsSchema = exports.getGamesSchema = exports.createGameSchema = void 0;
const zod_1 = require("zod");
const game_1 = require("@/types/game");
// Schema para crear un juego
exports.createGameSchema = {
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, 'Título es requerido').max(100, 'Título muy largo'),
        description: zod_1.z.string().max(500, 'Descripción muy larga').optional(),
        maxPlayers: zod_1.z.string().transform((val) => {
            const num = parseInt(val);
            if (isNaN(num) || num < 2 || num > 1000) {
                throw new Error('Máximo de jugadores debe ser entre 2 y 1000');
            }
            return num;
        }),
        cardPrice: zod_1.z.string().transform((val) => {
            const num = parseFloat(val);
            if (isNaN(num) || num < 0.01) {
                throw new Error('Precio del cartón debe ser mayor a 0.01');
            }
            return num;
        }),
        scheduledAt: zod_1.z.string().transform((val) => {
            const date = new Date(val);
            if (isNaN(date.getTime())) {
                throw new Error('Fecha de programación inválida');
            }
            if (date <= new Date()) {
                throw new Error('Fecha de programación debe ser futura');
            }
            return date;
        }),
    }),
};
// Schema para filtrar juegos
exports.getGamesSchema = {
    query: zod_1.z.object({
        status: zod_1.z.nativeEnum(game_1.GameStatus).optional(),
    }),
};
// Schema para parámetros de juego por ID
exports.gameParamsSchema = {
    params: zod_1.z.object({
        gameId: zod_1.z.string().cuid('ID de juego inválido'),
    }),
};
// Schema para unirse a un juego
exports.joinGameSchema = {
    params: zod_1.z.object({
        gameId: zod_1.z.string().cuid('ID de juego inválido'),
    }),
};
// Tipos temporalmente comentados por problemas de TypeScript
// export type CreateGameInput = z.infer<typeof createGameSchema>;
// export type GetGamesInput = z.infer<typeof getGamesSchema>;
// export type GameParamsInput = z.infer<typeof gameParamsSchema>;
// export type JoinGameInput = z.infer<typeof joinGameSchema>;
//# sourceMappingURL=gameSchemas.js.map