"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bingoCardController_1 = require("@/controllers/bingoCardController");
const auth_1 = require("@/middleware/auth");
const validation_1 = require("@/middleware/validation");
const bingoCardSchemas_1 = require("@/schemas/bingoCardSchemas");
const router = (0, express_1.Router)();
// POST /api/cards/generate - Generar cartones para un juego
router.post('/generate', auth_1.authenticate, (0, validation_1.validateRequest)(bingoCardSchemas_1.generateCardsSchema), bingoCardController_1.BingoCardController.generateCards);
// GET /api/cards/user/:userId/game/:gameId - Obtener cartones de usuario (admin o propio usuario)
router.get('/user/:userId/game/:gameId', auth_1.authenticate, (0, validation_1.validateRequest)(bingoCardSchemas_1.getUserCardsSchema), bingoCardController_1.BingoCardController.getUserCards);
// GET /api/cards/my/:gameId - Obtener mis cartones
router.get('/my/:gameId', auth_1.authenticate, (0, validation_1.validateRequest)(bingoCardSchemas_1.getMyCardsSchema), bingoCardController_1.BingoCardController.getMyCards);
// PUT /api/cards/:cardId/mark - Marcar número en cartón
router.put('/:cardId/mark', auth_1.authenticate, (0, validation_1.validateRequest)(bingoCardSchemas_1.markNumberSchema), bingoCardController_1.BingoCardController.markNumber);
// GET /api/cards/:cardId/patterns - Obtener patrones del cartón
router.get('/:cardId/patterns', auth_1.authenticate, (0, validation_1.validateRequest)(bingoCardSchemas_1.getCardPatternsSchema), bingoCardController_1.BingoCardController.getCardPatterns);
// POST /api/cards/validate - Validar estructura de cartón
router.post('/validate', (0, validation_1.validateRequest)(bingoCardSchemas_1.validateCardSchema), bingoCardController_1.BingoCardController.validateCard);
// DELETE /api/cards/:cardId - Eliminar/desactivar cartón
router.delete('/:cardId', auth_1.authenticate, (0, validation_1.validateRequest)(bingoCardSchemas_1.deleteCardSchema), bingoCardController_1.BingoCardController.deleteCard);
exports.default = router;
//# sourceMappingURL=bingoCard.js.map