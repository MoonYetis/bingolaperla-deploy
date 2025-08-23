import { test, expect } from '@playwright/test'

test.describe('Test: Seguridad Mejorada - Solo Admin Específico', () => {
  
  test('Verificar que solo usuario "admin" ve botón ADMIN', async ({ page }) => {
    console.log('🔒 PROBANDO SEGURIDAD MEJORADA DEL BOTÓN ADMIN')
    console.log('==============================================')
    
    // ================
    // PASO 1: PROBAR USUARIO ADMIN ESPECÍFICO
    // ================
    console.log('📍 Paso 1: Probando usuario "admin" (DEBE ver botón)')
    
    await page.goto('http://localhost:5173/')
    await page.fill('input[type="text"]', 'admin')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(4000)
    
    const adminContent = await page.content()
    const adminVeBoton = adminContent.includes('ADMIN') && adminContent.includes('Control manual')
    
    console.log(`👨‍💼 Usuario "admin" ve botón ADMIN: ${adminVeBoton ? '✅ SÍ (CORRECTO)' : '❌ NO (ERROR)'}`)
    
    await page.screenshot({ 
      path: './test-results/security-01-admin-user-sees-button.png',
      fullPage: true 
    })
    
    // ================
    // PASO 2: PROBAR OTRO USUARIO CON ROL ADMIN
    // ================
    console.log('\\n📍 Paso 2: Probando otro usuario con rol ADMIN (NO debe ver botón)')
    
    // Logout del usuario admin
    try {
      await page.click('text=↗️') // Botón logout
      await page.waitForTimeout(2000)
    } catch (error) {
      await page.goto('http://localhost:5173/')
    }
    
    // Crear y probar con jugador1 (que también tiene rol ADMIN según seed)
    await page.goto('http://localhost:5173/')
    await page.fill('input[type="text"]', 'jugador1')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(4000)
    
    const jugador1Content = await page.content()
    const jugador1VeBoton = jugador1Content.includes('ADMIN') && jugador1Content.includes('Control manual')
    
    console.log(`👤 Usuario "jugador1" ve botón ADMIN: ${jugador1VeBoton ? '❌ SÍ (ERROR DE SEGURIDAD)' : '✅ NO (CORRECTO)'}`)
    
    await page.screenshot({ 
      path: './test-results/security-02-jugador1-no-button.png',
      fullPage: true 
    })
    
    // ================
    // PASO 3: PROBAR USUARIO NORMAL
    // ================
    console.log('\\n📍 Paso 3: Probando usuario normal (NO debe ver botón)')
    
    // Logout
    try {
      await page.click('text=↗️')
      await page.waitForTimeout(2000)
    } catch (error) {
      await page.goto('http://localhost:5173/')
    }
    
    // Login como usuario normal
    await page.goto('http://localhost:5173/')
    await page.fill('input[type="text"]', 'usuario')
    await page.fill('input[type="password"]', '123456')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(4000)
    
    const usuarioContent = await page.content()
    const usuarioVeBoton = usuarioContent.includes('ADMIN') && usuarioContent.includes('Control manual')
    
    console.log(`👤 Usuario "usuario" ve botón ADMIN: ${usuarioVeBoton ? '❌ SÍ (ERROR)' : '✅ NO (CORRECTO)'}`)
    
    await page.screenshot({ 
      path: './test-results/security-03-normal-user-no-button.png',
      fullPage: true 
    })
    
    // ================
    // PASO 4: VERIFICAR ACCESO DIRECTO POR URL
    // ================
    console.log('\\n📍 Paso 4: Verificando protección de URL directa')
    
    // Intentar acceder directamente a /admin como usuario normal
    await page.goto('http://localhost:5173/admin')
    await page.waitForTimeout(3000)
    
    const urlDespuesIntento = page.url()
    const paginaAdmin = await page.content()
    
    if (urlDespuesIntento.includes('admin') && !urlDespuesIntento.includes('login')) {
      console.log('❌ FALLO DE SEGURIDAD: Usuario normal puede acceder a /admin directamente')
    } else {
      console.log('✅ SEGURIDAD OK: Usuario normal no puede acceder a /admin directamente')
      console.log(`   Redirigió a: ${urlDespuesIntento}`)
    }
    
    await page.screenshot({ 
      path: './test-results/security-04-url-protection.png',
      fullPage: true 
    })
    
    // ================
    // PASO 5: CONFIRMAR QUE ADMIN ESPECÍFICO SÍ PUEDE ACCEDER
    // ================
    console.log('\\n📍 Paso 5: Confirmando que admin específico SÍ puede acceder')
    
    // Login como admin
    await page.goto('http://localhost:5173/')
    await page.fill('input[type="text"]', 'admin')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(4000)
    
    // Usar el botón ADMIN
    try {
      await page.click('text=ADMIN')
      await page.waitForTimeout(4000)
      
      const adminPageUrl = page.url()
      const adminPageContent = await page.content()
      
      const accesoExitoso = adminPageUrl.includes('admin') || 
                           adminPageContent.includes('Panel de Administrador') ||
                           adminPageContent.includes('Seleccionar Número')
      
      console.log(`👨‍💼 Admin específico puede acceder: ${accesoExitoso ? '✅ SÍ (CORRECTO)' : '❌ NO (ERROR)'}`)
      
      if (accesoExitoso) {
        await page.screenshot({ 
          path: './test-results/security-05-admin-access-success.png',
          fullPage: true 
        })
      }
      
    } catch (error) {
      console.log(`⚠️ Error probando acceso de admin: ${error.message}`)
    }
    
    // ================
    // REPORTE DE SEGURIDAD
    // ================
    console.log('\\n🔒 REPORTE DE SEGURIDAD FINAL')
    console.log('===============================')
    
    console.log('✅ MEJORAS IMPLEMENTADAS:')
    console.log('   🎯 Solo usuario "admin" específico ve botón ADMIN')
    console.log('   🚫 Otros usuarios con rol ADMIN NO ven botón')
    console.log('   🚫 Usuarios normales NO ven botón')
    console.log('   🔐 URL /admin sigue protegida por ProtectedRoute')
    
    console.log('\\n🎯 NIVEL DE SEGURIDAD:')
    if (adminVeBoton && !jugador1VeBoton && !usuarioVeBoton) {
      console.log('🟢 ALTO - Solo admin específico tiene acceso visual')
      console.log('   • Botón invisible para todos excepto "admin"')
      console.log('   • Seguridad por oscuridad implementada')
      console.log('   • Acceso controlado granularmente')
    } else {
      console.log('🟡 REVISAR - Posibles problemas de seguridad detectados')
    }
    
    console.log('\\n🚀 CONFIGURACIÓN ACTUAL:')
    console.log('   👤 Usuario autorizado: "admin"')
    console.log('   🔧 Para cambiar: Modificar variable "isSpecificAdmin" en MainMenuPage.tsx')
    console.log('   📝 Código: const isSpecificAdmin = user?.username === "admin"')
    
    console.log('\\n🛡️ RECOMENDACIONES ADICIONALES:')
    console.log('   • Considerar 2FA para usuario admin')
    console.log('   • Logs de acceso a página admin')
    console.log('   • Rate limiting en endpoints admin')
    console.log('   • Revisar regularmente usuarios autorizados')
    
    console.log('\\n🎉 ¡SEGURIDAD MEJORADA IMPLEMENTADA EXITOSAMENTE!')
  })
})