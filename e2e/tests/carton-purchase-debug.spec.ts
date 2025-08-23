import { test, expect } from '@playwright/test';

test.describe('Debug: Compra de Cartones', () => {
  test('Investigar por qué aparece "No disponible" en compra de cartones', async ({ page }) => {
    console.log('🔍 DEBUGGING COMPRA DE CARTONES');
    console.log('================================');
    
    try {
      // 1. Login como usuario con 89 Perlas
      console.log('🔐 1. Login como usuario...');
      await page.goto('http://localhost:5173');
      await page.waitForTimeout(2000);
      
      await page.fill('input[type="text"]', 'usuario');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      console.log(`   URL después login: ${currentUrl}`);
      
      if (!currentUrl.includes('/menu')) {
        console.log('❌ Login falló, URL no es /menu');
        await page.screenshot({ path: './test-results/debug-login-failed.png' });
        return;
      }
      
      console.log('✅ Login exitoso');
      
      // Capturar screenshot del menú
      await page.screenshot({ 
        path: './test-results/debug-01-menu.png',
        fullPage: true 
      });
      
      // 2. Ir al dashboard para ver juegos
      console.log('\n🎮 2. Navegando al dashboard...');
      await page.goto('http://localhost:5173/dashboard');
      await page.waitForTimeout(3000);
      
      await page.screenshot({ 
        path: './test-results/debug-02-dashboard.png',
        fullPage: true 
      });
      
      // 3. Buscar el botón "COMPRAR CARTONES"
      console.log('\n🔍 3. Buscando botón COMPRAR CARTONES...');
      
      const buyButton = await page.locator('text=COMPRAR CARTONES').first();
      const buyButtonExists = await buyButton.isVisible();
      console.log(`   Botón COMPRAR CARTONES visible: ${buyButtonExists}`);
      
      if (!buyButtonExists) {
        console.log('❌ No se encontró botón COMPRAR CARTONES');
        
        // Buscar otros botones relacionados
        const buttons = await page.locator('button').all();
        console.log(`   Total de botones encontrados: ${buttons.length}`);
        
        for (const button of buttons) {
          const text = await button.textContent();
          if (text && text.toLowerCase().includes('carton')) {
            console.log(`   Botón encontrado: "${text}"`);
          }
        }
        return;
      }
      
      // 4. Verificar estado del botón
      console.log('\n🔍 4. Verificando estado del botón...');
      
      const buttonText = await buyButton.textContent();
      const isDisabled = await buyButton.isDisabled();
      
      console.log(`   Texto del botón: "${buttonText}"`);
      console.log(`   Botón deshabilitado: ${isDisabled}`);
      
      // Capturar estado antes de click
      await page.screenshot({ 
        path: './test-results/debug-03-before-click.png',
        fullPage: true 
      });
      
      // 5. Hacer click en el botón
      console.log('\n🖱️  5. Haciendo click en COMPRAR CARTONES...');
      
      try {
        await buyButton.click();
        await page.waitForTimeout(3000);
        
        console.log('✅ Click realizado');
        
        // Capturar lo que aparece después del click
        await page.screenshot({ 
          path: './test-results/debug-04-after-click.png',
          fullPage: true 
        });
        
        // 6. Verificar si se abrió modal
        console.log('\n📋 6. Verificando modal de compra...');
        
        const modalTitle = await page.locator('h2').filter({ hasText: 'Comprar Cartones' });
        const modalVisible = await modalTitle.isVisible();
        
        console.log(`   Modal de compra visible: ${modalVisible}`);
        
        if (modalVisible) {
          console.log('✅ Modal se abrió correctamente');
          
          // 7. Verificar contenido del modal
          const modalContent = await page.locator('[role="dialog"], .modal, .fixed').first();
          if (await modalContent.isVisible()) {
            const textContent = await modalContent.textContent();
            
            if (textContent?.includes('No Disponible') || textContent?.includes('No disponible')) {
              console.log('❌ PROBLEMA ENCONTRADO: Modal muestra "No Disponible"');
              console.log('   Contenido del modal:');
              console.log(textContent?.substring(0, 500));
              
              // Buscar información específica del error
              if (textContent?.includes('Saldo insuficiente')) {
                console.log('   💰 Problema: Saldo insuficiente detectado en modal');
              }
              if (textContent?.includes('Juego no encontrado')) {
                console.log('   🎮 Problema: Juego no encontrado');
              }
              if (textContent?.includes('Billetera')) {
                console.log('   💎 Problema: Relacionado con billetera');
              }
              
            } else if (textContent?.includes('Continuar') || textContent?.includes('Confirmar')) {
              console.log('✅ Modal funciona correctamente, botones de acción visibles');
            }
            
            // Capturar modal en detalle
            await page.screenshot({ 
              path: './test-results/debug-05-modal-detail.png',
              fullPage: true 
            });
          }
        } else {
          console.log('❌ Modal no se abrió');
          
          // Buscar mensajes de error en la página
          const errorMessages = await page.locator('.error, .alert, [role="alert"]').all();
          for (const error of errorMessages) {
            const errorText = await error.textContent();
            if (errorText) {
              console.log(`   Error encontrado: ${errorText}`);
            }
          }
        }
        
      } catch (clickError) {
        console.log(`❌ Error haciendo click: ${clickError}`);
      }
      
      // 8. Capturar logs de consola del navegador
      console.log('\n📜 8. Logs de consola del navegador:');
      const logs = await page.evaluate(() => {
        // @ts-ignore
        return window.console_logs || [];
      });
      
      if (logs.length > 0) {
        logs.forEach((log: any) => {
          console.log(`   ${log.level}: ${log.message}`);
        });
      } else {
        console.log('   No hay logs específicos capturados');
      }
      
    } catch (error) {
      console.log(`❌ Error durante debugging: ${error}`);
      await page.screenshot({ 
        path: './test-results/debug-error.png',
        fullPage: true 
      });
    }
    
    console.log('\n📊 DEBUGGING COMPLETADO');
    console.log('========================');
    console.log('Screenshots guardados en ./test-results/debug-*.png');
  });
});