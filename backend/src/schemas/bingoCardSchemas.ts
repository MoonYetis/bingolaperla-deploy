import { z } from 'zod';
import { BINGO_CONSTANTS } from '@/types/game';

// Schema para generar cartones
export const generateCardsSchema = {
  body: z.object({
    gameId: z.string().cuid('ID de juego inválido'),
    count: z.number().int().min(1).max(BINGO_CONSTANTS.MAX_CARDS_PER_USER).default(3),
  }),
};

// Schema para obtener cartones de usuario
export const getUserCardsSchema = {
  params: z.object({
    userId: z.string().cuid('ID de usuario inválido'),
    gameId: z.string().cuid('ID de juego inválido'),
  }),
};

// Schema para obtener mis cartones
export const getMyCardsSchema = {
  params: z.object({
    gameId: z.string().cuid('ID de juego inválido'),
  }),
};

// Schema para marcar número en cartón
export const markNumberSchema = {
  params: z.object({
    cardId: z.string().cuid('ID de cartón inválido'),
  }),
  body: z.object({
    number: z.number().int().min(1, 'Número debe ser mayor a 0').max(75, 'Número debe ser menor o igual a 75'),
  }),
};

// Schema para obtener patrones de cartón
export const getCardPatternsSchema = {
  params: z.object({
    cardId: z.string().cuid('ID de cartón inválido'),
  }),
};

// Schema para validar cartón
export const validateCardSchema = {
  body: z.object({
    cardNumbers: z.array(z.object({
      id: z.string().optional(),
      position: z.number().int().min(0).max(24),
      column: z.enum(['B', 'I', 'N', 'G', 'O']),
      number: z.number().int().min(1).max(75).nullable(),
      isMarked: z.boolean(),
      isFree: z.boolean(),
    })).length(25, 'Cartón debe tener exactamente 25 celdas'),
  }),
};

// Schema para eliminar cartón
export const deleteCardSchema = {
  params: z.object({
    cardId: z.string().cuid('ID de cartón inválido'),
  }),
};

// Tipos temporalmente comentados por problemas de TypeScript
// export type GenerateCardsInput = z.infer<typeof generateCardsSchema>;
// export type GetUserCardsInput = z.infer<typeof getUserCardsSchema>;
// export type GetMyCardsInput = z.infer<typeof getMyCardsSchema>;
// export type MarkNumberInput = z.infer<typeof markNumberSchema>;
// export type GetCardPatternsInput = z.infer<typeof getCardPatternsSchema>;
// export type ValidateCardInput = z.infer<typeof validateCardSchema>;
// export type DeleteCardInput = z.infer<typeof deleteCardSchema>;