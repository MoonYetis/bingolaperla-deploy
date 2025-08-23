"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const gameController_1 = require("@/controllers/gameController");
const auth_1 = require("@/middleware/auth");
const validation_1 = require("@/middleware/validation");
const gameSchemas_1 = require("@/schemas/gameSchemas");
const router = (0, express_1.Router)();
// GET /api/games - Obtener todos los juegos
router.get('/', (0, validation_1.validateRequest)(gameSchemas_1.getGamesSchema), gameController_1.GameController.getAllGames);
// GET /api/games/:gameId - Obtener juego específico
router.get('/:gameId', (0, validation_1.validateRequest)(gameSchemas_1.gameParamsSchema), gameController_1.GameController.getGameById);
// POST /api/games - Crear nuevo juego (solo admin)
router.post('/', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validateRequest)(gameSchemas_1.createGameSchema), gameController_1.GameController.createGame);
// POST /api/games/:gameId/join - Unirse a un juego
router.post('/:gameId/join', auth_1.authenticate, (0, validation_1.validateRequest)(gameSchemas_1.joinGameSchema), gameController_1.GameController.joinGame);
// POST /api/games/:gameId/start - Iniciar juego (solo admin)
router.post('/:gameId/start', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validateRequest)(gameSchemas_1.gameParamsSchema), gameController_1.GameController.startGame);
// POST /api/games/:gameId/draw-ball - Sortear bola (solo admin)
router.post('/:gameId/draw-ball', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validateRequest)(gameSchemas_1.gameParamsSchema), gameController_1.GameController.drawBall);
// POST /api/games/:gameId/end - Finalizar juego (solo admin)
router.post('/:gameId/end', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validateRequest)(gameSchemas_1.gameParamsSchema), gameController_1.GameController.endGame);
exports.default = router;
//# sourceMappingURL=game.js.map