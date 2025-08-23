import { prisma } from '@/config/database'
import { walletService } from './walletService'
import { logger } from '@/utils/structuredLogger'
import { BingoCardService } from './bingoCardService'

export interface GamePurchaseResult {
  transaction: {
    id: string
    amount: number
    description: string
    timestamp: string
  }
  cards: Array<{
    id: string
    cardNumber: number
    numbers: any[]
  }>
  newBalance: number
  gameInfo: {
    id: string
    title: string
    cardPrice: number
  }
}

export class GamePurchaseService {
  /**
   * Compra cartones de bingo usando Perlas
   */
  static async purchaseCardsWithPearls(
    userId: string,
    gameId: string,
    cardCount: number = 1
  ): Promise<GamePurchaseResult> {
    try {
      // Validar parámetros
      if (cardCount <= 0) {
        throw new Error('La cantidad de cartones debe ser mayor a 0')
      }
      
      // Límite práctico para prevenir abuso del sistema
      if (cardCount > 100) {
        throw new Error('Máximo 100 cartones por compra para mantener el rendimiento')
      }

      // Realizar la compra en una transacción atómica
      const result = await prisma.$transaction(async (tx) => {
        // 1. Obtener información del juego
        const game = await tx.game.findUnique({
          where: { id: gameId },
          include: {
            _count: {
              select: { participants: true }
            }
          }
        })

        if (!game) {
          throw new Error('Juego no encontrado')
        }

        if (game.status !== 'OPEN' && game.status !== 'SCHEDULED' && game.status !== 'IN_PROGRESS') {
          throw new Error('El juego no está disponible para compra de cartones')
        }

        if (game._count.participants >= game.maxPlayers) {
          throw new Error('El juego está lleno')
        }

        // 2. Calcular costo total
        const cardPrice = parseFloat(game.cardPrice.toString())
        const totalCost = cardPrice * cardCount

        // 3. Verificar balance de Perlas del usuario
        const userWallet = await tx.wallet.findUnique({
          where: { userId }
        })

        if (!userWallet) {
          throw new Error('Billetera no encontrada. Contacta soporte.')
        }

        if (!userWallet.isActive || userWallet.isFrozen) {
          throw new Error('Tu billetera está suspendida. Contacta soporte.')
        }

        const currentBalance = parseFloat(userWallet.balance.toString())
        if (currentBalance < totalCost) {
          throw new Error(`Saldo insuficiente. Necesitas ${totalCost.toFixed(2)} Perlas pero solo tienes ${currentBalance.toFixed(2)}`)
        }

        // 4. Verificar si el usuario ya participa en este juego
        let gameParticipant = await tx.gameParticipant.findUnique({
          where: {
            userId_gameId: {
              userId,
              gameId
            }
          }
        })

        // 5. Verificar límite de cartones por usuario (máximo 100 total por juego)
        const existingCardsCount = await tx.bingoCard.count({
          where: {
            userId,
            gameId
          }
        })

        if (existingCardsCount + cardCount > 100) {
          throw new Error(`No puedes tener más de 100 cartones por juego. Ya tienes ${existingCardsCount}`)
        }

        // 6. Debitar Perlas del usuario
        const newBalance = currentBalance - totalCost
        await tx.wallet.update({
          where: { userId },
          data: { balance: newBalance }
        })

        // 7. Crear transacción de compra
        const transaction = await tx.transaction.create({
          data: {
            userId,
            type: 'GAME_PURCHASE',
            amount: totalCost,
            pearlsAmount: totalCost,
            description: `Compra de ${cardCount} cartón${cardCount > 1 ? 'es' : ''} - ${game.title}`,
            status: 'COMPLETED',
            paymentMethod: 'PEARLS',
            referenceId: `GAME-${gameId}-${Date.now()}`
          }
        })

        // 8. Crear o actualizar participación en el juego
        if (gameParticipant) {
          // Actualizar participación existente
          gameParticipant = await tx.gameParticipant.update({
            where: { id: gameParticipant.id },
            data: {
              cardsCount: gameParticipant.cardsCount + cardCount,
              totalSpent: parseFloat(gameParticipant.totalSpent.toString()) + totalCost
            }
          })
        } else {
          // Crear nueva participación
          gameParticipant = await tx.gameParticipant.create({
            data: {
              userId,
              gameId,
              cardsCount: cardCount,
              totalSpent: totalCost
            }
          })
        }

        // 9. Generar cartones de bingo
        const cards = []
        for (let i = 0; i < cardCount; i++) {
          // Obtener el siguiente número de cartón disponible
          const maxCardNumber = await tx.bingoCard.aggregate({
            where: { gameId },
            _max: { cardNumber: true }
          })
          
          const nextCardNumber = (maxCardNumber._max.cardNumber || 0) + 1

          // Generar números únicos para el cartón
          const cardNumbers = BingoCardService.generateUniqueCard()

          // Crear el cartón en la base de datos
          const bingoCard = await tx.bingoCard.create({
            data: {
              userId,
              gameId,
              cardNumber: nextCardNumber
            }
          })

          // Crear los números del cartón
          const cardNumberRecords = await Promise.all(
            cardNumbers.map(async (cardNumber, index) => {
              return await tx.cardNumber.create({
                data: {
                  cardId: bingoCard.id,
                  position: cardNumber.position,
                  column: cardNumber.column,
                  number: cardNumber.number,
                  isMarked: cardNumber.isMarked,
                  isFree: cardNumber.isFree
                }
              })
            })
          )

          cards.push({
            id: bingoCard.id,
            cardNumber: bingoCard.cardNumber,
            numbers: cardNumbers
          })
        }

        return {
          transaction: {
            id: transaction.id,
            amount: totalCost,
            description: transaction.description,
            timestamp: transaction.createdAt.toISOString()
          },
          cards,
          newBalance,
          gameInfo: {
            id: game.id,
            title: game.title,
            cardPrice
          }
        }
      })

      logger.info('Cartones comprados con Perlas exitosamente', {
        userId,
        gameId,
        cardCount,
        totalCost: result.transaction.amount,
        newBalance: result.newBalance,
        transactionId: result.transaction.id
      })

      return result

    } catch (error) {
      logger.error('Error comprando cartones con Perlas', error as Error, {
        userId,
        gameId,
        cardCount
      })
      throw error
    }
  }

