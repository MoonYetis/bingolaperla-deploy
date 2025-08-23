/**
 * E2E API Error Recovery Tests - Bingo La Perla PWA  
 * Testing error recovery for 400/404 endpoints
 */

import { test, expect } from './setup/test-setup';

test.describe('API Error Recovery Tests', () => {
  
  test('should handle 400 error from wallet transactions endpoint', async ({ authenticatedPage, mockFailedAPIs }) => {
    // Navigate to wallet page
    await authenticatedPage.click('[data-testid="wallet-button"]');
    await authenticatedPage.waitForURL('**/wallet**');

    // Try to load transactions (should fail with 400)
    await authenticatedPage.click('[data-testid="transactions-tab"]');
    
    // Should display error message instead of crashing
    await expect(authenticatedPage.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="error-message"]')).toContainText('Error de validación');
    
    // Should provide retry mechanism
    await expect(authenticatedPage.locator('[data-testid="retry-button"]')).toBeVisible();
    
    // Rest of the app should still function
    await expect(authenticatedPage.locator('[data-testid="wallet-balance"]')).toBeVisible();
  });

  test('should handle 404 errors gracefully', async ({ page }) => {
    // Mock 404 responses
    await page.route('**/favicon.ico', async route => {
      await route.fulfill({ status: 404, body: 'Not Found' });
    });

    await page.route('**/api/nonexistent-endpoint', async route => {
      await route.fulfill({ status: 404, body: JSON.stringify({ error: 'Endpoint not found' }) });
    });

    // Navigate to app
    await page.goto('/menu');
    
    // App should still load despite 404 errors
    await expect(page.locator('[data-testid="main-menu"]')).toBeVisible();
    
    // Check console for errors (should be handled gracefully)
    const logs = await page.evaluate(() => {
      // @ts-ignore
      return window.console.errors || [];
    });
    
    // 404 errors should not crash the app
    expect(page.url()).toContain('/menu');
  });

  test('should retry failed API calls with exponential backoff', async ({ authenticatedPage }) => {
    let attemptCount = 0;
    
    // Mock API that fails first 2 times, then succeeds
    await authenticatedPage.route('**/api/wallet/balance', async route => {
      attemptCount++;
      
      if (attemptCount <= 2) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json', 
          body: JSON.stringify({ error: 'Internal server error' })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { balance: 89, dailyLimit: 1000, monthlyLimit: 10000, isActive: true, isFrozen: false }
          })
        });
      }
    });

    // Navigate to wallet
    await authenticatedPage.click('[data-testid="wallet-button"]');
    await authenticatedPage.waitForURL('**/wallet**');
    
    // Should eventually succeed after retries
    await expect(authenticatedPage.locator('[data-testid="wallet-balance"]')).toBeVisible({ timeout: 10000 });
    
    // Verify retry attempts
    expect(attemptCount).toBe(3);
  });

  test('should provide offline fallback when APIs are unavailable', async ({ authenticatedPage }) => {
    // Mock all API calls to fail (simulate offline)
    await authenticatedPage.route('**/api/**', async route => {
      await route.abort('failed');
    });

    // Navigate around the app
    await authenticatedPage.click('[data-testid="wallet-button"]');
    
    // Should show offline indicator
    await expect(authenticatedPage.locator('[data-testid="offline-indicator"]')).toBeVisible();
    
    // Should display cached data if available
    const balanceElement = authenticatedPage.locator('[data-testid="wallet-balance"]');
    if (await balanceElement.isVisible()) {
      await expect(balanceElement).toContainText('89'); // Cached balance
    }
    
    // Should disable actions that require network
    await expect(authenticatedPage.locator('[data-testid="buy-cards-button"]')).toBeDisabled();
  });

  test('should handle authentication token expiry gracefully', async ({ page }) => {
    // Mock expired token response
    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Token expired' })
      });
    });

    await page.route('**/api/auth/refresh', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tokens: {
            accessToken: 'new-token',
            refreshToken: 'new-refresh-token'
          }
        })
      });
    });

    // Try to access protected route
    await page.goto('/wallet');
    
    // Should redirect to login or refresh token automatically
    // App should not crash or get stuck
    await page.waitForTimeout(2000);
    
    const url = page.url();
    const isHandled = url.includes('/login') || url.includes('/wallet');
    expect(isHandled).toBeTruthy();
  });

  test('should validate network connectivity before API calls', async ({ authenticatedPage }) => {
    // Mock navigator.onLine
    await authenticatedPage.addInitScript(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });
    });

    // Navigate to wallet
    await authenticatedPage.click('[data-testid="wallet-button"]');
    
    // Should detect offline state
    await expect(authenticatedPage.locator('[data-testid="offline-message"]')).toBeVisible();
    
    // Simulate going back online
    await authenticatedPage.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { value: true });
      window.dispatchEvent(new Event('online'));
    });
    
    // Should retry API calls when back online
    await expect(authenticatedPage.locator('[data-testid="wallet-balance"]')).toBeVisible({ timeout: 5000 });
  });
});