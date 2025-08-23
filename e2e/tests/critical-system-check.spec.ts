import { test, expect } from '@playwright/test'

test.describe('Test: Diagnóstico Crítico del Sistema', () => {
  
  test('Verificar estado crítico del sistema', async ({ page }) => {
    console.log('🚨 DIAGNÓSTICO CRÍTICO DEL SISTEMA')
    console.log('==================================')
    
    // ================
    // PASO 1: VERIFICAR CONECTIVIDAD BÁSICA
    // ================
    console.log('\n🔍 PASO 1: Verificar conectividad básica')
    
    try {
      console.log('   Intentando conectar a http://localhost:5173...')
      
      const response = await page.goto('http://localhost:5173/', { 
        waitUntil: 'load',
        timeout: 15000 
      })
      
      console.log(`   Status de respuesta: ${response?.status() || 'Sin respuesta'}`)
      console.log(`   URL final: ${page.url()}`)
      
      await page.waitForTimeout(5000)
      
      const content = await page.textContent('body').catch(() => '')
      console.log(`   Contenido del body: "${content.substring(0, 100)}..."`)
      console.log(`   Longitud del contenido: ${content.length} caracteres`)
      
      await page.screenshot({ 
        path: './test-results/critical-01-initial-load.png', 
        fullPage: true 
      })
      
      if (content.length < 10) {
        console.log('   ❌ PROBLEMA CRÍTICO: Página vacía o no carga')
      } else {
        console.log('   ✅ Página tiene contenido')
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR DE CONEXIÓN: ${error.message}`)
      
      await page.screenshot({ 
        path: './test-results/critical-01-connection-error.png', 
        fullPage: true 
      })
    }
    
    // ================
    // PASO 2: VERIFICAR ELEMENTOS HTML
    // ================
    console.log('\n🔍 PASO 2: Verificar elementos HTML básicos')
    
    try {
      const html = await page.content()
      console.log(`   HTML length: ${html.length}`)
      
      const hasHtml = html.includes('<html')
      const hasBody = html.includes('<body')
      const hasHead = html.includes('<head')
      const hasTitle = html.includes('<title')
      const hasBingo = html.includes('BINGO') || html.includes('bingo')
      const hasLogin = html.includes('login') || html.includes('ENTRAR')
      
      console.log(`   Tiene HTML tag: ${hasHtml ? '✅' : '❌'}`)
      console.log(`   Tiene BODY tag: ${hasBody ? '✅' : '❌'}`)
      console.log(`   Tiene HEAD tag: ${hasHead ? '✅' : '❌'}`)
      console.log(`   Tiene TITLE tag: ${hasTitle ? '✅' : '❌'}`)
      console.log(`   Contiene "BINGO": ${hasBingo ? '✅' : '❌'}`)
      console.log(`   Contiene login: ${hasLogin ? '✅' : '❌'}`)
      
      if (html.length > 1000 && hasHtml && hasBody) {
        console.log('   ✅ HTML estructura básica presente')
      } else {
        console.log('   ❌ HTML estructura incompleta o corrupta')
        console.log(`   HTML snippet: ${html.substring(0, 500)}`)
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR obteniendo HTML: ${error.message}`)
    }
    
    // ================
    // PASO 3: VERIFICAR ERRORES DE CONSOLA
    // ================
    console.log('\n🔍 PASO 3: Capturar errores de consola')
    
    const consoleErrors = []
    const consoleWarnings = []
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
        console.log(`   🚨 Console Error: ${msg.text()}`)
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text())
        console.log(`   ⚠️ Console Warning: ${msg.text()}`)
      }
    })
    
    // Recargar para capturar errores
    await page.reload({ waitUntil: 'networkidle' }).catch(() => {})
    await page.waitForTimeout(3000)
    
    console.log(`   Total errores console: ${consoleErrors.length}`)
    console.log(`   Total warnings console: ${consoleWarnings.length}`)
    
    // ================
    // PASO 4: VERIFICAR NETWORK REQUESTS
    // ================
    console.log('\n🔍 PASO 4: Verificar network requests')
    
    const requests = []
    const responses = []
    
    page.on('request', request => {
      requests.push(request.url())
    })
    
    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status()
      })
    })
    
    // Hacer otra carga para capturar requests
    await page.goto('http://localhost:5173/').catch(() => {})
    await page.waitForTimeout(5000)
    
    console.log(`   Total requests: ${requests.length}`)
    console.log(`   Total responses: ${responses.length}`)
    
    const failedRequests = responses.filter(r => r.status >= 400)
    console.log(`   Failed requests: ${failedRequests.length}`)
    
    if (failedRequests.length > 0) {
      console.log('   Failed requests:')
      failedRequests.forEach(req => {
        console.log(`     ${req.status} - ${req.url}`)
      })
    }
    
    // ================
    // PASO 5: INTENTAR ACCESOS DIRECTOS
    // ================
    console.log('\n🔍 PASO 5: Intentar accesos directos')
    
    const urlsToTest = [
      'http://localhost:5173/',
      'http://localhost:5173/login',
      'http://localhost:5173/menu', 
      'http://localhost:5173/admin',
      'http://localhost:5173/game-simple/game-1'
    ]
    
    for (const url of urlsToTest) {
      try {
        console.log(`   Probando: ${url}`)
        await page.goto(url, { timeout: 10000 })
        await page.waitForTimeout(2000)
        
        const finalUrl = page.url()
        const content = await page.textContent('body').catch(() => '')
        
        console.log(`     URL final: ${finalUrl}`)
        console.log(`     Contenido length: ${content.length}`)
        console.log(`     Status: ${content.length > 10 ? '✅ Carga' : '❌ Vacío'}`)
        
        await page.screenshot({ 
          path: `./test-results/critical-url-${url.split('/').pop() || 'root'}.png`, 
          fullPage: true 
        })
        
      } catch (error) {
        console.log(`     ❌ Error: ${error.message}`)
      }
    }
    
    // ================
    // DIAGNÓSTICO FINAL
    // ================
    console.log('\n🎯 DIAGNÓSTICO FINAL')
    console.log('===================')
    
    const systemResponds = responses.length > 0
    const hasContent = (await page.textContent('body').catch(() => '')).length > 10
    const hasErrors = consoleErrors.length > 5
    
    console.log(`\n📊 ESTADO DEL SISTEMA:`)
    console.log(`   🌐 Servidor responde: ${systemResponds ? '✅' : '❌'}`)
    console.log(`   📄 Página tiene contenido: ${hasContent ? '✅' : '❌'}`)
    console.log(`   🚨 Errores críticos: ${hasErrors ? '❌ SÍ' : '✅ NO'}`)
    
    if (!systemResponds) {
      console.log('\n❌ PROBLEMA CRÍTICO: SERVIDOR NO RESPONDE')
      console.log('🔧 SOLUCIÓN:')
      console.log('   1. Verificar que el servidor esté corriendo: npm run dev')
      console.log('   2. Verificar puerto 5173 disponible: lsof -i :5173')
      console.log('   3. Reiniciar el servidor si es necesario')
      
    } else if (!hasContent) {
      console.log('\n❌ PROBLEMA CRÍTICO: PÁGINA VACÍA')
      console.log('🔧 SOLUCIÓN:')
      console.log('   1. Problema de compilación o build')
      console.log('   2. Verificar errores en npm run dev')
      console.log('   3. Limpiar cache: rm -rf node_modules/.vite')
      
    } else if (hasErrors) {
      console.log('\n⚠️ SISTEMA PARCIAL: ERRORES DE JAVASCRIPT')
      console.log('🔧 SOLUCIÓN:')
      console.log('   1. Revisar errores de consola específicos')
      console.log('   2. Posible problema de dependencias')
      
    } else {
      console.log('\n✅ SISTEMA APARENTEMENTE FUNCIONAL')
      console.log('🔧 SIGUIENTE PASO:')
      console.log('   1. Probar login manual')
      console.log('   2. Problema podría estar en autenticación')
    }
    
    console.log('\n📸 EVIDENCIA GENERADA:')
    console.log('   📁 Revisa ./test-results/ para screenshots')
    console.log('   📸 Cada URL probada documentada visualmente')
  })
})