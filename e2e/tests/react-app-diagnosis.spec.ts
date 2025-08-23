import { test, expect } from '@playwright/test';

test.describe('React App Loading Diagnosis', () => {
  
  test('should capture React app loading state and console messages', async ({ page }) => {
    console.log('Diagnosing React app loading...');
    
    // Capturar todos los logs de consola
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const logMessage = `[${msg.type()}] ${msg.text()}`;
      consoleLogs.push(logMessage);
      console.log(logMessage);
    });
    
    // Capturar errores de página
    const pageErrors: string[] = [];
    page.on('pageerror', error => {
      const errorMessage = `PAGE ERROR: ${error.message}`;
      pageErrors.push(errorMessage);
      console.log(errorMessage);
    });
    
    // Navegar a la página
    await page.goto('http://localhost:5173');
    
    // Esperar un tiempo considerable para el timeout de auth
    console.log('Waiting for auth timeout (4 seconds)...');
    await page.waitForTimeout(4000);
    
    // Verificar estado después del timeout
    const finalState = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        rootExists: !!root,
        rootContent: root?.innerHTML || 'NO CONTENT',
        rootChildrenCount: root?.children?.length || 0,
        bodyContent: document.body.innerHTML.length,
        title: document.title
      };
    });
    
    console.log('Final React state:', JSON.stringify(finalState, null, 2));
    
    // Tomar captura final
    await page.screenshot({ 
      path: 'react-app-final-state.png',
      fullPage: true 
    });
    
    // Verificar si hay elementos visibles específicos
    const loadingSpinner = await page.locator('[class*="spinner"], [class*="loading"]').count();
    const authStatus = await page.locator('text=/Auth:|Iniciando|autenticación/i').count();
    const debugInfo = await page.locator('text=/Auth: .*|Force:/').count();
    
    console.log('UI Elements:');
    console.log(`- Loading spinners: ${loadingSpinner}`);
    console.log(`- Auth status text: ${authStatus}`);
    console.log(`- Debug info: ${debugInfo}`);
    
    // Resumen final
    const diagnosis = {
      accessible: true,
      consoleLogs,
      pageErrors,
      finalState,
      uiElements: {
        loadingSpinner,
        authStatus,
        debugInfo
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('=== REACT APP DIAGNOSIS ===');
    console.log(JSON.stringify(diagnosis, null, 2));
    
    // El test debería pasar si encontramos contenido
    expect(finalState.rootChildrenCount).toBeGreaterThan(0);
  });

});