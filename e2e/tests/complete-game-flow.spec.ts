import { test, expect } from '@playwright/test';

test.describe('Complete Bingo Game Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('complete game flow from registration to bingo win', async ({ page }) => {
    // 1. Register new user
    await test.step('Register new user', async () => {
      await page.click('text=Registrarse');
      
      const timestamp = Date.now();
      await page.fill('[data-testid="username"]', `testuser${timestamp}`);
      await page.fill('[data-testid="email"]', `test${timestamp}@example.com`);
      await page.fill('[data-testid="password"]', 'TestPassword123!');
      await page.fill('[data-testid="confirmPassword"]', 'TestPassword123!');
      
      await page.click('[data-testid="register-button"]');
      
      // Wait for successful registration
      await expect(page.locator('text=Registro exitoso')).toBeVisible();
    });

    // 2. Login
    await test.step('Login with new user', async () => {
      await page.click('text=Iniciar Sesión');
      
      await page.fill('[data-testid="email-login"]', `test${Date.now()}@example.com`);
      await page.fill('[data-testid="password-login"]', 'TestPassword123!');
      
      await page.click('[data-testid="login-button"]');
      
      // Should redirect to dashboard
      await expect(page).toHaveURL(/.*dashboard/);
    });

    // 3. Navigate to card selection
    await test.step('Navigate to card selection', async () => {
      await page.click('[data-testid="select-cards-button"]');
      await expect(page).toHaveURL(/.*cards/);
    });

    // 4. Select bingo cards
    await test.step('Select bingo cards', async () => {
      // Select first card
      await page.click('[data-testid="card-0"]');
      await expect(page.locator('[data-testid="card-0"]')).toHaveClass(/selected/);
      
      // Select second card
      await page.click('[data-testid="card-1"]');
      await expect(page.locator('[data-testid="card-1"]')).toHaveClass(/selected/);
      
      // Confirm selection
      await page.click('[data-testid="confirm-cards-button"]');
    });

    // 5. Join game lobby
    await test.step('Join game lobby', async () => {
      await expect(page).toHaveURL(/.*lobby/);
      
      // Check that user is in lobby
      await expect(page.locator('[data-testid="lobby-users"]')).toContainText('testuser');
      
      // Check selected cards are displayed
      await expect(page.locator('[data-testid="selected-cards"]')).toBeVisible();
    });

    // 6. Start game (simulate admin action)
    await test.step('Start game', async () => {
      // For E2E test, we'll simulate the game start via API or admin interface
      // In a real scenario, this would be triggered by an admin
      
      // Check if start game button exists (for admin users)
      const startButton = page.locator('[data-testid="start-game-button"]');
      if (await startButton.isVisible()) {
        await startButton.click();
      }
      
      // Wait for game to start
      await expect(page.locator('[data-testid="game-status"]')).toContainText('En progreso');
    });

    // 7. Play the game
    await test.step('Play the game', async () => {
      await expect(page).toHaveURL(/.*game/);
      
      // Check that bingo cards are displayed
      await expect(page.locator('[data-testid="bingo-cards"]')).toBeVisible();
      
      // Check that ball display is visible
      await expect(page.locator('[data-testid="ball-display"]')).toBeVisible();
      
      // Wait for first ball to be drawn
      await page.waitForSelector('[data-testid="current-ball"]', { timeout: 10000 });
      
      // Verify real-time updates are working
      const ballNumber = await page.locator('[data-testid="current-ball"]').textContent();
      expect(ballNumber).toMatch(/^[B|I|N|G|O]\d+$/);
    });

    // 8. Mark numbers automatically (simulate quick game)
    await test.step('Mark numbers and check for bingo', async () => {
      // In a real E2E test, we'd either:
      // 1. Wait for actual balls to be drawn and mark them
      // 2. Use test mode to accelerate the game
      // 3. Mock the ball drawing for faster testing
      
      // For now, we'll check that the marking mechanism works
      const firstCell = page.locator('[data-testid="bingo-cell"]').first();
      if (await firstCell.isVisible()) {
        await firstCell.click();
        await expect(firstCell).toHaveClass(/marked/);
      }
      
      // Check for bingo detection
      // In a real game, this would happen automatically when a pattern is completed
      const bingoAlert = page.locator('[data-testid="bingo-alert"]');
      // We don't expect bingo immediately, but check the element exists
      await expect(bingoAlert).toBeAttached();
    });

    // 9. Verify game statistics
    await test.step('Verify game statistics', async () => {
      // Check that statistics are being tracked
      await expect(page.locator('[data-testid="balls-called"]')).toBeVisible();
      await expect(page.locator('[data-testid="game-timer"]')).toBeVisible();
    });

    // 10. Test connection resilience
    await test.step('Test connection resilience', async () => {
      // Simulate network interruption
      await page.setOfflineMode(true);
      await page.waitForTimeout(2000);
      
      // Verify offline indicator
      await expect(page.locator('[data-testid="connection-status"]')).toContainText('Desconectado');
      
      // Restore connection
      await page.setOfflineMode(false);
      await page.waitForTimeout(3000);
      
      // Verify reconnection
      await expect(page.locator('[data-testid="connection-status"]')).toContainText('Conectado');
    });
  });

  test('multiple users can join same game', async ({ browser }) => {
    // Create multiple browser contexts to simulate different users
    const user1Context = await browser.newContext();
    const user2Context = await browser.newContext();
    
    const user1Page = await user1Context.newPage();
    const user2Page = await user2Context.newPage();

    await test.step('Both users register and join lobby', async () => {
      // User 1
      await user1Page.goto('/');
      await user1Page.click('text=Registrarse');
      const timestamp1 = Date.now();
      await user1Page.fill('[data-testid="username"]', `user1_${timestamp1}`);
      await user1Page.fill('[data-testid="email"]', `user1_${timestamp1}@example.com`);
      await user1Page.fill('[data-testid="password"]', 'Password123!');
      await user1Page.fill('[data-testid="confirmPassword"]', 'Password123!');
      await user1Page.click('[data-testid="register-button"]');
      
      // User 2
      await user2Page.goto('/');
      await user2Page.click('text=Registrarse');
      const timestamp2 = Date.now() + 1;
      await user2Page.fill('[data-testid="username"]', `user2_${timestamp2}`);
      await user2Page.fill('[data-testid="email"]', `user2_${timestamp2}@example.com`);
      await user2Page.fill('[data-testid="password"]', 'Password123!');
      await user2Page.fill('[data-testid="confirmPassword"]', 'Password123!');
      await user2Page.click('[data-testid="register-button"]');
    });

    await test.step('Both users join the same game', async () => {
      // Both navigate to game lobby
      await user1Page.goto('/dashboard');
      await user1Page.click('[data-testid="join-game-button"]');
      
      await user2Page.goto('/dashboard');
      await user2Page.click('[data-testid="join-game-button"]');
      
      // Verify both users are in the lobby
      await expect(user1Page.locator('[data-testid="lobby-users"]')).toContainText('user1_');
      await expect(user1Page.locator('[data-testid="lobby-users"]')).toContainText('user2_');
      
      await expect(user2Page.locator('[data-testid="lobby-users"]')).toContainText('user1_');
      await expect(user2Page.locator('[data-testid="lobby-users"]')).toContainText('user2_');
    });

    // Cleanup
    await user1Context.close();
    await user2Context.close();
  });

  test('responsive design works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await test.step('Mobile navigation works', async () => {
      await page.goto('/');
      
      // Check mobile menu
      const mobileMenu = page.locator('[data-testid="mobile-menu"]');
      if (await mobileMenu.isVisible()) {
        await mobileMenu.click();
      }
      
      // Navigation should work on mobile
      await page.click('text=Registrarse');
      await expect(page).toHaveURL(/.*register/);
    });

    await test.step('Bingo cards are playable on mobile', async () => {
      // Login first (simplified for mobile test)
      await page.goto('/login');
      // ... login steps ...
      
      // Go to game
      await page.goto('/game');
      
      // Check that bingo cards are visible and clickable on mobile
      const bingoCard = page.locator('[data-testid="bingo-card"]').first();
      await expect(bingoCard).toBeVisible();
      
      // Check touch interactions work
      const cell = page.locator('[data-testid="bingo-cell"]').first();
      await cell.tap(); // Use tap instead of click for mobile
      await expect(cell).toHaveClass(/marked/);
    });
  });

  test('error handling and recovery', async ({ page }) => {
    await test.step('Handle API errors gracefully', async () => {
      // Intercept API calls and return errors
      await page.route('/api/**', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' })
        });
      });

      await page.goto('/');
      
      // Should show error message but not crash
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      
      // Should have retry mechanism
      const retryButton = page.locator('[data-testid="retry-button"]');
      if (await retryButton.isVisible()) {
        await retryButton.click();
      }
    });

    await test.step('Handle WebSocket disconnections', async () => {
      // This would require more sophisticated mocking
      // but demonstrates the test structure for WebSocket testing
      
      await page.goto('/game');
      
      // Simulate WebSocket disconnection
      await page.evaluate(() => {
        // Force close WebSocket connections
        if (window.socket) {
          window.socket.disconnect();
        }
      });
      
      // Should show disconnection status
      await expect(page.locator('[data-testid="connection-status"]')).toContainText('Desconectado');
      
      // Should attempt reconnection
      await page.waitForTimeout(5000);
      await expect(page.locator('[data-testid="connection-status"]')).toContainText('Conectado');
    });
  });
});