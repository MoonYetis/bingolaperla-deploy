"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCardSchema = exports.validateCardSchema = exports.getCardPatternsSchema = exports.markNumberSchema = exports.getMyCardsSchema = exports.getUserCardsSchema = exports.generateCardsSchema = void 0;
const zod_1 = require("zod");
const game_1 = require("../../../shared/types/game");
// Schema para generar cartones
exports.generateCardsSchema = {
    body: zod_1.z.object({
        gameId: zod_1.z.string().cuid('ID de juego inválido'),
        count: zod_1.z.number().int().min(1).max(game_1.BINGO_CONSTANTS.MAX_CARDS_PER_USER).default(3),
    }),
};
// Schema para obtener cartones de usuario
exports.getUserCardsSchema = {
    params: zod_1.z.object({
        userId: zod_1.z.string().cuid('ID de usuario inválido'),
        gameId: zod_1.z.string().cuid('ID de juego inválido'),
    }),
};
// Schema para obtener mis cartones
exports.getMyCardsSchema = {
    params: zod_1.z.object({
        gameId: zod_1.z.string().cuid('ID de juego inválido'),
    }),
};
// Schema para marcar número en cartón
exports.markNumberSchema = {
    params: zod_1.z.object({
        cardId: zod_1.z.string().cuid('ID de cartón inválido'),
    }),
    body: zod_1.z.object({
        number: zod_1.z.number().int().min(1, 'Número debe ser mayor a 0').max(75, 'Número debe ser menor o igual a 75'),
    }),
};
// Schema para obtener patrones de cartón
exports.getCardPatternsSchema = {
    params: zod_1.z.object({
        cardId: zod_1.z.string().cuid('ID de cartón inválido'),
    }),
};
// Schema para validar cartón
exports.validateCardSchema = {
    body: zod_1.z.object({
        cardNumbers: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string().optional(),
            position: zod_1.z.number().int().min(0).max(24),
            column: zod_1.z.enum(['B', 'I', 'N', 'G', 'O']),
            number: zod_1.z.number().int().min(1).max(75).nullable(),
            isMarked: zod_1.z.boolean(),
            isFree: zod_1.z.boolean(),
        })).length(25, 'Cartón debe tener exactamente 25 celdas'),
    }),
};
// Schema para eliminar cartón
exports.deleteCardSchema = {
    params: zod_1.z.object({
        cardId: zod_1.z.string().cuid('ID de cartón inválido'),
    }),
};
//# sourceMappingURL=bingoCardSchemas.js.map