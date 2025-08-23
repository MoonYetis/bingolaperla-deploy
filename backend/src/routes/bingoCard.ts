import { Router } from 'express';
import { BingoCardController } from '@/controllers/bingoCardController';
import { authenticate, requireAdmin } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validation';
import {
  generateCardsSchema,
  getUserCardsSchema,
  getMyCardsSchema,
  markNumberSchema,
  getCardPatternsSchema,
  validateCardSchema,
  deleteCardSchema,
} from '@/schemas/bingoCardSchemas';

const router = Router();

// POST /api/cards/generate - Generar cartones para un juego
router.post(
  '/generate',
  authenticate,
  /* validateRequest(generateCardsSchema), */
  BingoCardController.generateCards
);

// GET /api/cards/user/:userId/game/:gameId - Obtener cartones de usuario (admin o propio usuario)
router.get(
  '/user/:userId/game/:gameId',
  authenticate,
  /* validateRequest(getUserCardsSchema), */
  BingoCardController.getUserCards
);

// GET /api/cards/my/:gameId - Obtener mis cartones
router.get(
  '/my/:gameId',
  authenticate,
  /* validateRequest(getMyCardsSchema), */
  BingoCardController.getMyCards
);

// GET /api/cards/my-all - Obtener todos mis cartones agrupados por juego
router.get(
  '/my-all',
  authenticate,
  BingoCardController.getMyAllCards
);

// PUT /api/cards/:cardId/mark - Marcar número en cartón
router.put(
  '/:cardId/mark',
  authenticate,
  /* validateRequest(markNumberSchema), */
  BingoCardController.markNumber
);

// GET /api/cards/:cardId/patterns - Obtener patrones del cartón
router.get(
  '/:cardId/patterns',
  authenticate,
  /* validateRequest(getCardPatternsSchema), */
  BingoCardController.getCardPatterns
);

// POST /api/cards/validate - Validar estructura de cartón
router.post(
  '/validate',
  /* validateRequest(validateCardSchema), */
  BingoCardController.validateCard
);

// DELETE /api/cards/:cardId - Eliminar/desactivar cartón
router.delete(
  '/:cardId',
  authenticate,
  /* validateRequest(deleteCardSchema), */
  BingoCardController.deleteCard
);

export default router;