  /**
   * Acreditar premio en Perlas cuando un usuario gana
   */
  static async awardPrizeInPearls(
    userId: string,
    gameId: string,
    prizeAmount: number,
    winningPattern: string
  ): Promise<{
    transaction: any
    newBalance: number
    gameInfo: any
  }> {
    try {
      if (prizeAmount <= 0) {
        throw new Error('El monto del premio debe ser mayor a 0')
      }

      const result = await prisma.$transaction(async (tx) => {
        // 1. Verificar el juego
        const game = await tx.game.findUnique({
          where: { id: gameId }
        })

        if (!game) {
          throw new Error('Juego no encontrado')
        }

        // 2. Verificar billetera del usuario
        const userWallet = await tx.wallet.findUnique({
          where: { userId }
        })

        if (!userWallet) {
          throw new Error('Billetera no encontrada')
        }

        if (!userWallet.isActive) {
          throw new Error('Billetera inactiva')
        }

        // 3. Acreditar Perlas
        const currentBalance = parseFloat(userWallet.balance.toString())
        const newBalance = currentBalance + prizeAmount

        await tx.wallet.update({
          where: { userId },
          data: { balance: newBalance }
        })

        // 4. Crear transacción de premio
        const transaction = await tx.transaction.create({
          data: {
            userId,
            type: 'GAME_WIN',
            amount: prizeAmount,
            pearlsAmount: prizeAmount,
            description: `Premio ${winningPattern} - ${game.title}`,
            status: 'COMPLETED',
            paymentMethod: 'GAME_PRIZE',
            referenceId: `WIN-${gameId}-${userId}-${Date.now()}`
          }
        })

        // 5. Actualizar participación del juego
        await tx.gameParticipant.updateMany({
          where: {
            userId,
            gameId
          },
          data: {
            hasWon: true,
            prizeWon: prizeAmount
          }
        })

        return {
          transaction,
          newBalance,
          gameInfo: {
            id: game.id,
            title: game.title
          }
        }
      })

      logger.info('Premio acreditado en Perlas exitosamente', {
        userId,
        gameId,
        prizeAmount,
        winningPattern,
        newBalance: result.newBalance,
        transactionId: result.transaction.id
      })

      return result

    } catch (error) {
      logger.error('Error acreditando premio en Perlas', error as Error, {
        userId,
        gameId,
        prizeAmount,
        winningPattern
      })
      throw error
    }
  }

