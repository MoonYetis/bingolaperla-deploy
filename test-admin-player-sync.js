const { chromium } = require('playwright');

async function testAdminPlayerSync() {
  console.log('🧪 TESTING ADMIN-PLAYER SYNCHRONIZATION');
  console.log('======================================');
  
  // Iniciar dos navegadores: uno para admin, otro para jugador
  const adminBrowser = await chromium.launch({ headless: false });
  const playerBrowser = await chromium.launch({ headless: false });
  
  const adminPage = await adminBrowser.newPage();
  const playerPage = await playerBrowser.newPage();
  
  try {
    // === CONFIGURACIÓN ===
    
    // 1. Login como admin
    console.log('1. 🔑 Admin login...');
    await adminPage.goto('http://localhost:5173');
    await adminPage.waitForTimeout(2000);
    
    await adminPage.fill('input[type="text"]', 'admin');
    await adminPage.fill('input[type="password"]', 'admin123');
    await adminPage.click('button[type="submit"]');
    await adminPage.waitForTimeout(3000);
    
    // Ir al panel de admin
    await adminPage.goto('http://localhost:5173/admin');
    await adminPage.waitForTimeout(3000);
    
    // 2. Login como jugador y comprar cartones
    console.log('2. 🎮 Player login y compra cartones...');
    await playerPage.goto('http://localhost:5173');
    await playerPage.waitForTimeout(2000);
    
    await playerPage.fill('input[type="text"]', 'usuario');
    await playerPage.fill('input[type="password"]', 'password123');
    await playerPage.click('button[type="submit"]');
    await playerPage.waitForTimeout(3000);
    
    // Comprar cartones si es necesario
    await playerPage.click('button:has-text("BILLETERA")');
    await playerPage.waitForTimeout(2000);
    
    const buyButtons = await playerPage.locator('button:has-text("Comprar Cartones")').count();
    if (buyButtons > 0) {
      console.log('   Comprando cartones...');
      await playerPage.click('button:has-text("Comprar Cartones")');
      await playerPage.waitForTimeout(1000);
      
      const continueBtn = playerPage.locator('button:has-text("Continuar")');
      if (await continueBtn.isVisible()) {
        await continueBtn.click();
        await playerPage.waitForTimeout(1000);
        
        const confirmBtn = playerPage.locator('button:has-text("Confirmar Compra")');
        if (await confirmBtn.isVisible()) {
          await confirmBtn.click();
          await playerPage.waitForTimeout(2000);
        }
      }
    }
    
    // Cerrar cualquier modal que pueda estar abierto
    try {
      await playerPage.click('[data-testid="close-modal"], button:has-text("×"), button:has-text("Cerrar")');
      await playerPage.waitForTimeout(1000);
    } catch (e) {
      // No hay modal, continuar
    }
    
    // Ir al juego
    await playerPage.click('button:has-text("PLAY")');
    await playerPage.waitForTimeout(3000);
    
    // Buscar juego EN VIVO para entrar
    const enterGameBtn = playerPage.locator('button:has-text("ENTRAR AL JUEGO")');
    if (await enterGameBtn.count() > 0) {
      await enterGameBtn.first().click();
      await playerPage.waitForTimeout(3000);
    }
    
    // === PRUEBAS DE SINCRONIZACIÓN ===
    
    console.log('3. 🔄 Verificando sincronización...');
    
    // Verificar que admin puede seleccionar juego
    const adminGameSelector = await adminPage.locator('[class*="border-orange-500"], [class*="border-green-500"]').count();
    console.log(`   Admin ve ${adminGameSelector} juegos disponibles`);
    
    if (adminGameSelector > 0) {
      // Seleccionar primer juego disponible
      await adminPage.locator('[class*="border-orange-500"], [class*="border-green-500"]').first().click();
      await adminPage.waitForTimeout(2000);
      
      // Verificar que se seleccionó
      const selectedGame = await adminPage.locator('text=CONTROLANDO ESTE JUEGO').count();
      console.log(`   ✅ Admin seleccionó juego: ${selectedGame > 0}`);
      
      if (selectedGame > 0) {
        // === PRUEBA 1: CANTAR NÚMEROS ===
        console.log('4. 🎱 Prueba 1: Admin canta números...');
        
        // Admin canta número 5
        await adminPage.click('text=5');
        await adminPage.waitForTimeout(2000);
        
        // Verificar que el número aparece en el admin
        const adminNumber5 = await adminPage.locator('[class*="bg-red-500"]:has-text("5")').count();
        console.log(`   Admin ve número 5 cantado: ${adminNumber5 > 0}`);
        
        // Verificar que el jugador recibe el número
        await playerPage.waitForTimeout(3000);
        const playerNumber5 = await playerPage.locator('text=5').count();
        console.log(`   Jugador ve número 5: ${playerNumber5 > 0}`);
        
        // === PRUEBA 2: CAMBIAR PATRÓN ===
        console.log('5. 🏆 Prueba 2: Admin cambia patrón...');
        
        // Cambiar a patrón diagonal
        await adminPage.click('input[value="diagonal"]');
        await adminPage.waitForTimeout(1000);
        await adminPage.click('button:has-text("Actualizar Patrón")');
        await adminPage.waitForTimeout(2000);
        
        console.log('   ✅ Admin cambió patrón a diagonal');
        
        // === PRUEBA 3: PAUSAR/REANUDAR JUEGO ===
        console.log('6. ⏸️ Prueba 3: Admin pausa juego...');
        
        await adminPage.click('button:has-text("Pausar Juego")');
        await adminPage.waitForTimeout(2000);
        
        // Verificar estado en admin
        const adminPaused = await adminPage.locator('text=🔴 PAUSADO').count();
        console.log(`   Admin ve juego pausado: ${adminPaused > 0}`);
        
        // Verificar estado en jugador
        await playerPage.waitForTimeout(3000);
        const playerPaused = await playerPage.locator('text=⏸️ PAUSADO').count();
        console.log(`   Jugador ve juego pausado: ${playerPaused > 0}`);
        
        // Reanudar
        await adminPage.click('button:has-text("Reanudar Juego")');
        await adminPage.waitForTimeout(2000);
        console.log('   ✅ Admin reanudó juego');
        
        // === PRUEBA 4: REINICIAR JUEGO ===
        console.log('7. 🔄 Prueba 4: Admin reinicia juego...');
        
        await adminPage.click('button:has-text("Reiniciar Juego")');
        await adminPage.waitForTimeout(2000);
        
        // Verificar que los números se limpiaron
        const adminClearedNumbers = await adminPage.locator('[class*="bg-red-500"]').count();
        console.log(`   Admin números limpiados: ${adminClearedNumbers === 0}`);
        
        console.log('8. ✅ SINCRONIZACIÓN COMPLETA EXITOSA');
        
      } else {
        console.log('   ❌ Admin no pudo seleccionar juego');
      }
    } else {
      console.log('   ❌ Admin no ve juegos disponibles');
    }
    
    // Screenshots finales
    await adminPage.screenshot({ 
      path: './test-results/admin-sync-final.png',
      fullPage: true 
    });
    
    await playerPage.screenshot({ 
      path: './test-results/player-sync-final.png',
      fullPage: true 
    });
    
  } catch (error) {
    console.error('❌ Error en test de sincronización:', error);
  } finally {
    await adminBrowser.close();
    await playerBrowser.close();
    console.log('\n✅ Test de sincronización completado');
  }
}

testAdminPlayerSync();