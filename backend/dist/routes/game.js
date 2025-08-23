"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const gameController_1 = require("@/controllers/gameController");
const auth_1 = require("@/middleware/auth");
const router = (0, express_1.Router)();
// GET /api/games/dashboard/stats - Obtener estadísticas del dashboard
router.get('/dashboard/stats', gameController_1.GameController.getDashboardStats);
// GET /api/games/test-cards - Endpoint temporal para probar cartones sin autenticación
const bingoCardService_1 = require("@/controllers/../services/bingoCardService");
router.get('/test-cards/:gameId', async (req, res) => {
    try {
        const { gameId } = req.params;
        const cards = await bingoCardService_1.BingoCardService.generateCardsMock(gameId, 'test-user', 3);
        res.json({
            message: 'Cartones de prueba generados exitosamente',
            cards,
            count: cards.length
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Error generando cartones de prueba' });
    }
});
// GET /api/games - Obtener todos los juegos
router.get('/', /* validateRequest(getGamesSchema), */ gameController_1.GameController.getAllGames);
// GET /api/games/:gameId - Obtener juego específico
router.get('/:gameId', /* validateRequest(gameParamsSchema), */ gameController_1.GameController.getGameById);
// POST /api/games - Crear nuevo juego (solo admin)
router.post('/', auth_1.authenticate, auth_1.requireAdmin, 
/* validateRequest(createGameSchema), */
gameController_1.GameController.createGame);
// POST /api/games/:gameId/join - Unirse a un juego
router.post('/:gameId/join', auth_1.authenticate, 
/* validateRequest(joinGameSchema), */
gameController_1.GameController.joinGame);
// POST /api/games/:gameId/start - Iniciar juego (solo admin)
router.post('/:gameId/start', auth_1.authenticate, auth_1.requireAdmin, 
/* validateRequest(gameParamsSchema), */
gameController_1.GameController.startGame);
// POST /api/games/:gameId/draw-ball - Sortear bola (solo admin)
router.post('/:gameId/draw-ball', auth_1.authenticate, auth_1.requireAdmin, 
/* validateRequest(gameParamsSchema), */
gameController_1.GameController.drawBall);
// POST /api/games/:gameId/end - Finalizar juego (solo admin)
router.post('/:gameId/end', auth_1.authenticate, auth_1.requireAdmin, 
/* validateRequest(gameParamsSchema), */
gameController_1.GameController.endGame);
// POST /api/games/:gameId/start-demo - Iniciar demo con sorteo automático
router.post('/:gameId/start-demo', 
/* authenticate, requireAdmin, */
gameController_1.GameController.startDemo);
// POST /api/games/:gameId/stop-demo - Detener demo automático
router.post('/:gameId/stop-demo', 
/* authenticate, requireAdmin, */
gameController_1.GameController.stopDemo);
// POST /api/games/:gameId/announce-bingo - Anunciar BINGO manualmente
router.post('/:gameId/announce-bingo', auth_1.authenticate, gameController_1.GameController.announceBingo);
exports.default = router;
//# sourceMappingURL=game.js.map