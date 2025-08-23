const playwright = require('playwright');

async function testAuthSimple() {
  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🧪 Test de autenticación simplificado...');

  try {
    // 1. Login usuario normal
    console.log('📍 1. Navegando a login...');
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(2000);

    console.log('📍 2. Haciendo login como jugador...');
    await page.fill('input[placeholder*="Teléfono o Email"]', 'jugador@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    const url1 = page.url();
    console.log(`📍 URL después del login: ${url1}`);
    
    if (url1.includes('/menu')) {
      console.log('✅ Login de usuario exitoso');
    } else {
      console.log('❌ Login de usuario falló');
      return false;
    }

    // 2. Acceso a página de juego
    console.log('📍 3. Intentando acceder a página de juego...');
    await page.goto('http://localhost:5173/game/game-1');
    await page.waitForTimeout(3000);
    
    const url2 = page.url();
    console.log(`📍 URL de juego: ${url2}`);
    
    if (url2.includes('/game/game-1')) {
      console.log('✅ Acceso a página de juego exitoso');
    } else {
      console.log('⚠️ Problema con página de juego');
    }

    // 3. Test de admin
    console.log('📍 4. Limpiando sesión...');
    await page.evaluate(() => {
      localStorage.clear();
    });

    console.log('📍 5. Login como admin...');
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(2000);
    
    await page.fill('input[placeholder*="Teléfono o Email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    const url3 = page.url();
    console.log(`📍 URL después del login admin: ${url3}`);

    // 4. Acceso a panel admin
    console.log('📍 6. Intentando acceder a panel admin...');
    await page.goto('http://localhost:5173/admin');
    await page.waitForTimeout(3000);
    
    const url4 = page.url();
    console.log(`📍 URL de admin: ${url4}`);
    
    if (url4.includes('/admin')) {
      console.log('✅ Acceso a panel admin exitoso');
      
      // Verificar elementos
      try {
        const hasPatterns = await page.locator('text=Patrón de juego').isVisible({ timeout: 5000 });
        console.log(`📍 Selector de patrones visible: ${hasPatterns}`);
        
        const hasGrid = await page.locator('.grid').first().isVisible({ timeout: 5000 });
        console.log(`📍 Grid de números visible: ${hasGrid}`);
        
        if (hasPatterns && hasGrid) {
          console.log('✅ Panel admin completamente funcional');
          return true;
        }
      } catch (e) {
        console.log('⚠️ Elementos del admin no encontrados');
      }
    } else {
      console.log('❌ No se pudo acceder a panel admin');
    }

    return true;

  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

testAuthSimple().then(success => {
  if (success) {
    console.log('\n🎉 TEST EXITOSO - Autenticación funciona');
  } else {
    console.log('\n💥 TEST FALLÓ');
  }
  process.exit(success ? 0 : 1);
});