const playwright = require('playwright');

async function testFinal() {
  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🧪 TEST FINAL - Verificación completa...');

  try {
    // 1. Test admin con credenciales correctas
    console.log('📍 1. Navegando a login...');
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(2000);

    console.log('📍 2. Login como admin con credenciales correctas...');
    await page.fill('input[placeholder*="Teléfono o Email"]', 'admin@bingo-la-perla.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    const adminLoginUrl = page.url();
    console.log(`📍 URL después del login admin: ${adminLoginUrl}`);

    if (adminLoginUrl.includes('/menu')) {
      console.log('✅ Login admin exitoso');
      
      // Verificar botón admin (selector específico para el botón)
      const adminButtonVisible = await page.locator('button:has-text("👨‍💼 ADMIN")').isVisible({ timeout: 5000 });
      console.log(`📍 Botón ADMIN visible: ${adminButtonVisible}`);
      
      if (adminButtonVisible) {
        console.log('✅ Botón ADMIN visible correctamente');
        
        // Ir a página admin
        await page.click('button:has-text("👨‍💼 ADMIN")');
        await page.waitForTimeout(3000);
        
        const adminPageUrl = page.url();
        console.log(`📍 URL página admin: ${adminPageUrl}`);
        
        if (adminPageUrl.includes('/admin')) {
          console.log('✅ Acceso a página admin exitoso');
          
          // Verificar elementos de admin
          const hasPatterns = await page.locator('text=Patrón de juego').isVisible({ timeout: 5000 });
          const hasGrid = await page.locator('.grid').first().isVisible({ timeout: 5000 });
          
          console.log(`📍 Selector de patrones visible: ${hasPatterns}`);
          console.log(`📍 Grid de números visible: ${hasGrid}`);
          
          if (hasPatterns && hasGrid) {
            console.log('✅ Panel admin completamente funcional');
            console.log('✅ Funcionalidad de patrones implementada');
            return true;
          }
        }
      }
    } else {
      console.log('❌ Login admin falló');
    }

    return false;

  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

testFinal().then(success => {
  if (success) {
    console.log('\n🎉 ¡TEST FINAL EXITOSO!');
    console.log('✅ Autenticación reparada completamente');
    console.log('✅ Panel admin funcional con selección de patrones');
    console.log('✅ Sistema listo para uso');
  } else {
    console.log('\n💥 TEST FINAL FALLÓ');
  }
  process.exit(success ? 0 : 1);
});