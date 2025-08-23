"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const gamePurchaseController_1 = require("@/controllers/gamePurchaseController");
const auth_1 = require("@/middleware/auth");
const adminAuth_1 = require("@/middleware/adminAuth");
const validation_1 = require("@/middleware/validation");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// Esquemas de validación
const purchaseCardsSchema = zod_1.z.object({
    body: zod_1.z.object({
        gameId: zod_1.z.string().min(1, 'gameId es requerido'),
        cardCount: zod_1.z.number().int().min(1).max(3).default(1)
    })
});
const awardPrizeSchema = zod_1.z.object({
    body: zod_1.z.object({
        userId: zod_1.z.string().min(1, 'userId es requerido'),
        gameId: zod_1.z.string().min(1, 'gameId es requerido'),
        prizeAmount: zod_1.z.number().positive('prizeAmount debe ser positivo'),
        winningPattern: zod_1.z.string().min(1, 'winningPattern es requerido')
    })
});
const validatePurchaseSchema = zod_1.z.object({
    params: zod_1.z.object({
        gameId: zod_1.z.string().min(1, 'gameId es requerido'),
        cardCount: zod_1.z.string().optional()
    })
});
const purchaseHistorySchema = zod_1.z.object({
    params: zod_1.z.object({
        gameId: zod_1.z.string().optional()
    })
});
/**
 * @swagger
 * tags:
 *   name: GamePurchase
 *   description: Compra de cartones con sistema de Perlas
 */
/**
 * @swagger
 * /api/game-purchase/cards:
 *   post:
 *     summary: Comprar cartones de bingo usando Perlas
 *     tags: [GamePurchase]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - gameId
 *             properties:
 *               gameId:
 *                 type: string
 *                 description: ID del juego
 *               cardCount:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 3
 *                 default: 1
 *                 description: Cantidad de cartones a comprar
 *     responses:
 *       200:
 *         description: Compra exitosa
 *       400:
 *         description: Datos inválidos o saldo insuficiente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Juego no encontrado
 *       409:
 *         description: Límite de cartones excedido
 */
router.post('/cards', auth_1.authenticateToken, (0, validation_1.validateRequest)({ body: purchaseCardsSchema.shape.body }), gamePurchaseController_1.GamePurchaseController.purchaseCards);
/**
 * @swagger
 * /api/game-purchase/validate/{gameId}/{cardCount}:
 *   get:
 *     summary: Validar si el usuario puede comprar cartones
 *     tags: [GamePurchase]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del juego
 *       - in: path
 *         name: cardCount
 *         required: false
 *         schema:
 *           type: string
 *           default: "1"
 *         description: Cantidad de cartones a validar
 *     responses:
 *       200:
 *         description: Validación completada
 *       400:
 *         description: Parámetros inválidos
 *       401:
 *         description: No autorizado
 */
router.get('/validate/:gameId/:cardCount?', auth_1.authenticateToken, (0, validation_1.validateRequest)({ params: validatePurchaseSchema.shape.params }), gamePurchaseController_1.GamePurchaseController.validatePurchase);
/**
 * @swagger
 * /api/game-purchase/history/{gameId}:
 *   get:
 *     summary: Obtener historial de compras del usuario
 *     tags: [GamePurchase]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: false
 *         schema:
 *           type: string
 *         description: ID del juego (opcional, si no se proporciona devuelve historial general)
 *     responses:
 *       200:
 *         description: Historial obtenido exitosamente
 *       401:
 *         description: No autorizado
 */
router.get('/history/:gameId?', auth_1.authenticateToken, (0, validation_1.validateRequest)({ params: purchaseHistorySchema.shape.params }), gamePurchaseController_1.GamePurchaseController.getPurchaseHistory);
/**
 * @swagger
 * /api/game-purchase/award-prize:
 *   post:
 *     summary: Acreditar premio en Perlas a un ganador (ADMIN)
 *     tags: [GamePurchase]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - gameId
 *               - prizeAmount
 *               - winningPattern
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID del usuario ganador
 *               gameId:
 *                 type: string
 *                 description: ID del juego
 *               prizeAmount:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Monto del premio en Perlas
 *               winningPattern:
 *                 type: string
 *                 description: Tipo de patrón ganador
 *     responses:
 *       200:
 *         description: Premio acreditado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Solo administradores pueden acreditar premios
 *       404:
 *         description: Usuario o juego no encontrado
 */
router.post('/award-prize', auth_1.authenticateToken, adminAuth_1.adminAuth, (0, validation_1.validateRequest)({ body: awardPrizeSchema.shape.body }), gamePurchaseController_1.GamePurchaseController.awardPrize);
exports.default = router;
//# sourceMappingURL=gamePurchase.js.map