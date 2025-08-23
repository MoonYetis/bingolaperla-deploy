import { test, expect } from './fixtures/auth.fixture'

test.describe('🎮 Game Data Validation - Datos Específicos Reales', () => {
  
  test('🏆 Game Information: Verifica datos exactos del juego observado', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard')
    await authenticatedPage.waitForLoadState('networkidle')
    
    // Datos específicos observados en la exploración real
    const expectedGameData = {
      title: 'Bingo La Perla - Noche Especial',
      time: '04:30',
      prize: 'S/ 1500', 
      players: '23/100',
      cardPrice: 15.00
    }
    
    console.log('🔍 Validating real game data...')
    
    // Verificar título del juego
    await expect(authenticatedPage.locator(`text=${expectedGameData.title}`)).toBeVisible({ timeout: 10000 })
    console.log('✅ Game title confirmed:', expectedGameData.title)
    
    // Verificar horario
    await expect(authenticatedPage.locator(`text=${expectedGameData.time}`)).toBeVisible()
    console.log('✅ Game time confirmed:', expectedGameData.time)
    
    // Verificar premio
    await expect(authenticatedPage.locator(`text=${expectedGameData.prize}`)).toBeVisible()
    console.log('✅ Prize confirmed:', expectedGameData.prize)
    
    // Verificar jugadores
    await expect(authenticatedPage.locator(`text=${expectedGameData.players}`)).toBeVisible()
    console.log('✅ Player count confirmed:', expectedGameData.players)
    
    // Screenshot de validación
    await authenticatedPage.screenshot({ 
      path: `test-results/game-data-validation-${Date.now()}.png`,
      fullPage: true 
    })
    
    console.log('🎉 All game data validated successfully')
  })

  test('🎯 Multiple Games: Verifica que hay varios juegos disponibles', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard')
    await authenticatedPage.waitForLoadState('networkidle')
    
    // Basado en exploración real: debe haber múltiples juegos
    const gameElements = await authenticatedPage.locator('[data-testid="game-card"], .game-card, text=Bingo').count()
    
    console.log(`🎮 Found ${gameElements} game elements`)
    
    // Debe haber al menos el juego principal observado
    expect(gameElements).toBeGreaterThanOrEqual(1)
    
    // Verificar que el juego "Noche Especial" está presente
    await expect(authenticatedPage.locator('text=Noche Especial')).toBeVisible()
  })

  test('💎 Card Price Consistency: Precio por cartón es constante en 15 Perlas', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard')
    await authenticatedPage.waitForLoadState('networkidle')
    
    // Verificar que el precio base es 15 Perlas por cartón
    const expectedPricePerCard = 15.00
    
    // Seleccionar 1 cartón
    await authenticatedPage.click('button.w-16.h-16:has-text("1")')
    await expect(authenticatedPage.locator(`text=${expectedPricePerCard.toFixed(2)} Perlas total`)).toBeVisible()
    
    // Seleccionar 2 cartones (15 * 2 = 30)
    await authenticatedPage.click('button.w-16.h-16:has-text("2")')
    await expect(authenticatedPage.locator(`text=${(expectedPricePerCard * 2).toFixed(2)} Perlas total`)).toBeVisible()
    
    // Seleccionar 3 cartones (15 * 3 = 45)  
    await authenticatedPage.click('button.w-16.h-16:has-text("3")')
    await expect(authenticatedPage.locator(`text=${(expectedPricePerCard * 3).toFixed(2)} Perlas total`)).toBeVisible()
    
    console.log(`✅ Card price consistency verified: ${expectedPricePerCard} Perlas per card`)
  })

  test('⏰ Game Status: Verifica estados de juego (OPEN, SCHEDULED, IN_PROGRESS)', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard')
    await authenticatedPage.waitForLoadState('networkidle')
    
    // Buscar indicadores de estado de juego
    const statusIndicators = [
      'EN VIVO',        // Para juegos IN_PROGRESS
      'PRÓXIMO',        // Para juegos SCHEDULED
      'ABIERTO',        // Para juegos OPEN
      'COMPRAR CARTONES' // Botón disponible para juegos abiertos
    ]
    
    let statusFound = false
    for (const indicator of statusIndicators) {
      if (await authenticatedPage.locator(`text=${indicator}`).isVisible()) {
        console.log(`✅ Game status indicator found: ${indicator}`)
        statusFound = true
        break
      }
    }
    
    expect(statusFound).toBe(true)
    
    // El juego específico observado debe permitir compras
    await expect(authenticatedPage.locator('button:has-text("COMPRAR CARTONES")')).toBeVisible()
  })

  test('🔢 Player Count: Validar formato y rangos de jugadores', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard')
    await authenticatedPage.waitForLoadState('networkidle')
    
    // Buscar formato de jugadores "X/Y" 
    const playerCountElement = authenticatedPage.locator('text=/\\d+\\/\\d+/')
    await expect(playerCountElement).toBeVisible()
    
    const playerText = await playerCountElement.textContent()
    console.log(`👥 Player count: ${playerText}`)
    
    if (playerText) {
      const [current, max] = playerText.split('/').map(n => parseInt(n))
      
      // Validar que los números son razonables
      expect(current).toBeGreaterThanOrEqual(0)
      expect(max).toBeGreaterThan(0)
      expect(current).toBeLessThanOrEqual(max)
      
      // Basado en observación real: 23/100
      if (playerText === '23/100') {
        console.log('✅ Exact match with observed data: 23/100 players')
      }
    }
  })

  test('🎰 Game Selection: Navegar entre múltiples juegos si disponible', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard')
    await authenticatedPage.waitForLoadState('networkidle')
    
    // Buscar si hay navegación entre juegos o solo uno disponible
    const gameNavigationElements = await authenticatedPage.locator('[data-testid="game-selector"], .game-selector, button:has-text("Siguiente"), button:has-text("Anterior")').count()
    
    if (gameNavigationElements > 0) {
      console.log('🎮 Multiple game navigation detected')
      
      // Test navegación si existe
      const nextButton = authenticatedPage.locator('button:has-text("Siguiente"), [aria-label="Next game"]')
      if (await nextButton.isVisible()) {
        await nextButton.click()
        await authenticatedPage.waitForTimeout(1000)
        
        // Verificar que cambió algo
        await expect(authenticatedPage.locator('text=PRÓXIMO JUEGO')).toBeVisible()
      }
      
    } else {
      console.log('📊 Single game display confirmed')
      
      // Verificar que hay al menos un juego mostrado
      await expect(authenticatedPage.locator('text=PRÓXIMO JUEGO')).toBeVisible()
    }
  })
})