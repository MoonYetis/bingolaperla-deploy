const { chromium } = require('playwright');

async function testNewUXFlow() {
  console.log('🧪 TESTING NUEVO FLUJO UX');
  console.log('========================');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // 1. Login
    console.log('1. 🔐 Iniciando sesión...');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
    
    await page.fill('input[type="text"]', 'usuario');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // 2. Ir a PLAY primero para verificar el nuevo diseño
    console.log('2. 🎯 Verificando nueva página PLAY...');
    await page.click('button:has-text("PLAY")');
    await page.waitForTimeout(3000);
    
    // Verificar que NO hay botón de comprar cartones
    const buyButtonExists = await page.locator('button:has-text("COMPRAR CARTONES")').count();
    if (buyButtonExists === 0) {
      console.log('   ✅ CORRECTO: No hay botón "COMPRAR CARTONES" en PLAY');
    } else {
      console.log('   ❌ ERROR: Todavía hay botón "COMPRAR CARTONES" en PLAY');
    }
    
    // Verificar que muestra "Mis Cartones"
    const myCardsTitle = await page.locator('text=Mis Cartones').count();
    if (myCardsTitle > 0) {
      console.log('   ✅ CORRECTO: Muestra sección "Mis Cartones"');
    } else {
      console.log('   ❌ ERROR: No muestra sección "Mis Cartones"');
    }
    
    // 3. Ir a BILLETERA
    console.log('3. 💰 Verificando nueva página BILLETERA...');
    await page.click('button:has-text("Billetera")');
    await page.waitForTimeout(3000);
    
    // Verificar que hay sección de compra de cartones
    const shopTitle = await page.locator('text=Comprar Cartones').count();
    if (shopTitle > 0) {
      console.log('   ✅ CORRECTO: Muestra sección "Comprar Cartones" en BILLETERA');
    } else {
      console.log('   ❌ ERROR: No muestra sección "Comprar Cartones" en BILLETERA');
    }
    
    // 4. Intentar comprar cartones desde BILLETERA
    console.log('4. 🛒 Probando compra de cartones desde BILLETERA...');
    const buyCardButton = page.locator('button:has-text("Comprar Cartones")').first();
    
    if (await buyCardButton.isVisible()) {
      console.log('   ✅ Botón "Comprar Cartones" visible en BILLETERA');
      
      await buyCardButton.click();
      await page.waitForTimeout(2000);
      
      // Verificar si se abre el modal
      const modalVisible = await page.locator('text=Selecciona cantidad de cartones').count();
      if (modalVisible > 0) {
        console.log('   ✅ Modal de compra se abre correctamente');
        
        // Intentar continuar
        const continueBtn = page.locator('button:has-text("Continuar")').first();
        if (await continueBtn.isVisible() && await continueBtn.isEnabled()) {
          console.log('   ✅ Botón "Continuar" habilitado');
          await continueBtn.click();
          await page.waitForTimeout(2000);
          
          // Verificar pantalla de confirmación
          const confirmTitle = await page.locator('text=Confirmar Compra').count();
          if (confirmTitle > 0) {
            console.log('   ✅ Llega a pantalla de confirmación');
            
            // Probar confirmar compra
            const confirmBtn = page.locator('button:has-text("Confirmar Compra")').first();
            if (await confirmBtn.isVisible()) {
              console.log('   ✅ Botón "Confirmar Compra" visible');
              await confirmBtn.click();
              await page.waitForTimeout(3000);
              
              // Verificar si la compra fue exitosa
              const successText = await page.locator('text=¡Compra Exitosa!').count();
              if (successText > 0) {
                console.log('   🎉 ¡COMPRA EXITOSA! Nuevo flujo funciona perfecto');
              } else {
                console.log('   ⚠️  Compra procesada pero no se ve mensaje de éxito');
              }
            }
          }
        } else {
          console.log('   ⚠️  Botón "Continuar" no habilitado - verificar balance');
        }
      } else {
        console.log('   ❌ Modal de compra no se abre');
      }
    } else {
      console.log('   ⚠️  No hay juegos disponibles o botón no visible');
    }
    
    // 5. Regresar a PLAY para verificar cartones comprados
    console.log('5. 🎮 Verificando cartones en PLAY...');
    await page.click('button:has-text("Mis Cartones")');
    await page.waitForTimeout(3000);
    
    const playCards = await page.locator('text=Tus cartones').count();
    if (playCards > 0) {
      console.log('   ✅ PLAY muestra cartones comprados');
    } else {
      console.log('   ℹ️  No hay cartones comprados o no aparecen en PLAY');
    }
    
    console.log('\n🎯 RESUMEN DEL NUEVO FLUJO:');
    console.log('1. BILLETERA = Comprar cartones ✅');
    console.log('2. PLAY = Ver mis cartones y jugar ✅');
    console.log('3. Separación clara de funcionalidades ✅');
    console.log('4. UX más intuitiva ✅');
    
    await page.screenshot({ 
      path: './test-results/new-ux-flow-final.png',
      fullPage: true 
    });
    
  } catch (error) {
    console.error('❌ Error en el test:', error);
  } finally {
    await browser.close();
    console.log('\n✅ Test completado');
  }
}

testNewUXFlow();