/**
 * E2E Navigation Tests - Bingo La Perla PWA
 * Testing navigation flow between 4 main modules
 */

import { test, expect, MobileTestHelpers } from './setup/test-setup';

test.describe('Navigation Flow Tests', () => {
  test.beforeEach(async ({ page }) => {
    const mobile = new MobileTestHelpers(page);
    await mobile.setMobileViewport();
  });

  test('should navigate between all 4 main modules', async ({ authenticatedPage }) => {
    // Start at main menu
    await expect(authenticatedPage.locator('[data-testid="main-menu"]')).toBeVisible();

    // Test PLAY module navigation
    await authenticatedPage.click('[data-testid="play-button"]');
    await authenticatedPage.waitForURL('**/play**');
    await expect(authenticatedPage.locator('[data-testid="game-dashboard"]')).toBeVisible();
    
    // Navigate back to menu
    await authenticatedPage.click('[data-testid="back-to-menu"]');
    await authenticatedPage.waitForURL('**/menu');

    // Test BILLETERA module navigation
    await authenticatedPage.click('[data-testid="wallet-button"]');
    await authenticatedPage.waitForURL('**/wallet**');
    await expect(authenticatedPage.locator('[data-testid="wallet-balance"]')).toBeVisible();
    
    // Navigate back to menu
    await authenticatedPage.click('[data-testid="back-to-menu"]');
    await authenticatedPage.waitForURL('**/menu');

    // Test PERFIL module navigation
    await authenticatedPage.click('[data-testid="profile-button"]');
    await authenticatedPage.waitForURL('**/profile**');
    await expect(authenticatedPage.locator('[data-testid="profile-info"]')).toBeVisible();
    
    // Navigate back to menu
    await authenticatedPage.click('[data-testid="back-to-menu"]');
    await authenticatedPage.waitForURL('**/menu');

    // Test AYUDA module navigation
    await authenticatedPage.click('[data-testid="help-button"]');
    await authenticatedPage.waitForURL('**/help**');
    await expect(authenticatedPage.locator('[data-testid="help-content"]')).toBeVisible();
  });

  test('should maintain navigation state during page refresh', async ({ authenticatedPage }) => {
    // Navigate to wallet page
    await authenticatedPage.click('[data-testid="wallet-button"]');
    await authenticatedPage.waitForURL('**/wallet**');
    
    // Refresh page
    await authenticatedPage.reload();
    
    // Should remain on wallet page after refresh
    await expect(authenticatedPage.locator('[data-testid="wallet-balance"]')).toBeVisible();
    expect(authenticatedPage.url()).toContain('/wallet');
  });

  test('should handle browser back/forward navigation', async ({ authenticatedPage }) => {
    // Navigate to play -> wallet -> profile
    await authenticatedPage.click('[data-testid="play-button"]');
    await authenticatedPage.waitForURL('**/play**');
    
    await authenticatedPage.goBack();
    await authenticatedPage.waitForURL('**/menu');
    
    await authenticatedPage.click('[data-testid="wallet-button"]');
    await authenticatedPage.waitForURL('**/wallet**');
    
    // Test browser back button
    await authenticatedPage.goBack();
    await authenticatedPage.waitForURL('**/menu');
    
    // Test browser forward button
    await authenticatedPage.goForward();
    await authenticatedPage.waitForURL('**/wallet**');
  });

  test('should validate mobile responsive navigation', async ({ authenticatedPage }) => {
    const mobile = new MobileTestHelpers(authenticatedPage);
    await mobile.checkResponsiveLayout();
    await mobile.validateTouchTargets();

    // Test mobile menu behavior
    const menuButtons = await authenticatedPage.locator('[data-testid*="-button"]').all();
    expect(menuButtons.length).toBe(4); // PLAY, BILLETERA, PERFIL, AYUDA

    for (const button of menuButtons) {
      await expect(button).toBeVisible();
      await expect(button).toBeEnabled();
    }
  });
});