import { test, expect } from '@playwright/test'

test.describe('Buy Cards Navigation Diagnosis', () => {
  
  test('Diagnose why COMPRAR CARTONES redirects to home', async ({ page }) => {
    console.log('🔍 Diagnosticando problema de COMPRAR CARTONES')
    
    // Capturar errores de consola y requests
    const consoleErrors: string[] = []
    const networkErrors: string[] = []
    const navigationEvents: string[] = []
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
        console.log('❌ Console Error:', msg.text())
      }
    })
    
    page.on('response', async (response) => {
      const url = response.url()
      const status = response.status()
      
      if (url.includes('/api/') && status >= 400) {
        networkErrors.push(`${url}: ${status}`)
        console.log(`❌ API Error: ${status} - ${url}`)
      }
    })
    
    // Capturar navegaciones
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        const url = frame.url()
        navigationEvents.push(url)
        console.log(`🌐 Navegación a: ${url}`)
      }
    })
    
    // Login
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
    await page.fill('input[type="text"]', 'usuario')
    await page.fill('input[type="password"]', '123456')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)
    
    console.log('📍 Paso 1: Navegando a PLAY')
    
    // Ir a PLAY
    const playButton = page.locator('text=PLAY').first()
    await playButton.click()
    await page.waitForTimeout(3000)
    
    await page.screenshot({ 
      path: './test-results/buy-diagnosis-01-play-page.png',
      fullPage: true 
    })
    
    const playContent = await page.content()
    console.log(`🌐 URL en PLAY: ${page.url()}`)
    
    // Verificar contenido de la página PLAY
    const hasNextGame = playContent.includes('PRÓXIMO JUEGO')
    const hasBuyButton = playContent.includes('COMPRAR CARTONES') || playContent.includes('UNIRSE AL JUEGO')
    const hasCardSelector = playContent.includes('Cartones a comprar')
    const hasNoGamesMessage = playContent.includes('No hay juegos') || playContent.includes('😴')
    
    console.log(`🎮 ¿Tiene próximo juego?: ${hasNextGame}`)
    console.log(`🎯 ¿Tiene botón comprar?: ${hasBuyButton}`)
    console.log(`🎫 ¿Tiene selector cartones?: ${hasCardSelector}`)
    console.log(`😴 ¿Mensaje sin juegos?: ${hasNoGamesMessage}`)
    
    if (hasNoGamesMessage) {
      console.log('🚨 PROBLEMA ENCONTRADO: No hay juegos disponibles')
      console.log('   - La API no está devolviendo juegos')
      console.log('   - O todos los juegos están en estado incorrecto')
      return
    }
    
    if (!hasBuyButton) {
      console.log('🚨 PROBLEMA ENCONTRADO: No hay botón COMPRAR CARTONES')
      console.log('   - El botón no se está renderizando')
      return
    }
    
    console.log('📍 Paso 2: Haciendo clic en COMPRAR CARTONES')
    
    // Buscar y hacer clic en el botón de compra
    try {
      const buyButton = page.locator('text=COMPRAR CARTONES').first()
      const joinButton = page.locator('text=UNIRSE AL JUEGO').first()
      
      let targetButton
      if (await buyButton.count() > 0) {
        targetButton = buyButton
        console.log('🎯 Usando botón COMPRAR CARTONES')
      } else if (await joinButton.count() > 0) {
        targetButton = joinButton
        console.log('🔴 Usando botón UNIRSE AL JUEGO')
      } else {
        console.log('❌ No se encontró botón de compra/unirse')
        return
      }
      
      // Capturar URL antes del clic
      const urlBeforeClick = page.url()
      console.log(`🔍 URL antes del clic: ${urlBeforeClick}`)
      
      await targetButton.click()
      await page.waitForTimeout(3000)
      
      // Capturar URL después del clic
      const urlAfterClick = page.url()
      console.log(`🔍 URL después del clic: ${urlAfterClick}`)
      
      await page.screenshot({ 
        path: './test-results/buy-diagnosis-02-after-click.png',
        fullPage: true 
      })
      
      // Analizar qué pasó
      if (urlAfterClick.includes('/game/')) {
        console.log('✅ ÉXITO: Navegó correctamente a GamePage')
        
        const gameContent = await page.content()
        const hasGameInterface = gameContent.includes('BINGO') || gameContent.includes('cartón') || gameContent.includes('números')
        
        console.log(`🎮 ¿GamePage se cargó?: ${hasGameInterface}`)
        
        if (!hasGameInterface) {
          console.log('⚠️ GamePage se cargó pero no muestra interfaz de juego')
        }
        
      } else if (urlAfterClick === 'http://localhost:5173/' || urlAfterClick.includes('menu')) {
        console.log('🚨 PROBLEMA CONFIRMADO: Redirigió a página de inicio/menú')
        console.log('   Posibles causas:')
        console.log('   - Error en handleBuyCards()')
        console.log('   - nextGame.id es undefined')
        console.log('   - GamePage tiene error y redirige automáticamente')
        console.log('   - Hay un redirect automático después de la navegación')
        
      } else {
        console.log(`🤔 Navegó a URL inesperada: ${urlAfterClick}`)
      }
      
    } catch (error) {
      console.log(`❌ Error haciendo clic en botón: ${error.message}`)
    }
    
    // Reporte final
    console.log('\n📊 DIAGNÓSTICO COMPLETO:')
    console.log('==========================')
    console.log(`🌐 Navegaciones: ${navigationEvents.length}`)
    navigationEvents.forEach((url, i) => console.log(`  ${i + 1}. ${url}`))
    
    console.log(`❌ Errores de consola: ${consoleErrors.length}`)
    consoleErrors.forEach(error => console.log(`  - ${error}`))
    
    console.log(`🌐 Errores de red: ${networkErrors.length}`)
    networkErrors.forEach(error => console.log(`  - ${error}`))
    
    if (consoleErrors.length > 0) {
      console.log('\n🚨 CAUSA PROBABLE: Errores JavaScript impiden navegación correcta')
    } else if (networkErrors.length > 0) {
      console.log('\n🚨 CAUSA PROBABLE: Errores de API impiden carga de datos de juego')
    } else {
      console.log('\n🤔 CAUSA DESCONOCIDA: No se detectaron errores obvios')
    }
  })
})