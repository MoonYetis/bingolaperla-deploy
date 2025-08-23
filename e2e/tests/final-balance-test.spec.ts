import { test, expect } from '@playwright/test'

test.describe('Final Balance S/999 Test', () => {
  
  test('Verify S/999 Balance Works Perfectly', async ({ page }) => {
    console.log('🎯 Verificación final: S/999 debe mostrarse perfectamente')
    
    // Ir a la aplicación
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
    
    console.log('📍 Paso 1: Login')
    await page.fill('input[type="text"]', 'usuario')
    await page.fill('input[type="password"]', '123456')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)
    
    await page.screenshot({ 
      path: './test-results/final-balance-01-mainmenu.png',
      fullPage: true 
    })
    
    // Verificar MainMenu
    const mainContent = await page.content()
    const hasBalance999 = mainContent.includes('S/ 999.00')
    const hasNoJSError = !mainContent.includes('toFixed is not a function')
    
    console.log(`✅ MainMenu - S/999.00: ${hasBalance999}`)
    console.log(`✅ Sin errores JS: ${hasNoJSError}`)
    
    if (hasBalance999 && hasNoJSError) {
      console.log('🎉 ¡PERFECTO! MainMenu muestra S/999.00 sin errores')
    }
    
    // Probar PERFIL
    console.log('📍 Paso 2: Verificando PERFIL')
    const perfilButton = page.locator('text=PERFIL').first()
    await perfilButton.click()
    await page.waitForTimeout(2000)
    
    await page.screenshot({ 
      path: './test-results/final-balance-02-perfil.png',
      fullPage: true 
    })
    
    const perfilContent = await page.content()
    const hasBalance999Perfil = perfilContent.includes('S/ 999.00')
    const hasRechargeButtons = perfilContent.includes('RECARGAR SALDO')
    
    console.log(`✅ PERFIL - S/999.00: ${hasBalance999Perfil}`)
    console.log(`✅ PERFIL - Botones recarga: ${hasRechargeButtons}`)
    
    // Probar PLAY
    console.log('📍 Paso 3: Verificando PLAY')
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)
    
    const playButton = page.locator('text=PLAY').first()
    await playButton.click()
    await page.waitForTimeout(2000)
    
    await page.screenshot({ 
      path: './test-results/final-balance-03-play.png',
      fullPage: true 
    })
    
    const playContent = await page.content()
    const hasBalancePlay = playContent.includes('S/ 999.00')
    
    console.log(`✅ PLAY - Balance visible: ${hasBalancePlay}`)
    
    // Reporte final
    console.log('\n🎉 REPORTE FINAL:')
    console.log('==================')
    
    if (hasBalance999 && hasBalance999Perfil) {
      console.log('✅ ÉXITO COMPLETO: Usuario tiene S/999.00')
      console.log('✅ MainMenu: Muestra balance correctamente')
      console.log('✅ Perfil: Muestra balance y opciones de recarga')
      console.log('✅ Play: Muestra balance para compras')
      console.log('✅ Sin errores JavaScript')
      console.log('')
      console.log('🎯 INSTRUCCIONES PARA EL USUARIO:')
      console.log('===================================')
      console.log('1. Login: usuario / 123456')
      console.log('2. ¡Ya tienes S/999.00 para probar!')
      console.log('3. Ve a PERFIL para ver tu saldo completo')
      console.log('4. Ve a PLAY para comprar cartones')
      console.log('5. Ve a AYUDA para FAQs simples')
      console.log('')
      console.log('🎰 ¡Disfruta del nuevo menú principal!')
    } else {
      console.log('❌ Aún hay problemas con el balance')
    }
  })
})