import { test, expect } from '@playwright/test'

test.describe('Debug: Sincronización Socket.IO Admin → Jugador', () => {
  
  test('Diagnosticar problema de sincronización entre admin y jugadores', async ({ browser }) => {
    console.log('🔍 DIAGNOSTICANDO SINCRONIZACIÓN SOCKET.IO')
    console.log('==========================================')
    
    // Crear dos contextos: Admin y Jugador
    const adminContext = await browser.newContext()
    const playerContext = await browser.newContext()
    
    const adminPage = await adminContext.newPage()
    const playerPage = await playerContext.newPage()
    
    // Habilitar logs de consola para ambas páginas
    adminPage.on('console', msg => {
      if (msg.text().includes('Socket') || msg.text().includes('admin') || msg.text().includes('number')) {
        console.log(`🟠 [ADMIN CONSOLE]: ${msg.text()}`)
      }
    })
    
    playerPage.on('console', msg => {
      if (msg.text().includes('Socket') || msg.text().includes('number') || msg.text().includes('cantado')) {
        console.log(`🔵 [PLAYER CONSOLE]: ${msg.text()}`)
      }
    })
    
    // ================
    // PASO 1: LOGIN ADMIN
    // ================
    console.log('\\n📍 Paso 1: Login como admin')
    
    await adminPage.goto('http://localhost:5173/')
    await adminPage.fill('input[type="text"]', 'admin')
    await adminPage.fill('input[type="password"]', 'password123')
    await adminPage.click('button[type="submit"]')
    await adminPage.waitForTimeout(3000)
    
    // Ir a página admin
    await adminPage.click('text=ADMIN')
    await adminPage.waitForTimeout(4000)
    
    console.log(`🟠 Admin en: ${adminPage.url()}`)
    
    await adminPage.screenshot({ 
      path: './test-results/socket-debug-01-admin.png',
      fullPage: true 
    })
    
    // ================
    // PASO 2: LOGIN JUGADOR
    // ================
    console.log('\\n📍 Paso 2: Login como jugador')
    
    await playerPage.goto('http://localhost:5173/')
    await playerPage.fill('input[type="text"]', 'usuario')
    await playerPage.fill('input[type="password"]', '123456')
    await playerPage.click('button[type="submit"]')
    await playerPage.waitForTimeout(3000)
    
    // Ir al juego  
    await playerPage.click('text=PLAY')
    await playerPage.waitForTimeout(2000)
    await playerPage.click('text=COMPRAR CARTONES')
    await playerPage.waitForTimeout(4000)
    
    console.log(`🔵 Jugador en: ${playerPage.url()}`)
    
    await playerPage.screenshot({ 
      path: './test-results/socket-debug-02-player.png',
      fullPage: true 
    })
    
    // ================
    // PASO 3: VERIFICAR CONEXIONES SOCKET.IO
    // ================
    console.log('\\n📍 Paso 3: Verificando conexiones Socket.IO')
    
    // Verificar estado de conexión en ambas páginas
    const adminContent = await adminPage.content()
    const playerContent = await playerPage.content()
    
    const adminConnected = adminContent.includes('Conectado') && !adminContent.includes('Desconectado')
    const playerConnected = playerContent.includes('En vivo') && !playerContent.includes('Desconectado')
    
    console.log(`🟠 Admin Socket conectado: ${adminConnected ? '✅ SÍ' : '❌ NO'}`)
    console.log(`🔵 Jugador Socket conectado: ${playerConnected ? '✅ SÍ' : '❌ NO'}`)
    
    // ================
    // PASO 4: PROBAR SINCRONIZACIÓN
    // ================
    console.log('\\n📍 Paso 4: Probando sincronización manual')
    
    // Capturar números cantados ANTES del click en admin
    const numerosAntes = await playerPage.evaluate(() => {
      const elementos = document.querySelectorAll('[class*="bg-red-500"]')
      return Array.from(elementos).map(el => el.textContent?.trim()).filter(Boolean)
    })
    
    console.log(`🔵 Números cantados ANTES: [${numerosAntes.join(', ')}]`)
    
    // Admin canta número 45
    console.log('🟠 Admin va a cantar número 45...')
    
    try {
      await adminPage.click('button:has-text("45")', { timeout: 5000 })
      console.log('🟠 ✅ Admin hizo click en número 45')
      
      await adminPage.waitForTimeout(2000) // Esperar propagación
      
      await adminPage.screenshot({ 
        path: './test-results/socket-debug-03-admin-after-click.png',
        fullPage: true 
      })
      
    } catch (error) {
      console.log(`🟠 ❌ Error haciendo click en 45: ${error.message}`)
    }
    
    // Verificar si el número aparece en jugador
    await playerPage.waitForTimeout(3000)
    
    const numerosDepues = await playerPage.evaluate(() => {
      const elementos = document.querySelectorAll('[class*="bg-red-500"]')
      return Array.from(elementos).map(el => el.textContent?.trim()).filter(Boolean)
    })
    
    console.log(`🔵 Números cantados DESPUÉS: [${numerosDepues.join(', ')}]`)
    
    await playerPage.screenshot({ 
      path: './test-results/socket-debug-04-player-after-admin-click.png',
      fullPage: true 
    })
    
    // ================
    // PASO 5: ANÁLISIS DE RESULTADOS
    // ================
    console.log('\\n📍 Paso 5: Análisis de sincronización')
    
    const numero45Agregado = numerosDepues.includes('45') && !numerosAntes.includes('45')
    
    if (numero45Agregado) {
      console.log('🎉 ✅ SINCRONIZACIÓN FUNCIONA: Número 45 apareció en jugador')
    } else {
      console.log('🚨 ❌ SINCRONIZACIÓN FALLA: Número 45 NO apareció en jugador')
      
      console.log('\\n🔍 POSIBLES CAUSAS:')
      console.log('1. Socket.IO no conectado correctamente')
      console.log('2. GameId diferente entre admin y jugador')
      console.log('3. Eventos no registrados correctamente')
      console.log('4. Salas de Socket.IO mal configuradas')
      console.log('5. useBingoSocket hook no funcionando')
    }
    
    // ================
    // PASO 6: DEBUG DETALLADO
    // ================
    console.log('\\n📍 Paso 6: Debug detallado de eventos')
    
    // Verificar eventos en DevTools
    await adminPage.evaluate(() => {
      console.log('🟠 [DEBUG] Verificando useBingoSocket en admin...')
      console.log('🟠 [DEBUG] isConnected:', window.location.href)
    })
    
    await playerPage.evaluate(() => {
      console.log('🔵 [DEBUG] Verificando useBingoSocket en jugador...')
      console.log('🔵 [DEBUG] isConnected:', window.location.href)
    })
    
    // ================
    // PASO 7: PROBAR OTRO NÚMERO
    // ================
    console.log('\\n📍 Paso 7: Probando con otro número (23)')
    
    try {
      await adminPage.click('button:has-text("23")', { timeout: 5000 })
      console.log('🟠 ✅ Admin hizo click en número 23')
      
      await adminPage.waitForTimeout(2000)
      await playerPage.waitForTimeout(2000)
      
      const numerosFinales = await playerPage.evaluate(() => {
        const elementos = document.querySelectorAll('[class*="bg-red-500"]')
        return Array.from(elementos).map(el => el.textContent?.trim()).filter(Boolean)
      })
      
      console.log(`🔵 Números finales: [${numerosFinales.join(', ')}]`)
      
      const numero23Agregado = numerosFinales.includes('23') && !numerosDepues.includes('23')
      
      if (numero23Agregado) {
        console.log('✅ Número 23 sincronizado correctamente')
      } else {
        console.log('❌ Número 23 NO se sincronizó')
      }
      
    } catch (error) {
      console.log(`🟠 ❌ Error con número 23: ${error.message}`)
    }
    
    // ================
    // REPORTE FINAL
    // ================
    console.log('\\n🎯 REPORTE DE DIAGNÓSTICO SOCKET.IO')
    console.log('===================================')
    
    console.log(`🔌 Conexiones:`)
    console.log(`   🟠 Admin conectado: ${adminConnected ? '✅' : '❌'}`)
    console.log(`   🔵 Jugador conectado: ${playerConnected ? '✅' : '❌'}`)
    
    console.log(`\\n📡 Sincronización:`)
    console.log(`   🎯 Número 45: ${numero45Agregado ? '✅ Sincronizado' : '❌ NO sincronizado'}`)
    
    if (!numero45Agregado) {
      console.log('\\n🛠️ SIGUIENTES PASOS PARA ARREGLAR:')
      console.log('1. Verificar backend Socket.IO está corriendo')
      console.log('2. Revisar eventos admin-call-number en server.ts')
      console.log('3. Verificar useBingoSocket hook en frontend')
      console.log('4. Asegurar gameId consistente entre admin y jugador')
      console.log('5. Debug específico de salas Socket.IO')
    } else {
      console.log('\\n🎉 ¡SINCRONIZACIÓN FUNCIONANDO CORRECTAMENTE!')
    }
    
    // Cleanup
    await adminContext.close()
    await playerContext.close()
  })
})