/**
 * Type definitions for E2E tests
 */

export interface TestUser {
  email: string;
  password: string;
  expectedBalance: number;
  walletBalance: number;
  username: string;
  role: string;
}

export interface APIResponse {
  status: number;
  body: any;
}

export interface MockAPIResponses {
  walletTransactions400: APIResponse;
  favicon404: APIResponse;
  authSuccess: APIResponse;
  walletBalanceSuccess: APIResponse;
}

export interface PerlasPurchase {
  cardCount: number;
  totalCost: number;
  expectedBalance: number;
}