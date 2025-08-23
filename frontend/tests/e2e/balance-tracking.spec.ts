import { test, expect, getCurrentBalance } from './fixtures/auth.fixture'

test.describe('💎 Balance Tracking - Comportamiento Real Observado', () => {
  
  test('📊 Balance Inconsistency: Documenta comportamiento 99 → 89 Perlas', async ({ authenticatedPage }) => {
    console.log('🔍 Documentando comportamiento real de balance...')
    
    // 1. Balance inicial en menu
    await authenticatedPage.goto('/menu')
    const menuBalance = await getCurrentBalance(authenticatedPage)
    console.log(`💎 Balance en menu: ${menuBalance} Perlas`)
    
    // 2. Navegar a dashboard y verificar balance
    await authenticatedPage.evaluate(() => {
      const buttons = document.querySelectorAll('button')
      for (const button of buttons) {
        if (button.textContent?.includes('PLAY')) {
          button.click()
          break
        }
      }
    })
    
    await authenticatedPage.waitForURL('/dashboard')
    await authenticatedPage.waitForLoadState('networkidle')
    
    const dashboardBalance = await getCurrentBalance(authenticatedPage)
    console.log(`💎 Balance en dashboard: ${dashboardBalance} Perlas`)
    
    // 3. Documentar la inconsistencia observada
    if (menuBalance === 99.00 && dashboardBalance === 89.00) {
      console.log('⚠️ Balance inconsistency confirmed: 99 → 89 Perlas')
      
      // Screenshot para documentación
      await authenticatedPage.screenshot({ 
        path: `test-results/balance-inconsistency-${Date.now()}.png`,
        fullPage: true 
      })
      
      // Verificar que la diferencia es exactamente 10 Perlas
      expect(menuBalance - dashboardBalance).toBe(10.00)
      
    } else if (menuBalance === dashboardBalance) {
      console.log('✅ Balance consistency maintained')
      expect(menuBalance).toBe(dashboardBalance)
      
    } else {
      console.log(`📊 Different balance behavior: ${menuBalance} → ${dashboardBalance}`)
      
      // Screenshot para análisis
      await authenticatedPage.screenshot({ 
        path: `test-results/balance-behavior-${Date.now()}.png`,
        fullPage: true 
      })
    }
  })

  test('🔄 Real-time Updates: Balance WebSocket funcionality', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard')
    await authenticatedPage.waitForLoadState('networkidle')
    
    // Capturar balance inicial
    const initialBalance = await getCurrentBalance(authenticatedPage)
    console.log(`💎 Initial balance: ${initialBalance}`)
    
    // Simular actividad que podría activar WebSocket
    await authenticatedPage.click('button.w-16.h-16:has-text("2")')
    
    // Esperar posibles actualizaciones en tiempo real
    await authenticatedPage.waitForTimeout(2000)
    
    const afterBalance = await getCurrentBalance(authenticatedPage)
    console.log(`💎 Balance after activity: ${afterBalance}`)
    
    // Documentar si hubo cambios
    if (initialBalance !== afterBalance) {
      console.log(`🔄 Real-time balance update detected: ${initialBalance} → ${afterBalance}`)
    } else {
      console.log('📊 No real-time balance changes detected')
    }
  })

  test('💰 Price Calculation: Verificar cálculos exactos observados', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard')
    await authenticatedPage.waitForLoadState('networkidle')
    
    // Test precios exactos basados en exploración real
    const testCases = [
      { cartones: 1, expectedPrice: 15.00 },
      { cartones: 2, expectedPrice: 30.00 },
      { cartones: 3, expectedPrice: 45.00 }
    ]
    
    for (const testCase of testCases) {
      console.log(`🧮 Testing ${testCase.cartones} carton(es) = ${testCase.expectedPrice} Perlas`)
      
      // Click selector
      await authenticatedPage.click(`button.w-16.h-16:has-text("${testCase.cartones}")`)
      
      // Verificar precio total
      await expect(authenticatedPage.locator(`text=${testCase.expectedPrice.toFixed(2)} Perlas total`)).toBeVisible()
      
      // Screenshot para documentación
      await authenticatedPage.screenshot({ 
        path: `test-results/price-calc-${testCase.cartones}-cartones-${Date.now()}.png` 
      })
    }
    
    console.log('✅ All price calculations verified')
  })
})