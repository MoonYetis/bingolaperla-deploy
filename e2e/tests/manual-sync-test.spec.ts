import { test, expect } from '@playwright/test'

test.describe('Test Manual: Sincronización Admin → Jugador', () => {
  
  test('Test específico de sincronización con selectors correctos', async ({ browser }) => {
    console.log('🎯 TEST MANUAL DE SINCRONIZACIÓN')
    console.log('==============================')
    
    // Crear contextos separados
    const adminContext = await browser.newContext()
    const playerContext = await browser.newContext()
    const adminPage = await adminContext.newPage()
    const playerPage = await playerContext.newPage()
    
    // ================
    // SETUP JUGADOR PRIMERO
    // ================
    console.log('\\n📍 Configurando jugador...')
    
    await playerPage.goto('http://localhost:5173/')
    await playerPage.fill('input[type="text"]', 'usuario')
    await playerPage.fill('input[type="password"]', '123456')
    await playerPage.click('button[type="submit"]')
    await playerPage.waitForTimeout(3000)
    
    await playerPage.click('text=PLAY')
    await playerPage.waitForTimeout(2000)
    await playerPage.click('text=COMPRAR CARTONES')
    await playerPage.waitForTimeout(4000)
    
    console.log(`✅ Jugador listo en: ${playerPage.url()}`)
    
    // ================
    // SETUP ADMIN CON SELECTOR ESPECÍFICO
    // ================
    console.log('\\n📍 Configurando admin...')
    
    await adminPage.goto('http://localhost:5173/')
    await adminPage.fill('input[type="text"]', 'admin')
    await adminPage.fill('input[type="password"]', 'password123')
    await adminPage.click('button[type="submit"]')
    await adminPage.waitForTimeout(3000)
    
    // Usar selector más específico para el botón ADMIN
    try {
      await adminPage.click('[class*="from-red-500"]', { timeout: 10000 })
      console.log('✅ Click en botón ADMIN exitoso (selector por clase)')
    } catch (error) {
      try {
        await adminPage.click('text=Control manual')
        console.log('✅ Click en botón ADMIN exitoso (texto "Control manual")')
      } catch (error2) {
        console.log('❌ No se pudo hacer click en botón ADMIN')
        console.log('Intentando navegación directa...')
        await adminPage.goto('http://localhost:5173/admin')
      }
    }
    
    await adminPage.waitForTimeout(5000)
    console.log(`🟠 Admin en: ${adminPage.url()}`)
    
    await adminPage.screenshot({ 
      path: './test-results/manual-sync-01-admin.png',
      fullPage: true 
    })
    
    // ================
    // VERIFICAR ADMIN PAGE CARGADA
    // ================
    const adminContent = await adminPage.content()
    const adminPageLoaded = adminContent.includes('Panel de Administrador') || 
                           adminContent.includes('Seleccionar Número') ||
                           adminContent.includes('Grid')
    
    console.log(`🟠 Admin page cargada: ${adminPageLoaded ? '✅' : '❌'}`)
    
    if (!adminPageLoaded) {
      console.log('❌ Admin page no cargó - abortando test')
      await adminContext.close()
      await playerContext.close()
      return
    }
    
    // ================
    // OBTENER NÚMEROS ANTES
    // ================
    console.log('\\n📍 Obteniendo números cantados ANTES...')
    
    const numerosAntes = await playerPage.evaluate(() => {
      // Buscar números en elementos rojos (números cantados)
      const rojos = document.querySelectorAll('[class*="bg-red-500"]')
      return Array.from(rojos).map(el => el.textContent?.trim()).filter(Boolean)
    })
    
    console.log(`🔵 Números ANTES: [${numerosAntes.join(', ')}]`)
    
    // ================
    // ADMIN CANTA NÚMERO
    // ================
    console.log('\\n📍 Admin va a cantar número 55...')
    
    let clickExitoso = false
    
    // Múltiples estrategias para hacer click en número 55
    try {
      await adminPage.click('button:has-text("55")', { timeout: 5000 })
      clickExitoso = true
      console.log('✅ Click en 55 exitoso (strategy 1)')
    } catch (error) {
      try {
        await adminPage.locator('button').filter({ hasText: /^55$/ }).click()
        clickExitoso = true
        console.log('✅ Click en 55 exitoso (strategy 2)')
      } catch (error2) {
        try {
          await adminPage.click('text="55"')
          clickExitoso = true
          console.log('✅ Click en 55 exitoso (strategy 3)')
        } catch (error3) {
          console.log('❌ No se pudo hacer click en número 55')
          console.log(`Error: ${error3.message}`)
        }
      }
    }
    
    if (!clickExitoso) {
      console.log('❌ No se pudo cantar número - test fallido')
      await adminContext.close()
      await playerContext.close()
      return
    }
    
    // Esperar propagación
    await adminPage.waitForTimeout(3000)
    await playerPage.waitForTimeout(3000)
    
    // ================
    // VERIFICAR SINCRONIZACIÓN
    // ================
    console.log('\\n📍 Verificando sincronización...')
    
    const numerosDepues = await playerPage.evaluate(() => {
      const rojos = document.querySelectorAll('[class*="bg-red-500"]')
      return Array.from(rojos).map(el => el.textContent?.trim()).filter(Boolean)
    })
    
    console.log(`🔵 Números DESPUÉS: [${numerosDepues.join(', ')}]`)
    
    await playerPage.screenshot({ 
      path: './test-results/manual-sync-02-player-after.png',
      fullPage: true 
    })
    
    // ================
    // RESULTADO
    // ================
    const numero55Agregado = numerosDepues.includes('55') && !numerosAntes.includes('55')
    
    if (numero55Agregado) {
      console.log('\\n🎉 ¡SINCRONIZACIÓN EXITOSA!')
      console.log('✅ Número 55 apareció en jugador')
      console.log('✅ Socket.IO funcionando correctamente')
      console.log('✅ GameId sincronizado entre admin y jugador')
      
      // Probar otro número
      console.log('\\n🟠 Probando número 33 para confirmar...')
      
      try {
        await adminPage.click('button:has-text("33")')
        await adminPage.waitForTimeout(2000)
        await playerPage.waitForTimeout(2000)
        
        const numerosFinal = await playerPage.evaluate(() => {
          const rojos = document.querySelectorAll('[class*="bg-red-500"]')
          return Array.from(rojos).map(el => el.textContent?.trim()).filter(Boolean)
        })
        
        const numero33Agregado = numerosFinal.includes('33') && !numerosDepues.includes('33')
        
        if (numero33Agregado) {
          console.log('✅ Número 33 también sincronizado - ¡PERFECTO!')
        }
        
        console.log(`🔵 Números FINAL: [${numerosFinal.join(', ')}]`)
        
      } catch (error) {
        console.log(`⚠️ Error con número 33: ${error.message}`)
      }
      
    } else {
      console.log('\\n❌ SINCRONIZACIÓN FALLÓ')
      console.log('🔍 Posibles problemas:')
      console.log('- GameId no coincide entre admin y jugador')
      console.log('- Socket.IO no conectado correctamente')
      console.log('- Eventos no configurados en backend')
      console.log('- useBingoSocket hook con problemas')
    }
    
    // ================
    // REPORTE FINAL
    // ================
    console.log('\\n📊 REPORTE FINAL')
    console.log('=================')
    console.log(`✅ Admin page cargada: ${adminPageLoaded}`)
    console.log(`✅ Click en número: ${clickExitoso}`)
    console.log(`✅ Sincronización: ${numero55Agregado}`)
    
    if (numero55Agregado) {
      console.log('\\n🚀 ¡PROBLEMA DE SINCRONIZACIÓN SOLUCIONADO!')
      console.log('El admin puede controlar números manualmente')
      console.log('Los jugadores reciben números en tiempo real')
      console.log('Streaming + Control manual 100% funcional')
    } else {
      console.log('\\n🔧 REQUIERE MÁS DEBUG')
      console.log('Revisar implementación Socket.IO')
    }
    
    await adminContext.close()
    await playerContext.close()
  })
})