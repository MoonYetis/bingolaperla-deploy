import httpClient from './httpClient';

// Tipos para las respuestas de la API
export interface WalletInfo {
  id: string;
  userId: string;
  balance: number;
  dailyLimit: number;
  monthlyLimit: number;
  isActive: boolean;
  isFrozen: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WalletBalance {
  balance: number;
  dailyLimit: number;
  monthlyLimit: number;
  isActive: boolean;
  isFrozen: boolean;
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  pearlsAmount?: number;
  description: string;
  status: string;
  paymentMethod?: string;
  commissionAmount?: number;
  referenceId?: string;
  createdAt: string;
  fromUser?: { username: string };
  toUser?: { username: string };
  isCredit: boolean;
  isDebit: boolean;
}

export interface TransferPearlsRequest {
  toUsername: string;
  amount: number;
  description: string;
  confirmTransfer: boolean;
}

export interface TransferPearlsResponse {
  fromTransactionId: string;
  toTransactionId: string;
  amount: number;
  commission: number;
  totalDebit: number;
  toUsername: string;
  description: string;
  timestamp: string;
}

export interface UsernameVerification {
  exists: boolean;
  username?: string;
  fullName?: string;
  message: string;
}

export class WalletApiService {
  /**
   * Obtener información completa de la billetera
   */
  async getWalletInfo(): Promise<WalletInfo> {
    const response = await httpClient.get('/wallet');
    // El backend retorna { success: true, data: { id, userId, balance, ... } }
    return response.data.data;
  }

  /**
   * Obtener balance actual de Perlas
   */
  async getBalance(): Promise<WalletBalance> {
    const response = await httpClient.get('/wallet/balance');
    // El backend retorna { success: true, data: { balance, dailyLimit, ... } }
    return response.data.data;
  }

  /**
   * Obtener historial de transacciones
   */
  async getTransactionHistory(params?: {
    limit?: number;
    offset?: number;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{
    transactions: Transaction[];
    pagination: {
      limit: number;
      offset: number;
      total: number;
    };
  }> {
    const response = await httpClient.get('/wallet/transactions', { params });
    // El backend retorna { success: true, data: { transactions, pagination } }
    return response.data.data;
  }

  /**
   * Realizar transferencia P2P entre usuarios
   */
  async transferPearls(data: TransferPearlsRequest): Promise<TransferPearlsResponse> {
    const response = await httpClient.post('/wallet/transfer', data);
    // El backend retorna { success: true, data: { fromTransactionId, toTransactionId, ... } }
    return response.data.data;
  }

  /**
   * Verificar si un username existe y es válido para transferencias
   */
  async verifyUsername(username: string): Promise<UsernameVerification> {
    const response = await httpClient.get(`/wallet/verify-username/${username}`);
    // El backend retorna { success: true, data: { isValid, user } }
    return response.data.data;
  }
}

export const walletApi = new WalletApiService();