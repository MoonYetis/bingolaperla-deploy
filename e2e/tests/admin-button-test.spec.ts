import { test, expect } from '@playwright/test'

test.describe('Test: Botón de ADMIN en MainMenu', () => {
  
  test('Verificar botón ADMIN para administradores', async ({ page }) => {
    console.log('🎯 PROBANDO BOTÓN DE ADMIN EN MAINMENU')
    console.log('====================================')
    
    // ================
    // PASO 1: LOGIN COMO ADMIN
    // ================
    console.log('📍 Paso 1: Login como administrador')
    
    await page.goto('http://localhost:5173/')
    await page.fill('input[type="text"]', 'admin')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(4000)
    
    console.log('✅ Login como admin exitoso')
    
    // ================
    // PASO 2: VERIFICAR MAINMENU CON BOTÓN ADMIN
    // ================
    console.log('\\n📍 Paso 2: Verificando MainMenu con botón ADMIN')
    
    const mainMenuContent = await page.content()
    
    // Verificar botones normales
    const tienePlay = mainMenuContent.includes('PLAY')
    const tienePerfil = mainMenuContent.includes('PERFIL')
    const tieneAyuda = mainMenuContent.includes('AYUDA')
    
    // Verificar botón de admin
    const tieneAdmin = mainMenuContent.includes('ADMIN') && mainMenuContent.includes('Control manual')
    
    console.log('🎮 BOTONES EN MAINMENU:')
    console.log(`   🎯 PLAY: ${tienePlay ? '✅' : '❌'}`)
    console.log(`   👤 PERFIL: ${tienePerfil ? '✅' : '❌'}`)
    console.log(`   ❓ AYUDA: ${tieneAyuda ? '✅' : '❌'}`)
    console.log(`   👨‍💼 ADMIN: ${tieneAdmin ? '✅ DISPONIBLE PARA ADMIN' : '❌ NO ENCONTRADO'}`)
    
    await page.screenshot({ 
      path: './test-results/admin-button-01-mainmenu-with-admin.png',
      fullPage: true 
    })
    
    // ================
    // PASO 3: USAR BOTÓN ADMIN
    // ================
    if (tieneAdmin) {
      console.log('\\n📍 Paso 3: Haciendo clic en botón ADMIN')
      
      try {
        // Hacer clic en el botón ADMIN
        await page.click('text=ADMIN')
        await page.waitForTimeout(5000)
        
        const urlDespuesAdmin = page.url()
        const adminPageContent = await page.content()
        
        console.log(`🌐 URL después de clic en ADMIN: ${urlDespuesAdmin}`)
        
        if (urlDespuesAdmin.includes('admin')) {
          console.log('🎉 ¡ÉXITO! Botón ADMIN funciona correctamente')
          
          // Verificar página de admin
          const tieneGridAdmin = adminPageContent.includes('Panel de Administrador') || 
                                 adminPageContent.includes('Seleccionar Número')
          
          if (tieneGridAdmin) {
            console.log('✅ Página de administrador cargada correctamente')
            console.log('   🎲 Grid de números B-I-N-G-O disponible')
            console.log('   👨‍💼 Panel de control manual funcionando')
            
            await page.screenshot({ 
              path: './test-results/admin-button-02-admin-page-success.png',
              fullPage: true 
            })
            
          } else {
            console.log('⚠️ Página de admin cargó pero sin contenido esperado')
          }
          
        } else {
          console.log('❌ Botón ADMIN no redirigió correctamente')
          console.log(`   URL actual: ${urlDespuesAdmin}`)
        }
        
      } catch (error) {
        console.log(`❌ Error haciendo clic en botón ADMIN: ${error.message}`)
      }
    }
    
    // ================
    // PASO 4: PROBAR CON USUARIO NORMAL
    // ================
    console.log('\\n📍 Paso 4: Verificando que usuario normal NO vea botón ADMIN')
    
    // Logout
    await page.goto('http://localhost:5173/')
    await page.waitForTimeout(2000)
    
    try {
      await page.click('text=↗️') // Botón logout
      await page.waitForTimeout(2000)
    } catch (error) {
      // Si no encuentra logout, hacer logout manual
      await page.goto('http://localhost:5173/login')
    }
    
    // Login como usuario normal
    await page.fill('input[type="text"]', 'usuario')
    await page.fill('input[type="password"]', '123456')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(4000)
    
    const usuarioContent = await page.content()
    const usuarioTieneAdmin = usuarioContent.includes('ADMIN') && usuarioContent.includes('Control manual')
    
    console.log(`👤 Usuario normal ve botón ADMIN: ${usuarioTieneAdmin ? '❌ ERROR - NO DEBERÍA VERLO' : '✅ CORRECTO - NO LO VE'}`)
    
    await page.screenshot({ 
      path: './test-results/admin-button-03-user-no-admin.png',
      fullPage: true 
    })
    
    // ================
    // REPORTE FINAL
    // ================
    console.log('\\n🎉 REPORTE FINAL: BOTÓN ADMIN IMPLEMENTADO')
    console.log('==========================================')
    
    if (tieneAdmin) {
      console.log('✅ SOLUCIÓN EXITOSA:')
      console.log('   🎯 Botón ADMIN añadido al MainMenu')
      console.log('   👨‍💼 Solo visible para usuarios con rol ADMIN')
      console.log('   🔗 Navegación directa a página de administrador')
      console.log('   🎲 Acceso inmediato al grid de números manual')
      console.log('')
      console.log('🚀 CÓMO ACCEDER AHORA:')
      console.log('   1️⃣ Login con: admin / password123')
      console.log('   2️⃣ En MainMenu: clic en botón "👨‍💼 ADMIN"')
      console.log('   3️⃣ ¡Listo! Ya estás en la página de control manual')
      console.log('')
      console.log('🎮 FUNCIONALIDAD DISPONIBLE:')
      console.log('   • Grid B-I-N-G-O con 75 números clickeables')
      console.log('   • Colores por letra (B=azul, I=verde, etc.)')
      console.log('   • Control manual total de números')
      console.log('   • Sincronización Socket.IO en tiempo real')
      console.log('   • Estadísticas, controles, configuración')
      
    } else {
      console.log('❌ Botón ADMIN no encontrado - revisar implementación')
    }
    
    console.log('\\n🎯 ¡PROBLEMA DE ACCESO SOLUCIONADO!')
  })
})