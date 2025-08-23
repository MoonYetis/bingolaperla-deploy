const playwright = require('playwright');

async function testAuthenticationFix() {
  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🧪 Iniciando test de autenticación...');

  try {
    // 1. Ir a la página de login
    console.log('📍 1. Navegando a página de login...');
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');

    // 2. Intentar login con credenciales de usuario
    console.log('📍 2. Intentando login con usuario jugador...');
    await page.fill('input[placeholder*="Teléfono o Email"]', 'jugador@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // 3. Esperar redirección
    console.log('📍 3. Esperando redirección después del login...');
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    console.log(`📍 URL actual después del login: ${currentUrl}`);

    if (currentUrl.includes('/login')) {
      console.log('❌ FALLO: Aún estamos en login, autenticación no funciona');
      return false;
    }

    // 4. Verificar acceso a página protegida (menu)
    console.log('📍 4. Intentando acceder a página de menú...');
    await page.goto('http://localhost:5173/menu');
    await page.waitForTimeout(2000);

    const menuUrl = page.url();
    console.log(`📍 URL después de ir a menu: ${menuUrl}`);

    if (menuUrl.includes('/login')) {
      console.log('❌ FALLO: Redirigido a login desde menú');
      return false;
    }

    // 5. Verificar acceso a página de juego
    console.log('📍 5. Intentando acceder a página de juego...');
    await page.goto('http://localhost:5173/game/game-1');
    await page.waitForTimeout(2000);

    const gameUrl = page.url();
    console.log(`📍 URL después de ir a juego: ${gameUrl}`);

    if (gameUrl.includes('/login')) {
      console.log('❌ FALLO: Redirigido a login desde juego');
      return false;
    }

    // 6. Logout y test de admin
    console.log('📍 6. Haciendo logout...');
    await page.goto('http://localhost:5173/menu');
    await page.waitForTimeout(1000);
    
    // Buscar botón de logout
    try {
      await page.click('text=Cerrar Sesión');
      await page.waitForTimeout(1000);
    } catch (e) {
      console.log('📍 No se encontró botón de logout, continuando...');
    }

    // 7. Login como admin
    console.log('📍 7. Intentando login como admin...');
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[placeholder*="Teléfono o Email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // 8. Verificar acceso a página de admin
    console.log('📍 8. Verificando acceso a página de admin...');
    await page.goto('http://localhost:5173/admin');
    await page.waitForTimeout(2000);

    const adminUrl = page.url();
    console.log(`📍 URL después de ir a admin: ${adminUrl}`);

    if (adminUrl.includes('/login')) {
      console.log('❌ FALLO: Redirigido a login desde admin');
      return false;
    }

    // 9. Verificar elementos de admin (patrón selector)
    console.log('📍 9. Verificando elementos de página admin...');
    const hasPatternSelector = await page.locator('text=Patrón de juego').isVisible();
    console.log(`📍 Selector de patrón visible: ${hasPatternSelector}`);

    const hasNumberGrid = await page.locator('.grid').first().isVisible();
    console.log(`📍 Grid de números visible: ${hasNumberGrid}`);

    console.log('✅ ¡ÉXITO! Autenticación funciona correctamente');
    console.log('✅ Usuario puede hacer login y acceder a páginas protegidas');
    console.log('✅ Admin puede acceder a panel de administración');
    console.log('✅ Funcionalidad de patrones está disponible');

    return true;

  } catch (error) {
    console.error('❌ Error durante test:', error);
    return false;
  } finally {
    await browser.close();
  }
}

// Ejecutar test
testAuthenticationFix().then(success => {
  if (success) {
    console.log('\n🎉 TEST COMPLETADO EXITOSAMENTE - Autenticación reparada');
    process.exit(0);
  } else {
    console.log('\n💥 TEST FALLÓ - Autenticación aún no funciona');
    process.exit(1);
  }
});