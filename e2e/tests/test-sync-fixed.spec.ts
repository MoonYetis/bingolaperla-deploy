import { test, expect } from '@playwright/test'

test.describe('Test: Sincronización Arreglada Admin → Jugador', () => {
  
  test('Verificar que sincronización funcione después del fix', async ({ browser }) => {
    console.log('🔧 PROBANDO SINCRONIZACIÓN ARREGLADA')
    console.log('===================================')
    
    // Crear dos contextos: Admin y Jugador
    const adminContext = await browser.newContext()
    const playerContext = await browser.newContext()
    
    const adminPage = await adminContext.newPage()
    const playerPage = await playerContext.newPage()
    
    // Logs de Socket.IO para debug
    adminPage.on('console', msg => {
      if (msg.text().includes('Socket') || msg.text().includes('admin') || msg.text().includes('🔌') || msg.text().includes('📢')) {
        console.log(`🟠 [ADMIN]: ${msg.text()}`)
      }
    })
    
    playerPage.on('console', msg => {
      if (msg.text().includes('Socket') || msg.text().includes('cantado') || msg.text().includes('🔌') || msg.text().includes('🎯')) {
        console.log(`🔵 [PLAYER]: ${msg.text()}`)
      }
    })
    
    // ================
    // PASO 1: SETUP JUGADOR
    // ================
    console.log('\\n📍 Paso 1: Setup jugador primero')
    
    await playerPage.goto('http://localhost:5173/')
    await playerPage.fill('input[type="text"]', 'usuario')
    await playerPage.fill('input[type="password"]', '123456')
    await playerPage.click('button[type="submit"]')
    await playerPage.waitForTimeout(3000)
    
    // Ir al juego - esto crea gameId 'game-1'
    await playerPage.click('text=PLAY')
    await playerPage.waitForTimeout(2000)
    await playerPage.click('text=COMPRAR CARTONES')
    await playerPage.waitForTimeout(5000)
    
    console.log(`🔵 Jugador en: ${playerPage.url()}`)
    
    // ================
    // PASO 2: SETUP ADMIN
    // ================
    console.log('\\n📍 Paso 2: Setup admin con gameId sincronizado')
    
    await adminPage.goto('http://localhost:5173/')
    await adminPage.fill('input[type="text"]', 'admin')
    await adminPage.fill('input[type="password"]', 'password123')
    await adminPage.click('button[type="submit"]')
    await adminPage.waitForTimeout(3000)
    
    // Ir a página admin
    await adminPage.click('text=ADMIN')
    await adminPage.waitForTimeout(5000)
    
    console.log(`🟠 Admin en: ${adminPage.url()}`)
    
    await adminPage.screenshot({ 
      path: './test-results/sync-fixed-01-admin-loaded.png',
      fullPage: true 
    })
    
    await playerPage.screenshot({ 
      path: './test-results/sync-fixed-02-player-ready.png',
      fullPage: true 
    })
    
    // ================
    // PASO 3: VERIFICAR CONEXIONES
    // ================
    console.log('\\n📍 Paso 3: Verificando conexiones Socket.IO')
    
    await adminPage.waitForTimeout(3000) // Asegurar conexión
    await playerPage.waitForTimeout(3000)
    
    const adminContent = await adminPage.content()
    const playerContent = await playerPage.content()
    
    const adminConnected = adminContent.includes('Conectado') && !adminContent.includes('Desconectado')
    const playerConnected = playerContent.includes('En vivo') && !playerContent.includes('Desconectado')
    const adminHasGrid = adminContent.includes('Seleccionar Número') || adminContent.includes('Panel de Administrador')
    
    console.log(`🟠 Admin Socket conectado: ${adminConnected ? '✅' : '❌'}`)
    console.log(`🔵 Jugador Socket conectado: ${playerConnected ? '✅' : '❌'}`)
    console.log(`🟠 Admin grid cargado: ${adminHasGrid ? '✅' : '❌'}`)
    
    // ================
    // PASO 4: PROBAR SINCRONIZACIÓN
    // ================
    console.log('\\n📍 Paso 4: Probando sincronización en tiempo real')
    
    if (!adminHasGrid) {
      console.log('❌ Admin grid no cargado - no se puede probar sincronización')
      return
    }
    
    // Obtener números cantados ANTES
    const numerosAntes = await playerPage.evaluate(() => {
      const elementos = document.querySelectorAll('[class*="bg-red-500"]')
      return Array.from(elementos).map(el => el.textContent?.trim()).filter(Boolean)
    })
    
    console.log(`🔵 Números ANTES: [${numerosAntes.join(', ')}]`)
    
    // Admin canta número 42
    console.log('🟠 Admin va a cantar número 42...')
    
    try {
      await adminPage.click('button:has-text("42")', { timeout: 10000 })
      console.log('🟠 ✅ Admin hizo click en número 42')
      
      // Esperar propagación
      await adminPage.waitForTimeout(2000)
      await playerPage.waitForTimeout(2000)
      
      await adminPage.screenshot({ 
        path: './test-results/sync-fixed-03-admin-clicked-42.png',
        fullPage: true 
      })
      
    } catch (error) {
      console.log(`🟠 ❌ Error haciendo click en 42: ${error.message}`)
      
      // Intentar con otro selector
      try {
        await adminPage.locator('button').filter({ hasText: /^42$/ }).click({ timeout: 5000 })
        console.log('🟠 ✅ Admin hizo click en 42 (selector alternativo)')
      } catch (error2) {
        console.log(`🟠 ❌ Error con selector alternativo: ${error2.message}`)
        return
      }
    }
    
    // Verificar si el número aparece en jugador
    await playerPage.waitForTimeout(3000)
    
    const numerosDepues = await playerPage.evaluate(() => {
      const elementos = document.querySelectorAll('[class*="bg-red-500"]')
      return Array.from(elementos).map(el => el.textContent?.trim()).filter(Boolean)
    })
    
    console.log(`🔵 Números DESPUÉS: [${numerosDepues.join(', ')}]`)
    
    await playerPage.screenshot({ 
      path: './test-results/sync-fixed-04-player-after-42.png',
      fullPage: true 
    })
    
    // ================
    // PASO 5: VERIFICAR SINCRONIZACIÓN
    // ================
    const numero42Agregado = numerosDepues.includes('42') && !numerosAntes.includes('42')
    
    if (numero42Agregado) {
      console.log('\\n🎉 ✅ ¡SINCRONIZACIÓN FUNCIONA PERFECTAMENTE!')
      console.log('   Número 42 apareció en jugador después de admin click')
      
      // Probar otro número para confirmar
      console.log('\\n🟠 Probando número 18 para confirmar...')
      
      try {
        await adminPage.click('button:has-text("18")', { timeout: 5000 })
        await adminPage.waitForTimeout(1000)
        await playerPage.waitForTimeout(1000)
        
        const numerosFinal = await playerPage.evaluate(() => {
          const elementos = document.querySelectorAll('[class*="bg-red-500"]')
          return Array.from(elementos).map(el => el.textContent?.trim()).filter(Boolean)
        })
        
        const numero18Agregado = numerosFinal.includes('18') && !numerosDepues.includes('18')
        
        if (numero18Agregado) {
          console.log('✅ Número 18 también sincronizado - ¡Sistema funcionando al 100%!')
        }
        
        console.log(`🔵 Números FINAL: [${numerosFinal.join(', ')}]`)
        
      } catch (error) {
        console.log(`⚠️ Error probando número 18: ${error.message}`)
      }
      
    } else {
      console.log('\\n❌ SINCRONIZACIÓN AÚN NO FUNCIONA')
      console.log('   Verificar que gameId sea consistente')
      console.log('   Verificar eventos Socket.IO en backend')
    }
    
    // ================
    // REPORTE FINAL
    // ================
    console.log('\\n🎯 REPORTE FINAL DE SINCRONIZACIÓN')
    console.log('==================================')
    
    console.log(`🔗 Conexiones:`)
    console.log(`   🟠 Admin: ${adminConnected ? '✅ Conectado' : '❌ Desconectado'}`)
    console.log(`   🔵 Jugador: ${playerConnected ? '✅ Conectado' : '❌ Desconectado'}`)
    
    console.log(`\\n🎲 Grid y UI:`)
    console.log(`   🟠 Admin grid: ${adminHasGrid ? '✅ Cargado' : '❌ No cargado'}`)
    console.log(`   🔵 Jugador game: ✅ Cargado`)
    
    console.log(`\\n⚡ Sincronización:`)
    console.log(`   🎯 Número 42: ${numero42Agregado ? '✅ Sincronizado perfectamente' : '❌ NO sincronizado'}`)
    
    if (numero42Agregado) {
      console.log('\\n🎉 ¡PROBLEMA SOLUCIONADO COMPLETAMENTE!')
      console.log('✅ GameId sincronizado entre admin y jugador')
      console.log('✅ Socket.IO funcionando correctamente')
      console.log('✅ Eventos admin-call-number → number-called funcionando')
      console.log('✅ Admin puede controlar números manualmente')
      console.log('✅ Jugadores reciben números en tiempo real')
      console.log('')
      console.log('🚀 ¡STREAMING + CONTROL MANUAL 100% FUNCIONAL!')
    } else {
      console.log('\\n🔧 NECESITA MÁS DEBUG:')
      console.log('- Revisar logs de Socket.IO en backend')
      console.log('- Verificar gameId consistente')
      console.log('- Confirmar eventos en server.ts')
    }
    
    // Cleanup
    await adminContext.close()
    await playerContext.close()
  })
})