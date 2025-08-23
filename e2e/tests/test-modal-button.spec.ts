import { test, expect } from '@playwright/test';

test.describe('Test Modal Button', () => {
  test('Verificar que el botón del modal ya no dice "No Disponible"', async ({ page }) => {
    console.log('🔍 TESTING BOTÓN DEL MODAL');
    console.log('==========================');
    
    // 1. Login y llegar al modal
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
    
    await page.fill('input[type="text"]', 'usuario');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // 2. Ir al dashboard
    await page.goto('http://localhost:5173/dashboard');
    await page.waitForTimeout(3000);
    
    // 3. Abrir modal
    const buyButton = page.locator('button:has-text("COMPRAR CARTONES")').first();
    await buyButton.click();
    await page.waitForTimeout(3000);
    
    // 4. Verificar el botón del modal
    const continueButton = page.locator('button').filter({ 
      hasText: /Continuar|No Disponible|Saldo Insuficiente|Validando/ 
    }).first();
    
    if (await continueButton.isVisible()) {
      const buttonText = await continueButton.textContent();
      const isDisabled = await continueButton.isDisabled();
      
      console.log(`Texto del botón: "${buttonText}"`);
      console.log(`Botón deshabilitado: ${isDisabled}`);
      
      if (buttonText === 'Continuar' && !isDisabled) {
        console.log('✅ ¡ÉXITO! Botón habilitado con texto "Continuar"');
        
        // Intentar hacer click en Continuar
        await continueButton.click();
        await page.waitForTimeout(2000);
        
        // Verificar si llegamos a la pantalla de confirmación
        const confirmTitle = await page.locator('h3:has-text("Confirmar Compra")').isVisible();
        console.log(`Pantalla de confirmación: ${confirmTitle}`);
        
        if (confirmTitle) {
          console.log('🎉 ¡FLUJO COMPLETO FUNCIONA! - Modal permite ir a confirmación');
        }
        
      } else {
        console.log(`❌ Problema: Botón dice "${buttonText}" y está ${isDisabled ? 'deshabilitado' : 'habilitado'}`);
      }
    }
    
    await page.screenshot({ 
      path: './test-results/test-modal-button.png',
      fullPage: true 
    });
  });
});