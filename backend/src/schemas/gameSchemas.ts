import { z } from 'zod';
import { GameStatus } from '@/types/game';

// Schema para crear un juego
export const createGameSchema = {
  body: z.object({
    title: z.string().min(1, 'Título es requerido').max(100, 'Título muy largo'),
    description: z.string().max(500, 'Descripción muy larga').optional(),
    maxPlayers: z.string().transform((val) => {
      const num = parseInt(val);
      if (isNaN(num) || num < 2 || num > 1000) {
        throw new Error('Máximo de jugadores debe ser entre 2 y 1000');
      }
      return num;
    }),
    cardPrice: z.string().transform((val) => {
      const num = parseFloat(val);
      if (isNaN(num) || num < 0.01) {
        throw new Error('Precio del cartón debe ser mayor a 0.01');
      }
      return num;
    }),
    scheduledAt: z.string().transform((val) => {
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
export const getGamesSchema = {
  query: z.object({
    status: z.nativeEnum(GameStatus).optional(),
  }),
};

// Schema para parámetros de juego por ID
export const gameParamsSchema = {
  params: z.object({
    gameId: z.string().cuid('ID de juego inválido'),
  }),
};

// Schema para unirse a un juego
export const joinGameSchema = {
  params: z.object({
    gameId: z.string().cuid('ID de juego inválido'),
  }),
};

// Tipos temporalmente comentados por problemas de TypeScript
// export type CreateGameInput = z.infer<typeof createGameSchema>;
// export type GetGamesInput = z.infer<typeof getGamesSchema>;
// export type GameParamsInput = z.infer<typeof gameParamsSchema>;
// export type JoinGameInput = z.infer<typeof joinGameSchema>;