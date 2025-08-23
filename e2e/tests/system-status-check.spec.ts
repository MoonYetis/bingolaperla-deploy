import { test, expect } from '@playwright/test'

test.describe('Test: Estado Completo del Sistema', () => {
  
  test('Verificar estado de backend, frontend y conectividad', async ({ page }) => {
    console.log('🔍 VERIFICACIÓN COMPLETA DEL SISTEMA')
    console.log('===================================')
    
    // ================
    // PASO 1: VERIFICAR FRONTEND
    // ================
    console.log('\n📍 Paso 1: Estado del Frontend')
    
    try {
      await page.goto('/', { timeout: 30000 })
      await page.waitForTimeout(3000)
      
      const url = page.url()
      const content = await page.content()
      const title = await page.title()
      
      console.log(`🌐 URL cargada: ${url}`)
      console.log(`🌐 Título página: ${title}`)
      console.log(`🌐 Contiene login form: ${content.includes('ENTRAR') ? '✅' : '❌'}`)
      console.log(`🌐 Contiene BINGO LA PERLA: ${content.includes('BINGO LA PERLA') ? '✅' : '❌'}`)
      console.log(`🌐 CSS cargado: ${content.includes('text-') || content.includes('bg-') ? '✅' : '❌'}`)
      
      await page.screenshot({ path: './test-results/system-01-frontend.png', fullPage: true })
      
      if (content.includes('ENTRAR') && content.includes('BINGO LA PERLA')) {
        console.log('✅ Frontend funcionando correctamente')
      } else {
        console.log('❌ Frontend tiene problemas de carga')
      }
      
    } catch (error) {
      console.log(`❌ Error cargando frontend: ${error.message}`)
    }
    
    // ================
    // PASO 2: VERIFICAR BACKEND CONECTIVIDAD
    // ================
    console.log('\n📍 Paso 2: Conectividad con Backend')
    
    // Interceptar requests para ver si backend responde
    let backendRequests = []
    let authAttempts = []
    
    page.on('response', response => {
      if (response.url().includes('3001') || response.url().includes('api')) {
        backendRequests.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        })
        console.log(`🔗 Backend request: ${response.status()} ${response.url()}`)
      }
    })
    
    page.on('request', request => {
      if (request.url().includes('login') || request.url().includes('auth')) {
        authAttempts.push({
          url: request.url(),
          method: request.method(),
          postData: request.postData()
        })
        console.log(`🔐 Auth request: ${request.method()} ${request.url()}`)
      }
    })
    
    // ================
    // PASO 3: PROBAR LOGIN PARA GENERAR REQUESTS
    // ================
    console.log('\n📍 Paso 3: Probar Login para Conectividad')
    
    try {
      await page.fill('input[type=\"text\"]', 'admin')
      await page.fill('input[type=\"password\"]', 'password123')
      
      console.log('🔐 Credenciales ingresadas, enviando...')
      
      await page.click('button[type=\"submit\"]')
      await page.waitForTimeout(5000)
      
      const postLoginUrl = page.url()
      const postLoginContent = await page.content()
      
      console.log(`🔐 URL después de login: ${postLoginUrl}`)
      console.log(`🔐 Login exitoso: ${!postLoginUrl.includes('/login') ? '✅' : '❌'}`)
      
      // Verificar errores específicos
      const hasAuthError = postLoginContent.includes('incorrectos') || 
                          postLoginContent.includes('error') ||
                          postLoginContent.includes('failed')
      
      console.log(`🔐 Errores de auth visibles: ${hasAuthError ? '❌' : '✅'}`)
      
      await page.screenshot({ path: './test-results/system-02-login-attempt.png', fullPage: true })
      
    } catch (error) {
      console.log(`❌ Error en login test: ${error.message}`)
    }
    
    // ================
    // PASO 4: ANALIZAR REQUESTS
    // ================
    console.log('\n📍 Paso 4: Análisis de Requests')
    
    console.log(`🔗 Total backend requests: ${backendRequests.length}`)
    backendRequests.forEach((req, i) => {
      console.log(`   ${i+1}. ${req.status} ${req.statusText} - ${req.url}`)
    })
    
    console.log(`🔐 Total auth attempts: ${authAttempts.length}`)
    authAttempts.forEach((req, i) => {
      console.log(`   ${i+1}. ${req.method} ${req.url}`)
      if (req.postData) {
        try {
          const postData = JSON.parse(req.postData)
          console.log(`      Data: ${JSON.stringify(postData)}`)
        } catch {
          console.log(`      Data: ${req.postData}`)
        }
      }
    })
    
    // ================
    // PASO 5: VERIFICAR RECURSOS
    // ================
    console.log('\n📍 Paso 5: Verificar Carga de Recursos')
    
    const performance = await page.evaluate(() => {
      const entries = performance.getEntriesByType('navigation')
      const resources = performance.getEntriesByType('resource')
      
      return {
        navigation: entries[0] ? {
          loadEventEnd: entries[0].loadEventEnd,
          domContentLoadedEventEnd: entries[0].domContentLoadedEventEnd
        } : null,
        resourceCount: resources.length,
        failedResources: resources.filter(r => r.transferSize === 0).length
      }
    })
    
    console.log(`⚡ Tiempo de carga DOM: ${performance.navigation?.domContentLoadedEventEnd}ms`)
    console.log(`⚡ Tiempo de carga completa: ${performance.navigation?.loadEventEnd}ms`)
    console.log(`📦 Recursos cargados: ${performance.resourceCount}`)
    console.log(`❌ Recursos fallidos: ${performance.failedResources}`)
    
    // ================
    // PASO 6: VERIFICAR ERRORES DE CONSOLE
    // ================
    console.log('\n📍 Paso 6: Errores de Console')
    
    const consoleErrors = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
        console.log(`🚨 Console Error: ${msg.text()}`)
      }
    })
    
    // Recargar para capturar errores
    await page.reload()
    await page.waitForTimeout(3000)
    
    console.log(`🚨 Total errores console: ${consoleErrors.length}`)
    
    // ================
    // PASO 7: VERIFICAR LOCAL STORAGE Y COOKIES
    // ================
    console.log('\n📍 Paso 7: Estado de Sesión')
    
    const sessionState = await page.evaluate(() => {
      return {
        localStorage: Object.keys(localStorage).map(key => ({
          key,
          value: localStorage.getItem(key)?.substring(0, 100) + '...'
        })),
        cookies: document.cookie,
        userAgent: navigator.userAgent
      }
    })
    
    console.log(`🍪 LocalStorage items: ${sessionState.localStorage.length}`)
    sessionState.localStorage.forEach(item => {
      console.log(`   ${item.key}: ${item.value}`)
    })
    
    console.log(`🍪 Cookies: ${sessionState.cookies || 'No cookies'}`)
    
    // ================
    // REPORTE DE ESTADO
    // ================
    console.log('\n🎯 REPORTE DE ESTADO DEL SISTEMA')
    console.log('================================')
    
    const frontendOk = page.url().includes('localhost:5173')
    const backendReachable = backendRequests.length > 0
    const authWorking = backendRequests.some(req => req.url.includes('auth') && req.status === 200)
    const noMajorErrors = consoleErrors.length < 5
    
    console.log('✅ ESTADO GENERAL:')
    console.log(`   Frontend accesible: ${frontendOk ? '✅' : '❌'}`)
    console.log(`   Backend alcanzable: ${backendReachable ? '✅' : '❌'}`)
    console.log(`   Auth endpoint: ${authWorking ? '✅' : '❌'}`)
    console.log(`   Sin errores críticos: ${noMajorErrors ? '✅' : '❌'}`)
    
    console.log('\n📊 ESTADÍSTICAS:')
    console.log(`   Requests backend: ${backendRequests.length}`)
    console.log(`   Attempts auth: ${authAttempts.length}`)
    console.log(`   Console errors: ${consoleErrors.length}`)
    console.log(`   Resources loaded: ${performance.resourceCount}`)
    
    const systemHealth = [frontendOk, backendReachable, noMajorErrors].filter(Boolean).length
    
    if (systemHealth >= 2) {
      console.log('\n✅ SISTEMA SALUDABLE - Backend y Frontend funcionando')
      console.log('El problema probablemente está en credenciales o navegación')
    } else {
      console.log('\n⚠️ PROBLEMAS DE SISTEMA DETECTADOS')
      console.log('Revisar conectividad backend o configuración frontend')
    }
  })
})