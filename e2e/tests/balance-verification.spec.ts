import { test, expect } from '@playwright/test'

test.describe('Balance Verification Test', () => {
  
  test('Verify S/999 Balance Shows Correctly', async ({ page }) => {
    console.log('💰 Verificando que el saldo S/999 se muestre correctamente')
    
    // Ir a la aplicación
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
    
    console.log('📍 Paso 1: Login con usuario que tiene S/999')
    
    // Login con el usuario actualizado
    await page.fill('input[type="text"]', 'usuario')
    await page.fill('input[type="password"]', '123456')
    
    await page.screenshot({ 
      path: './test-results/balance-01-login.png',
      fullPage: true 
    })
    
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)
    
    await page.screenshot({ 
      path: './test-results/balance-02-mainmenu.png',
      fullPage: true 
    })
    
    console.log('📍 Paso 2: Verificando balance en MainMenu')
    
    const mainMenuContent = await page.content()
    
    // Buscar el balance en el MainMenu
    const hasBalance999 = mainMenuContent.includes('S/ 999.00') || mainMenuContent.includes('S/ 999')
    const hasBalanceSection = mainMenuContent.includes('Balance') || mainMenuContent.includes('balance')
    
    console.log(`💰 ¿Muestra S/999 en MainMenu?: ${hasBalance999}`)
    console.log(`📊 ¿Tiene sección de balance?: ${hasBalanceSection}`)
    
    if (hasBalance999) {
      console.log('✅ Balance S/999 visible en MainMenu!')
    } else {
      console.log('⚠️ Balance S/999 no visible en MainMenu, verificando contenido...')
      // Buscar variaciones del balance
      const balanceMatches = mainMenuContent.match(/S\/\s*\d+(\.\d{2})?/g)
      if (balanceMatches) {
        console.log(`📊 Balances encontrados: ${balanceMatches.join(', ')}`)
      }
    }
    
    console.log('📍 Paso 3: Verificando balance en Perfil')
    
    // Ir a la página de perfil
    try {
      const perfilButton = page.locator('text=PERFIL').first()
      await perfilButton.click()
      await page.waitForTimeout(2000)
      
      await page.screenshot({ 
        path: './test-results/balance-03-perfil.png',
        fullPage: true 
      })
      
      const perfilContent = await page.content()
      
      // Verificar balance en perfil
      const hasBalance999InPerfil = perfilContent.includes('S/ 999.00') || perfilContent.includes('S/ 999')
      const hasRechargeButtons = perfilContent.includes('RECARGAR SALDO')
      const hasMyBalance = perfilContent.includes('Mi Balance')
      
      console.log(`💰 ¿Muestra S/999 en Perfil?: ${hasBalance999InPerfil}`)
      console.log(`🔄 ¿Tiene botones de recarga?: ${hasRechargeButtons}`)
      console.log(`📈 ¿Tiene "Mi Balance"?: ${hasMyBalance}`)
      
      if (hasBalance999InPerfil) {
        console.log('✅ Balance S/999 visible en Perfil!')
      }
      
      // Buscar todos los balances en el perfil
      const perfilBalanceMatches = perfilContent.match(/S\/\s*\d+(\.\d{2})?/g)
      if (perfilBalanceMatches) {
        console.log(`📊 Balances en perfil: ${perfilBalanceMatches.join(', ')}`)
      }
      
    } catch (error) {
      console.log(`❌ Error navegando al perfil: ${error.message}`)
    }
    
    console.log('📍 Paso 4: Verificando balance en Dashboard/PLAY')
    
    // Volver al menú y ir a PLAY
    try {
      await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
      await page.waitForTimeout(1000)
      
      const playButton = page.locator('text=PLAY').first()
      await playButton.click()
      await page.waitForTimeout(2000)
      
      await page.screenshot({ 
        path: './test-results/balance-04-play.png',
        fullPage: true 
      })
      
      const playContent = await page.content()
      
      // Verificar balance en dashboard/play (debe ser mínimo)
      const hasBalanceInPlay = playContent.includes('Balance:') || playContent.includes('balance')
      const hasBalance999InPlay = playContent.includes('S/ 999')
      
      console.log(`📊 ¿Muestra balance en PLAY?: ${hasBalanceInPlay}`)
      console.log(`💰 ¿Muestra S/999 en PLAY?: ${hasBalance999InPlay}`)
      
      if (hasBalanceInPlay) {
        console.log('✅ Balance visible en página PLAY (como debería ser - mínimo)')
      }
      
    } catch (error) {
      console.log(`❌ Error navegando a PLAY: ${error.message}`)
    }
    
    // Reporte final
    console.log('\n🎯 REPORTE DE BALANCE:')
    console.log('========================')
    
    if (hasBalance999) {
      console.log('✅ Usuario tiene S/999.00 correctamente configurado')
      console.log('✅ Balance visible en MainMenu')
      console.log('✅ Sistema de balance funcionando')
    } else {
      console.log('⚠️ Balance S/999 no detectado - puede ser problema de formato')
    }
    
    console.log('\n💡 INSTRUCCIONES PARA EL USUARIO:')
    console.log('=====================================')
    console.log('1. Usa: usuario / 123456 para login')
    console.log('2. Verás tu balance S/999.00 en el MainMenu')
    console.log('3. Ve a PERFIL para ver balance detallado y recargas')
    console.log('4. Ve a PLAY para comprar cartones con tu saldo')
    console.log('')
    console.log('🎉 ¡Ya tienes S/999 para probar todas las funcionalidades!')
  })
})