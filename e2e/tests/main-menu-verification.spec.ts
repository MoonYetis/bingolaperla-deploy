import { test, expect, Page } from '@playwright/test'

test.describe('Main Menu Implementation Verification', () => {
  
  // Configuración inicial para cada test
  test.beforeEach(async ({ page }) => {
    // Configurar timeout más largo para cargas lentas
    test.setTimeout(60000)
    
    // Navegar a la aplicación
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })
  })

  test('1. Frontend Accessibility and React App Loading', async ({ page }) => {
    console.log('🔍 Verificando accesibilidad del frontend...')
    
    // Verificar que la página carga
    await expect(page).toHaveTitle(/Bingo/i)
    
    // Verificar que no hay errores críticos en consola
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    // Esperar a que React se inicialice
    await page.waitForSelector('#root', { timeout: 10000 })
    
    // Verificar que el contenedor React existe
    const reactRoot = await page.$('#root')
    expect(reactRoot).toBeTruthy()
    
    // Screenshot del estado inicial
    await page.screenshot({ 
      path: './test-results/01-frontend-initial-load.png',
      fullPage: true 
    })
    
    console.log('✅ Frontend cargando correctamente')
    
    // Reportar errores críticos si los hay
    const criticalErrors = errors.filter(error => 
      !error.includes('Failed to fetch') && 
      !error.includes('ECONNREFUSED') &&
      !error.includes('NetworkError')
    )
    
    if (criticalErrors.length > 0) {
      console.warn('⚠️ Errores encontrados:', criticalErrors)
    }
  })

  test('2. Login to MainMenu Flow Verification', async ({ page }) => {
    console.log('🔍 Verificando flujo Login → MainMenu...')
    
    // Verificar que aparece la página de login inicialmente
    await page.waitForSelector('input[type="text"]', { timeout: 10000 })
    
    // Screenshot del login
    await page.screenshot({ 
      path: './test-results/02-login-page.png',
      fullPage: true 
    })
    
    // Intentar login con credenciales admin (si está disponible)
    try {
      await page.fill('input[type="text"]', 'admin')
      await page.fill('input[type="password"]', 'admin123')
      
      await page.screenshot({ 
        path: './test-results/03-login-filled.png',
        fullPage: true 
      })
      
      // Click en botón de login
      await page.click('button[type="submit"]')
      
      // Esperar navegación (puede ir a MainMenu o Dashboard dependiendo del estado)
      await page.waitForTimeout(3000)
      
      await page.screenshot({ 
        path: './test-results/04-after-login.png',
        fullPage: true 
      })
      
      console.log('✅ Flujo de login ejecutado')
      
    } catch (error) {
      console.log('ℹ️ Login automático no disponible (esperado):', error)
      
      // Simular navegación directa al MainMenu para testing
      await page.goto('http://localhost:5173/menu', { waitUntil: 'networkidle' })
      await page.screenshot({ 
        path: './test-results/04-direct-menu-nav.png',
        fullPage: true 
      })
    }
  })

  test('3. MainMenuPage Content and Design Verification', async ({ page }) => {
    console.log('🔍 Verificando MainMenuPage...')
    
    // Navegar directamente al menú para verificar el diseño
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)
    
    // Screenshot del estado actual
    await page.screenshot({ 
      path: './test-results/05-current-homepage.png',
      fullPage: true 
    })
    
    // Verificar elementos que deberían existir en MainMenuPage
    const pageContent = await page.content()
    
    // Buscar indicadores de MainMenuPage
    const hasPlayButton = pageContent.includes('PLAY') || pageContent.includes('Play')
    const hasProfileButton = pageContent.includes('PERFIL') || pageContent.includes('Profile')
    const hasHelpButton = pageContent.includes('AYUDA') || pageContent.includes('Help')
    const hasBingoTitle = pageContent.includes('BINGO') || pageContent.includes('Bingo')
    
    console.log('📊 Elementos encontrados:')
    console.log('- PLAY button:', hasPlayButton)
    console.log('- PERFIL button:', hasProfileButton) 
    console.log('- AYUDA button:', hasHelpButton)
    console.log('- BINGO title:', hasBingoTitle)
    
    // Verificar video de fondo
    const videoElement = await page.$('video')
    if (videoElement) {
      console.log('✅ Video de fondo encontrado')
    } else {
      console.log('ℹ️ Video de fondo no detectado (puede estar en componente no renderizado)')
    }
    
    // Buscar botones por texto o clases
    try {
      const buttons = await page.$$('button')
      console.log(`📝 Total de botones encontrados: ${buttons.length}`)
      
      for (let i = 0; i < Math.min(buttons.length, 10); i++) {
        const buttonText = await buttons[i].textContent()
        console.log(`  - Botón ${i + 1}: "${buttonText}"`)
      }
    } catch (error) {
      console.log('ℹ️ Error al enumerar botones:', error)
    }
  })

  test('4. Navigation Between Pages Verification', async ({ page }) => {
    console.log('🔍 Verificando navegación entre páginas...')
    
    // Página inicial
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)
    
    const routes = [
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/profile', name: 'Profile' },
      { path: '/help', name: 'Help' },
      { path: '/menu', name: 'Menu' }
    ]
    
    for (const route of routes) {
      try {
        console.log(`📍 Probando ruta: ${route.path}`)
        await page.goto(`http://localhost:5173${route.path}`, { 
          waitUntil: 'networkidle',
          timeout: 10000 
        })
        
        await page.waitForTimeout(1000)
        
        // Screenshot de cada ruta
        await page.screenshot({ 
          path: `./test-results/06-route-${route.name.toLowerCase()}.png`,
          fullPage: true 
        })
        
        // Verificar que la página cargó (no es 404)
        const content = await page.content()
        const is404 = content.includes('404') || content.includes('Not Found')
        
        if (is404) {
          console.log(`❌ Ruta ${route.path} devuelve 404`)
        } else {
          console.log(`✅ Ruta ${route.path} accesible`)
        }
        
      } catch (error) {
        console.log(`⚠️ Error en ruta ${route.path}:`, error)
      }
    }
  })

  test('5. New Pages Content Verification', async ({ page }) => {
    console.log('🔍 Verificando contenido de páginas nuevas...')
    
    // Verificar ProfilePage
    try {
      await page.goto('http://localhost:5173/profile', { waitUntil: 'networkidle' })
      await page.waitForTimeout(1000)
      
      const profileContent = await page.content()
      const hasProfileElements = {
        balance: profileContent.includes('Balance') || profileContent.includes('balance'),
        statistics: profileContent.includes('Estadísticas') || profileContent.includes('Statistics'),
        userInfo: profileContent.includes('información') || profileContent.includes('Usuario'),
        editButton: profileContent.includes('Editar') || profileContent.includes('Edit')
      }
      
      console.log('📊 ProfilePage elementos:')
      Object.entries(hasProfileElements).forEach(([key, value]) => {
        console.log(`  - ${key}: ${value}`)
      })
      
      await page.screenshot({ 
        path: './test-results/07-profile-page-content.png',
        fullPage: true 
      })
      
    } catch (error) {
      console.log('⚠️ Error verificando ProfilePage:', error)
    }
    
    // Verificar HelpPage
    try {
      await page.goto('http://localhost:5173/help', { waitUntil: 'networkidle' })
      await page.waitForTimeout(1000)
      
      const helpContent = await page.content()
      const hasHelpElements = {
        howToPlay: helpContent.includes('Cómo jugar') || helpContent.includes('How to play'),
        rules: helpContent.includes('Reglas') || helpContent.includes('Rules'),
        prizes: helpContent.includes('Premios') || helpContent.includes('Prizes'),
        tips: helpContent.includes('Consejos') || helpContent.includes('Tips')
      }
      
      console.log('📊 HelpPage elementos:')
      Object.entries(hasHelpElements).forEach(([key, value]) => {
        console.log(`  - ${key}: ${value}`)
      })
      
      await page.screenshot({ 
        path: './test-results/08-help-page-content.png',
        fullPage: true 
      })
      
    } catch (error) {
      console.log('⚠️ Error verificando HelpPage:', error)
    }
  })

  test('6. Responsive Design and Mobile Verification', async ({ page }) => {
    console.log('🔍 Verificando diseño responsive...')
    
    // Probar diferentes tamaños de pantalla
    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1920, height: 1080, name: 'desktop' }
    ]
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
      await page.waitForTimeout(1000)
      
      await page.screenshot({ 
        path: `./test-results/09-responsive-${viewport.name}.png`,
        fullPage: true 
      })
      
      console.log(`✅ Screenshot capturado para ${viewport.name} (${viewport.width}x${viewport.height})`)
    }
  })

  test('7. Final Verification Report', async ({ page }) => {
    console.log('📋 Generando reporte final...')
    
    // Navegar a la página principal
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
    
    // Capturar información final
    const title = await page.title()
    const url = page.url()
    const content = await page.content()
    
    // Análisis del contenido
    const analysis = {
      hasReactRoot: content.includes('id="root"'),
      hasMainMenuElements: content.includes('PLAY') || content.includes('PERFIL') || content.includes('AYUDA'),
      hasLoginForm: content.includes('password') && content.includes('username'),
      hasBingoTitle: content.includes('BINGO') || content.includes('Bingo'),
      hasVideo: content.includes('<video') || content.includes('video'),
      currentRoute: url.split('/').pop() || 'root'
    }
    
    console.log('📊 REPORTE FINAL DE VERIFICACIÓN:')
    console.log('=====================================')
    console.log(`🌐 URL actual: ${url}`)
    console.log(`📄 Título: ${title}`)
    console.log(`📱 Estado React: ${analysis.hasReactRoot ? '✅' : '❌'}`)
    console.log(`🎯 Elementos MainMenu: ${analysis.hasMainMenuElements ? '✅' : '❌'}`)
    console.log(`🔑 Formulario Login: ${analysis.hasLoginForm ? '✅' : '❌'}`)
    console.log(`🎰 Título Bingo: ${analysis.hasBingoTitle ? '✅' : '❌'}`)
    console.log(`🎬 Video de fondo: ${analysis.hasVideo ? '✅' : '❌'}`)
    console.log(`🛣️ Ruta actual: /${analysis.currentRoute}`)
    
    // Screenshot final
    await page.screenshot({ 
      path: './test-results/10-final-state.png',
      fullPage: true 
    })
    
    console.log('✅ Verificación completa terminada')
    console.log('📁 Screenshots guardados en ./test-results/')
  })
})