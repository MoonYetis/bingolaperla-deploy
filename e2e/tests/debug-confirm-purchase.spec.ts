import { test, expect } from '@playwright/test';

test.describe('Debug Confirm Purchase', () => {
  test('Debuggear botón "Confirmar Compra" que no responde', async ({ page }) => {
    console.log('🔍 DEBUG BOTÓN CONFIRMAR COMPRA');
    console.log('==============================');
    
    // Capturar todos los eventos relevantes
    const consoleLogs: string[] = [];
    const errors: string[] = [];
    const networkCalls: { url: string; method: string; status: number; response?: any }[] = [];
    
    // Capturar logs de consola
    page.on('console', (msg) => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleLogs.push(text);
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Capturar llamadas de red
    page.on('response', async (response) => {
      if (response.url().includes('/api/')) {
        try {
          const responseBody = await response.text();
          let parsedResponse;
          try {
            parsedResponse = JSON.parse(responseBody);
          } catch {
            parsedResponse = responseBody;
          }
          
          networkCalls.push({
            url: response.url(),
            method: response.request().method(),
            status: response.status(),
            response: parsedResponse
          });
          
          console.log(`📡 API: ${response.status()} ${response.request().method()} ${response.url()}`);
          
        } catch (e) {
          console.log(`📡 API: ${response.status()} ${response.request().method()} ${response.url()} (no body)`);
        }
      }
    });
    
    // 1. Llegar al modal de confirmación
    console.log('1. 🔐 Navegando al modal de confirmación...');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
    
    await page.fill('input[type="text"]', 'usuario');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    await page.goto('http://localhost:5173/dashboard');
    await page.waitForTimeout(3000);
    
    // Abrir modal y llegar a confirmación
    const buyButton = page.locator('button:has-text("COMPRAR CARTONES")').first();
    await buyButton.click();
    await page.waitForTimeout(2000);
    
    const continueButton = page.locator('button:has-text("Continuar")').first();
    await continueButton.click();
    await page.waitForTimeout(2000);
    
    console.log('✅ Llegamos a la pantalla de confirmación');
    
    // 2. Verificar estado antes del click
    console.log('2. 🔍 Estado antes del click en "Confirmar Compra"...');
    
    const confirmButton = page.locator('button:has-text("Confirmar Compra")').first();
    const isVisible = await confirmButton.isVisible();
    const isEnabled = await confirmButton.isEnabled();
    const buttonText = await confirmButton.textContent();
    
    console.log(`   Botón visible: ${isVisible}`);
    console.log(`   Botón habilitado: ${isEnabled}`);
    console.log(`   Texto del botón: "${buttonText}"`);
    
    if (!isVisible || !isEnabled) {
      console.log('❌ Problema: Botón no visible o no habilitado');
      return;
    }
    
    // 3. Interceptar clicks y eventos
    console.log('3. 🖱️  Preparando para click en "Confirmar Compra"...');
    
    // Limpiar logs previos
    errors.length = 0;
    networkCalls.length = 0;
    
    await page.screenshot({ 
      path: './test-results/before-confirm-click.png',
      fullPage: true 
    });
    
    // 4. Hacer click y observar qué pasa
    console.log('4. 🎯 HACIENDO CLICK EN "CONFIRMAR COMPRA"...');
    
    try {
      await confirmButton.click();
      console.log('✅ Click ejecutado exitosamente');
      
      // Esperar varios segundos para ver cambios
      for (let i = 1; i <= 5; i++) {
        await page.waitForTimeout(1000);
        
        // Verificar si cambió el estado del modal
        const currentStep = await page.evaluate(() => {
          const modal = document.querySelector('[role="dialog"]') || document.querySelector('.bg-white.rounded-2xl');
          if (!modal) return 'no-modal';
          
          const text = modal.textContent || '';
          
          if (text.includes('Procesando tu compra')) return 'processing';
          if (text.includes('¡Compra Exitosa!')) return 'success';
          if (text.includes('Confirmar Compra')) return 'confirmation';
          if (text.includes('Error')) return 'error';
          
          return 'unknown';
        });
        
        console.log(`   ${i}s: Estado del modal = ${currentStep}`);
        
        if (currentStep !== 'confirmation') {
          console.log(`   🔄 ¡Cambio detectado! Modal cambió a: ${currentStep}`);
          break;
        }
      }
      
    } catch (clickError) {
      console.log(`❌ Error haciendo click: ${clickError}`);
    }
    
    // 5. Analizar qué pasó
    console.log('5. 📊 Análisis de resultados...');
    
    // Verificar estado final del modal
    const finalState = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]') || document.querySelector('.bg-white.rounded-2xl');
      if (!modal) return { state: 'no-modal', text: '' };
      
      const text = modal.textContent || '';
      let state = 'unknown';
      
      if (text.includes('Procesando tu compra')) state = 'processing';
      else if (text.includes('¡Compra Exitosa!')) state = 'success';
      else if (text.includes('Confirmar Compra')) state = 'confirmation';
      else if (text.includes('Error')) state = 'error';
      
      return { state, text: text.substring(0, 300) };
    });
    
    console.log(`   Estado final del modal: ${finalState.state}`);
    
    // Mostrar errores de JavaScript
    console.log('📜 Errores de JavaScript:');
    if (errors.length > 0) {
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    } else {
      console.log('   ✅ No hay errores de JavaScript');
    }
    
    // Mostrar llamadas de red
    console.log('📡 Llamadas de red durante el click:');
    if (networkCalls.length > 0) {
      networkCalls.forEach((call, index) => {
        console.log(`   ${index + 1}. ${call.status} ${call.method} ${call.url}`);
        if (call.status >= 400) {
          console.log(`      ❌ Error: ${JSON.stringify(call.response).substring(0, 100)}`);
        }
      });
    } else {
      console.log('   ⚠️  No se detectaron llamadas de red - esto puede ser el problema');
    }
    
    // Screenshot final
    await page.screenshot({ 
      path: './test-results/after-confirm-click.png',
      fullPage: true 
    });
    
    // 6. Conclusión
    console.log('\n🎯 CONCLUSIÓN:');
    if (finalState.state === 'processing') {
      console.log('✅ Botón funciona - modal cambió a "Procesando"');
    } else if (finalState.state === 'success') {
      console.log('🎉 ¡Compra exitosa! - Modal muestra éxito');
    } else if (finalState.state === 'confirmation') {
      console.log('❌ PROBLEMA: Modal se quedó en confirmación - click no tuvo efecto');
    } else if (finalState.state === 'error') {
      console.log('❌ Error en compra - revisar logs de red y JavaScript');
    }
    
    console.log('\n📋 Para debugging adicional:');
    console.log('   - Ver screenshots: before-confirm-click.png y after-confirm-click.png');
    console.log('   - Revisar logs de red arriba');
    console.log('   - Verificar errores de JavaScript arriba');
  });
});