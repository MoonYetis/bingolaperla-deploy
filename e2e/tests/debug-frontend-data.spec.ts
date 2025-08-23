import { test, expect } from '@playwright/test';

test.describe('Debug: Datos del Frontend', () => {
  test('Inspeccionar datos que recibe el componente DashboardPage', async ({ page }) => {
    console.log('🔍 DEBUGGING DATOS DEL FRONTEND');
    console.log('===============================');
    
    // Interceptar requests para ver qué devuelve la API
    const apiCalls: { url: string; response: any }[] = [];
    
    page.route('**/api/**', async (route) => {
      const response = await route.fetch();
      const responseBody = await response.text();
      
      try {
        const jsonData = JSON.parse(responseBody);
        apiCalls.push({
          url: route.request().url(),
          response: jsonData
        });
        console.log(`📡 API Call: ${route.request().url()}`);
      } catch (e) {
        console.log(`📡 API Call (no JSON): ${route.request().url()}`);
      }
      
      route.fulfill({ response });
    });
    
    // 1. Login
    console.log('🔐 1. Login como usuario...');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
    
    await page.fill('input[type="text"]', 'usuario');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // 2. Ir al dashboard
    console.log('\n🎮 2. Navegando al dashboard...');
    await page.goto('http://localhost:5173/dashboard');
    await page.waitForTimeout(5000); // Dar tiempo para que carguen los datos
    
    // 3. Capturar información del estado del componente React
    console.log('\n📊 3. Inspeccionando estado del componente...');
    
    const componentData = await page.evaluate(() => {
      // Intentar acceder al estado de React a través del DOM
      const dashboard = document.querySelector('[data-testid="dashboard"]') || document.body;
      
      // Buscar cualquier información útil en el DOM
      const gameInfo = {
        hasNextGameSection: !!document.querySelector('.bg-white.rounded-2xl'),
        noGamesMessage: document.querySelector('h3')?.textContent?.includes('No hay juegos disponibles'),
        buttons: Array.from(document.querySelectorAll('button')).map(btn => btn.textContent?.trim()),
        textContent: document.body.textContent
      };
      
      return gameInfo;
    });
    
    console.log('📋 Estado del componente:');
    console.log(`   Sección de próximo juego visible: ${componentData.hasNextGameSection}`);
    console.log(`   Mensaje "No hay juegos": ${componentData.noGamesMessage}`);
    console.log(`   Botones encontrados: ${componentData.buttons.join(', ')}`);
    
    // 4. Mostrar las llamadas de API capturadas
    console.log('\n📡 4. Llamadas de API capturadas:');
    apiCalls.forEach((call, index) => {
      console.log(`\n${index + 1}. ${call.url}`);
      if (call.url.includes('/games')) {
        console.log('   📋 Response (games):');
        console.log('   ', JSON.stringify(call.response, null, 2));
      } else if (call.url.includes('/wallet')) {
        console.log('   💰 Response (wallet):');
        console.log('   ', JSON.stringify(call.response, null, 2));
      } else {
        console.log('   📄 Response:');
        console.log('   ', JSON.stringify(call.response, null, 2).substring(0, 200) + '...');
      }
    });
    
    // 5. Verificar qué contiene exactamente el localStorage para auth
    console.log('\n🔐 5. Verificando localStorage auth...');
    const authData = await page.evaluate(() => {
      return {
        auth_tokens: localStorage.getItem('auth_tokens'),
        auth: localStorage.getItem('auth'),
        allKeys: Object.keys(localStorage)
      };
    });
    
    console.log('   Keys en localStorage:', authData.allKeys);
    if (authData.auth_tokens) {
      console.log('   auth_tokens existe:', authData.auth_tokens.substring(0, 100) + '...');
    }
    if (authData.auth) {
      console.log('   auth existe:', authData.auth.substring(0, 100) + '...');
    }
    
    // 6. Capturar screenshot final
    await page.screenshot({ 
      path: './test-results/debug-frontend-data.png',
      fullPage: true 
    });
    
    console.log('\n✅ Debugging completado - screenshot guardado');
  });
});