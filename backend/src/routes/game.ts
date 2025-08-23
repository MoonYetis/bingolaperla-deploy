import { Router } from 'express';
import { GameController } from '@/controllers/gameController';
import { authenticate, requireAdmin } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validation';
import {
  createGameSchema,
  getGamesSchema,
  gameParamsSchema,
  joinGameSchema,
} from '@/schemas/gameSchemas';

const router = Router();

// GET /api/games/dashboard/stats - Obtener estadísticas del dashboard
router.get('/dashboard/stats', GameController.getDashboardStats);

// GET /api/games/test-cards - Endpoint temporal para probar cartones sin autenticación
import { BingoCardService } from '@/controllers/../services/bingoCardService';
router.get('/test-cards/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const cards = await BingoCardService.generateCardsMock(gameId, 'test-user', 3);
    res.json({
      message: 'Cartones de prueba generados exitosamente',
      cards,
      count: cards.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Error generando cartones de prueba' });
  }
});

// GET /api/games - Obtener todos los juegos
router.get('/', /* validateRequest(getGamesSchema), */ GameController.getAllGames);

// GET /api/games/:gameId - Obtener juego específico
router.get('/:gameId', /* validateRequest(gameParamsSchema), */ GameController.getGameById);

// POST /api/games - Crear nuevo juego (solo admin)
router.post(
  '/',
  authenticate,
  requireAdmin,
  /* validateRequest(createGameSchema), */
  GameController.createGame
);

// POST /api/games/:gameId/join - Unirse a un juego
router.post(
  '/:gameId/join',
  authenticate,
  /* validateRequest(joinGameSchema), */
  GameController.joinGame
);

// POST /api/games/:gameId/start - Iniciar juego (solo admin)
router.post(
  '/:gameId/start',
  authenticate,
  requireAdmin,
  /* validateRequest(gameParamsSchema), */
  GameController.startGame
);

// POST /api/games/:gameId/draw-ball - Sortear bola (solo admin)
router.post(
  '/:gameId/draw-ball',
  authenticate,
  requireAdmin,
  /* validateRequest(gameParamsSchema), */
  GameController.drawBall
);

// POST /api/games/:gameId/end - Finalizar juego (solo admin)
router.post(
  '/:gameId/end',
  authenticate,
  requireAdmin,
  /* validateRequest(gameParamsSchema), */
  GameController.endGame
);

// POST /api/games/:gameId/start-demo - Iniciar demo con sorteo automático
router.post(
  '/:gameId/start-demo',
  /* authenticate, requireAdmin, */
  GameController.startDemo
);

// POST /api/games/:gameId/stop-demo - Detener demo automático
router.post(
  '/:gameId/stop-demo',
  /* authenticate, requireAdmin, */
  GameController.stopDemo
);

// POST /api/games/:gameId/announce-bingo - Anunciar BINGO manualmente
router.post(
  '/:gameId/announce-bingo',
  authenticate,
  GameController.announceBingo
);

export default router;