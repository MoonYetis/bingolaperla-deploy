/**
 * Fixed Wallet API Service - Resolves 400 errors and data consistency
 * Addresses /api/wallet/transactions parameter requirements
 */

import httpClient from './httpClient';

export interface WalletBalance {
  balance: number;
  dailyLimit: number;
  monthlyLimit: number;
  isActive: boolean;
  isFrozen: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'CARD_PURCHASE' | 'PRIZE_PAYOUT' | 'PEARL_PURCHASE' | 'PEARL_TRANSFER' | 'WITHDRAWAL' | 'COMMISSION';
  amount: number;
  pearlsAmount: number;
  description: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  createdAt: string;
  fromUser?: { username: string };
  toUser?: { username: string };
}

export interface TransactionHistoryParams {
  limit?: number;
  offset?: number;
  type?: Transaction['type'];
  dateFrom?: string;
  dateTo?: string;
}

export interface P2PTransferData {
  toUsername: string;
  amount: number;
  description: string;
  confirmTransfer: boolean;
}

class WalletApiService {
  /**
   * Get current wallet balance
   */
  async getBalance(): Promise<WalletBalance> {
    try {
      const response = await httpClient.get('/wallet/balance');
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Failed to get balance');
      }
    } catch (error: any) {
      console.error('WalletApi.getBalance error:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Sesión expirada - inicia sesión nuevamente');
      }
      
      throw new Error('Error obteniendo balance de la billetera');
    }
  }

  /**
   * Get transaction history with proper query parameters
   * FIXED: Now includes required query parameters to prevent 400 errors
   */
  async getTransactionHistory(params: TransactionHistoryParams = {}): Promise<Transaction[]> {
    try {
      // Build query parameters with defaults
      const queryParams = new URLSearchParams({
        limit: (params.limit || 50).toString(),
        offset: (params.offset || 0).toString()
      });

      // Add optional parameters
      if (params.type) queryParams.append('type', params.type);
      if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) queryParams.append('dateTo', params.dateTo);

      const response = await httpClient.get(`/wallet/transactions?${queryParams.toString()}`);
      
      if (response.data.success) {
        return response.data.data || [];
      } else {
        throw new Error(response.data.error || 'Failed to get transactions');
      }
    } catch (error: any) {
      console.error('WalletApi.getTransactionHistory error:', error);
      
      if (error.response?.status === 400) {
        console.error('Validation error details:', error.response.data);
        throw new Error('Parámetros de consulta inválidos');
      }
      
      if (error.response?.status === 401) {
        throw new Error('Sesión expirada - inicia sesión nuevamente');
      }
      
      throw new Error('Error obteniendo historial de transacciones');
    }
  }

  /**
   * P2P Transfer between users
   */
  async transferPearls(transferData: P2PTransferData): Promise<any> {
    try {
      const response = await httpClient.post('/wallet/transfer', transferData);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Transfer failed');
      }
    } catch (error: any) {
      console.error('WalletApi.transferPearls error:', error);
      
      if (error.response?.status === 400) {
        const details = error.response.data.details;
        if (details && Array.isArray(details)) {
          const messages = details.map((d: any) => d.message).join(', ');
          throw new Error(`Error de validación: ${messages}`);
        }
        throw new Error(error.response.data.error || 'Datos de transferencia inválidos');
      }
      
      if (error.response?.status === 401) {
        throw new Error('Sesión expirada - inicia sesión nuevamente');
      }
      
      throw new Error('Error realizando transferencia');
    }
  }

  /**
   * Verify username exists for transfers
   */
  async verifyUsername(username: string): Promise<{ valid: boolean; user?: any }> {
    try {
      const response = await httpClient.get(`/wallet/verify-username/${encodeURIComponent(username)}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        return { valid: false };
      }
    } catch (error: any) {
      console.error('WalletApi.verifyUsername error:', error);
      return { valid: false };
    }
  }

  /**
   * Get comprehensive wallet info
   */
  async getWalletInfo(): Promise<any> {
    try {
      const response = await httpClient.get('/wallet');
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Failed to get wallet info');
      }
    } catch (error: any) {
      console.error('WalletApi.getWalletInfo error:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Sesión expirada - inicia sesión nuevamente');
      }
      
      throw new Error('Error obteniendo información de billetera');
    }
  }
}

export const walletApi = new WalletApiService();