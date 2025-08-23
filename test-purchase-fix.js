const { chromium } = require('playwright');

async function testPurchaseFix() {
  console.log('🧪 TESTING FIX COMPRA CARTONES');
  console.log('==============================');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // 1. Login
    console.log('1. 🔐 Login...');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
    
    await page.fill('input[type="text"]', 'usuario');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // 2. Ir a BILLETERA
    console.log('2. 💰 Ir a BILLETERA...');
    await page.click('button:has-text("BILLETERA")');
    await page.waitForTimeout(3000);
    
    // 3. Verificar que hay juegos disponibles
    const gamesAvailable = await page.locator('button:has-text("Comprar Cartones")').count();
    console.log(`   Juegos disponibles para compra: ${gamesAvailable}`);
    
    if (gamesAvailable > 0) {
      // 4. Intentar comprar cartones
      console.log('3. 🛒 Intentando comprar cartones...');
      await page.click('button:has-text("Comprar Cartones")');
      await page.waitForTimeout(2000);
      
      // 5. Verificar modal
      const modalOpen = await page.locator('text=Selecciona cantidad de cartones').count();
      if (modalOpen > 0) {
        console.log('   ✅ Modal se abre correctamente');
        
        // 6. Continuar
        const continueBtn = page.locator('button:has-text("Continuar")');
        if (await continueBtn.isVisible() && await continueBtn.isEnabled()) {
          console.log('   ✅ Botón "Continuar" habilitado');
          await continueBtn.click();
          await page.waitForTimeout(2000);
          
          // 7. Confirmar compra
          const confirmBtn = page.locator('button:has-text("Confirmar Compra")');
          if (await confirmBtn.isVisible()) {
            console.log('   ✅ Botón "Confirmar Compra" visible');
            await confirmBtn.click();
            await page.waitForTimeout(3000);
            
            // 8. Verificar resultado
            const success = await page.locator('text=¡Compra Exitosa!').count();
            const error = await page.locator('text=Request failed').count();
            
            if (success > 0) {
              console.log('   🎉 ¡COMPRA EXITOSA! - Problema resuelto');
            } else if (error > 0) {
              console.log('   ❌ Todavía hay error en la compra');
            } else {
              console.log('   ⚠️  Estado indeterminado - revisar manualmente');
            }
          } else {
            console.log('   ❌ Botón "Confirmar Compra" no visible');
          }
        } else {
          console.log('   ❌ Botón "Continuar" no habilitado');
        }
      } else {
        console.log('   ❌ Modal no se abre');
      }
    } else {
      console.log('   ⚠️  No hay juegos disponibles para compra');
    }
    
    await page.screenshot({ 
      path: './test-results/purchase-fix-test.png',
      fullPage: true 
    });
    
  } catch (error) {
    console.error('❌ Error en el test:', error);
  } finally {
    await browser.close();
    console.log('\n✅ Test completado');
  }
}

testPurchaseFix();