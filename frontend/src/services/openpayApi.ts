import axios from 'axios';

export interface CardPaymentRequest {
  amount: number;
  token: string;
  deviceSessionId: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
}

export interface BankTransferRequest {
  amount: number;
  customerEmail: string;
  customerName: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  openpayChargeId?: string;
  status?: string;
  authorizationCode?: string;
  paymentInstructions?: {
    bankName?: string;
    accountNumber?: string;
    reference?: string;
    expirationDate?: string;
  };
  error?: string;
}

export interface TransactionStatus {
  id: string;
  openpayChargeId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  authorizationCode?: string;
  chargedAt?: string;
  expiresAt?: string;
  depositRequest: {
    referenceCode: string;
    pearlsAmount: number;
    status: string;
  };
}

export interface TransactionHistory {
  transactions: TransactionStatus[];
  total: number;
  page: number;
  limit: number;
}

export interface PaymentMethod {
  id: string;
  type: string;
  brand?: string;
  last4?: string;
  expirationMonth?: string;
  expirationYear?: string;
  holderName?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

class OpenpayApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = '/openpay';
  }

  private getHeaders() {
    const authData = localStorage.getItem('auth');
    let authToken = '';
    
    if (authData) {
      try {
        const { tokens } = JSON.parse(authData);
        if (tokens?.accessToken) {
          authToken = `Bearer ${tokens.accessToken}`;
        }
      } catch (error) {
        console.warn('Error parsing auth data from localStorage:', error);
      }
    }
    
    return {
      'Content-Type': 'application/json',
      'Authorization': authToken
    };
  }

  private async handleResponse<T>(response: any): Promise<T> {
    if (response.data.success === false) {
      throw new Error(response.data.message || 'API request failed');
    }
    return response.data;
  }

  /**
   * Process card payment with Openpay
   */
  async processCardPayment(paymentData: CardPaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await axios.post(
        `${this.baseURL}/card`,
        paymentData,
        { headers: this.getHeaders() }
      );

      return await this.handleResponse<PaymentResponse>(response);
    } catch (error: any) {
      console.error('Card payment API error:', error);
      
      if (error.response?.data) {
        return {
          success: false,
          error: error.response.data.message || error.response.data.error || 'Payment failed'
        };
      }
      
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  /**
   * Process bank transfer payment with Openpay
   */
  async processBankTransfer(transferData: BankTransferRequest): Promise<PaymentResponse> {
    try {
      const response = await axios.post(
        `${this.baseURL}/bank-transfer`,
        transferData,
        { headers: this.getHeaders() }
      );

      return await this.handleResponse<PaymentResponse>(response);
    } catch (error: any) {
      console.error('Bank transfer API error:', error);
      
      if (error.response?.data) {
        return {
          success: false,
          error: error.response.data.message || error.response.data.error || 'Transfer creation failed'
        };
      }
      
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  /**
   * Get transaction status by ID
   */
  async getTransactionStatus(transactionId: string): Promise<TransactionStatus> {
    try {
      const response = await axios.get(
        `${this.baseURL}/transaction/${transactionId}`,
        { headers: this.getHeaders() }
      );

      return await this.handleResponse<TransactionStatus>(response);
    } catch (error: any) {
      console.error('Get transaction status API error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get transaction status');
    }
  }

  /**
   * Get user's transaction history
   */
  async getTransactionHistory(page: number = 1, limit: number = 10): Promise<TransactionHistory> {
    try {
      const response = await axios.get(
        `${this.baseURL}/transactions`,
        { 
          headers: this.getHeaders(),
          params: { page, limit }
        }
      );

      return await this.handleResponse<TransactionHistory>(response);
    } catch (error: any) {
      console.error('Get transaction history API error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get transaction history');
    }
  }

  /**
   * Get user's saved payment methods
   */
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response = await axios.get(
        `${this.baseURL}/payment-methods`,
        { headers: this.getHeaders() }
      );

      return await this.handleResponse<PaymentMethod[]>(response);
    } catch (error: any) {
      console.error('Get payment methods API error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get payment methods');
    }
  }

  /**
   * Poll transaction status until completion
   * Useful for tracking payment confirmations in real-time
   */
  async pollTransactionStatus(
    transactionId: string, 
    maxAttempts: number = 30, 
    intervalMs: number = 2000
  ): Promise<TransactionStatus> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const transaction = await this.getTransactionStatus(transactionId);
        
        // If payment is completed or failed, return result
        if (transaction.status === 'completed' || 
            transaction.status === 'failed' || 
            transaction.status === 'cancelled') {
          return transaction;
        }
        
        // If not final attempt, wait before next poll
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
      } catch (error) {
        // If this is the last attempt, throw the error
        if (attempt === maxAttempts) {
          throw error;
        }
        
        // Otherwise wait and try again
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }
    
    // If we've exhausted all attempts, throw timeout error
    throw new Error('Transaction status polling timed out');
  }

  /**
   * Validate payment amount
   */
  validatePaymentAmount(amount: number): { valid: boolean; error?: string } {
    if (!amount || isNaN(amount)) {
      return { valid: false, error: 'Amount is required' };
    }
    
    if (amount < 1) {
      return { valid: false, error: 'Minimum amount is 1.00 PEN' };
    }
    
    if (amount > 10000) {
      return { valid: false, error: 'Maximum amount is 10,000.00 PEN' };
    }
    
    // Check for reasonable decimal places (max 2)
    if (Number(amount.toFixed(2)) !== amount) {
      return { valid: false, error: 'Amount can have maximum 2 decimal places' };
    }
    
    return { valid: true };
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number, currency: string = 'PEN'): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: currency === 'PEN' ? 'PEN' : 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Get payment method display name
   */
  getPaymentMethodDisplayName(method: string): string {
    const methodNames: Record<string, string> = {
      'card': 'Tarjeta de Crédito/Débito',
      'bank_transfer': 'Transferencia Bancaria',
      'cash': 'Pago en Efectivo',
      'OPENPAY_CARD': 'Tarjeta Openpay',
      'OPENPAY_BANK_TRANSFER': 'Transferencia Openpay',
      'OPENPAY_CASH': 'Efectivo Openpay'
    };
    
    return methodNames[method] || method;
  }

  /**
   * Get payment status display info
   */
  getPaymentStatusInfo(status: string): { text: string; color: string; icon: string } {
    const statusInfo: Record<string, { text: string; color: string; icon: string }> = {
      'completed': { text: 'Completado', color: 'green', icon: '✅' },
      'pending': { text: 'Pendiente', color: 'yellow', icon: '⏳' },
      'charge_pending': { text: 'Procesando', color: 'blue', icon: '🔄' },
      'failed': { text: 'Fallido', color: 'red', icon: '❌' },
      'cancelled': { text: 'Cancelado', color: 'gray', icon: '🚫' },
      'expired': { text: 'Expirado', color: 'red', icon: '⏰' }
    };
    
    return statusInfo[status] || { text: status, color: 'gray', icon: '❓' };
  }
}

export const openpayApi = new OpenpayApiService();
export default openpayApi;