const { chromium } = require('playwright');

async function testEnterGame() {
  console.log('🧪 TESTING ENTER GAME FLOW');
  console.log('===========================');
  
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
    
    // 2. Ir a PLAY
    console.log('2. 🎮 Yendo a PLAY...');
    await page.click('button:has-text("PLAY")');
    await page.waitForTimeout(5000);
    
    // 3. Buscar juego EN VIVO
    const liveGameButton = page.locator('button:has-text("ENTRAR AL JUEGO")');
    const liveGameCount = await liveGameButton.count();
    
    console.log(`   Juegos EN VIVO disponibles: ${liveGameCount}`);
    
    if (liveGameCount > 0) {
      console.log('3. 🔴 Entrando al juego EN VIVO...');
      await liveGameButton.first().click();
      await page.waitForTimeout(5000);
      
      // 4. Verificar que entramos a la página del juego
      const currentUrl = page.url();
      console.log(`   URL actual: ${currentUrl}`);
      
      if (currentUrl.includes('/game/')) {
        console.log('   🎉 ¡SUCCESS! Entramos al juego correctamente');
        
        // 5. Verificar elementos del juego
        const gameTitle = await page.locator('h1, h2, h3').count();
        const bingoCards = await page.locator('[class*="card"], [class*="bingo"]').count();
        
        console.log(`   Títulos de juego encontrados: ${gameTitle}`);
        console.log(`   Elementos de cartones encontrados: ${bingoCards}`);
        
        // 6. Verificar que el juego carga correctamente
        await page.waitForTimeout(3000);
        
        const hasError = await page.locator('text=Error, text=404, text=Not Found').count();
        if (hasError === 0) {
          console.log('   ✅ El juego carga sin errores');
        } else {
          console.log('   ❌ Hay errores en la página del juego');
        }
        
      } else {
        console.log('   ❌ No se redirigió a la página del juego');
      }
      
    } else {
      console.log('   ⚠️  No hay juegos EN VIVO disponibles para probar');
      
      // Verificar juegos programados
      const scheduledGames = await page.locator('button:has-text("Esperando inicio")').count();
      console.log(`   Juegos programados: ${scheduledGames}`);
    }
    
    await page.screenshot({ 
      path: './test-results/enter-game-test.png',
      fullPage: true 
    });
    
  } catch (error) {
    console.error('❌ Error en el test:', error);
  } finally {
    await browser.close();
    console.log('\n✅ Test completado');
  }
}

testEnterGame();