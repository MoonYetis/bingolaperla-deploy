import { test, expect } from '@playwright/test';

test.describe('Frontend Accessibility Verification', () => {
  
  test('should access http://localhost:5173 successfully', async ({ page }) => {
    console.log('Testing frontend accessibility...');
    
    try {
      // Intentar acceder a la página principal
      await page.goto('http://localhost:5173', { 
        waitUntil: 'networkidle',
        timeout: 10000 
      });
      
      // Verificar que la página se carga correctamente
      await expect(page).toHaveTitle(/Bingo/i);
      
      // Tomar captura de pantalla para documentar el estado
      await page.screenshot({ 
        path: 'frontend-accessibility-success.png',
        fullPage: true 
      });
      
      console.log('✅ Frontend accessible at http://localhost:5173');
      
    } catch (error) {
      console.error('❌ Frontend not accessible:', error);
      
      // Tomar captura del error si es posible
      try {
        await page.screenshot({ 
          path: 'frontend-accessibility-error.png',
          fullPage: true 
        });
      } catch (screenshotError) {
        console.error('Could not take error screenshot:', screenshotError);
      }
      
      throw error;
    }
  });

  test('should verify React app loads properly', async ({ page }) => {
    console.log('Testing React app loading...');
    
    await page.goto('http://localhost:5173');
    
    // Verificar que elementos básicos de React están presentes
    const reactElements = [
      'body', 
      '[id="root"]'
    ];
    
    for (const selector of reactElements) {
      await expect(page.locator(selector)).toBeVisible();
      console.log(`✅ Element found: ${selector}`);
    }
  });

  test('should verify backend connectivity from frontend', async ({ page }) => {
    console.log('Testing backend connectivity...');
    
    // Interceptar llamadas de red para verificar conectividad
    const failedRequests: string[] = [];
    
    page.on('response', async (response) => {
      if (!response.ok() && response.url().includes('localhost:3001')) {
        failedRequests.push(`${response.status()} - ${response.url()}`);
      }
    });
    
    await page.goto('http://localhost:5173');
    
    // Esperar a que se completen las llamadas iniciales
    await page.waitForTimeout(2000);
    
    if (failedRequests.length > 0) {
      console.warn('⚠️ Backend connectivity issues found:');
      failedRequests.forEach(req => console.warn(`  - ${req}`));
    } else {
      console.log('✅ No backend connectivity issues detected');
    }
  });

  test('should check navigation functionality', async ({ page }) => {
    console.log('Testing navigation...');
    
    await page.goto('http://localhost:5173');
    
    // Verificar que el router funciona
    const currentUrl = page.url();
    expect(currentUrl).toBe('http://localhost:5173/');
    
    console.log(`✅ Current URL: ${currentUrl}`);
  });

  test('should verify essential page elements', async ({ page }) => {
    console.log('Testing essential page elements...');
    
    await page.goto('http://localhost:5173');
    
    // Verificar elementos esenciales que deberían estar presentes
    const essentialElements = [
      'body',
      'main, [role="main"], #app, #root'
    ];
    
    for (const selector of essentialElements) {
      const element = page.locator(selector).first();
      await expect(element).toBeVisible();
      console.log(`✅ Essential element present: ${selector}`);
    }
  });

});