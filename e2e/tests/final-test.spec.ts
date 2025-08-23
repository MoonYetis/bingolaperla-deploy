import { test, expect } from '@playwright/test';

test.describe('Test Final Dashboard', () => {
  test('Probar funcionalidad de compra después de reinicio', async ({ page }) => {
    console.log('🎯 TESTING FUNCIONALIDAD FINAL');
    console.log('==============================');
    
    // 1. Ir a la página y login
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
    
    console.log('1. Login...');
    await page.fill('input[type="text"]', 'usuario');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    console.log(`   URL después login: ${page.url()}`);
    
    // 2. Ir al dashboard usando el botón PLAY
    console.log('2. Clic en botón PLAY...');
    const playButton = page.locator('button:has-text("PLAY")').first();
    if (await playButton.isVisible()) {
      await playButton.click();
      await page.waitForTimeout(3000);
    } else {
      console.log('   Navegando directamente al dashboard...');
      await page.goto('http://localhost:5173/dashboard');
      await page.waitForTimeout(3000);
    }
    
    console.log(`   URL del dashboard: ${page.url()}`);
    
    // 3. Verificar contenido del dashboard
    const content = await page.evaluate(() => ({
      hasProximoJuego: document.body.textContent?.includes('PRÓXIMO JUEGO'),
      hasComprarCartones: document.body.textContent?.includes('COMPRAR CARTONES'),
      hasPerlas: document.body.textContent?.includes('Perlas'),
      textSample: document.body.textContent?.substring(0, 300)
    }));
    
    console.log('3. Contenido del dashboard:');
    console.log(`   Tiene PRÓXIMO JUEGO: ${content.hasProximoJuego}`);
    console.log(`   Tiene COMPRAR CARTONES: ${content.hasComprarCartones}`);
    console.log(`   Tiene Perlas: ${content.hasPerlas}`);
    console.log(`   Texto ejemplo: ${content.textSample}`);
    
    // 4. Buscar y hacer click en botón COMPRAR CARTONES
    if (content.hasComprarCartones) {
      console.log('4. ✅ Botón COMPRAR CARTONES encontrado!');
      
      const buyButton = page.locator('button:has-text("COMPRAR CARTONES")').first();
      if (await buyButton.isVisible()) {
        console.log('   Haciendo click...');
        await buyButton.click();
        await page.waitForTimeout(2000);
        
        const modalVisible = await page.locator('h2:has-text("Comprar Cartones")').isVisible();
        console.log(`   Modal abierto: ${modalVisible}`);
        
        if (modalVisible) {
          console.log('   🎉 ¡FUNCIONALIDAD FUNCIONA CORRECTAMENTE!');
        }
      }
    } else {
      console.log('4. ❌ Botón COMPRAR CARTONES no encontrado');
    }
    
    // Screenshot
    await page.screenshot({ 
      path: './test-results/final-test.png',
      fullPage: true 
    });
    
    console.log('\n📋 RESULTADO:');
    if (page.url().includes('/dashboard') && content.hasComprarCartones) {
      console.log('🎉 ¡ÉXITO! Dashboard funciona correctamente');
    } else {
      console.log('❌ Problema detectado');
    }
  });
});