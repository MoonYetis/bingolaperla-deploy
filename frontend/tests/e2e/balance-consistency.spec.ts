/**
 * E2E Balance Consistency Tests - Bingo La Perla PWA
 * Testing Redux state consistency for Perlas balance (99.00 vs 89.00 discrepancy)
 */

import { test, expect, ReduxStateHelpers, TEST_USER } from './setup/test-setup';

test.describe('Perlas Balance Consistency Tests', () => {
  
  test('should identify balance inconsistency between components', async ({ authenticatedPage }) => {
    const reduxHelper = new ReduxStateHelpers(authenticatedPage);

    // Check main menu balance display
    const mainMenuBalance = await authenticatedPage.locator('[data-testid="main-balance"]').textContent();
    const mainBalanceValue = parseFloat(mainMenuBalance?.replace(/[^\d.]/g, '') || '0');

    // Navigate to wallet page
    await authenticatedPage.click('[data-testid="wallet-button"]');
    await authenticatedPage.waitForURL('**/wallet**');
    
    // Check wallet page balance display
    const walletBalance = await authenticatedPage.locator('[data-testid="wallet-balance"]').textContent();
    const walletBalanceValue = parseFloat(walletBalance?.replace(/[^\d.]/g, '') || '0');

    // Check Redux state
    await reduxHelper.validatePerlasBalance(TEST_USER.expectedBalance);

    // Document the inconsistency
    console.log(`❌ BALANCE INCONSISTENCY DETECTED:`);
    console.log(`   Main Menu Balance: ${mainBalanceValue} Perlas`);
    console.log(`   Wallet Balance: ${walletBalanceValue} Perlas`);
    console.log(`   Expected Balance: ${TEST_USER.expectedBalance} Perlas`);

    // Test should fail to highlight the issue
    expect(mainBalanceValue).toBe(walletBalanceValue);
  });

  test('should track balance updates across navigation', async ({ authenticatedPage }) => {
    const reduxHelper = new ReduxStateHelpers(authenticatedPage);
    const balanceValues: number[] = [];

    // Record balance on each page
    const pages = [
      { route: '/menu', testId: 'main-balance' },
      { route: '/wallet', testId: 'wallet-balance' },
      { route: '/play', testId: 'game-balance' },
      { route: '/profile', testId: 'profile-balance' }
    ];

    for (const page of pages) {
      await authenticatedPage.goto(page.route);
      await authenticatedPage.waitForLoadState('networkidle');
      
      const balanceElement = authenticatedPage.locator(`[data-testid="${page.testId}"]`);
      if (await balanceElement.isVisible()) {
        const balanceText = await balanceElement.textContent();
        const balanceValue = parseFloat(balanceText?.replace(/[^\d.]/g, '') || '0');
        balanceValues.push(balanceValue);
        
        console.log(`${page.route}: ${balanceValue} Perlas`);
      }
    }

    // All balance values should be consistent
    const uniqueValues = [...new Set(balanceValues)];
    expect(uniqueValues.length).toBe(1);
  });

  test('should validate API response vs UI display consistency', async ({ page }) => {
    let apiBalance: number = 0;
    let uiBalance: number = 0;

    // Intercept API calls to capture balance data
    await page.route('**/api/auth/me', async route => {
      const response = await route.fetch();
      const data = await response.json();
      apiBalance = parseFloat(data.user.pearlsBalance);
      await route.fulfill({ response });
    });

    await page.route('**/api/wallet/balance', async route => {
      const response = await route.fetch();
      const data = await response.json();
      apiBalance = data.data.balance; // This should match pearlsBalance
      await route.fulfill({ response });
    });

    // Login and navigate to main menu
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', TEST_USER.email);
    await page.fill('[data-testid="password-input"]', TEST_USER.password);
    await page.click('[data-testid="login-button"]');
    
    await page.waitForURL('**/menu');
    await page.waitForLoadState('networkidle');

    // Get UI balance
    const balanceElement = await page.locator('[data-testid="main-balance"]').textContent();
    uiBalance = parseFloat(balanceElement?.replace(/[^\d.]/g, '') || '0');

    console.log(`API Balance: ${apiBalance} Perlas`);
    console.log(`UI Balance: ${uiBalance} Perlas`);

    // They should match
    expect(uiBalance).toBe(apiBalance);
  });

  test('should handle balance updates after transactions', async ({ authenticatedPage }) => {
    // Mock transaction API
    await authenticatedPage.route('**/api/game-purchase/cards', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            purchase: { totalCost: 10 },
            newBalance: TEST_USER.walletBalance - 10
          }
        })
      });
    });

    // Get initial balance
    const initialBalance = await authenticatedPage.locator('[data-testid="main-balance"]').textContent();
    const initialValue = parseFloat(initialBalance?.replace(/[^\d.]/g, '') || '0');

    // Navigate to play and purchase cards
    await authenticatedPage.click('[data-testid="play-button"]');
    await authenticatedPage.waitForURL('**/play**');
    
    // Simulate card purchase
    await authenticatedPage.click('[data-testid="buy-cards-button"]');
    await authenticatedPage.waitForResponse('**/api/game-purchase/cards');

    // Check if balance updated
    await authenticatedPage.waitForTimeout(1000); // Wait for UI update
    const updatedBalance = await authenticatedPage.locator('[data-testid="game-balance"]').textContent();
    const updatedValue = parseFloat(updatedBalance?.replace(/[^\d.]/g, '') || '0');

    expect(updatedValue).toBeLessThan(initialValue);
    expect(updatedValue).toBe(initialValue - 10);
  });
});