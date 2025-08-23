import { Router } from 'express'
import { GamePurchaseController } from '@/controllers/gamePurchaseController'
import { authenticateToken } from '@/middleware/auth'
import { adminAuth } from '@/middleware/adminAuth'
import { validateRequest } from '@/middleware/validation'
import { z } from 'zod'

const router = Router()

// Esquemas de validación
const purchaseCardsSchema = z.object({
  body: z.object({
    gameId: z.string().min(1, 'gameId es requerido'),
    cardCount: z.number().int().min(1).max(50).default(1)
  })
})

const awardPrizeSchema = z.object({
  body: z.object({
    userId: z.string().min(1, 'userId es requerido'),
    gameId: z.string().min(1, 'gameId es requerido'),
    prizeAmount: z.number().positive('prizeAmount debe ser positivo'),
    winningPattern: z.string().min(1, 'winningPattern es requerido')
  })
})

const validatePurchaseSchema = z.object({
  params: z.object({
    gameId: z.string().min(1, 'gameId es requerido'),
    cardCount: z.string().optional()
  })
})

const purchaseHistorySchema = z.object({
  params: z.object({
    gameId: z.string().optional()
  })
})

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
 *                 maximum: 50
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
router.post('/cards', 
  authenticateToken,
  validateRequest({ body: purchaseCardsSchema.shape.body }),
  GamePurchaseController.purchaseCards as any
)

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
router.get('/validate/:gameId/:cardCount?',
  authenticateToken,
  validateRequest({ params: validatePurchaseSchema.shape.params }),
  GamePurchaseController.validatePurchase as any
)

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
router.get('/history/:gameId?',
  authenticateToken,
  validateRequest({ params: purchaseHistorySchema.shape.params }),
  GamePurchaseController.getPurchaseHistory as any
)

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
router.post('/award-prize',
  authenticateToken,
  adminAuth as any,
  validateRequest({ body: awardPrizeSchema.shape.body }),
  GamePurchaseController.awardPrize as any
)

export default router