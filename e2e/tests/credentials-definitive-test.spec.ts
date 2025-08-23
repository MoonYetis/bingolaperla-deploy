import { test, expect } from '@playwright/test'

test.describe('Test: Credenciales Definitivas', () => {
  
  test('Probar exhaustivamente todas las credenciales y persistencia', async ({ page }) => {
    console.log('🔐 TEST DEFINITIVO DE CREDENCIALES')
    console.log('==================================')
    
    const credenciales = [
      { user: 'admin', pass: 'password123', desc: 'Admin principal', expected: 'admin' },
      { user: 'admin@bingo-la-perla.com', pass: 'password123', desc: 'Admin email', expected: 'admin' },
      { user: 'jugador@test.com', pass: 'password123', desc: 'Usuario email', expected: 'user' },
      { user: 'usuario', pass: 'password123', desc: 'Usuario username', expected: 'user' },
      { user: 'usuario', pass: '123456', desc: 'Usuario old pass', expected: 'user' }
    ]
    
    const resultados = []
    
    for (const cred of credenciales) {
      console.log(`\n📍 Probando: ${cred.desc}`)
      console.log(`   Credenciales: ${cred.user} / ${cred.pass}`)
      
      // Ir a login limpio
      await page.goto('/', { waitUntil: 'networkidle' })
      await page.waitForTimeout(2000)
      
      // Limpiar storage previo
      await page.evaluate(() => {
        localStorage.clear()
        sessionStorage.clear()
      })
      
      // Interceptar requests de auth
      let authResponse = null
      let meResponse = null
      
      page.on('response', response => {
        if (response.url().includes('/api/auth/login')) {
          authResponse = {
            status: response.status(),
            url: response.url()
          }
        }
        if (response.url().includes('/api/auth/me')) {
          meResponse = {
            status: response.status(),
            url: response.url()
          }
        }
      })
      
      // Intentar login
      try {
        await page.fill('input[type=\"text\"]', cred.user)
        await page.fill('input[type=\"password\"]', cred.pass) 
        await page.click('button[type=\"submit\"]')
        await page.waitForTimeout(4000)
        
        const url = page.url()
        const content = await page.content()
        
        // Verificar resultado del login
        const loginExitoso = !url.includes('/login')
        const enMenu = url.includes('/menu')
        const tieneBalance = content.includes('S/') || content.includes('Balance')
        const esAdmin = content.includes('ADMIN') && content.includes('Control manual')
        const tienePlay = content.includes('PLAY')
        
        // Verificar persistencia de sesión
        const storageState = await page.evaluate(() => {
          return {
            localStorage: Object.keys(localStorage).length,
            sessionStorage: Object.keys(sessionStorage).length,
            localStorageContent: localStorage.getItem('token') || localStorage.getItem('auth') || localStorage.getItem('user'),
            cookies: document.cookie.length
          }
        })
        
        console.log(`   URL resultado: ${url}`)
        console.log(`   Login exitoso: ${loginExitoso ? '✅' : '❌'}`)
        console.log(`   En menú: ${enMenu ? '✅' : '❌'}`)
        console.log(`   Es admin: ${esAdmin ? '✅' : '❌'}`)
        console.log(`   Tiene PLAY: ${tienePlay ? '✅' : '❌'}`)
        console.log(`   Auth response: ${authResponse?.status || 'No response'}`)
        console.log(`   Me response: ${meResponse?.status || 'No response'}`)
        console.log(`   Storage items: ${storageState.localStorage + storageState.sessionStorage}`)
        console.log(`   Cookies: ${storageState.cookies > 0 ? '✅' : '❌'}`)
        
        // Screenshot del resultado
        await page.screenshot({ 
          path: `./test-results/cred-${cred.user.replace('@', '-').replace('.', '-')}.png`, 
          fullPage: true 
        })
        
        // Si login exitoso, probar persistencia
        if (loginExitoso) {
          console.log('   🔄 Probando persistencia de sesión...')
          
          // Recargar página
          await page.reload({ waitUntil: 'networkidle' })
          await page.waitForTimeout(3000)
          
          const urlDespuesReload = page.url()
          const persisteSesion = !urlDespuesReload.includes('/login')
          
          console.log(`   Sesión persiste: ${persisteSesion ? '✅' : '❌'}`)
          
          if (esAdmin && loginExitoso) {
            console.log('   🔧 Probando acceso admin panel...')
            
            try {
              await page.goto('/admin', { waitUntil: 'networkidle' })
              await page.waitForTimeout(3000)
              
              const adminUrl = page.url()
              const adminContent = await page.content()
              const adminPanelCarga = adminContent.includes('Panel de Administrador') ||
                                     adminContent.includes('Patrón de Juego') ||
                                     adminContent.includes('Seleccionar Número')
              
              console.log(`   Admin panel URL: ${adminUrl}`)
              console.log(`   Admin panel carga: ${adminPanelCarga ? '✅' : '❌'}`)
              
              if (adminPanelCarga) {
                console.log('   🏆 Verificando elementos de patrones...')
                
                const tienePatrones = adminContent.includes('Línea horizontal') &&
                                     adminContent.includes('Diagonal') &&
                                     adminContent.includes('Actualizar Patrón')
                
                const tieneGrid = adminContent.includes('Seleccionar Número') ||
                                 adminContent.includes('Grid')
                                 
                const tieneClaims = adminContent.includes('Claims de BINGO')
                
                console.log(`   Selector patrones: ${tienePatrones ? '✅' : '❌'}`)
                console.log(`   Grid números: ${tieneGrid ? '✅' : '❌'}`)
                console.log(`   Panel claims: ${tieneClaims ? '✅' : '❌'}`)
                
                await page.screenshot({ 
                  path: `./test-results/admin-panel-${cred.user.replace('@', '-').replace('.', '-')}.png`, 
                  fullPage: true 
                })
              }
            } catch (error) {
              console.log(`   ❌ Error accediendo admin: ${error.message}`)
            }
          }
        }
        
        resultados.push({
          credencial: cred,
          loginExitoso,
          enMenu,
          esAdmin,
          tienePlay,
          authStatus: authResponse?.status,
          meStatus: meResponse?.status,
          persisteSesion: loginExitoso ? persisteSesion : false,
          storageItems: storageState.localStorage + storageState.sessionStorage,
          cookies: storageState.cookies > 0
        })
        
      } catch (error) {
        console.log(`   ❌ Error en test: ${error.message}`)
        resultados.push({
          credencial: cred,
          error: error.message,
          loginExitoso: false
        })
      }
      
      // Reset para siguiente test
      authResponse = null
      meResponse = null
    }
    
    // ================
    // REPORTE FINAL
    // ================
    console.log('\n🎯 REPORTE DEFINITIVO DE CREDENCIALES')
    console.log('====================================')
    
    const credencialesExitosas = resultados.filter(r => r.loginExitoso)
    const adminFuncional = resultados.filter(r => r.esAdmin && r.loginExitoso)
    const usuarioFuncional = resultados.filter(r => r.tienePlay && r.loginExitoso)
    
    console.log('✅ CREDENCIALES QUE FUNCIONAN:')
    credencialesExitosas.forEach(r => {
      console.log(`   ${r.credencial.desc}: ${r.credencial.user} / ${r.credencial.pass}`)
      console.log(`      Tipo: ${r.esAdmin ? 'ADMIN' : 'USER'}`)
      console.log(`      Auth: ${r.authStatus} | Me: ${r.meStatus}`)
      console.log(`      Persistencia: ${r.persisteSesion ? '✅' : '❌'}`)
    })
    
    console.log(`\n📊 ESTADÍSTICAS:`)
    console.log(`   Total probadas: ${resultados.length}`)
    console.log(`   Login exitoso: ${credencialesExitosas.length}`)
    console.log(`   Admin funcional: ${adminFuncional.length}`)
    console.log(`   Usuario funcional: ${usuarioFuncional.length}`)
    
    if (adminFuncional.length > 0) {
      const mejorAdmin = adminFuncional[0]
      console.log('\n🎉 ADMIN CONFIRMADO:')
      console.log(`   Usuario: ${mejorAdmin.credencial.user}`)
      console.log(`   Password: ${mejorAdmin.credencial.pass}`)
      console.log(`   Status: ✅ FUNCIONAL`)
    }
    
    if (usuarioFuncional.length > 0) {
      const mejorUsuario = usuarioFuncional[0]
      console.log('\n🎉 USUARIO CONFIRMADO:')
      console.log(`   Usuario: ${mejorUsuario.credencial.user}`)
      console.log(`   Password: ${mejorUsuario.credencial.pass}`)
      console.log(`   Status: ✅ FUNCIONAL`)
    }
    
    if (credencialesExitosas.length === 0) {
      console.log('\n❌ PROBLEMA CRÍTICO: Ninguna credencial funciona')
      console.log('Revisar base de datos o configuración de auth')
    } else {
      console.log('\n✅ CREDENCIALES CONFIRMADAS - Sistema autenticación funciona')
    }
  })
})