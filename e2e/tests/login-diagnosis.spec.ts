import { test, expect } from '@playwright/test'

test.describe('Login Diagnosis and Testing', () => {
  
  test('Comprehensive Login Testing with Error Capture', async ({ page }) => {
    console.log('🔍 Diagnosticando sistema de login...')
    
    // Capturar errores de consola
    const consoleErrors: string[] = []
    const networkErrors: string[] = []
    const requests: any[] = []
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
        console.log('❌ Console Error:', msg.text())
      }
    })
    
    page.on('response', async (response) => {
      const url = response.url()
      const status = response.status()
      
      if (url.includes('/api/')) {
        const requestInfo = {
          url,
          status,
          method: response.request().method(),
          headers: await response.allHeaders()
        }
        requests.push(requestInfo)
        console.log(`📡 API Request: ${requestInfo.method} ${url} → ${status}`)
        
        if (status >= 400) {
          try {
            const errorBody = await response.text()
            networkErrors.push(`${url}: ${status} - ${errorBody}`)
            console.log(`❌ API Error: ${status} - ${errorBody}`)
          } catch (e) {
            networkErrors.push(`${url}: ${status} - Could not read error body`)
          }
        }
      }
    })
    
    // Ir a la aplicación
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
    
    // Screenshot inicial
    await page.screenshot({ 
      path: './test-results/login-01-initial.png',
      fullPage: true 
    })
    
    // Verificar que estamos en login
    await expect(page).toHaveTitle(/Bingo/i)
    
    const isLoginPage = await page.locator('input[type="password"]').count() > 0
    console.log(`📍 ¿Estamos en login?: ${isLoginPage}`)
    
    if (!isLoginPage) {
      console.log('❌ No se encontró formulario de login')
      return
    }
    
    // Probar diferentes credenciales conocidas
    const credentialSets = [
      { user: 'admin', pass: 'admin123', name: 'Admin Default' },
      { user: 'admin', pass: 'admin', name: 'Admin Simple' },
      { user: 'test', pass: 'test123', name: 'Test User' },
      { user: 'demo@bingo.com', pass: 'demo123', name: 'Demo Email' },
      { user: 'user@example.com', pass: 'password', name: 'Example User' }
    ]
    
    for (let i = 0; i < credentialSets.length; i++) {
      const creds = credentialSets[i]
      console.log(`\n📝 Probando credenciales: ${creds.name} (${creds.user})`)
      
      // Limpiar campos
      await page.fill('input[type="text"]', '')
      await page.fill('input[type="password"]', '')
      
      // Llenar credenciales
      await page.fill('input[type="text"]', creds.user)
      await page.fill('input[type="password"]', creds.pass)
      
      // Screenshot antes de enviar
      await page.screenshot({ 
        path: `./test-results/login-02-creds-${i + 1}-filled.png`,
        fullPage: true 
      })
      
      // Intentar login
      const loginPromise = page.waitForResponse(response => 
        response.url().includes('/api/auth/login') && response.request().method() === 'POST',
        { timeout: 10000 }
      ).catch(() => null)
      
      await page.click('button[type="submit"]')
      
      // Esperar respuesta del servidor
      const loginResponse = await loginPromise
      
      if (loginResponse) {
        const status = loginResponse.status()
        console.log(`📡 Login response: ${status}`)
        
        try {
          const responseBody = await loginResponse.text()
          console.log(`📄 Response body:`, responseBody.substring(0, 200))
          
          if (status === 200) {
            console.log('✅ Login exitoso!')
            
            // Esperar navegación
            await page.waitForTimeout(2000)
            
            await page.screenshot({ 
              path: `./test-results/login-03-success-${i + 1}.png`,
              fullPage: true 
            })
            
            // Verificar a dónde fuimos
            const currentUrl = page.url()
            console.log(`🌐 URL después del login: ${currentUrl}`)
            
            // Verificar si vemos el MainMenu
            const content = await page.content()
            const hasMainMenu = content.includes('PLAY') || content.includes('PERFIL') || content.includes('AYUDA')
            const hasDashboard = content.includes('Dashboard') || content.includes('Balance')
            
            console.log(`🎯 ¿Vemos MainMenu?: ${hasMainMenu}`)
            console.log(`📊 ¿Vemos Dashboard?: ${hasDashboard}`)
            
            if (hasMainMenu) {
              console.log('🎉 ¡MainMenu visible! Login funcionando correctamente')
              
              // Probar navegación a cada sección
              const menuButtons = [
                { text: 'PLAY', expected: '/dashboard' },
                { text: 'PERFIL', expected: '/profile' },
                { text: 'AYUDA', expected: '/help' }
              ]
              
              for (const button of menuButtons) {
                try {
                  const buttonElement = await page.locator(`text=${button.text}`).first()
                  if (await buttonElement.count() > 0) {
                    await buttonElement.click()
                    await page.waitForTimeout(1000)
                    
                    await page.screenshot({ 
                      path: `./test-results/login-04-${button.text.toLowerCase()}.png`,
                      fullPage: true 
                    })
                    
                    console.log(`✅ Navegación a ${button.text} exitosa`)
                    
                    // Volver al menú principal
                    await page.goto('http://localhost:5173/menu')
                    await page.waitForTimeout(1000)
                  }
                } catch (error) {
                  console.log(`⚠️ Error navegando a ${button.text}:`, error.message)
                }
              }
            }
            
            // Si llegamos aquí, el login funcionó
            return
            
          } else {
            console.log(`❌ Login falló con status: ${status}`)
            console.log(`📄 Error body: ${responseBody}`)
          }
          
        } catch (error) {
          console.log(`⚠️ Error leyendo respuesta:`, error.message)
        }
      } else {
        console.log('❌ No se recibió respuesta del servidor')
      }
      
      // Screenshot después del intento
      await page.screenshot({ 
        path: `./test-results/login-02-creds-${i + 1}-result.png`,
        fullPage: true 
      })
      
      // Esperar un poco antes del siguiente intento
      await page.waitForTimeout(1000)
    }
    
    // Reporte final
    console.log('\n📊 REPORTE DE DIAGNÓSTICO:')
    console.log('=================================')
    console.log(`🖥️ Errores de consola: ${consoleErrors.length}`)
    consoleErrors.forEach(error => console.log(`  - ${error}`))
    
    console.log(`🌐 Errores de red: ${networkErrors.length}`)
    networkErrors.forEach(error => console.log(`  - ${error}`))
    
    console.log(`📡 Requests API realizados: ${requests.length}`)
    requests.forEach(req => console.log(`  - ${req.method} ${req.url} → ${req.status}`))
    
    if (requests.length === 0) {
      console.log('❌ PROBLEMA: No se realizaron requests a la API')
      console.log('   Posibles causas:')
      console.log('   - Frontend no está enviando requests')
      console.log('   - Problema de CORS')
      console.log('   - URL de API incorrecta')
    }
    
    console.log('\n🔧 SUGERENCIAS:')
    if (networkErrors.length > 0) {
      console.log('- Verificar conectividad backend-frontend')
      console.log('- Revisar configuración de CORS')
    }
    if (consoleErrors.length > 0) {
      console.log('- Revisar errores de JavaScript en frontend')
    }
    if (requests.some(r => r.status === 401)) {
      console.log('- Verificar credenciales en base de datos')
      console.log('- Comprobar hash de contraseñas')
    }
    if (requests.some(r => r.status === 500)) {
      console.log('- Revisar logs del servidor backend')
      console.log('- Verificar conexión a base de datos')
    }
  })

  test('Database User Verification', async ({ page }) => {
    console.log('🔍 Verificando usuarios en base de datos...')
    
    // Hacer request directo al endpoint de usuarios (si existe)
    const response = await page.request.get('http://localhost:3001/health')
    const healthData = await response.json()
    console.log('🏥 Backend health:', healthData)
    
    // Intentar verificar si hay un endpoint para listar usuarios
    try {
      const usersResponse = await page.request.get('http://localhost:3001/api/auth/debug-users')
      if (usersResponse.ok()) {
        const users = await usersResponse.json()
        console.log('👥 Usuarios encontrados:', users)
      } else {
        console.log('ℹ️ No hay endpoint de debug users (normal)')
      }
    } catch (error) {
      console.log('ℹ️ Endpoint debug-users no disponible')
    }
    
    // Verificar si podemos hacer un request de registro para crear un usuario de prueba
    try {
      const testUser = {
        email: 'test@bingo.com',
        username: 'testuser',
        password: 'test123',
        confirmPassword: 'test123'
      }
      
      const registerResponse = await page.request.post('http://localhost:3001/api/auth/register', {
        data: testUser
      })
      
      const registerStatus = registerResponse.status()
      console.log(`📝 Intento de registro: ${registerStatus}`)
      
      if (registerStatus === 201 || registerStatus === 200) {
        const registerData = await registerResponse.json()
        console.log('✅ Usuario de prueba creado:', registerData.message)
        
        // Ahora intentar login con este usuario
        await page.goto('http://localhost:5173/')
        await page.fill('input[type="text"]', 'testuser')
        await page.fill('input[type="password"]', 'test123')
        
        await page.screenshot({ 
          path: './test-results/login-05-new-user-attempt.png',
          fullPage: true 
        })
        
        await page.click('button[type="submit"]')
        await page.waitForTimeout(2000)
        
        await page.screenshot({ 
          path: './test-results/login-06-new-user-result.png',
          fullPage: true 
        })
        
        const currentUrl = page.url()
        console.log(`🌐 URL después de login con nuevo usuario: ${currentUrl}`)
        
      } else {
        const errorBody = await registerResponse.text()
        console.log(`❌ Registro falló: ${registerStatus} - ${errorBody}`)
      }
      
    } catch (error) {
      console.log('⚠️ Error en verificación de usuarios:', error.message)
    }
  })
})