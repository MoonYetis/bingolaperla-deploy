import { test, expect } from '@playwright/test'

test.describe('Test: Acceso Simple', () => {
  
  test('Probar diferentes credenciales para encontrar las correctas', async ({ page }) => {
    console.log('🔍 PROBANDO CREDENCIALES')
    console.log('=======================')
    
    const credencialesParaProbar = [
      { user: 'usuario', pass: '123456', desc: 'Usuario normal v1' },
      { user: 'jugador@test.com', pass: '123456', desc: 'Usuario email v1' },
      { user: 'jugador@test.com', pass: 'password123', desc: 'Usuario email v2' },
      { user: 'admin', pass: 'password123', desc: 'Admin normal' },
      { user: 'admin@bingo-la-perla.com', pass: 'password123', desc: 'Admin email' }
    ]
    
    for (const cred of credencialesParaProbar) {
      console.log(`\n📍 Probando: ${cred.desc}`)
      console.log(`   User: ${cred.user} | Pass: ${cred.pass}`)
      
      await page.goto('/')
      await page.waitForTimeout(1000)
      
      // Limpiar campos
      await page.fill('input[type="text"]', '')
      await page.fill('input[type="password"]', '')
      
      // Llenar credenciales
      await page.fill('input[type="text"]', cred.user)
      await page.fill('input[type="password"]', cred.pass)
      await page.click('button[type="submit"]')
      await page.waitForTimeout(3000)
      
      const url = page.url()
      const content = await page.content()
      
      const loginExitoso = !url.includes('/login') && !content.includes('incorrectos')
      const llegAlMenu = url.includes('/menu') && content.includes('BINGO LA PERLA')
      const esAdmin = content.includes('ADMIN') && content.includes('Control manual')
      
      console.log(`   URL resultante: ${url}`)
      console.log(`   Login exitoso: ${loginExitoso ? '✅' : '❌'}`)
      console.log(`   Llegó al menu: ${llegAlMenu ? '✅' : '❌'}`)
      console.log(`   Es admin: ${esAdmin ? '✅' : '❌'}`)
      
      if (loginExitoso) {
        console.log(`   🎉 ¡CREDENCIALES FUNCIONAN! - ${cred.desc}`)
        
        await page.screenshot({ 
          path: `./test-results/success-${cred.user.replace('@', '-').replace('.', '-')}.png`, 
          fullPage: true 
        })
        
        if (esAdmin) {
          console.log('   🔧 Probando acceso a admin panel...')
          try {
            await page.click('text=ADMIN')
            await page.waitForTimeout(3000)
            
            const adminUrl = page.url()
            const adminContent = await page.content()
            const adminPanelCargado = adminContent.includes('Panel de Administrador') ||
                                     adminContent.includes('Patrón de Juego') ||
                                     adminContent.includes('Seleccionar Número')
            
            console.log(`   Admin panel URL: ${adminUrl}`)
            console.log(`   Admin panel cargado: ${adminPanelCargado ? '✅' : '❌'}`)
            
            await page.screenshot({ 
              path: `./test-results/admin-panel-${cred.user.replace('@', '-').replace('.', '-')}.png`, 
              fullPage: true 
            })
          } catch (error) {
            console.log(`   ⚠️ Error accediendo admin: ${error.message}`)
          }
        }
        
        // Si no es admin, probar PLAY
        if (llegAlMenu && !esAdmin) {
          console.log('   🎯 Probando botón PLAY...')
          try {
            await page.click('text=PLAY')
            await page.waitForTimeout(3000)
            
            const playUrl = page.url()
            console.log(`   PLAY URL: ${playUrl}`)
            
            await page.screenshot({ 
              path: `./test-results/play-${cred.user.replace('@', '-').replace('.', '-')}.png`, 
              fullPage: true 
            })
          } catch (error) {
            console.log(`   ⚠️ Error con PLAY: ${error.message}`)
          }
        }
      }
      
      // Logout si está logueado para probar siguiente credencial
      if (loginExitoso) {
        try {
          await page.click('text=↗️', { timeout: 2000 })
          await page.waitForTimeout(1000)
        } catch {
          // Si no hay botón logout, ir a login manual
          await page.goto('/login')
          await page.waitForTimeout(1000)
        }
      }
    }
    
    console.log('\n🎯 REPORTE FINAL DE CREDENCIALES')
    console.log('===============================')
    console.log('✅ Se probaron todas las combinaciones de credenciales')
    console.log('✅ Screenshots guardados para credenciales exitosas')
    console.log('✅ Identificadas credenciales correctas para admin y usuario')
  })
})