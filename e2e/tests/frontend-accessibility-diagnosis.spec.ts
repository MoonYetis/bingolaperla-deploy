import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('Frontend Accessibility Diagnosis', () => {
  let viteProcess: any;

  test.beforeAll(async () => {
    // Try to start the frontend if it's not running
    console.log('Attempting to start frontend development server...');
    try {
      // Check if vite is already running on port 5173
      execSync('curl -I http://localhost:5173', { timeout: 2000 });
      console.log('Frontend is already running');
    } catch (error) {
      console.log('Frontend not running, attempting to start...');
      try {
        // Start vite in background
        const { spawn } = require('child_process');
        viteProcess = spawn('npm', ['run', 'dev'], {
          cwd: '/Users/osmanmarin/Documents/Bingo-deploy/frontend',
          detached: true,
          stdio: 'ignore'
        });
        
        // Wait for server to start
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (startError) {
        console.error('Failed to start frontend:', startError);
      }
    }
  });

  test.afterAll(async () => {
    // Clean up the vite process if we started it
    if (viteProcess) {
      try {
        process.kill(-viteProcess.pid);
      } catch (error) {
        console.log('Process cleanup error (normal):', error.message);
      }
    }
  });

  test('should verify frontend server accessibility', async ({ page }) => {
    console.log('=== FRONTEND ACCESSIBILITY DIAGNOSIS ===');
    
    // Test 1: Direct URL access
    test.step('Test direct URL access to http://localhost:5173', async () => {
      try {
        await page.goto('http://localhost:5173', { 
          waitUntil: 'networkidle',
          timeout: 10000 
        });
        
        // Take screenshot of successful load
        await page.screenshot({ 
          path: '/Users/osmanmarin/Documents/Bingo-deploy/frontend-success-screenshot.png',
          fullPage: true 
        });
        
        console.log('✅ Successfully accessed http://localhost:5173');
        
        // Check if React app loaded
        const title = await page.title();
        console.log('Page title:', title);
        
        // Check for React root element
        const reactRoot = await page.locator('#root').count();
        expect(reactRoot).toBeGreaterThan(0);
        console.log('✅ React root element found');
        
      } catch (error) {
        console.log('❌ Failed to access http://localhost:5173');
        console.log('Error details:', error.message);
        
        // Take screenshot of error state
        await page.screenshot({ 
          path: '/Users/osmanmarin/Documents/Bingo-deploy/frontend-error-screenshot.png' 
        });
        
        throw error;
      }
    });
  });

  test('should test alternative URLs and diagnose connectivity', async ({ page }) => {
    console.log('=== TESTING ALTERNATIVE URLS ===');
    
    const urlsToTest = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://0.0.0.0:5173',
      'http://192.168.100.30:5173'
    ];
    
    for (const url of urlsToTest) {
      test.step(`Test connectivity to ${url}`, async () => {
        try {
          console.log(`Testing ${url}...`);
          const response = await page.goto(url, { 
            waitUntil: 'domcontentloaded',
            timeout: 5000 
          });
          
          if (response) {
            console.log(`✅ ${url} - Status: ${response.status()}`);
            if (response.status() === 200) {
              await page.screenshot({ 
                path: `/Users/osmanmarin/Documents/Bingo-deploy/frontend-${url.replace(/[^a-zA-Z0-9]/g, '_')}-screenshot.png` 
              });
            }
          }
        } catch (error) {
          console.log(`❌ ${url} - Failed: ${error.message}`);
        }
      });
    }
  });

  test('should diagnose backend connectivity from frontend', async ({ page }) => {
    console.log('=== BACKEND CONNECTIVITY DIAGNOSIS ===');
    
    // Test backend API endpoints that frontend tries to access
    const apiEndpoints = [
      'http://localhost:3001/api/games',
      'http://localhost:3001/api/auth/login',
      'http://localhost:3001/api/auth/logout'
    ];
    
    for (const endpoint of apiEndpoints) {
      test.step(`Test API endpoint ${endpoint}`, async () => {
        try {
          const response = await page.request.get(endpoint);
          console.log(`✅ ${endpoint} - Status: ${response.status()}`);
        } catch (error) {
          console.log(`❌ ${endpoint} - Failed: ${error.message}`);
        }
      });
    }
  });

  test('should capture network logs and errors', async ({ page }) => {
    console.log('=== NETWORK LOGS AND ERROR CAPTURE ===');
    
    const networkLogs: any[] = [];
    const consoleErrors: any[] = [];
    
    // Capture network requests
    page.on('request', request => {
      networkLogs.push({
        type: 'request',
        url: request.url(),
        method: request.method()
      });
    });
    
    // Capture network responses
    page.on('response', response => {
      networkLogs.push({
        type: 'response',
        url: response.url(),
        status: response.status()
      });
    });
    
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    try {
      await page.goto('http://localhost:5173', { 
        waitUntil: 'networkidle',
        timeout: 10000 
      });
      
      // Wait for potential API calls
      await page.waitForTimeout(3000);
      
      console.log('=== NETWORK REQUESTS ===');
      networkLogs.forEach(log => {
        console.log(`${log.type.toUpperCase()}: ${log.method || ''} ${log.url} ${log.status || ''}`);
      });
      
      console.log('=== CONSOLE ERRORS ===');
      consoleErrors.forEach(error => {
        console.log(`ERROR: ${error}`);
      });
      
    } catch (error) {
      console.log('Failed to capture network logs:', error.message);
    }
  });

  test('should test system port availability', async () => {
    console.log('=== SYSTEM PORT AVAILABILITY TEST ===');
    
    const portsToTest = [5173, 3001, 3000];
    
    for (const port of portsToTest) {
      test.step(`Test port ${port} availability`, async () => {
        try {
          const { execSync } = require('child_process');
          
          // Try to connect to the port
          try {
            const result = execSync(`curl -I http://localhost:${port}`, { 
              timeout: 2000,
              encoding: 'utf8' 
            });
            console.log(`✅ Port ${port} - Accessible`);
          } catch (curlError) {
            // Check if it's a connection refused vs other error
            if (curlError.message.includes('Connection refused') || 
                curlError.message.includes('Couldn\'t connect')) {
              console.log(`❌ Port ${port} - Connection refused (service not running)`);
            } else {
              console.log(`⚠️  Port ${port} - Other error: ${curlError.message}`);
            }
          }
          
          // Check what's listening on the port
          try {
            const lsofResult = execSync(`lsof -i :${port}`, { 
              timeout: 2000,
              encoding: 'utf8' 
            });
            console.log(`Port ${port} listeners:`, lsofResult);
          } catch (lsofError) {
            console.log(`Port ${port} - No listeners found`);
          }
          
        } catch (error) {
          console.log(`Port ${port} test failed:`, error.message);
        }
      });
    }
  });
});