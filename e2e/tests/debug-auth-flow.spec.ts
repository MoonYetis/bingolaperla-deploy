import { test, expect } from '@playwright/test';

test.describe('Debug: Flujo de Autenticación', () => {
  test('Debuggear problemas de autenticación en dashboard', async ({ page }) => {
    console.log('🔐 DEBUGGING FLUJO DE AUTENTICACIÓN');
    console.log('==================================');
    
    // 1. Login con debugging de cada paso
    console.log('1. 🔑 Proceso de login...');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
    
    // Verificar estado antes de login
    const beforeLoginState = await page.evaluate(() => ({
      url: window.location.href,
      localStorage: {
        auth_tokens: localStorage.getItem('auth_tokens'),
        auth: localStorage.getItem('auth'),
        allKeys: Object.keys(localStorage)
      }
    }));
    
    console.log(`   URL inicial: ${beforeLoginState.url}`);
    console.log(`   localStorage keys: ${beforeLoginState.localStorage.allKeys.join(', ')}`);
    
    // Llenar formulario de login
    await page.fill('input[type="text"]', 'usuario');
    await page.fill('input[type="password"]', 'password123');
    
    console.log('   📋 Campos llenados, haciendo click en submit...');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Verificar estado después de login
    const afterLoginState = await page.evaluate(() => ({
      url: window.location.href,
      localStorage: {
        auth_tokens: localStorage.getItem('auth_tokens'),
        auth: localStorage.getItem('auth'),
        allKeys: Object.keys(localStorage)
      }
    }));
    
    console.log(`   URL después login: ${afterLoginState.url}`);
    console.log(`   localStorage keys: ${afterLoginState.localStorage.allKeys.join(', ')}`);
    console.log(`   auth_tokens existe: ${!!afterLoginState.localStorage.auth_tokens}`);
    
    if (afterLoginState.localStorage.auth_tokens) {
      try {
        const tokenData = JSON.parse(afterLoginState.localStorage.auth_tokens);
        console.log(`   Token preview: ${tokenData.accessToken?.substring(0, 50)}...`);
      } catch (e) {
        console.log(`   Error parsing token: ${e}`);
      }
    }
    
    // 2. Navegación directa a dashboard
    console.log('\n2. 🎮 Navegando a dashboard...');
    
    await page.goto('http://localhost:5173/dashboard');
    await page.waitForTimeout(2000);
    
    const dashboardState1 = await page.evaluate(() => ({
      url: window.location.href,
      title: document.title,
      hasAuthTokens: !!localStorage.getItem('auth_tokens')
    }));
    
    console.log(`   URL después navegar: ${dashboardState1.url}`);
    console.log(`   Title: ${dashboardState1.title}`);
    console.log(`   Tiene auth tokens: ${dashboardState1.hasAuthTokens}`);
    
    // Esperar más tiempo para ver si hay redirecciones
    await page.waitForTimeout(3000);
    
    const dashboardState2 = await page.evaluate(() => ({
      url: window.location.href,
      bodyText: document.body.textContent?.substring(0, 200)
    }));
    
    console.log(`   URL final: ${dashboardState2.url}`);
    console.log(`   Contenido body: ${dashboardState2.bodyText}`);
    
    // 3. Verificar si está en dashboard o en menu
    if (dashboardState2.url.includes('/dashboard')) {
      console.log('   ✅ Permaneció en dashboard');
      
      // Buscar elementos específicos del dashboard
      console.log('\n3. 🔍 Inspeccionando contenido del dashboard...');
      
      const dashboardContent = await page.evaluate(() => {
        return {
          hasProximoJuego: !!document.querySelector('*')?.textContent?.includes('PRÓXIMO JUEGO'),
          hasNoJuegosDisponibles: !!document.querySelector('*')?.textContent?.includes('No hay juegos disponibles'),
          hasPerlas: !!document.querySelector('*')?.textContent?.includes('Perlas'),
          hasComprarCartones: !!document.querySelector('*')?.textContent?.includes('COMPRAR CARTONES'),
          allText: document.body.textContent
        };
      });
      
      console.log(`   Tiene "PRÓXIMO JUEGO": ${dashboardContent.hasProximoJuego}`);
      console.log(`   Tiene "No hay juegos disponibles": ${dashboardContent.hasNoJuegosDisponibles}`);
      console.log(`   Tiene "Perlas": ${dashboardContent.hasPerlas}`);
      console.log(`   Tiene "COMPRAR CARTONES": ${dashboardContent.hasComprarCartones}`);
      
    } else {
      console.log('   ❌ Fue redirigido fuera del dashboard');
      console.log('   🔄 Esto indica un problema de autenticación');
    }
    
    // 4. Verificar requests de API
    console.log('\n4. 📡 Verificando requests de API...');
    
    // Interceptar requests
    const apiRequests: { url: string, status: number, response: any }[] = [];
    
    page.route('**/api/**', async (route) => {
      try {
        const response = await route.fetch();
        const responseBody = await response.text();
        
        let parsedResponse;
        try {
          parsedResponse = JSON.parse(responseBody);
        } catch {
          parsedResponse = responseBody.substring(0, 100) + '...';
        }
        
        apiRequests.push({
          url: route.request().url(),
          status: response.status(),
          response: parsedResponse
        });
        
        route.fulfill({ response });
      } catch (error) {
        console.log(`   ❌ Error en request ${route.request().url()}: ${error}`);
        route.continue();
      }
    });
    
    // Recargar dashboard para capturar requests
    await page.reload();
    await page.waitForTimeout(5000);
    
    console.log(`   Total requests capturados: ${apiRequests.length}`);
    apiRequests.forEach((req, index) => {
      console.log(`   ${index + 1}. ${req.url} - Status: ${req.status}`);
      if (req.status !== 200) {
        console.log(`      ❌ Error response: ${JSON.stringify(req.response).substring(0, 100)}`);
      }
    });
    
    // Screenshot final
    await page.screenshot({ 
      path: './test-results/debug-auth-flow.png',
      fullPage: true 
    });
    
    console.log('\n✅ Debugging de autenticación completado');
  });
});