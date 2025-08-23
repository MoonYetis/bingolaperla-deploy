const { chromium } = require('playwright');

async function testPlaySectionFix() {
  console.log('🧪 TESTING PLAY SECTION FIX');
  console.log('============================');
  
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
    
    // 2. Primero verificar que hay cartones en BILLETERA
    console.log('2. 💰 Verificando BILLETERA...');
    await page.click('button:has-text("BILLETERA")');
    await page.waitForTimeout(3000);
    
    // 3. Comprar cartones si no hay ninguno
    const gamesAvailable = await page.locator('button:has-text("Comprar Cartones")').count();
    console.log(`   Juegos disponibles para compra: ${gamesAvailable}`);
    
    if (gamesAvailable > 0) {
      console.log('3. 🛒 Comprando cartones...');
      await page.click('button:has-text("Comprar Cartones")');
      await page.waitForTimeout(2000);
      
      // Continuar con la compra
      const continueBtn = page.locator('button:has-text("Continuar")');
      if (await continueBtn.isVisible() && await continueBtn.isEnabled()) {
        await continueBtn.click();
        await page.waitForTimeout(2000);
        
        // Confirmar compra
        const confirmBtn = page.locator('button:has-text("Confirmar Compra")');
        if (await confirmBtn.isVisible()) {
          await confirmBtn.click();
          await page.waitForTimeout(3000);
          
          const success = await page.locator('text=¡Compra Exitosa!').count();
          if (success > 0) {
            console.log('   ✅ Compra exitosa realizada');
          } else {
            console.log('   ⚠️  Puede que ya tengas cartones');
          }
        }
      }
    }
    
    // 4. Ir a PLAY
    console.log('4. 🎮 Yendo a PLAY...');
    await page.click('button:has-text("PLAY")');
    await page.waitForTimeout(5000);
    
    // 5. Verificar si aparecen cartones en PLAY
    const hasCards = await page.locator('text=Mis Cartones').count();
    const noCardsMessage = await page.locator('text=No tienes cartones').count();
    const goToBilletera = await page.locator('text=Ir a Billetera').count();
    
    console.log(`   Sección "Mis Cartones" visible: ${hasCards > 0}`);
    console.log(`   Mensaje "No tienes cartones": ${noCardsMessage > 0}`);
    console.log(`   Botón "Ir a Billetera": ${goToBilletera > 0}`);
    
    // 6. Verificar cartones específicos
    const gameCards = await page.locator('[class*="bg-white rounded-xl border border-gray-200"]').count();
    console.log(`   Juegos con cartones mostrados: ${gameCards}`);
    
    if (gameCards > 0) {
      console.log('   🎉 ¡SUCCESS! Los cartones aparecen en la sección PLAY');
      
      // 7. Verificar botones de entrada al juego
      const enterGameButtons = await page.locator('button:has-text("ENTRAR AL JUEGO")').count();
      const waitingButtons = await page.locator('button:has-text("Esperando inicio")').count();
      
      console.log(`   Botones "ENTRAR AL JUEGO": ${enterGameButtons}`);
      console.log(`   Botones "Esperando inicio": ${waitingButtons}`);
      
      if (enterGameButtons > 0) {
        console.log('   🔥 ¡HAY JUEGOS EN VIVO DISPONIBLES PARA ENTRAR!');
      }
    } else {
      console.log('   ❌ PROBLEMA: Los cartones NO aparecen en PLAY');
      
      // Debug: Verificar estado de la API
      console.log('   🔍 Verificando llamadas API...');
      
      // Abrir DevTools para ver errores
      const logs = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          logs.push(msg.text());
        }
      });
      
      await page.waitForTimeout(2000);
      
      if (logs.length > 0) {
        console.log('   ⚠️  Errores encontrados:');
        logs.forEach(log => console.log(`      ${log}`));
      }
    }
    
    await page.screenshot({ 
      path: './test-results/play-section-fix-test.png',
      fullPage: true 
    });
    
  } catch (error) {
    console.error('❌ Error en el test:', error);
  } finally {
    await browser.close();
    console.log('\n✅ Test completado');
  }
}

testPlaySectionFix();