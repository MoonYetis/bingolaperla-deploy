/**
 * E2E Test Setup for Bingo La Perla PWA
 * Comprehensive setup for Playwright tests with API mocking
 */

import { test as base, expect, Page, BrowserContext } from '@playwright/test';
import { TestUser, MockAPIResponses } from './types';

// Test data for demo user
export const TEST_USER: TestUser = {
  email: 'jugador@test.com',
  password: 'password123',
  expectedBalance: 99.00,
  walletBalance: 89.00, // Known inconsistency
  username: 'usuario',
  role: 'USER'
};

// Mock API responses for error scenarios
export const MOCK_API_RESPONSES: MockAPIResponses = {
  // 400 error scenarios
  walletTransactions400: {
    status: 400,
    body: { error: "Error de validación", details: [{ field: "query", message: "Required" }] }
  },
  
  // 404 error scenarios  
  favicon404: {
    status: 404,
    body: 'Not Found'
  },
  
  // Success scenarios
  authSuccess: {
    status: 200,
    body: {
      message: "Inicio de sesión exitoso",
      user: {
        id: "test-user-id",
        email: TEST_USER.email,
        username: TEST_USER.username,
        role: TEST_USER.role,
        pearlsBalance: TEST_USER.expectedBalance.toString()
      },
      tokens: {
        accessToken: "mock-jwt-token",
        refreshToken: "mock-refresh-token",
        expiresIn: "24h"
      }
    }
  },
  
  walletBalanceSuccess: {
    status: 200,
    body: {
      success: true,
      data: {
        balance: TEST_USER.walletBalance,
        dailyLimit: 1000,
        monthlyLimit: 10000,
        isActive: true,
        isFrozen: false
      }
    }
  }
};

// Extended test fixture with helper methods
export const test = base.extend<{
  authenticatedPage: Page;
  mockFailedAPIs: void;
}>({
  // Pre-authenticated page fixture
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/login');
    
    // Mock successful login
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_API_RESPONSES.authSuccess.body)
      });
    });

    // Mock wallet balance
    await page.route('**/api/wallet/balance', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_API_RESPONSES.walletBalanceSuccess.body)
      });
    });

    // Perform login
    await page.fill('[data-testid="email-input"]', TEST_USER.email);
    await page.fill('[data-testid="password-input"]', TEST_USER.password);
    await page.click('[data-testid="login-button"]');
    
    // Wait for navigation to main menu
    await page.waitForURL('**/menu');
    
    await use(page);
  },

  // Mock failed APIs fixture
  mockFailedAPIs: async ({ page }, use) => {
    // Mock 400 error for transactions
    await page.route('**/api/wallet/transactions**', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_API_RESPONSES.walletTransactions400.body)
      });
    });

    // Mock 404 for favicon
    await page.route('**/favicon.ico', async route => {
      await route.fulfill({
        status: 404,
        body: MOCK_API_RESPONSES.favicon404.body
      });
    });

    await use();
  }
});

// Helper functions for mobile testing
export class MobileTestHelpers {
  constructor(private page: Page) {}

  async setMobileViewport() {
    await this.page.setViewportSize({ width: 375, height: 667 });
  }

  async checkResponsiveLayout() {
    const isMobile = await this.page.evaluate(() => window.innerWidth <= 768);
    expect(isMobile).toBeTruthy();
  }

  async validateTouchTargets() {
    const buttons = await this.page.locator('button, [role="button"]').all();
    for (const button of buttons) {
      const box = await button.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44); // iOS minimum touch target
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  }
}

// Redux state validation helpers
export class ReduxStateHelpers {
  constructor(private page: Page) {}

  async getReduxState() {
    return await this.page.evaluate(() => {
      // @ts-ignore - Access Redux store from window
      return window.__REDUX_STORE__?.getState();
    });
  }

  async validatePerlasBalance(expectedBalance: number) {
    const state = await this.getReduxState();
    const userBalance = state?.auth?.user?.pearlsBalance;
    expect(parseFloat(userBalance || '0')).toBe(expectedBalance);
  }
}

export { expect };