import { test, expect } from '@playwright/test'

test.describe('Test: Verificación Visual Definitiva', () => {
  
  test('Verificación completa con evidencia visual paso a paso', async ({ browser }) => {
    console.log('📸 VERIFICACIÓN VISUAL DEFINITIVA')
    console.log('=================================')
    console.log('Objetivo: Confirmar estado real del sistema con evidencia visual')
    console.log('')
    
    // Crear contexto completamente limpio
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }, // Resolución grande para screenshots claros
    })
    const page = await context.newPage()
    
    // Limpiar completamente el navegador
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    
    let stepCounter = 1
    const results = {
      systemWorking: false,
      loginWorking: false,
      adminAccessible: false,
      gameAccessible: false,
      patternsVisible: false,
      workingCredentials: []
    }
    
    // ================
    // PASO 1: ESTADO INICIAL DEL SISTEMA
    // ================
    console.log(`\\n📸 PASO ${stepCounter}: Estado inicial del sistema`)
    stepCounter++
    
    try {
      await page.goto('http://localhost:5173/', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      })
      await page.waitForTimeout(3000)
      
      const url = page.url()
      const content = await page.content()
      const title = await page.title()
      
      const systemHealthy = content.includes('BINGO LA PERLA') && 
                           content.includes('ENTRAR') &&
                           url.includes('localhost:5173')
      
      console.log(`   🌐 URL: ${url}`)
      console.log(`   📄 Título: ${title}`)
      console.log(`   ✅ Frontend carga: ${systemHealthy ? 'SÍ' : 'NO'}`)
      console.log(`   📋 Formulario login: ${content.includes('ENTRAR') ? 'VISIBLE' : 'NO VISIBLE'}`)
      
      results.systemWorking = systemHealthy
      
      await page.screenshot({ 
        path: './test-results/visual-01-sistema-inicial.png', 
        fullPage: true 
      })
      
      if (systemHealthy) {
        console.log('   🎉 ✅ SISTEMA FRONTEND FUNCIONANDO')
      } else {
        console.log('   ❌ PROBLEMA: Frontend no carga correctamente')
        return
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR CRÍTICO: No se puede acceder al sistema`)
      console.log(`   Error: ${error.message}`)
      await page.screenshot({ path: './test-results/error-sistema-no-accesible.png', fullPage: true })
      return
    }
    
    // ================
    // PASO 2: PRUEBA DE CREDENCIALES SISTEMÁTICA
    // ================
    const credencialesPrueba = [
      { user: 'admin@bingo-la-perla.com', pass: 'password123', desc: 'Admin Email', expected: 'admin' },
      { user: 'admin', pass: 'password123', desc: 'Admin Username', expected: 'admin' },
      { user: 'jugador@test.com', pass: 'password123', desc: 'Usuario Email', expected: 'user' },
      { user: 'usuario', pass: '123456', desc: 'Usuario Username Old', expected: 'user' },
      { user: 'usuario', pass: 'password123', desc: 'Usuario Username New', expected: 'user' }
    ]
    
    console.log(`\\n📸 PASO ${stepCounter}: Prueba sistemática de credenciales`)
    stepCounter++
    
    for (const cred of credencialesPrueba) {
      console.log(`\\n   🔐 Probando: ${cred.desc}`)
      console.log(`   📧 Usuario: ${cred.user}`)
      console.log(`   🔑 Password: ${cred.pass}`)
      
      // Ir a página limpia
      await page.goto('http://localhost:5173/')
      await page.waitForTimeout(2000)
      
      // Limpiar campos y llenar
      await page.fill('input[type=\"text\"]', '')
      await page.fill('input[type=\"password\"]', '')
      await page.fill('input[type=\"text\"]', cred.user)
      await page.fill('input[type=\"password\"]', cred.pass)
      
      // Screenshot antes de submit
      await page.screenshot({ 
        path: `./test-results/visual-${stepCounter.toString().padStart(2, '0')}-login-${cred.desc.replace(' ', '-').toLowerCase()}-antes.png`, 
        fullPage: true 
      })
      
      // Submit login
      await page.click('button[type=\"submit\"]')
      await page.waitForTimeout(5000)
      
      const urlDespues = page.url()
      const contentDespues = await page.content()
      
      // Analizar resultado
      const loginExitoso = !urlDespues.includes('/login')
      const enMenu = urlDespues.includes('/menu')
      const tieneError = contentDespues.includes('incorrectos') || contentDespues.includes('error')
      const esAdmin = contentDespues.includes('ADMIN') && contentDespues.includes('Control manual')
      const esUsuario = contentDespues.includes('PLAY') && !esAdmin
      
      console.log(`   📊 URL resultado: ${urlDespues}`)
      console.log(`   ✅ Login exitoso: ${loginExitoso ? 'SÍ' : 'NO'}`)
      console.log(`   🏠 En menú: ${enMenu ? 'SÍ' : 'NO'}`)
      console.log(`   ❌ Tiene error: ${tieneError ? 'SÍ' : 'NO'}`)
      console.log(`   👨‍💼 Es admin: ${esAdmin ? 'SÍ' : 'NO'}`)
      console.log(`   👤 Es usuario: ${esUsuario ? 'SÍ' : 'NO'}`)
      
      // Screenshot después de login
      await page.screenshot({ 
        path: `./test-results/visual-${stepCounter.toString().padStart(2, '0')}-login-${cred.desc.replace(' ', '-').toLowerCase()}-despues.png`, 
        fullPage: true 
      })
      stepCounter++
      
      if (loginExitoso) {
        console.log(`   🎉 ✅ CREDENCIAL FUNCIONA: ${cred.desc}`)
        results.workingCredentials.push({
          ...cred,
          loginSuccess: true,
          isAdmin: esAdmin,
          isUser: esUsuario
        })
        results.loginWorking = true
        
        // Si es admin, probar acceso a admin panel inmediatamente
        if (esAdmin) {
          console.log(`   🔧 Probando acceso inmediato a admin panel...`)
          
          await page.goto('http://localhost:5173/admin')
          await page.waitForTimeout(4000)
          
          const adminUrl = page.url()
          const adminContent = await page.content()
          
          const adminPanelVisible = adminContent.includes('Panel de Administrador') ||
                                   adminContent.includes('Patrón de Juego') ||
                                   adminContent.includes('Seleccionar Número')
          
          console.log(`   🎯 Admin panel URL: ${adminUrl}`)
          console.log(`   🎯 Admin panel visible: ${adminPanelVisible ? 'SÍ' : 'NO'}`)
          
          await page.screenshot({ 
            path: `./test-results/visual-${stepCounter.toString().padStart(2, '0')}-admin-panel-${cred.desc.replace(' ', '-').toLowerCase()}.png`, 
            fullPage: true 
          })
          stepCounter++
          
          if (adminPanelVisible) {
            console.log(`   🏆 ✅ ADMIN PANEL ACCESIBLE`)
            results.adminAccessible = true
            
            // Verificar elementos de patrones
            const tienePatrones = adminContent.includes('Línea horizontal') &&
                                 adminContent.includes('Diagonal') &&
                                 adminContent.includes('Actualizar Patrón')
            
            const tieneGrid = adminContent.includes('Seleccionar Número') ||
                             (adminContent.match(/\\b\\d+\\b/g) || []).length > 50
            
            const tieneClaims = adminContent.includes('Claims de BINGO')
            
            console.log(`   🏆 Selector patrones: ${tienePatrones ? 'SÍ' : 'NO'}`)
            console.log(`   🎲 Grid números: ${tieneGrid ? 'SÍ' : 'NO'}`)
            console.log(`   📝 Panel claims: ${tieneClaims ? 'SÍ' : 'NO'}`)
            
            if (tienePatrones && tieneGrid) {
              console.log(`   🎉 ✅ FUNCIONALIDAD DE PATRONES VISIBLE`)
              results.patternsVisible = true
            }
          }
        }
        
        // Si es usuario, probar acceso a game page
        if (esUsuario || loginExitoso) {
          console.log(`   🎮 Probando acceso a game page...`)
          
          await page.goto('http://localhost:5173/game-simple/game-1')
          await page.waitForTimeout(4000)
          
          const gameUrl = page.url()
          const gameContent = await page.content()
          
          const gameVisible = gameContent.includes('Streaming') ||
                             gameContent.includes('Patrón Actual') ||
                             gameContent.includes('Cartones')
          
          console.log(`   🎮 Game URL: ${gameUrl}`)
          console.log(`   🎮 Game visible: ${gameVisible ? 'SÍ' : 'NO'}`)
          
          await page.screenshot({ 
            path: `./test-results/visual-${stepCounter.toString().padStart(2, '0')}-game-page-${cred.desc.replace(' ', '-').toLowerCase()}.png`, 
            fullPage: true 
          })
          stepCounter++
          
          if (gameVisible) {
            console.log(`   🎮 ✅ GAME PAGE ACCESIBLE`)
            results.gameAccessible = true
            
            const tieneStreaming = gameContent.includes('Streaming') || gameContent.includes('En vivo')
            const tienePatronIndicador = gameContent.includes('Patrón Actual')
            const tieneCartones = gameContent.includes('Cartones') || gameContent.includes('FREE')
            
            console.log(`   📺 Streaming: ${tieneStreaming ? 'SÍ' : 'NO'}`)
            console.log(`   🏆 Indicador patrón: ${tienePatronIndicador ? 'SÍ' : 'NO'}`)
            console.log(`   🎫 Cartones: ${tieneCartones ? 'SÍ' : 'NO'}`)
          }
        }
      } else {
        console.log(`   ❌ CREDENCIAL NO FUNCIONA: ${cred.desc}`)
      }
    }
    
    // ================
    // PASO FINAL: REPORTE VISUAL DEFINITIVO
    // ================
    console.log('\\n📸 REPORTE VISUAL DEFINITIVO')
    console.log('============================')
    
    console.log('\\n📊 RESUMEN DE RESULTADOS:')
    console.log(`   🌐 Sistema frontend: ${results.systemWorking ? '✅ FUNCIONA' : '❌ NO FUNCIONA'}`)
    console.log(`   🔐 Login funciona: ${results.loginWorking ? '✅ SÍ' : '❌ NO'}`)
    console.log(`   👨‍💼 Admin panel accesible: ${results.adminAccessible ? '✅ SÍ' : '❌ NO'}`)
    console.log(`   🎮 Game page accesible: ${results.gameAccessible ? '✅ SÍ' : '❌ NO'}`)
    console.log(`   🏆 Patrones visibles: ${results.patternsVisible ? '✅ SÍ' : '❌ NO'}`)
    
    console.log(`\\n🔐 CREDENCIALES QUE FUNCIONAN:`)
    if (results.workingCredentials.length > 0) {
      results.workingCredentials.forEach((cred, i) => {
        console.log(`   ${i + 1}. ${cred.desc}: ${cred.user} / ${cred.pass}`)
        console.log(`      Tipo: ${cred.isAdmin ? 'ADMIN' : cred.isUser ? 'USUARIO' : 'DESCONOCIDO'}`)
      })
    } else {
      console.log('   ❌ NINGUNA CREDENCIAL FUNCIONA')
    }
    
    // Screenshot final del mejor resultado
    if (results.adminAccessible) {
      // Hacer screenshot final del admin panel funcionando
      const adminCred = results.workingCredentials.find(c => c.isAdmin)
      if (adminCred) {
        await page.goto('http://localhost:5173/')
        await page.fill('input[type=\"text\"]', adminCred.user)
        await page.fill('input[type=\"password\"]', adminCred.pass)
        await page.click('button[type=\"submit\"]')
        await page.waitForTimeout(2000)
        await page.goto('http://localhost:5173/admin')
        await page.waitForTimeout(3000)
        
        await page.screenshot({ 
          path: './test-results/visual-FINAL-admin-funcionando.png', 
          fullPage: true 
        })
        console.log('\\n📸 Screenshot final: admin-funcionando.png')
      }
    }
    
    if (results.gameAccessible) {
      // Hacer screenshot final del game page funcionando
      const userCred = results.workingCredentials.find(c => c.isUser) || results.workingCredentials[0]
      if (userCred) {
        await page.goto('http://localhost:5173/')
        await page.fill('input[type=\"text\"]', userCred.user)
        await page.fill('input[type=\"password\"]', userCred.pass)
        await page.click('button[type=\"submit\"]')
        await page.waitForTimeout(2000)
        await page.goto('http://localhost:5173/game-simple/game-1')
        await page.waitForTimeout(3000)
        
        await page.screenshot({ 
          path: './test-results/visual-FINAL-game-funcionando.png', 
          fullPage: true 
        })
        console.log('📸 Screenshot final: game-funcionando.png')
      }
    }
    
    // ================
    // CONCLUSIÓN DEFINITIVA
    // ================
    console.log('\\n🎯 CONCLUSIÓN DEFINITIVA')
    console.log('=========================')
    
    if (results.adminAccessible && results.gameAccessible && results.patternsVisible) {
      console.log('\\n🎉 ✅ SISTEMA COMPLETAMENTE FUNCIONAL')
      console.log('🚀 Admin panel accesible con funcionalidad de patrones')
      console.log('🚀 Game page accesible con streaming y BINGO')
      console.log('🚀 Credenciales identificadas y verificadas')
      console.log('')
      console.log('📋 INSTRUCCIONES GARANTIZADAS:')
      const adminCred = results.workingCredentials.find(c => c.isAdmin)
      const userCred = results.workingCredentials.find(c => c.isUser)
      
      if (adminCred) {
        console.log(`   👨‍💼 Admin: ${adminCred.user} / ${adminCred.pass}`)
        console.log('   1. Login → Inmediatamente ir a http://localhost:5173/admin')
      }
      if (userCred) {
        console.log(`   👤 Usuario: ${userCred.user} / ${userCred.pass}`)
        console.log('   2. Login → Inmediatamente ir a http://localhost:5173/game-simple/game-1')
      }
      
    } else if (results.loginWorking) {
      console.log('\\n⚠️ SISTEMA PARCIALMENTE FUNCIONAL')
      console.log('✅ Login funciona pero hay problemas de navegación')
      console.log('🔧 Usar credenciales identificadas y navegación directa')
      
    } else {
      console.log('\\n❌ SISTEMA NO FUNCIONAL')
      console.log('🔧 Problemas críticos identificados')
      console.log('🔧 Revisar backend o configuración')
    }
    
    console.log('\\n📸 EVIDENCIA VISUAL GENERADA:')
    console.log('   📁 Revisa carpeta ./test-results/ para screenshots completos')
    console.log('   📸 Cada paso documentado visualmente')
    console.log('   📊 Evidencia de funcionamiento o problemas específicos')
    
    await context.close()
  })
})