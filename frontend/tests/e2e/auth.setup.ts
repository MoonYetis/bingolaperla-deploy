import { test as setup, expect } from '@playwright/test'

const authFile = 'tests/e2e/.auth/user.json'

setup('authenticate', async ({ page }) => {
  console.log('🔐 Setting up authentication state...')
  
  // Navegar a login
  await page.goto('/login')
  
  // Remover debug overlays
  await page.evaluate(() => {
    document.querySelectorAll('.fixed.top-0.left-0, .fixed.bottom-4.right-4').forEach(el => el.remove())
  })
  
  // Realizar login
  await page.fill('input[type="email"]', 'jugador@test.com')
  await page.fill('input[type="password"]', 'password123')
  
  const loginButton = page.locator('button:has-text("Iniciar sesión"), button:has-text("ENTRAR")')
  await loginButton.click()
  
  // Esperar redirección exitosa
  await page.waitForURL(/\/(menu|$)/)
  
  // Verificar que estamos autenticados
  await expect(page.locator('text=usuario, text=Usuario')).toBeVisible()
  
  // Guardar estado de autenticación
  await page.context().storageState({ path: authFile })
  
  console.log('✅ Authentication state saved')
})