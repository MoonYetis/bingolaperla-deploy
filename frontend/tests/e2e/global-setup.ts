import { chromium } from '@playwright/test'

async function globalSetup() {
  console.log('🚀 Starting global setup for Bingo La Perla E2E tests...')
  
  // Verificar que los servidores están corriendo
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    console.log('🔍 Checking frontend server...')
    await page.goto('http://localhost:5174', { timeout: 10000 })
    console.log('✅ Frontend server is running')
    
    console.log('🔍 Checking backend API...')
    const response = await page.goto('http://localhost:3001/api/games', { timeout: 10000 })
    if (response?.ok()) {
      console.log('✅ Backend API is responding')
    } else {
      throw new Error('Backend API not responding correctly')
    }
    
    // Limpiar cualquier estado previo en localStorage
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    
    console.log('✅ Global setup completed successfully')
    
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
}

export default globalSetup