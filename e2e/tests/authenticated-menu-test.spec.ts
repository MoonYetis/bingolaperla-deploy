import { test, expect } from '@playwright/test'

test.describe('Authenticated Main Menu Verification', () => {
  
  test('Main Menu Pages with Mock Authentication', async ({ page }) => {
    console.log('🔍 Verificando páginas con autenticación simulada...')
    
    // Ir a la página principal
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
    
    // Simular estado de autenticación mediante localStorage
    await page.evaluate(() => {
      const mockUser = {
        id: 'test-user-1',
        email: 'test@example.com',
        username: 'TestUser',
        role: 'USER',
        balance: 50.00,
        gamesPlayed: 5,
        gamesWon: 2,
        cardsPurchased: 15
      }
      
      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: '3600'
      }
      
      const authState = {
        user: mockUser,
        tokens: mockTokens,
        isAuthenticated: true,
        isLoading: false,
        error: null
      }
      
      // Simular estado en localStorage (Redux Persist)
      localStorage.setItem('persist:auth', JSON.stringify({
        user: JSON.stringify(mockUser),
        tokens: JSON.stringify(mockTokens),
        isAuthenticated: 'true',
        isLoading: 'false',
        error: 'null',
        _persist: JSON.stringify({ version: -1, rehydrated: true })
      }))
      
      // También guardar en redux store si es posible
      if (window.__REDUX_STORE__) {
        window.__REDUX_STORE__.dispatch({
          type: 'auth/setCredentials',
          payload: { user: mockUser, tokens: mockTokens }
        })
      }
    })
    
    // Recargar la página para que tome el estado de autenticación
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)
    
    // Screenshot del estado con autenticación
    await page.screenshot({ 
      path: './test-results/11-authenticated-home.png',
      fullPage: true 
    })
    
    console.log('📊 Estado después de simular autenticación')
    
    // Verificar si ahora muestra MainMenu en lugar de Login
    const content = await page.content()
    const hasPlayButton = content.includes('PLAY') || content.includes('Play')
    const hasLoginForm = content.includes('Teléfono o Email') && content.includes('Contraseña')
    
    console.log('- Formulario de login:', hasLoginForm)
    console.log('- Botón PLAY:', hasPlayButton)
    
    // Intentar navegar directamente a cada página para verificar que se crearon
    const pagesToTest = [
      { path: '/menu', name: 'MainMenu' },
      { path: '/profile', name: 'Profile' },
      { path: '/help', name: 'Help' },
      { path: '/dashboard', name: 'Dashboard' }
    ]
    
    for (const pageInfo of pagesToTest) {
      try {
        await page.goto(`http://localhost:5173${pageInfo.path}`, { 
          waitUntil: 'networkidle',
          timeout: 10000 
        })
        
        await page.waitForTimeout(1500)
        
        await page.screenshot({ 
          path: `./test-results/12-page-${pageInfo.name.toLowerCase()}.png`,
          fullPage: true 
        })
        
        const pageContent = await page.content()
        const pageTitle = await page.title()
        
        console.log(`📍 Página ${pageInfo.name}:`)
        console.log(`  - URL: ${page.url()}`)
        console.log(`  - Título: ${pageTitle}`) 
        console.log(`  - Contiene BINGO: ${pageContent.includes('BINGO')}`)
        
        // Análisis específico por página
        if (pageInfo.name === 'MainMenu') {
          const hasMenuButtons = 
            pageContent.includes('PLAY') || 
            pageContent.includes('PERFIL') || 
            pageContent.includes('AYUDA')
          console.log(`  - Botones del menú: ${hasMenuButtons}`)
        }
        
        if (pageInfo.name === 'Profile') {
          const hasProfileElements = 
            pageContent.includes('Balance') || 
            pageContent.includes('Estadísticas') ||
            pageContent.includes('información')
          console.log(`  - Elementos de perfil: ${hasProfileElements}`)
        }
        
        if (pageInfo.name === 'Help') {
          const hasHelpSections = 
            pageContent.includes('Cómo jugar') || 
            pageContent.includes('Reglas') ||
            pageContent.includes('Premios') ||
            pageContent.includes('Consejos')
          console.log(`  - Secciones de ayuda: ${hasHelpSections}`)
        }
        
      } catch (error) {
        console.log(`⚠️ Error en página ${pageInfo.name}:`, error.message)
      }
    }
    
    // Test de responsive design en MainMenu
    await page.goto('http://localhost:5173/menu', { waitUntil: 'networkidle' })
    
    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' }
    ]
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.waitForTimeout(1000)
      
      await page.screenshot({ 
        path: `./test-results/13-menu-${viewport.name}.png`,
        fullPage: true 
      })
      
      console.log(`✅ MainMenu capturado en ${viewport.name}`)
    }
    
    console.log('✅ Verificación de páginas autenticadas completada')
  })

  test('Navigation Flow Simulation', async ({ page }) => {
    console.log('🔍 Simulando flujo de navegación completo...')
    
    // Empezar en la página principal
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
    
    // Screenshot inicial (Login)
    await page.screenshot({ 
      path: './test-results/14-flow-01-login.png',
      fullPage: true 
    })
    
    // Simular autenticación básica inyectando JavaScript
    await page.addInitScript(() => {
      // Mock básico del estado de autenticación
      window.mockAuth = true
      window.mockUser = {
        username: 'Usuario Demo',
        balance: 75.50,
        email: 'demo@bingo.com'
      }
    })
    
    // Probar navegación a diferentes rutas
    const routes = [
      { url: '/menu', name: 'menu', description: 'Menú Principal' },
      { url: '/profile', name: 'profile', description: 'Perfil de Usuario' },
      { url: '/help', name: 'help', description: 'Centro de Ayuda' },
      { url: '/dashboard', name: 'dashboard', description: 'Dashboard de Juego' }
    ]
    
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i]
      
      try {
        await page.goto(`http://localhost:5173${route.url}`, { 
          waitUntil: 'networkidle',
          timeout: 15000
        })
        
        await page.waitForTimeout(2000)
        
        await page.screenshot({ 
          path: `./test-results/14-flow-0${i + 2}-${route.name}.png`,
          fullPage: true 
        })
        
        console.log(`📱 ${route.description}: Capturado`)
        
        // Verificar elementos específicos
        const content = await page.content()
        const url = page.url()
        
        console.log(`  - URL final: ${url}`)
        console.log(`  - Contiene React: ${content.includes('id="root"')}`)
        console.log(`  - Es página de error: ${content.includes('404') || content.includes('Not Found')}`)
        
      } catch (error) {
        console.log(`⚠️ Error navegando a ${route.description}: ${error.message}`)
      }
    }
    
    console.log('✅ Simulación de flujo completada')
  })
})