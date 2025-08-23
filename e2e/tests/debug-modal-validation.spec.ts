import { test, expect } from '@playwright/test';

test.describe('Debug Modal Validation', () => {
  test('Debuggear validación del modal paso a paso', async ({ page }) => {
    console.log('🔍 DEBUG VALIDACIÓN DEL MODAL');
    console.log('=============================');
    
    // Capturar errores de consola
    const consoleLogs: string[] = [];
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      const text = msg.text();
      consoleLogs.push(`[${msg.type()}] ${text}`);
      if (msg.type() === 'error') {
        errors.push(text);
      }
    });
    
    page.on('response', (response) => {
      if (!response.ok() && response.url().includes('/api/')) {
        console.log(`❌ API Error: ${response.status()} ${response.url()}`);
      }
    });
    
    // 1. Login y llegar al modal
    console.log('1. 🔐 Login y navegación...');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
    
    await page.fill('input[type="text"]', 'usuario');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    console.log(`   URL después login: ${page.url()}`);
    
    // 2. Ir al dashboard
    console.log('2. 🎮 Ir al dashboard...');
    await page.goto('http://localhost:5173/dashboard');
    await page.waitForTimeout(3000);
    
    console.log(`   URL dashboard: ${page.url()}`);
    
    // 3. Abrir modal
    console.log('3. 📋 Abrir modal de compra...');
    const buyButton = page.locator('button:has-text("COMPRAR CARTONES")').first();
    
    if (await buyButton.isVisible()) {
      console.log('   ✅ Botón COMPRAR CARTONES encontrado');
      await buyButton.click();
      await page.waitForTimeout(3000);
      
      // 4. Inspeccionar estado del modal
      console.log('4. 🔍 Inspeccionando modal...');
      
      const modalVisible = await page.locator('h2:has-text("Comprar Cartones")').isVisible();
      console.log(`   Modal visible: ${modalVisible}`);
      
      if (modalVisible) {
        // Buscar el botón problemático
        const continueButton = page.locator('button').filter({ hasText: /Continuar|No Disponible|Saldo Insuficiente|Validando/ }).first();
        
        if (await continueButton.isVisible()) {
          const buttonText = await continueButton.textContent();
          const isDisabled = await continueButton.isDisabled();
          
          console.log(`   Texto del botón: "${buttonText}"`);
          console.log(`   Botón deshabilitado: ${isDisabled}`);
          
          // Capturar información del modal
          const modalInfo = await page.evaluate(() => {
            // Buscar información específica en el modal
            const modal = document.querySelector('[role="dialog"]') || document.querySelector('.bg-white.rounded-2xl');
            if (!modal) return null;
            
            return {
              balanceText: modal.textContent?.match(/(\d+\.?\d*)\s*Perlas/g) || [],
              hasValidating: modal.textContent?.includes('Validando'),
              hasNoDisponible: modal.textContent?.includes('No Disponible'),
              hasSaldoInsuficiente: modal.textContent?.includes('Saldo Insuficiente'),
              fullText: modal.textContent?.substring(0, 500)
            };
          });
          
          console.log('   Información del modal:');
          console.log(`     Balances: ${modalInfo?.balanceText.join(', ')}`);
          console.log(`     Está validando: ${modalInfo?.hasValidating}`);
          console.log(`     Dice "No Disponible": ${modalInfo?.hasNoDisponible}`);
          console.log(`     Dice "Saldo Insuficiente": ${modalInfo?.hasSaldoInsuficiente}`);
          
          // 5. Verificar llamadas de red durante el modal
          console.log('5. 📡 Verificando llamadas de red...');
          
          // Interceptar requests de API
          const apiCalls: { url: string; status: number; response?: any }[] = [];
          
          page.route('**/api/**', async (route) => {
            try {
              const response = await route.fetch();
              const responseBody = await response.text();
              
              let parsedResponse;
              try {
                parsedResponse = JSON.parse(responseBody);
              } catch {
                parsedResponse = responseBody;
              }
              
              apiCalls.push({
                url: route.request().url(),
                status: response.status(),
                response: parsedResponse
              });
              
              route.fulfill({ response });
            } catch (error) {
              console.log(`   ❌ Error en route: ${error}`);
              route.continue();
            }
          });
          
          // Forzar re-validación cambiando cantidad de cartones
          console.log('6. 🔄 Probando cambio de cartones...');
          const carton2Button = page.locator('button:has-text("2")').first();
          if (await carton2Button.isVisible()) {
            await carton2Button.click();
            await page.waitForTimeout(3000);
            
            const newButtonText = await continueButton.textContent();
            console.log(`   Nuevo texto del botón: "${newButtonText}"`);
          }
          
          // Mostrar llamadas de API
          console.log('\n📡 Llamadas de API capturadas:');
          apiCalls.forEach((call, index) => {
            console.log(`   ${index + 1}. ${call.status} ${call.url}`);
            if (call.status >= 400) {
              console.log(`      ❌ Error: ${JSON.stringify(call.response).substring(0, 100)}`);
            }
          });
        }
      }
    } else {
      console.log('   ❌ Botón COMPRAR CARTONES no encontrado');
    }
    
    // 7. Mostrar errores de consola
    console.log('\n📜 Errores de consola:');
    if (errors.length > 0) {
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    } else {
      console.log('   ✅ No hay errores de consola');
    }
    
    // Screenshot final
    await page.screenshot({ 
      path: './test-results/debug-modal-validation.png',
      fullPage: true 
    });
    
    console.log('\n✅ Debug del modal completado');
  });
});