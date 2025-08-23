const playwright = require('playwright');

async function debugAdmin() {
  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔍 DEBUG: Verificando login y datos de admin...');

  try {
    // Interceptar requests para ver datos
    page.on('response', async response => {
      if (response.url().includes('/auth/login')) {
        console.log('📡 Response login:', response.status());
        if (response.status() === 200) {
          try {
            const data = await response.json();
            console.log('📊 Datos de usuario en response:', {
              username: data.user?.username,
              email: data.user?.email,
              role: data.user?.role
            });
          } catch (e) {
            console.log('No se pudo parsear response');
          }
        }
      }
    });

    // 1. Login
    console.log('📍 1. Navegando a login...');
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(2000);

    console.log('📍 2. Login con admin@bingo-la-perla.com...');
    await page.fill('input[placeholder*="Teléfono o Email"]', 'admin@bingo-la-perla.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // 2. Verificar datos en localStorage
    const tokens = await page.evaluate(() => {
      return localStorage.getItem('auth_tokens');
    });

    if (tokens) {
      console.log('📍 3. Tokens en localStorage encontrados');
      
      // Parsear y mostrar datos del usuario
      const userData = await page.evaluate(() => {
        const authState = JSON.parse(localStorage.getItem('auth_tokens') || '{}');
        return authState;
      });
      
      console.log('📊 Datos en localStorage:', userData);
    }

    // 3. Verificar datos en Redux store
    const userFromStore = await page.evaluate(() => {
      // Intentar obtener el estado de Redux si está disponible
      if (window.__REDUX_DEVTOOLS_EXTENSION__) {
        return 'Redux DevTools disponible';
      }
      return 'No se puede acceder a Redux';
    });
    
    console.log('📍 4. Redux state:', userFromStore);

    // 4. Verificar HTML del menú
    const menuHTML = await page.locator('.space-y-6').innerHTML();
    console.log('📍 5. HTML del menú (primeros 500 chars):', menuHTML.substring(0, 500));

    // 5. Verificar todos los textos que contengan "admin"
    const adminTexts = await page.locator('*:has-text("admin")').allTextContents();
    console.log('📍 6. Textos que contienen "admin":', adminTexts);

    // 6. Verificar botones disponibles
    const buttons = await page.locator('button').allTextContents();
    console.log('📍 7. Botones disponibles:', buttons);

    return true;

  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  } finally {
    // Mantener browser abierto para inspección manual
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

debugAdmin();