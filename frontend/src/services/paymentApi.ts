import httpClient from './httpClient'

// Tipos para métodos de pago
export interface BankInfo {
  code: string
  name: string
  accountNumber: string
  accountHolder: string
  accountType: 'AHORROS' | 'CORRIENTE'
}

export interface PaymentMethod {
  id: string
  name: string
  type: 'BANK_TRANSFER' | 'DIGITAL_WALLET'
  code?: string
  instructions: string
  isActive: boolean
  bankInfo?: BankInfo
}

// Tipos para solicitudes de depósito
export interface CreateDepositRequest {
  amount: number
  paymentMethodId: string
  bankAccount?: string
  bankAccountName?: string
}

export interface DepositRequest {
  id: string
  userId: string
  amount: number
  pearlsAmount: number
  paymentMethod: string
  referenceCode: string
  bankReference?: string
  bankAccount?: string
  bankAccountName?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
  proofImage?: string
  validatedAt?: string
  validatedBy?: string
  rejectionReason?: string
  createdAt: string
  expiresAt: string
}

// Tipos para solicitudes de retiro
export interface CreateWithdrawalRequest {
  pearlsAmount: number
  bankCode: string
  accountNumber: string
  accountType: 'AHORROS' | 'CORRIENTE'
  accountHolderName: string
  accountHolderDni: string
}

export interface WithdrawalRequest {
  id: string
  userId: string
  pearlsAmount: number
  amountInSoles: number
  commission: number
  netAmount: number
  bankCode: string
  accountNumber: string
  accountType: string
  accountHolderName: string
  accountHolderDni: string
  referenceCode: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
  proofImage?: string
  validatedAt?: string
  validatedBy?: string
  rejectionReason?: string
  createdAt: string
}

export class PaymentApiService {
  /**
   * Obtener métodos de pago disponibles
   */
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const response = await httpClient.get('/payment/methods')
    return response.data
  }

  /**
   * Crear solicitud de depósito
   */
  async createDepositRequest(data: CreateDepositRequest): Promise<DepositRequest> {
    const response = await httpClient.post('/payment/deposit', data)
    return response.data
  }

  /**
   * Obtener mis solicitudes de depósito
   */
  async getMyDeposits(params?: {
    status?: string
    limit?: number
    offset?: number
  }): Promise<{
    deposits: DepositRequest[]
    pagination: {
      limit: number
      offset: number
      total: number
    }
  }> {
    const response = await httpClient.get('/payment/deposits', { params })
    return response.data
  }

  /**
   * Cancelar solicitud de depósito
   */
  async cancelDeposit(depositId: string): Promise<{ message: string }> {
    const response = await httpClient.delete(`/payment/deposits/${depositId}`)
    return response.data
  }

  /**
   * Crear solicitud de retiro
   */
  async createWithdrawalRequest(data: CreateWithdrawalRequest): Promise<WithdrawalRequest> {
    const response = await httpClient.post('/payment/withdrawal', data)
    return response.data
  }

  /**
   * Obtener mis solicitudes de retiro
   */
  async getMyWithdrawals(params?: {
    status?: string
    limit?: number
    offset?: number
  }): Promise<{
    withdrawals: WithdrawalRequest[]
    pagination: {
      limit: number
      offset: number
      total: number
    }
  }> {
    const response = await httpClient.get('/payment/withdrawals', { params })
    return response.data
  }

  /**
   * Obtener información de comisiones y límites
   */
  async getPaymentConfiguration(): Promise<{
    depositsEnabled: boolean
    withdrawalsEnabled: boolean
    transfersEnabled: boolean
    withdrawalCommissionRate: number
    minimumWithdrawalCommission: number
    p2pTransferCommission: number
    dailyDepositLimit: number
    monthlyDepositLimit: number
    dailyWithdrawalLimit: number
    monthlyWithdrawalLimit: number
  }> {
    const response = await httpClient.get('/payment/configuration')
    return response.data
  }

  /**
   * Subir comprobante de pago para depósito
   */
  async uploadDepositProof(depositId: string, proofFile: File): Promise<{ message: string; proofImageUrl: string }> {
    const formData = new FormData()
    formData.append('proof', proofFile)
    
    const response = await httpClient.post(
      `/payment/deposits/${depositId}/proof`, 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )
    return response.data
  }

  /**
   * Obtener bancos peruanos disponibles para retiros
   */
  async getAvailableBanks(): Promise<Array<{
    code: string
    name: string
    minAmount: number
    maxAmount: number
  }>> {
    const response = await httpClient.get('/payment/banks')
    return response.data
  }
}

export const paymentApi = new PaymentApiService()