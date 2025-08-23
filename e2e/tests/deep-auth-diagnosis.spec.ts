import { test, expect } from '@playwright/test'

test.describe('Test: Diagnóstico Profundo de Autenticación', () => {
  
  test('Analizar en detalle el flujo de autenticación', async ({ page }) => {
    console.log('🔬 DIAGNÓSTICO PROFUNDO DE AUTENTICACIÓN')
    console.log('========================================')
    
    // Capturar TODAS las requests y responses
    const allRequests = []
    const allResponses = []
    const consoleMessages = []
    
    page.on('request', request => {
      allRequests.push({
        url: request.url(),
        method: request.method(),
        headers: Object.fromEntries(Object.entries(request.headers())),
        postData: request.postData()
      })
    })
    
    page.on('response', async response => {
      let responseBody = null
      try {
        responseBody = await response.text()
      } catch (e) {
        responseBody = 'Could not read body'
      }
      
      allResponses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers(),
        body: responseBody.length > 500 ? responseBody.substring(0, 500) + '...' : responseBody
      })
    })
    
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      })
    })
    
    // ================
    // PASO 1: CARGAR PÁGINA INICIAL
    // ================
    console.log('\n📍 Paso 1: Cargar página inicial')
    
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)
    
    const initialRequests = allRequests.length
    const initialResponses = allResponses.length
    
    console.log(`🌐 Requests iniciales: ${initialRequests}`)
    console.log(`🌐 Responses iniciales: ${initialResponses}`)
    
    await page.screenshot({ path: './test-results/diagnosis-01-initial.png', fullPage: true })
    
    // ================
    // PASO 2: ANALIZAR TODAS LAS CREDENCIALES
    // ================
    const credenciales = [
      { user: 'admin@bingo-la-perla.com', pass: 'password123', desc: 'Admin email' },
      { user: 'admin', pass: 'password123', desc: 'Admin username' },
      { user: 'jugador@test.com', pass: 'password123', desc: 'User email' },
      { user: 'usuario', pass: '123456', desc: 'User old' }
    ]
    
    for (const cred of credenciales) {
      console.log(`\n📍 Analizando: ${cred.desc} (${cred.user})`)
      
      // Reset página
      await page.goto('/')
      await page.waitForTimeout(2000)
      
      const requestsBefore = allRequests.length
      const responsesBefore = allResponses.length
      
      // Llenar formulario
      await page.fill('input[type=\"text\"]', cred.user)
      await page.fill('input[type=\"password\"]', cred.pass)
      
      console.log('🔐 Formulario llenado, enviando...')
      
      // Submit
      await page.click('button[type=\"submit\"]')
      await page.waitForTimeout(5000)
      
      const requestsAfter = allRequests.length
      const responsesAfter = allResponses.length
      
      console.log(`📡 Requests generadas: ${requestsAfter - requestsBefore}`)
      console.log(`📡 Responses recibidas: ${responsesAfter - responsesBefore}`)
      
      // Analizar requests de auth específicas
      const authRequests = allRequests.slice(requestsBefore).filter(r => r.url.includes('auth') || r.url.includes('login'))
      const authResponses = allResponses.slice(responsesBefore).filter(r => r.url.includes('auth') || r.url.includes('login'))
      
      console.log(`🔐 Auth requests: ${authRequests.length}`)
      authRequests.forEach((req, i) => {
        console.log(`   ${i+1}. ${req.method} ${req.url}`)
        if (req.postData) {
          console.log(`      Body: ${req.postData}`)
        }
      })
      
      console.log(`🔐 Auth responses: ${authResponses.length}`)
      authResponses.forEach((res, i) => {
        console.log(`   ${i+1}. ${res.status} ${res.statusText} - ${res.url}`)
        if (res.body && res.body !== 'Could not read body' && res.body.length < 200) {
          console.log(`      Body: ${res.body}`)
        }
      })
      
      // Estado final
      const finalUrl = page.url()
      const finalContent = await page.content()
      
      const loginSuccess = !finalUrl.includes('/login')
      const hasError = finalContent.includes('incorrectos') || finalContent.includes('error')
      
      console.log(`📊 URL final: ${finalUrl}`)
      console.log(`📊 Login exitoso: ${loginSuccess ? '✅' : '❌'}`)
      console.log(`📊 Tiene errores: ${hasError ? '❌' : '✅'}`)
      
      // Si login exitoso, analizar storage
      if (loginSuccess) {
        const storage = await page.evaluate(() => {
          return {
            localStorage: Object.fromEntries(Object.entries(localStorage)),
            sessionStorage: Object.fromEntries(Object.entries(sessionStorage)),
            cookies: document.cookie
          }
        })
        
        console.log('💾 LocalStorage:')
        Object.entries(storage.localStorage).forEach(([key, value]) => {
          console.log(`   ${key}: ${typeof value === 'string' ? value.substring(0, 100) : value}...`)
        })
        
        console.log('💾 SessionStorage:')
        Object.entries(storage.sessionStorage).forEach(([key, value]) => {
          console.log(`   ${key}: ${typeof value === 'string' ? value.substring(0, 100) : value}...`)
        })
        
        console.log(`💾 Cookies: ${storage.cookies || 'None'}`)
        
        // Probar persistencia
        console.log('🔄 Probando persistencia...')
        await page.reload()
        await page.waitForTimeout(3000)
        
        const afterReloadUrl = page.url()
        const persistenceWorks = !afterReloadUrl.includes('/login')
        console.log(`🔄 Persistencia: ${persistenceWorks ? '✅' : '❌'}`)
        
        if (!persistenceWorks) {
          console.log('❌ Sesión se pierde al recargar')
        }
      }
      
      await page.screenshot({ 
        path: `./test-results/diagnosis-${cred.user.replace('@', '-').replace('.', '-')}.png`, 
        fullPage: true 
      })
    }
    
    // ================
    // PASO 3: ANÁLISIS DE ERRORES
    // ================
    console.log('\n📍 Paso 3: Análisis de errores y problemas')
    
    console.log(`🚨 Total console messages: ${consoleMessages.length}`)
    const errors = consoleMessages.filter(m => m.type === 'error')
    const warnings = consoleMessages.filter(m => m.type === 'warning')
    
    console.log(`🚨 Errores: ${errors.length}`)
    errors.forEach((err, i) => {
      console.log(`   ${i+1}. ${err.text}`)
    })
    
    console.log(`⚠️ Warnings: ${warnings.length}`)
    warnings.forEach((warn, i) => {
      console.log(`   ${i+1}. ${warn.text}`)
    })
    
    // ================
    // PASO 4: ANÁLISIS DE BACKEND
    // ================
    console.log('\n📍 Paso 4: Análisis de conectividad backend')
    
    const backendRequests = allRequests.filter(r => r.url.includes('3001') || r.url.includes('api'))
    const backendResponses = allResponses.filter(r => r.url.includes('3001') || r.url.includes('api'))
    
    console.log(`🔗 Backend requests: ${backendRequests.length}`)
    console.log(`🔗 Backend responses: ${backendResponses.length}`)
    
    const authEndpoints = backendResponses.filter(r => r.url.includes('auth'))
    console.log(`🔐 Auth endpoints hit: ${authEndpoints.length}`)
    
    authEndpoints.forEach((res, i) => {
      console.log(`   ${i+1}. ${res.status} ${res.url}`)
      if (res.status === 200 && res.body && !res.body.includes('html')) {
        console.log(`      Success response: ${res.body.substring(0, 200)}`)
      } else if (res.status !== 200) {
        console.log(`      Error response: ${res.body.substring(0, 200)}`)
      }
    })
    
    // ================
    // REPORTE FINAL
    // ================
    console.log('\n🎯 DIAGNÓSTICO FINAL')
    console.log('===================')
    
    const successfulLogins = authEndpoints.filter(r => r.status === 200).length
    const failedLogins = authEndpoints.filter(r => r.status !== 200).length
    
    console.log('📊 ESTADÍSTICAS:')
    console.log(`   Total requests: ${allRequests.length}`)
    console.log(`   Backend requests: ${backendRequests.length}`)
    console.log(`   Auth successful: ${successfulLogins}`)
    console.log(`   Auth failed: ${failedLogins}`)
    console.log(`   Console errors: ${errors.length}`)
    
    console.log('\n🔍 PROBLEMAS IDENTIFICADOS:')
    
    if (backendRequests.length === 0) {
      console.log('❌ CRÍTICO: No hay comunicación con backend')
      console.log('   Verificar que backend esté corriendo en puerto 3001')
    }
    
    if (successfulLogins === 0 && failedLogins > 0) {
      console.log('❌ CRÍTICO: Todas las autenticaciones fallan')
      console.log('   Verificar credenciales en base de datos')
    }
    
    if (successfulLogins > 0 && errors.length > 0) {
      console.log('⚠️ Login funciona pero hay errores de sesión')
      console.log('   Problema de persistencia de token')
    }
    
    console.log('\n📋 RECOMENDACIÓN:')
    if (successfulLogins > 0) {
      console.log('✅ Login funciona - problema de persistencia de sesión')
      console.log('🔧 Usar navegación directa después del login')
      console.log('🔧 Credenciales que funcionan identificadas')
    } else {
      console.log('❌ Problema fundamental de autenticación')
      console.log('🔧 Revisar backend y base de datos')
    }
  })
})