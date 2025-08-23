import httpClient from './httpClient';

// Tipos para las respuestas de la API de compras con Perlas
export interface GameInfo {
  id: string;
  title: string;
  cardPrice: number;
}

export interface PurchasedCard {
  id: string;
  cardNumber: number;
  numbers: any[];
}

export interface PurchaseTransaction {
  id: string;
  amount: number;
  description: string;
  timestamp: string;
}

export interface WalletInfo {
  newBalance: number;
  pearlsUsed: number;
}

export interface CardPurchaseResult {
  success: boolean;
  message: string;
  data: {
    purchase: {
      transactionId: string;
      amount: number;
      description: string;
      timestamp: string;
      cardsPurchased: number;
    };
    cards: PurchasedCard[];
    wallet: WalletInfo;
    game: GameInfo;
  };
}

export interface PurchaseValidation {
  success: boolean;
  message: string;
  data: {
    canPurchase: boolean;
    currentBalance: number;
    requiredAmount: number;
    message: string;
    cardCount: number;
    gameId: string;
  };
}

export interface PurchaseHistoryTransaction {
  id: string;
  gameId?: string;
  amount: number;
  pearlsAmount?: number;
  description: string;
  status: string;
  createdAt: string;
}

export interface GamePurchaseHistory {
  success: boolean;
  message: string;
  data: {
    gameId: string;
    purchases: Array<{
      id: string;
      amount: number;
      description: string;
      createdAt: string;
    }>;
    cards: Array<{
      id: string;
      cardNumber: number;
      isActive: boolean;
      isWinner: boolean;
      winningPattern?: string;
      numbers: any[];
    }>;
    totalPurchases: number;
    totalCards: number;
  };
}

export interface GeneralPurchaseHistory {
  success: boolean;
  message: string;
  data: {
    transactions: PurchaseHistoryTransaction[];
    totalTransactions: number;
  };
}

export interface CardPurchaseRequest {
  gameId: string;
  cardCount: number;
}

export interface PrizeAwardRequest {
  userId: string;
  gameId: string;
  prizeAmount: number;
  winningPattern: string;
}

export interface PrizeAwardResult {
  success: boolean;
  message: string;
  data: {
    prize: {
      transactionId: string;
      amount: number;
      description: string;
      winningPattern: string;
      recipientUserId: string;
    };
    wallet: {
      newBalance: number;
      pearlsAwarded: number;
    };
    game: GameInfo;
    awardedBy: string;
    awardedAt: string;
  };
}

export class GamePurchaseApiService {
  /**
   * Comprar cartones de bingo usando Perlas
   */
  async purchaseCards(data: CardPurchaseRequest): Promise<CardPurchaseResult> {
    const response = await httpClient.post('/game-purchase/cards', data);
    return response.data;
  }

  /**
   * Validar si el usuario puede comprar cartones
   */
  async validatePurchase(gameId: string, cardCount: number = 1): Promise<PurchaseValidation> {
    const response = await httpClient.get(`/game-purchase/validate/${gameId}/${cardCount}`);
    return response.data;
  }

  /**
   * Obtener historial de compras para un juego específico
   */
  async getGamePurchaseHistory(gameId: string): Promise<GamePurchaseHistory> {
    const response = await httpClient.get(`/game-purchase/history/${gameId}`);
    return response.data;
  }

  /**
   * Obtener historial general de compras del usuario
   */
  async getGeneralPurchaseHistory(): Promise<GeneralPurchaseHistory> {
    const response = await httpClient.get('/game-purchase/history');
    return response.data;
  }

  /**
   * Acreditar premio en Perlas (solo administradores)
   */
  async awardPrize(data: PrizeAwardRequest): Promise<PrizeAwardResult> {
    const response = await httpClient.post('/game-purchase/award-prize', data);
    return response.data;
  }
}

export const gamePurchaseApi = new GamePurchaseApiService();