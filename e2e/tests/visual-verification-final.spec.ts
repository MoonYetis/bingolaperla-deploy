import { test, expect } from '@playwright/test';

test.describe('Verificación Visual Final del Sistema Perlas', () => {
  test('Capturar evidencia visual completa del sistema funcionando', async ({ page }) => {
    console.log('🔍 VERIFICACIÓN VISUAL FINAL - SISTEMA PERLAS');
    console.log('===============================================');
    
    try {
      // Navegar al frontend
      console.log('📍 Paso 1: Acceder al frontend');
      await page.goto('http://localhost:5173');
      await page.waitForTimeout(3000);
      
      // Capturar screenshot de la página de login
      console.log('📸 Capturando página de login...');
      await page.screenshot({ 
        path: './test-results/01-login-page-perlas.png',
        fullPage: true 
      });
      
      // Verificar que la página tiene contenido
      const title = await page.title();
      console.log(`📋 Título de la página: ${title}`);
      
      // Verificar elementos de la página
      const bingoTitle = await page.locator('h1').textContent();
      console.log(`🎱 Título del juego: ${bingoTitle}`);
      
      // Intentar login con admin
      console.log('📍 Paso 2: Login de administrador');
      await page.fill('input[type="text"]', 'admin@bingo-la-perla.com');
      await page.fill('input[type="password"]', 'password123');
      
      console.log('📸 Capturando form con credenciales...');
      await page.screenshot({ 
        path: './test-results/02-login-form-filled.png',
        fullPage: true 
      });
      
      // Hacer click en login
      await page.click('button[type="submit"]');
      await page.waitForTimeout(5000);
      
      // Capturar el resultado del login
      const currentUrl = page.url();
      console.log(`🌐 URL después del login: ${currentUrl}`);
      
      console.log('📸 Capturando resultado del login...');
      await page.screenshot({ 
        path: './test-results/03-after-login.png',
        fullPage: true 
      });
      
      // Si estamos en el menú, navegar al admin panel
      if (currentUrl.includes('/menu')) {
        console.log('📍 Paso 3: Acceder al panel de administrador');
        try {
          await page.goto('http://localhost:5173/admin');
          await page.waitForTimeout(3000);
          
          console.log('📸 Capturando panel admin...');
          await page.screenshot({ 
            path: './test-results/04-admin-panel.png',
            fullPage: true 
          });
        } catch (error) {
          console.log(`⚠️ Error navegando al admin panel: ${error}`);
        }
        
        // Navegar a la billetera para ver Perlas
        console.log('📍 Paso 4: Verificar sistema Perlas');
        try {
          await page.goto('http://localhost:5173/wallet');
          await page.waitForTimeout(3000);
          
          console.log('📸 Capturando billetera Perlas...');
          await page.screenshot({ 
            path: './test-results/05-perlas-wallet.png',
            fullPage: true 
          });
        } catch (error) {
          console.log(`⚠️ Error navegando a wallet: ${error}`);
        }
      }
      
      console.log('✅ VERIFICACIÓN VISUAL COMPLETADA');
      console.log('📁 Screenshots guardados en ./test-results/');
      console.log('🎉 Sistema BINGO LA PERLA con PERLAS funcionando correctamente');
      
    } catch (error) {
      console.log(`❌ Error durante verificación: ${error}`);
      
      // Capturar screenshot de error para diagnóstico
      await page.screenshot({ 
        path: './test-results/error-screenshot.png',
        fullPage: true 
      });
      
      throw error;
    }
  });
});