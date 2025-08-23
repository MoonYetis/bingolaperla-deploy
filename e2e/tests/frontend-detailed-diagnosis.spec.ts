import { test, expect } from '@playwright/test';

test.describe('Frontend Detailed Diagnosis', () => {
  
  test('should capture detailed frontend state and take screenshots', async ({ page }) => {
    console.log('Capturing detailed frontend diagnosis...');
    
    await page.goto('http://localhost:5173');
    
    // Tomar captura de pantalla completa
    await page.screenshot({ 
      path: 'frontend-full-page.png',
      fullPage: true 
    });
    
    // Verificar HTML structure
    const htmlContent = await page.content();
    console.log('Page HTML length:', htmlContent.length);
    
    // Verificar si hay errores en la consola
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(`${msg.type()}: ${msg.text()}`);
    });
    
    // Verificar red
    const failedRequests: string[] = [];
    page.on('response', async (response) => {
      if (!response.ok()) {
        failedRequests.push(`${response.status()} - ${response.url()}`);
      }
    });
    
    // Esperar cargas de red
    await page.waitForTimeout(3000);
    
    // Verificar el estado del DOM
    const bodyExists = await page.locator('body').count();
    const rootExists = await page.locator('#root').count();
    const appExists = await page.locator('#app').count();
    
    console.log('DOM Elements found:');
    console.log(`- body: ${bodyExists}`);
    console.log(`- #root: ${rootExists}`);
    console.log(`- #app: ${appExists}`);
    
    // Verificar CSS
    const bodyStyles = await page.evaluate(() => {
      const body = document.body;
      const computedStyle = window.getComputedStyle(body);
      return {
        display: computedStyle.display,
        visibility: computedStyle.visibility,
        opacity: computedStyle.opacity,
        height: computedStyle.height,
        overflow: computedStyle.overflow
      };
    });
    
    console.log('Body styles:', bodyStyles);
    
    // Verificar si React está montado
    const reactAppMounted = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        exists: !!root,
        hasChildren: root?.children?.length > 0,
        innerHTML: root?.innerHTML?.substring(0, 200) || 'NO CONTENT'
      };
    });
    
    console.log('React app state:', reactAppMounted);
    
    // Log de errores de consola
    if (logs.length > 0) {
      console.log('Console messages:');
      logs.forEach(log => console.log(`  ${log}`));
    }
    
    // Log de errores de red
    if (failedRequests.length > 0) {
      console.log('Failed network requests:');
      failedRequests.forEach(req => console.log(`  ${req}`));
    }
    
    // Verificar título de la página
    const title = await page.title();
    console.log('Page title:', title);
    
    // Crear reporte
    const diagnosis = {
      accessible: true,
      title,
      domElements: {
        body: bodyExists,
        root: rootExists,
        app: appExists
      },
      bodyStyles,
      reactApp: reactAppMounted,
      consoleErrors: logs.filter(log => log.includes('error')),
      networkErrors: failedRequests,
      timestamp: new Date().toISOString()
    };
    
    console.log('=== FRONTEND DIAGNOSIS REPORT ===');
    console.log(JSON.stringify(diagnosis, null, 2));
  });

});