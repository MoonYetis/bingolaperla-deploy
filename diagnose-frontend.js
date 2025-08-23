const { chromium } = require('playwright-core');

async function diagnoseFrontend() {
  console.log('🔍 Iniciando diagnóstico visual de localhost:5173...');
  
  let browser;
  try {
    // Lanzar navegador
    browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Capturar errores de consola
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
      console.log(`🔔 Console ${msg.type()}: ${msg.text()}`);
    });
    
    // Capturar errores de página
    page.on('pageerror', error => {
      console.error('❌ Page Error:', error.message);
    });
    
    console.log('🌐 Navegando a http://localhost:5173...');
    
    // Navegar a la página
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    // Esperar un momento para que React se renderice
    await page.waitForTimeout(3000);
    
    // Tomar screenshot
    await page.screenshot({ path: 'frontend-screenshot.png', fullPage: true });
    console.log('📸 Screenshot guardado como frontend-screenshot.png');
    
    // Verificar contenido del div root
    const rootContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        exists: !!root,
        innerHTML: root ? root.innerHTML : null,
        hasChildren: root ? root.children.length > 0 : false,
        textContent: root ? root.textContent : null
      };
    });
    
    console.log('🔍 Contenido del div root:', rootContent);
    
    // Verificar si hay elementos visibles
    const visibleElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let visibleCount = 0;
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
          visibleCount++;
        }
      });
      return visibleCount;
    });
    
    console.log(`👁️ Elementos visibles en página: ${visibleElements}`);
    
    // Verificar el título de la página
    const title = await page.title();
    console.log(`📄 Título de página: "${title}"`);
    
    // Verificar si React está cargado
    const reactLoaded = await page.evaluate(() => {
      return typeof window.React !== 'undefined' || document.querySelector('[data-reactroot]') !== null;
    });
    
    console.log(`⚛️ React cargado: ${reactLoaded}`);
    
    // Resumen
    console.log('\n📊 RESUMEN DEL DIAGNÓSTICO:');
    console.log(`- Título: ${title}`);
    console.log(`- Div root existe: ${rootContent.exists}`);
    console.log(`- Div root tiene contenido: ${rootContent.hasChildren}`);
    console.log(`- Elementos visibles: ${visibleElements}`);
    console.log(`- Errores de consola: ${consoleErrors.length}`);
    console.log(`- React cargado: ${reactLoaded}`);
    
    if (consoleErrors.length > 0) {
      console.log('\n❌ ERRORES DE CONSOLA:');
      consoleErrors.forEach((error, i) => {
        console.log(`${i + 1}. ${error}`);
      });
    }
    
    // Mantener navegador abierto por 10 segundos para inspección manual
    console.log('\n⏳ Manteniendo navegador abierto por 10 segundos para inspección...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('💥 Error durante diagnóstico:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

diagnoseFrontend().catch(console.error);