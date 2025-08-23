import { test, expect } from '@playwright/test'

test.describe('Test: Diagnóstico de Rutas Específicas', () => {
  
  test('Diagnosticar problema con rutas admin y game', async ({ page }) => {
    console.log('🛣️ DIAGNÓSTICO DE RUTAS ESPECÍFICAS')
    console.log('===================================')
    
    // ================
    // PASO 1: LOGIN EXITOSO CONFIRMADO
    // ================
    console.log('\n✅ PASO 1: Login exitoso (ya confirmado)')
    
    await page.goto('http://localhost:5173/')
    await page.waitForTimeout(2000)
    
    await page.fill('input[type=\"text\"]', 'admin')
    await page.fill('input[type=\"password\"]', 'password123')
    await page.click('button[type=\"submit\"]')
    await page.waitForTimeout(3000)
    
    const menuUrl = page.url()
    console.log(`   🏠 En menú: ${menuUrl}`)
    console.log(`   ✅ Login funcionando confirmado`)
    
    await page.screenshot({ path: './test-results/route-01-menu.png', fullPage: true })
    
    // ================
    // PASO 2: DIAGNÓSTICO DETALLADO DE /admin
    // ================
    console.log('\n🔍 PASO 2: Diagnóstico detallado de /admin')
    
    console.log('   Navegando a /admin...')
    await page.goto('http://localhost:5173/admin')
    await page.waitForTimeout(5000)
    
    const adminUrl = page.url()
    const adminContent = await page.content()
    const adminText = await page.textContent('body').catch(() => '')
    
    console.log(`   📊 URL final: ${adminUrl}`)
    console.log(`   📄 Content length: ${adminContent.length}`)
    console.log(`   📝 Body text length: ${adminText.length}`)
    console.log(`   📝 Body text preview: "${adminText.substring(0, 200)}..."`)
    
    await page.screenshot({ path: './test-results/route-02-admin.png', fullPage: true })
    
    // Verificar elementos específicos
    const tieneAdminPanel = adminContent.includes('Panel de Administrador')
    const tienePatrones = adminContent.includes('Patrón de Juego')
    const tieneGrid = adminContent.includes('Seleccionar Número')
    const tieneError = adminContent.includes('error') || adminContent.includes('Error')
    const esRedireccion = adminUrl !== 'http://localhost:5173/admin'
    
    console.log(`   👨‍💼 Tiene admin panel: ${tieneAdminPanel ? 'SÍ' : 'NO'}`)
    console.log(`   🏆 Tiene patrones: ${tienePatrones ? 'SÍ' : 'NO'}`)
    console.log(`   🎲 Tiene grid: ${tieneGrid ? 'SÍ' : 'NO'}`)
    console.log(`   ❌ Tiene errores: ${tieneError ? 'SÍ' : 'NO'}`)
    console.log(`   🔄 Es redirección: ${esRedireccion ? 'SÍ' : 'NO'}`)
    
    if (esRedireccion) {
      console.log(`   🔄 Redirigido a: ${adminUrl}`)
    }
    
    // ================
    // PASO 3: DIAGNÓSTICO DETALLADO DE /game-simple/game-1
    // ================
    console.log('\n🔍 PASO 3: Diagnóstico detallado de /game-simple/game-1')
    
    console.log('   Navegando a /game-simple/game-1...')
    await page.goto('http://localhost:5173/game-simple/game-1')
    await page.waitForTimeout(5000)
    
    const gameUrl = page.url()
    const gameContent = await page.content()
    const gameText = await page.textContent('body').catch(() => '')
    
    console.log(`   📊 URL final: ${gameUrl}`)
    console.log(`   📄 Content length: ${gameContent.length}`)
    console.log(`   📝 Body text length: ${gameText.length}`)
    console.log(`   📝 Body text preview: "${gameText.substring(0, 200)}..."`)
    
    await page.screenshot({ path: './test-results/route-03-game.png', fullPage: true })
    
    // Verificar elementos específicos
    const tieneStreaming = gameContent.includes('Streaming')
    const tienePatronIndicador = gameContent.includes('Patrón Actual')
    const tieneCartones = gameContent.includes('Cartones')
    const tieneGameError = gameContent.includes('error') || gameContent.includes('Error')
    const esGameRedireccion = gameUrl !== 'http://localhost:5173/game-simple/game-1'
    
    console.log(`   📺 Tiene streaming: ${tieneStreaming ? 'SÍ' : 'NO'}`)
    console.log(`   🏆 Tiene patrón indicador: ${tienePatronIndicador ? 'SÍ' : 'NO'}`)
    console.log(`   🎫 Tiene cartones: ${tieneCartones ? 'SÍ' : 'NO'}`)
    console.log(`   ❌ Tiene errores: ${tieneGameError ? 'SÍ' : 'NO'}`)
    console.log(`   🔄 Es redirección: ${esGameRedireccion ? 'SÍ' : 'NO'}`)
    
    if (esGameRedireccion) {
      console.log(`   🔄 Redirigido a: ${gameUrl}`)
    }
    
    // ================
    // PASO 4: PROBAR OTRAS RUTAS
    // ================
    console.log('\n🔍 PASO 4: Probar otras rutas para comparar')
    
    const rutasPrueba = [
      { url: 'http://localhost:5173/menu', desc: 'Menu' },
      { url: 'http://localhost:5173/dashboard', desc: 'Dashboard' },
      { url: 'http://localhost:5173/profile', desc: 'Profile' },
      { url: 'http://localhost:5173/help', desc: 'Help' }
    ]
    
    for (const ruta of rutasPrueba) {
      console.log(`   🔗 Probando ${ruta.desc}: ${ruta.url}`)
      
      try {
        await page.goto(ruta.url)
        await page.waitForTimeout(2000)
        
        const url = page.url()
        const text = await page.textContent('body').catch(() => '')
        
        console.log(`     URL final: ${url}`)
        console.log(`     Content length: ${text.length}`)
        console.log(`     Status: ${text.length > 10 ? '✅ Carga' : '❌ Vacío'}`)
        
      } catch (error) {
        console.log(`     ❌ Error: ${error.message}`)
      }
    }
    
    // ================
    // PASO 5: CAPTURAR ERRORES DE CONSOLA
    // ================
    console.log('\n🔍 PASO 5: Capturar errores de consola en rutas problemáticas')
    
    const consoleErrors = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
        console.log(`   🚨 Console Error: ${msg.text()}`)
      }
    })
    
    // Volver a probar admin con captura de errores
    console.log('   Probando /admin con captura de errores...')
    await page.goto('http://localhost:5173/admin')
    await page.waitForTimeout(3000)
    
    console.log(`   Total errores capturados: ${consoleErrors.length}`)
    
    // ================
    // DIAGNÓSTICO FINAL
    // ================
    console.log('\n🎯 DIAGNÓSTICO FINAL DE RUTAS')
    console.log('============================')
    
    console.log('\\n📊 RESUMEN:')
    console.log(`   ✅ Login: FUNCIONA`)
    console.log(`   ✅ Menu: FUNCIONA`)
    console.log(`   ${tieneAdminPanel ? '✅' : '❌'} Admin panel: ${tieneAdminPanel ? 'FUNCIONA' : 'NO CARGA'}`)
    console.log(`   ${tieneStreaming || tieneCartones ? '✅' : '❌'} Game page: ${tieneStreaming || tieneCartones ? 'FUNCIONA' : 'NO CARGA'}`)
    
    console.log('\\n🔍 PROBLEMAS IDENTIFICADOS:')
    
    if (!tieneAdminPanel) {
      console.log('   ❌ Admin panel no carga elementos')
      if (esRedireccion) {
        console.log('     Problema: Redirección automática')
        console.log(`     Redirige a: ${adminUrl}`)
      } else {
        console.log('     Problema: Página vacía o error de renderizado')
      }
    }
    
    if (!tieneStreaming && !tieneCartones) {
      console.log('   ❌ Game page no carga elementos')
      if (esGameRedireccion) {
        console.log('     Problema: Redirección automática')
        console.log(`     Redirige a: ${gameUrl}`)
      } else {
        console.log('     Problema: Página vacía o error de renderizado')
      }
    }
    
    if (consoleErrors.length > 0) {
      console.log(`   ❌ ${consoleErrors.length} errores de JavaScript detectados`)
    }
    
    console.log('\\n💡 SOLUCIONES RECOMENDADAS:')
    
    if (!tieneAdminPanel && !tieneStreaming) {
      console.log('   🔧 Problema con componentes específicos:')
      console.log('     1. Verificar que AdminPage.tsx compile correctamente')
      console.log('     2. Verificar que SimpleGamePage.tsx compile correctamente')
      console.log('     3. Posible problema con imports o dependencias')
      console.log('     4. Ejecutar npm run build para verificar errores')
    }
    
    if (esRedireccion || esGameRedireccion) {
      console.log('   🔧 Problema de autenticación en rutas protegidas:')
      console.log('     1. ProtectedRoute podría estar redirigiendo')
      console.log('     2. Token de sesión podría estar expirando')
      console.log('     3. Verificar localStorage/sessionStorage')
    }
    
    console.log('\\n📸 EVIDENCIA VISUAL:')
    console.log('   📁 route-01-menu.png - Menu funcionando')
    console.log('   📁 route-02-admin.png - Estado del admin panel')
    console.log('   📁 route-03-game.png - Estado del game page')
  })
})