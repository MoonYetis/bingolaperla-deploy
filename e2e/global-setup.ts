import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test setup...');
  
  // Wait for services to be ready
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Check backend health directly
    console.log('⏳ Checking backend health...');
    try {
      await page.goto('http://localhost:3001/health');
      console.log('✅ Backend is ready');
    } catch (error) {
      console.log('⚠️ Backend not responding, continuing with frontend-only tests');
    }
    
    // Wait for frontend to load
    console.log('⏳ Waiting for frontend to be ready...');
    await page.goto(config.use?.baseURL || 'http://localhost:5173');
    await page.waitForLoadState('domcontentloaded');
    console.log('✅ Frontend is ready');
    
    console.log('✅ E2E test setup completed successfully');
  } catch (error) {
    console.error('❌ E2E test setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;