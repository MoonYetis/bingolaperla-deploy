import { test, expect } from '@playwright/test';

test.describe('Login Debug - Credential Verification', () => {
  
  test.beforeEach(async ({ page }) => {
    // Capturar todos los logs de console
    page.on('console', msg => {
      console.log(`🖥️ CONSOLE [${msg.type()}]:`, msg.text());
    });

    // Capturar errores de página
    page.on('pageerror', error => {
      console.log(`💥 PAGE ERROR:`, error.message);
    });

    // Interceptar requests de network
    page.on('request', request => {
      if (request.url().includes('/api/auth/login')) {
        console.log(`📤 LOGIN REQUEST:`, request.url());
        console.log(`📤 METHOD:`, request.method());
        console.log(`📤 HEADERS:`, request.headers());
        console.log(`📤 POST DATA:`, request.postData());
      }
    });

    // Interceptar responses
    page.on('response', response => {
      if (response.url().includes('/api/auth/login')) {
        console.log(`📥 LOGIN RESPONSE:`, response.status(), response.statusText());
        response.text().then(body => {
          console.log(`📥 RESPONSE BODY:`, body);
        });
      }
    });
  });

  test('Debug Admin Login Flow', async ({ page }) => {
    console.log('🔍 === DEBUGGING ADMIN LOGIN ===');
    
    // 1. Navegar a la página
    console.log('📍 Step 1: Navigating to login page...');
    await page.goto('http://localhost:5173');
    
    // Screenshot inicial
    await page.screenshot({ 
      path: 'test-results/login-debug/01-page-loaded.png',
      fullPage: true 
    });
    
    // Verificar que la página cargó
    console.log('✅ Page loaded, checking for login form...');
    
    // 2. Verificar elementos del formulario
    const emailInput = page.locator('input[type="text"]').first();
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    // Verificar que los elementos existen
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    
    console.log('✅ Login form elements found');
    
    // 3. Llenar credenciales admin
    console.log('📝 Step 2: Filling admin credentials...');
    await emailInput.fill('admin@bingo-la-perla.com');
    await passwordInput.fill('password123');
    
    // Screenshot con formulario lleno
    await page.screenshot({ 
      path: 'test-results/login-debug/02-admin-form-filled.png',
      fullPage: true 
    });
    
    // Verificar que los campos tienen los valores correctos
    const emailValue = await emailInput.inputValue();
    const passwordValue = await passwordInput.inputValue();
    
    console.log(`📧 Email field value: "${emailValue}"`);
    console.log(`🔒 Password field value: "${passwordValue}"`);
    
    expect(emailValue).toBe('admin@bingo-la-perla.com');
    expect(passwordValue).toBe('password123');
    
    // 4. Hacer click en submit
    console.log('🚀 Step 3: Submitting login form...');
    
    // Esperar por navigation o response
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/auth/login') && response.status() !== 0,
      { timeout: 10000 }
    );
    
    await submitButton.click();
    
    // Esperar la respuesta
    try {
      const response = await responsePromise;
      console.log(`📥 Got response: ${response.status()} ${response.statusText()}`);
      
      const responseBody = await response.text();
      console.log(`📥 Response body: ${responseBody}`);
      
      // Screenshot después del submit
      await page.screenshot({ 
        path: 'test-results/login-debug/03-admin-after-submit.png',
        fullPage: true 
      });
      
      if (response.status() === 200) {
        console.log('✅ Login request successful!');
        
        // Esperar redirección o cambio de página
        await page.waitForTimeout(2000);
        
        // Screenshot final
        await page.screenshot({ 
          path: 'test-results/login-debug/04-admin-final-state.png',
          fullPage: true 
        });
        
        // Verificar URL actual
        const currentURL = page.url();
        console.log(`📍 Current URL: ${currentURL}`);
        
        // Verificar si llegamos al dashboard
        if (currentURL.includes('/dashboard')) {
          console.log('✅ Successfully redirected to dashboard!');
        } else {
          console.log('⚠️ Login successful but no dashboard redirect');
        }
        
      } else {
        console.log(`❌ Login failed with status: ${response.status()}`);
      }
      
    } catch (error) {
      console.log(`💥 Error waiting for login response:`, error);
      
      // Screenshot del error
      await page.screenshot({ 
        path: 'test-results/login-debug/03-admin-error-state.png',
        fullPage: true 
      });
    }
  });

  test('Debug User Login Flow', async ({ page }) => {
    console.log('🔍 === DEBUGGING USER LOGIN ===');
    
    // Mismo proceso pero para usuario regular
    await page.goto('http://localhost:5173');
    
    await page.screenshot({ 
      path: 'test-results/login-debug/05-user-page-loaded.png',
      fullPage: true 
    });
    
    const emailInput = page.locator('input[type="text"]').first();
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    console.log('📝 Filling user credentials...');
    await emailInput.fill('jugador@test.com');
    await passwordInput.fill('password123');
    
    await page.screenshot({ 
      path: 'test-results/login-debug/06-user-form-filled.png',
      fullPage: true 
    });
    
    const emailValue = await emailInput.inputValue();
    const passwordValue = await passwordInput.inputValue();
    
    console.log(`📧 User email: "${emailValue}"`);
    console.log(`🔒 User password: "${passwordValue}"`);
    
    // Submit y capturar respuesta
    console.log('🚀 Submitting user login...');
    
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/auth/login'),
      { timeout: 10000 }
    );
    
    await submitButton.click();
    
    try {
      const response = await responsePromise;
      console.log(`📥 User login response: ${response.status()}`);
      
      await page.screenshot({ 
        path: 'test-results/login-debug/07-user-after-submit.png',
        fullPage: true 
      });
      
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: 'test-results/login-debug/08-user-final-state.png',
        fullPage: true 
      });
      
      console.log(`📍 User final URL: ${page.url()}`);
      
    } catch (error) {
      console.log(`💥 User login error:`, error);
      
      await page.screenshot({ 
        path: 'test-results/login-debug/07-user-error-state.png',
        fullPage: true 
      });
    }
  });

  test('Debug Network and Form Analysis', async ({ page }) => {
    console.log('🔍 === ANALYZING FORM AND NETWORK ===');
    
    await page.goto('http://localhost:5173');
    
    // Analizar la estructura del formulario
    const form = page.locator('form');
    const formAction = await form.getAttribute('action');
    const formMethod = await form.getAttribute('method');
    
    console.log(`📋 Form action: ${formAction}`);
    console.log(`📋 Form method: ${formMethod}`);
    
    // Analizar inputs
    const allInputs = page.locator('input');
    const inputCount = await allInputs.count();
    
    console.log(`📝 Total inputs found: ${inputCount}`);
    
    for (let i = 0; i < inputCount; i++) {
      const input = allInputs.nth(i);
      const type = await input.getAttribute('type');
      const placeholder = await input.getAttribute('placeholder');
      const name = await input.getAttribute('name');
      const id = await input.getAttribute('id');
      
      console.log(`📝 Input ${i}: type="${type}", placeholder="${placeholder}", name="${name}", id="${id}"`);
    }
    
    // Analizar botones
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    console.log(`🔘 Total buttons found: ${buttonCount}`);
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const type = await button.getAttribute('type');
      const text = await button.textContent();
      
      console.log(`🔘 Button ${i}: type="${type}", text="${text}"`);
    }
    
    await page.screenshot({ 
      path: 'test-results/login-debug/09-form-analysis.png',
      fullPage: true 
    });
  });

  test('Debug Current Authentication State', async ({ page }) => {
    console.log('🔍 === CHECKING AUTH STATE ===');
    
    await page.goto('http://localhost:5173');
    
    // Verificar localStorage
    const localStorage = await page.evaluate(() => {
      const items: { [key: string]: string } = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          items[key] = window.localStorage.getItem(key) || '';
        }
      }
      return items;
    });
    
    console.log('💾 LocalStorage contents:', localStorage);
    
    // Verificar cookies
    const cookies = await page.context().cookies();
    console.log('🍪 Cookies:', cookies);
    
    // Verificar si ya hay token válido
    if (localStorage.token || localStorage.accessToken) {
      console.log('⚠️ Found existing token in localStorage');
      
      // Intentar ir directamente al dashboard
      await page.goto('http://localhost:5173/dashboard');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: 'test-results/login-debug/10-dashboard-with-token.png',
        fullPage: true 
      });
      
      console.log(`📍 Dashboard URL result: ${page.url()}`);
    }
  });

});