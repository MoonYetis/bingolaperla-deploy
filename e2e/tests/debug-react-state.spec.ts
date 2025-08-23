import { test, expect } from '@playwright/test';

test.describe('Debug: Estado React Dashboard', () => {
  test('Debuggear estado de React en DashboardPage', async ({ page }) => {
    console.log('🔍 DEBUGGING ESTADO DE REACT - DASHBOARD');
    console.log('========================================');
    
    // 1. Login
    console.log('🔐 1. Login como usuario...');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
    
    await page.fill('input[type="text"]', 'usuario');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // 2. Ir al dashboard
    console.log('🎮 2. Navegando al dashboard...');
    await page.goto('http://localhost:5173/dashboard');
    await page.waitForTimeout(5000); // Tiempo extra para cargar datos
    
    // 3. Inyectar código para debuggear React
    console.log('⚛️  3. Inyectando debugging de React...');
    
    const reactState = await page.evaluate(() => {
      // Encontrar el elemento root de React
      const dashboardElement = document.querySelector('body') || document.documentElement;
      
      // Buscar la instancia de React
      // @ts-ignore
      const reactFiberKey = Object.keys(dashboardElement).find(key => key.startsWith('__reactFiber$'));
      // @ts-ignore
      const reactPropsKey = Object.keys(dashboardElement).find(key => key.startsWith('__reactProps$'));
      
      console.log('React Fiber Key:', reactFiberKey);
      console.log('React Props Key:', reactPropsKey);
      
      // Función helper para extraer estado de componentes
      const findReactState = (element: Element) => {
        const allElements = element.querySelectorAll('*');
        const states: any[] = [];
        
        Array.from(allElements).forEach((el: any) => {
          const keys = Object.keys(el);
          const fiberKey = keys.find(key => key.startsWith('__reactFiber$'));
          if (fiberKey) {
            const fiber = el[fiberKey];
            if (fiber && fiber.memoizedState) {
              states.push({
                element: el.tagName,
                className: el.className,
                memoizedState: fiber.memoizedState
              });
            }
          }
        });
        
        return states;
      };
      
      // Buscar información útil en el DOM
      const domInfo = {
        // Buscar elementos específicos del dashboard
        nextGameSection: !!document.querySelector('.bg-white.rounded-2xl'),
        noGamesMessage: !!document.querySelector('h3')?.textContent?.includes('No hay juegos disponibles'),
        comprarCartonesButton: !!document.querySelector('button')?.textContent?.includes('COMPRAR CARTONES'),
        
        // Buscar todos los botones
        buttons: Array.from(document.querySelectorAll('button')).map(btn => ({
          text: btn.textContent?.trim(),
          className: btn.className,
          disabled: btn.disabled
        })),
        
        // Buscar elementos con juego
        gameElements: Array.from(document.querySelectorAll('*')).filter(el => 
          el.textContent?.includes('PRÓXIMO JUEGO') || 
          el.textContent?.includes('Perlas') ||
          el.textContent?.includes('Premio')
        ).map(el => ({
          tagName: el.tagName,
          className: el.className || '',
          textContent: el.textContent?.substring(0, 100) || ''
        })),
        
        // DOM completo resumido
        bodyText: document.body.textContent?.substring(0, 500) || ''
      };
      
      return {
        domInfo,
        reactStates: findReactState(document.body)
      };
    });
    
    console.log('📋 INFORMACIÓN DEL DOM:');
    console.log(`   Sección next game visible: ${reactState.domInfo.nextGameSection}`);
    console.log(`   Mensaje "No hay juegos": ${reactState.domInfo.noGamesMessage}`);
    console.log(`   Botón "COMPRAR CARTONES" visible: ${reactState.domInfo.comprarCartonesButton}`);
    
    console.log('\n🔘 BOTONES ENCONTRADOS:');
    reactState.domInfo.buttons.forEach((btn, index) => {
      console.log(`   ${index + 1}. "${btn.text}" - ${btn.disabled ? 'DISABLED' : 'ENABLED'}`);
    });
    
    console.log('\n🎮 ELEMENTOS DE JUEGO:');
    reactState.domInfo.gameElements.forEach((el, index) => {
      console.log(`   ${index + 1}. <${el.tagName}> "${el.textContent}"`);
    });
    
    console.log('\n📄 CONTENIDO DEL BODY (primeros 500 chars):');
    console.log(`   ${reactState.domInfo.bodyText}`);
    
    // 4. Verificar console.log del navegador
    console.log('\n📜 4. Capturando logs de consola del navegador...');
    
    // Inyectar script para capturar errores
    await page.addInitScript(() => {
      // @ts-ignore
      window.capturedLogs = [];
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;
      
      console.log = (...args) => {
        // @ts-ignore
        window.capturedLogs.push({ type: 'log', args: args.map(String) });
        originalLog.apply(console, args);
      };
      
      console.error = (...args) => {
        // @ts-ignore
        window.capturedLogs.push({ type: 'error', args: args.map(String) });
        originalError.apply(console, args);
      };
      
      console.warn = (...args) => {
        // @ts-ignore
        window.capturedLogs.push({ type: 'warn', args: args.map(String) });
        originalWarn.apply(console, args);
      };
    });
    
    // Recargar para capturar logs desde el inicio
    await page.reload();
    await page.waitForTimeout(5000);
    
    const logs = await page.evaluate(() => {
      // @ts-ignore
      return window.capturedLogs || [];
    });
    
    console.log(`\n📜 Logs capturados: ${logs.length}`);
    logs.slice(0, 10).forEach((log: any, index: number) => {
      console.log(`   ${index + 1}. [${log.type}] ${log.args.join(' ')}`);
    });
    
    // 5. Screenshot final
    await page.screenshot({ 
      path: './test-results/debug-react-state.png',
      fullPage: true 
    });
    
    console.log('\n✅ Debugging de React completado');
  });
});