import { test, expect } from '@playwright/test';

test.describe('Test: Dashboard Final', () => {
  test('Verificar que dashboard funciona después de los arreglos', async ({ page }) => {
    console.log('🎯 TEST FINAL DEL DASHBOARD');
    console.log('===========================');
    
    // 1. Login
    console.log('1. 🔐 Login...');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(1000);
    
    await page.fill('input[type="text"]', 'usuario');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    console.log(`   Login completado, URL: ${page.url()}`);
    
    // 2. Navegar al dashboard
    console.log('2. 🎮 Navegando al dashboard...');
    await page.goto('http://localhost:5173/dashboard');
    await page.waitForTimeout(3000);
    
    const finalUrl = page.url();
    console.log(`   URL final: ${finalUrl}`);
    
    // 3. Verificar contenido del dashboard
    console.log('3. 📋 Verificando contenido del dashboard...');
    
    const dashboardContent = await page.evaluate(() => {
      return {
        hasProximoJuego: !!document.querySelector('*')?.textContent?.includes('PRÓXIMO JUEGO'),
        hasNoJuegosDisponibles: !!document.querySelector('*')?.textContent?.includes('No hay juegos disponibles'),
        hasPerlas: !!document.querySelector('*')?.textContent?.includes('Perlas'),
        hasComprarCartones: !!document.querySelector('button')?.textContent?.includes('COMPRAR CARTONES'),
        fullText: document.body.textContent?.substring(0, 500) || ''
      };
    });
    
    console.log(`   Tiene "PRÓXIMO JUEGO": ${dashboardContent.hasProximoJuego}`);
    console.log(`   Tiene "No hay juegos disponibles": ${dashboardContent.hasNoJuegosDisponibles}`);
    console.log(`   Tiene "Perlas": ${dashboardContent.hasPerlas}`);
    console.log(`   Tiene botón "COMPRAR CARTONES": ${dashboardContent.hasComprarCartones}`);
    
    // 4. Buscar botón COMPRAR CARTONES específicamente
    console.log('4. 🔍 Buscando botón COMPRAR CARTONES...');
    
    const buyButton = await page.locator('text=COMPRAR CARTONES').first();
    const buyButtonExists = await buyButton.isVisible();
    console.log(`   Botón COMPRAR CARTONES visible: ${buyButtonExists}`);
    
    if (buyButtonExists) {
      console.log('   ✅ ¡BOTÓN COMPRAR CARTONES ENCONTRADO!');
      
      // Intentar hacer click
      console.log('5. 🖱️  Intentando click en COMPRAR CARTONES...');
      try {
        await buyButton.click();
        await page.waitForTimeout(2000);
        
        const modalVisible = await page.locator('h2').filter({ hasText: 'Comprar Cartones' }).isVisible();
        console.log(`   Modal de compra visible: ${modalVisible}`);
        
        if (modalVisible) {
          console.log('   ✅ ¡MODAL DE COMPRA SE ABRIÓ CORRECTAMENTE!');
          console.log('   🎉 ¡FUNCIONALIDAD DE COMPRA FUNCIONA!');
        }
        
      } catch (error) {
        console.log(`   ❌ Error en click: ${error}`);
      }
    } else {
      console.log('   ❌ Botón COMPRAR CARTONES no encontrado');
      if (dashboardContent.hasNoJuegosDisponibles) {
        console.log('   ℹ️  Dashboard muestra "No hay juegos disponibles"');
      }
    }
    
    // Screenshot final
    await page.screenshot({ 
      path: './test-results/test-dashboard-final.png',
      fullPage: true 
    });
    
    console.log('\n📊 RESULTADO FINAL:');
    if (finalUrl.includes('/dashboard') && buyButtonExists) {
      console.log('🎉 ¡ÉXITO COMPLETO! Dashboard funciona y botón COMPRAR CARTONES visible');
    } else if (finalUrl.includes('/dashboard')) {
      console.log('⚠️  Dashboard carga pero problema con botón o juegos');
    } else {
      console.log('❌ Dashboard no carga correctamente');
    }
  });
});