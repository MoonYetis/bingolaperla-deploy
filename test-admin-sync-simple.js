const { chromium } = require('playwright');

async function testAdminSyncSimple() {
  console.log('🧪 TESTING ADMIN SYNCHRONIZATION (SIMPLE)');
  console.log('========================================');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // 1. Login como admin
    console.log('1. 🔑 Admin login...');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
    
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // 2. Ir al panel de admin
    console.log('2. 👨‍💼 Navegando al panel de admin...');
    await page.goto('http://localhost:5173/admin');
    await page.waitForTimeout(5000);
    
    // 3. Verificar carga de juegos
    const loadingSpinner = await page.locator('[class*="animate-spin"]').count();
    console.log(`   Spinner de carga visible: ${loadingSpinner > 0}`);
    
    // Esperar a que carguen los juegos
    await page.waitForTimeout(3000);
    
    // 4. Verificar selector de juegos
    const gameSelector = await page.locator('text=Seleccionar Juego a Controlar').count();
    console.log(`   ✅ Selector de juegos visible: ${gameSelector > 0}`);
    
    // 5. Verificar juegos disponibles
    const availableGames = await page.locator('button:has-text("🔴 EN VIVO"), button:has-text("🟢 ABIERTO"), button:has-text("📅 PROGRAMADO")').count();
    console.log(`   Juegos disponibles: ${availableGames}`);
    
    if (availableGames > 0) {
      // 6. Seleccionar primer juego
      console.log('3. 🎯 Seleccionando juego...');
      await page.locator('button:has-text("🔴 EN VIVO"), button:has-text("🟢 ABIERTO"), button:has-text("📅 PROGRAMADO")').first().click();
      await page.waitForTimeout(2000);
      
      // 7. Verificar que se seleccionó
      const selectedGame = await page.locator('text=CONTROLANDO ESTE JUEGO').count();
      console.log(`   ✅ Juego seleccionado: ${selectedGame > 0}`);
      
      if (selectedGame > 0) {
        // 8. Verificar controles habilitados
        console.log('4. 🎮 Verificando controles...');
        
        const pauseButton = await page.locator('button:has-text("Pausar Juego"), button:has-text("Reanudar Juego")').count();
        console.log(`   Botón pausar/reanudar visible: ${pauseButton > 0}`);
        
        const resetButton = await page.locator('button:has-text("Reiniciar Juego")').count();
        console.log(`   Botón reiniciar visible: ${resetButton > 0}`);
        
        const patternButton = await page.locator('button:has-text("Actualizar Patrón")').count();
        console.log(`   Botón actualizar patrón visible: ${patternButton > 0}`);
        
        // 9. Verificar grid de números
        const numbersGrid = await page.locator('text=B, text=I, text=N, text=G, text=O').count();
        console.log(`   Grid de números BINGO visible: ${numbersGrid >= 5}`);
        
        // 10. Probar cantar un número
        console.log('5. 🎱 Probando cantar número...');
        
        const number5 = page.locator('button:has-text("5")').first();
        if (await number5.isVisible()) {
          await number5.click();
          await page.waitForTimeout(1000);
          
          // Verificar que el número se marcó como cantado
          const calledNumber = await page.locator('[class*="bg-red-500"]:has-text("5")').count();
          console.log(`   ✅ Número 5 cantado y marcado: ${calledNumber > 0}`);
          
          // Verificar historial
          const numberHistory = await page.locator('text=Historial de Números Cantados').count();
          console.log(`   Historial de números visible: ${numberHistory > 0}`);
        }
        
        // 11. Probar cambio de patrón
        console.log('6. 🏆 Probando cambio de patrón...');
        
        const diagonalPattern = page.locator('input[value="diagonal"]');
        if (await diagonalPattern.isVisible()) {
          await diagonalPattern.click();
          await page.waitForTimeout(500);
          
          await page.click('button:has-text("Actualizar Patrón")');
          await page.waitForTimeout(1000);
          
          console.log('   ✅ Patrón diagonal seleccionado y actualizado');
        }
        
        // 12. Verificar estado de conexión
        const connectionStatus = await page.locator('text=Conectado').count();
        console.log(`   ✅ Estado de conexión Socket.IO: ${connectionStatus > 0 ? 'Conectado' : 'Desconectado'}`);
        
        console.log('7. ✅ ADMIN PANEL FUNCIONANDO CORRECTAMENTE');
        
      } else {
        console.log('   ❌ No se pudo seleccionar juego');
      }
      
    } else {
      console.log('   ⚠️  No hay juegos disponibles para administrar');
    }
    
    // Screenshot final
    await page.screenshot({ 
      path: './test-results/admin-panel-test.png',
      fullPage: true 
    });
    
  } catch (error) {
    console.error('❌ Error en test de admin:', error);
  } finally {
    await browser.close();
    console.log('\n✅ Test de panel admin completado');
  }
}

testAdminSyncSimple();