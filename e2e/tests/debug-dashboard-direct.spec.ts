import { test, expect } from '@playwright/test';

test.describe('Debug: Dashboard Directo', () => {
  test('Debuggear componente DashboardPage directamente', async ({ page }) => {
    console.log('🎮 DEBUGGING DASHBOARD COMPONENTE DIRECTAMENTE');
    console.log('===============================================');
    
    // Interceptar console.log para capturar debugs del componente
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });
    
    // 1. Login normal
    console.log('1. 🔐 Login...');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(1000);
    
    await page.fill('input[type="text"]', 'usuario');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    console.log(`   Login completado, URL: ${page.url()}`);
    
    // 2. Inyectar debug de React antes de navegar
    console.log('2. ⚛️  Inyectando debugging en React...');
    
    await page.addInitScript(() => {
      // Override React hooks para debugging
      const originalUseEffect = window.React?.useEffect;
      const originalUseState = window.React?.useState;
      
      // Interceptar useEffect para ver qué efectos se ejecutan
      if (originalUseEffect) {
        // @ts-ignore
        window.React.useEffect = (effect, deps) => {
          console.log('[REACT-DEBUG] useEffect called with deps:', deps);
          return originalUseEffect(effect, deps);
        };
      }
      
      // Capturar cualquier redirección
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;
      
      history.pushState = function(...args) {
        console.log('[NAVIGATION-DEBUG] pushState called:', args);
        return originalPushState.apply(this, args);
      };
      
      history.replaceState = function(...args) {
        console.log('[NAVIGATION-DEBUG] replaceState called:', args);
        return originalReplaceState.apply(this, args);
      };
    });
    
    // 3. Navegar a dashboard y observar paso a paso
    console.log('3. 🎯 Navegando a dashboard paso a paso...');
    
    await page.goto('http://localhost:5173/dashboard');
    
    // Esperar unos segundos y ver qué pasa
    for (let i = 1; i <= 5; i++) {
      await page.waitForTimeout(1000);
      const currentUrl = page.url();
      console.log(`   ${i}s: URL = ${currentUrl}`);
      
      if (currentUrl !== 'http://localhost:5173/dashboard') {
        console.log(`   🔄 REDIRECCIÓN DETECTADA en ${i} segundos!`);
        break;
      }
    }
    
    const finalUrl = page.url();
    console.log(`   URL final: ${finalUrl}`);
    
    // 4. Capturar estado del DOM inmediatamente
    console.log('4. 📋 Capturando estado del DOM...');
    
    const domState = await page.evaluate(() => {
      return {
        title: document.title,
        location: window.location.href,
        bodyClasses: document.body.className,
        hasNextGame: document.body.textContent?.includes('PRÓXIMO JUEGO'),
        hasNoGames: document.body.textContent?.includes('No hay juegos disponibles'),
        hasComprarCartones: document.body.textContent?.includes('COMPRAR CARTONES'),
        hasPerlas: document.body.textContent?.includes('Perlas'),
        hasBalance: document.body.textContent?.includes('Balance'),
        
        // Elementos específicos
        h3Elements: Array.from(document.querySelectorAll('h3')).map(el => el.textContent),
        buttonTexts: Array.from(document.querySelectorAll('button')).map(btn => btn.textContent?.trim()),
        
        // Texto completo del body (primeros 1000 chars)
        fullText: document.body.textContent?.substring(0, 1000)
      };
    });
    
    console.log('📊 Estado del DOM:');
    console.log(`   Location: ${domState.location}`);
    console.log(`   Has PRÓXIMO JUEGO: ${domState.hasNextGame}`);
    console.log(`   Has No hay juegos: ${domState.hasNoGames}`);
    console.log(`   Has COMPRAR CARTONES: ${domState.hasComprarCartones}`);
    console.log(`   Has Perlas: ${domState.hasPerlas}`);
    
    console.log(`   H3 elements: ${domState.h3Elements.join(', ')}`);
    console.log(`   Button texts: ${domState.buttonTexts.join(', ')}`);
    
    // 5. Mostrar logs capturados
    console.log('5. 📜 Console logs capturados:');
    const relevantLogs = consoleLogs.filter(log => 
      log.includes('REACT-DEBUG') || 
      log.includes('NAVIGATION-DEBUG') || 
      log.includes('nextGame') || 
      log.includes('games') ||
      log.includes('dashboard')
    );
    
    relevantLogs.slice(-10).forEach((log, index) => {
      console.log(`   ${index + 1}. ${log}`);
    });
    
    // Screenshot final
    await page.screenshot({ 
      path: './test-results/debug-dashboard-direct.png',
      fullPage: true 
    });
    
    console.log('\n✅ Debug directo completado');
    
    // Determinar el resultado
    if (finalUrl.includes('/dashboard') && domState.hasNextGame) {
      console.log('🎉 ÉXITO: Dashboard funciona correctamente');
    } else if (finalUrl.includes('/dashboard') && domState.hasNoGames) {
      console.log('⚠️  Dashboard carga pero no encuentra juegos');
    } else if (!finalUrl.includes('/dashboard')) {
      console.log('❌ PROBLEMA: Redirección automática fuera de dashboard');
    } else {
      console.log('❓ ESTADO DESCONOCIDO');
    }
  });
});