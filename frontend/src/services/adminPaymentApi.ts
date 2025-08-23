import httpClient from './httpClient'

// Tipos para el dashboard admin
export interface AdminDashboardStats {
  pendingRequests: {
    deposits: number
    withdrawals: number
  }
  todayStats: {
    totalTransactions: number
    totalVolume: number
    deposits: number
    withdrawals: number
    transfers: number
  }
  monthlyStats: {
    totalVolume: number
    totalTransactions: number
  }
  systemStatus: {
    depositsEnabled: boolean
    withdrawalsEnabled: boolean
    transfersEnabled: boolean
    p2pCommission: number
  }
  alerts: Array<{
    type: 'warning' | 'info' | 'error'
    message: string
    action: string
  }>
  lastUpdated: string
}

// Tipos para depósitos pendientes
export interface AdminDepositRequest {
  id: string
  userId: string
  user: {
    username: string
    email: string
    fullName: string
  }
  amount: number
  pearlsAmount: number
  paymentMethod: string
  referenceCode: string
  bankReference?: string
  bankAccount?: string
  bankAccountName?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
  proofImage?: string
  createdAt: string
  expiresAt: string
  isExpired: boolean
  timeRemaining: string
}

export interface AdminDepositsResponse {
  deposits: AdminDepositRequest[]
  pagination: {
    limit: number
    offset: number
    total: number
  }
}

// Tipos para retiros pendientes
export interface AdminWithdrawalRequest {
  id: string
  userId: string
  user: {
    username: string
    email: string
    fullName: string
  }
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
  createdAt: string
}

export interface AdminWithdrawalsResponse {
  withdrawals: AdminWithdrawalRequest[]
  pagination: {
    limit: number
    offset: number
    total: number
  }
}

// Tipos para estadísticas financieras detalladas
export interface FinancialStatistics {
  overview: {
    totalActiveWallets: number
    totalPearlsInCirculation: number
    dailyTransactions: number
    dailyVolume: number
    monthlyTransactions: number
    monthlyVolume: number
  }
  deposits: Array<{
    status: string
    count: number
    totalAmount: number
  }>
  withdrawals: Array<{
    status: string
    count: number
    totalAmount: number
  }>
  generatedAt: string
}

// Requests para acciones admin
export interface ApproveDepositRequest {
  bankReference: string
  adminNotes?: string
  proofImageUrl?: string
}

export interface RejectDepositRequest {
  reason: string
}

// Responses para acciones admin
export interface ApproveDepositResponse {
  depositRequestId: string
  userId: string
  amount: number
  pearlsAmount: number
  newUserBalance: number
  approvedAt: string
  transactionId: string
}

export interface RejectDepositResponse {
  depositRequestId: string
  userId: string
  amount: number
  reason: string
  rejectedAt: string
}

export class AdminPaymentApiService {
  /**
   * Obtener dashboard de estadísticas de pagos
   */
  async getPaymentDashboard(): Promise<AdminDashboardStats> {
    const response = await httpClient.get('/admin/payment/dashboard')
    return response.data.data
  }

  /**
   * Obtener estadísticas financieras detalladas
   */
  async getFinancialStatistics(): Promise<FinancialStatistics> {
    const response = await httpClient.get('/admin/payment/statistics')
    return response.data.data
  }

  /**
   * Obtener lista de depósitos pendientes
   */
  async getPendingDeposits(params?: {
    status?: string
    paymentMethod?: string
    limit?: number
    offset?: number
  }): Promise<AdminDepositsResponse> {
    const response = await httpClient.get('/admin/payment/deposits/pending', { params })
    return response.data.data
  }

  /**
   * Aprobar solicitud de depósito
   */
  async approveDeposit(
    depositRequestId: string, 
    data: ApproveDepositRequest
  ): Promise<ApproveDepositResponse> {
    const response = await httpClient.post(
      `/admin/payment/deposits/${depositRequestId}/approve`,
      data
    )
    return response.data.data
  }

  /**
   * Rechazar solicitud de depósito
   */
  async rejectDeposit(
    depositRequestId: string,
    data: RejectDepositRequest
  ): Promise<RejectDepositResponse> {
    const response = await httpClient.post(
      `/admin/payment/deposits/${depositRequestId}/reject`,
      data
    )
    return response.data.data
  }

  /**
   * Obtener lista de retiros pendientes
   */
  async getPendingWithdrawals(params?: {
    limit?: number
    offset?: number
  }): Promise<AdminWithdrawalsResponse> {
    const response = await httpClient.get('/admin/payment/withdrawals/pending', { params })
    return response.data.data
  }

  /**
   * Obtener detalles de un depósito específico
   */
  async getDepositDetails(depositRequestId: string): Promise<AdminDepositRequest> {
    const response = await httpClient.get(`/admin/payment/deposits/${depositRequestId}`)
    return response.data.data
  }

  /**
   * Obtener detalles de un retiro específico
   */
  async getWithdrawalDetails(withdrawalRequestId: string): Promise<AdminWithdrawalRequest> {
    const response = await httpClient.get(`/admin/payment/withdrawals/${withdrawalRequestId}`)
    return response.data.data
  }

  /**
   * Exportar datos de transacciones para reportes
   */
  async exportTransactions(params: {
    dateFrom: string
    dateTo: string
    type?: string
    format?: 'csv' | 'xlsx'
  }): Promise<Blob> {
    const response = await httpClient.get('/admin/payment/export', {
      params,
      responseType: 'blob'
    })
    return response.data
  }

  /**
   * Obtener logs de auditoría de acciones administrativas
   */
  async getAuditLogs(params?: {
    adminId?: string
    action?: string
    entityType?: string
    dateFrom?: string
    dateTo?: string
    limit?: number
    offset?: number
  }): Promise<{
    logs: Array<{
      id: string
      adminId: string
      adminUsername: string
      action: string
      entityType: string
      entityId: string
      details: Record<string, any>
      ipAddress: string
      timestamp: string
    }>
    pagination: {
      limit: number
      offset: number
      total: number
    }
  }> {
    const response = await httpClient.get('/admin/payment/audit-logs', { params })
    return response.data.data
  }

  /**
   * Actualizar configuración del sistema de pagos
   */
  async updatePaymentConfiguration(config: {
    depositsEnabled?: boolean
    withdrawalsEnabled?: boolean
    transfersEnabled?: boolean
    p2pTransferCommission?: number
    withdrawalCommissionRate?: number
    minimumWithdrawalCommission?: number
  }): Promise<{ message: string; updatedConfig: any }> {
    const response = await httpClient.put('/admin/payment/configuration', config)
    return response.data
  }

  /**
   * Forzar actualización de balance de usuario (casos excepcionales)
   */
  async adjustUserBalance(params: {
    userId: string
    amount: number
    type: 'CREDIT' | 'DEBIT'
    reason: string
    adminNotes: string
  }): Promise<{
    userId: string
    previousBalance: number
    newBalance: number
    adjustment: number
    transactionId: string
  }> {
    const response = await httpClient.post('/admin/payment/balance-adjustment', params)
    return response.data.data
  }
}

export const adminPaymentApi = new AdminPaymentApiService()