  /**
   * Obtener información de compras de cartones de un usuario para un juego específico
   */
  static async getUserGamePurchases(userId: string, gameId: string) {
    try {
      const purchases = await prisma.transaction.findMany({
        where: {
          userId,
          type: 'GAME_PURCHASE',
          description: {
            contains: gameId
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      const cards = await prisma.bingoCard.findMany({
        where: {
          userId,
          gameId
        },
        include: {
          numbers: {
            orderBy: {
              position: 'asc'
            }
          }
        }
      })

      return {
        purchases: purchases.map(purchase => ({
          id: purchase.id,
          amount: parseFloat(purchase.amount.toString()),
          description: purchase.description,
          createdAt: purchase.createdAt.toISOString()
        })),
        cards: cards.map(card => ({
          id: card.id,
          cardNumber: card.cardNumber,
          isActive: card.isActive,
          isWinner: card.isWinner,
          winningPattern: card.winningPattern,
          numbers: card.numbers
        }))
      }

    } catch (error) {
      logger.error('Error obteniendo compras de usuario para juego', error as Error, {
        userId,
        gameId
      })
      throw error
    }
  }

  /**
   * Validar si un usuario tiene balance suficiente para comprar cartones
   */
  static async validatePurchaseCapability(userId: string, gameId: string, cardCount: number = 1): Promise<{
    canPurchase: boolean
    currentBalance: number
    requiredAmount: number
    message: string
  }> {
    try {
      // Obtener información del juego
      const game = await prisma.game.findUnique({
        where: { id: gameId }
      })

      if (!game) {
        return {
          canPurchase: false,
          currentBalance: 0,
          requiredAmount: 0,
          message: 'Juego no encontrado'
        }
      }

      const cardPrice = parseFloat(game.cardPrice.toString())
      const requiredAmount = cardPrice * cardCount

      // Obtener balance del usuario
      const userWallet = await prisma.wallet.findUnique({
        where: { userId }
      })

      if (!userWallet) {
        return {
          canPurchase: false,
          currentBalance: 0,
          requiredAmount,
          message: 'Billetera no encontrada'
        }
      }

      const currentBalance = parseFloat(userWallet.balance.toString())

      const canPurchase = userWallet.isActive && 
                         !userWallet.isFrozen && 
                         currentBalance >= requiredAmount

      let message = ''
      if (!userWallet.isActive || userWallet.isFrozen) {
        message = 'Billetera suspendida'
      } else if (currentBalance < requiredAmount) {
        message = `Saldo insuficiente. Necesitas ${requiredAmount.toFixed(2)} Perlas`
      } else {
        message = 'Compra disponible'
      }

      return {
        canPurchase,
        currentBalance,
        requiredAmount,
        message
      }

    } catch (error) {
      logger.error('Error validando capacidad de compra', error as Error, {
        userId,
        gameId,
        cardCount
      })
      
      return {
        canPurchase: false,
        currentBalance: 0,
        requiredAmount: 0,
        message: 'Error validando compra'
      }
    }
  }
}

export const gamePurchaseService = GamePurchaseService