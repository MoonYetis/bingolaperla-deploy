import { test as base, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

export interface AuthenticatedUser {
  username: string
  email: string
  balance: number
  pearlsBalance: number
}

export interface AuthFixtures {
  authenticatedPage: Page
  testUser: AuthenticatedUser
}

/**
 * Fixture personalizado para autenticación en Bingo La Perla
 * Maneja el debug overlay y asegura estado inicial correcto
 */
export const test = base.extend<AuthFixtures>({
  testUser: async ({}, use) => {
    const user: AuthenticatedUser = {
      username: 'usuario',
      email: 'jugador@test.com',
      balance: 99.00,
      pearlsBalance: 99.00
    }
    await use(user)
  },

  authenticatedPage: async ({ page, testUser }, use) => {
    console.log('🔐 Setting up authenticated session for:', testUser.username)
    
    try {
      // 1. Navegar a login
      await page.goto('/login', { waitUntil: 'networkidle' })
      
      // 2. Remover debug overlay si existe (evita interferencia)
      await page.evaluate(() => {
        const debugOverlay = document.querySelector('.fixed.top-0.left-0.bg-blue-900')
        if (debugOverlay) {
          debugOverlay.remove()
          console.log('🗑️ Debug overlay removed')
        }
      })

      // 3. Realizar login
      await page.fill('input[type="email"]', testUser.email)
      await page.fill('input[type="password"]', 'password123')
      
      // Click login con retry por posibles overlays
      const loginButton = page.locator('button:has-text("Iniciar sesión"), button:has-text("ENTRAR")')
      await expect(loginButton).toBeVisible()
      await loginButton.click()

      // 4. Esperar redirección exitosa al menu principal
      await page.waitForURL(/\/(menu|$)/, { timeout: 10000 })
      
      // 5. Verificar estado de autenticación
      await expect(page.locator(`text=${testUser.username}`)).toBeVisible({ timeout: 8000 })
      
      // 6. Verificar balance inicial
      const balanceElement = page.locator('text=/.*99.*Perlas/')
      await expect(balanceElement).toBeVisible({ timeout: 5000 })
      
      // 7. Remover cualquier overlay que haya aparecido después del login
      await page.evaluate(() => {
        const overlays = document.querySelectorAll('.fixed.top-0, .fixed.bottom-0')
        overlays.forEach(overlay => {
          if (overlay.classList.contains('z-50') || overlay.classList.contains('z-40')) {
            overlay.remove()
          }
        })
      })

      console.log('✅ Authentication setup complete for:', testUser.username)
      
    } catch (error) {
      console.error('❌ Authentication setup failed:', error)
      await page.screenshot({ path: `test-results/auth-failure-${Date.now()}.png`, fullPage: true })
      throw error
    }

    await use(page)
  }
})

/**
 * Helper function para forzar clicks evitando debug overlay
 */
export async function forceClick(page: Page, selector: string) {
  await page.evaluate((sel) => {
    const element = document.querySelector(sel) as HTMLElement
    if (element) {
      element.click()
    } else {
      throw new Error(`Element not found: ${sel}`)
    }
  }, selector)
}

/**
 * Helper function para esperar y verificar navegación
 */
export async function waitForNavigation(page: Page, expectedPath: string, timeout = 10000) {
  await page.waitForURL(new RegExp(expectedPath), { timeout })
  await page.waitForLoadState('networkidle')
}

/**
 * Helper function para obtener balance actual de Perlas
 */
export async function getCurrentBalance(page: Page): Promise<number> {
  const balanceText = await page.locator('text=/.*\\d+\\.\\d+.*Perlas/').textContent()
  if (!balanceText) throw new Error('Balance not found')
  
  const match = balanceText.match(/(\d+\.?\d*)/);
  if (!match) throw new Error('Could not parse balance from: ' + balanceText)
  
  return parseFloat(match[1])
}

export { expect }