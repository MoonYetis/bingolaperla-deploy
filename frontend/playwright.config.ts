import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración Playwright optimizada para Bingo La Perla
 * Maneja debug overlay y elementos inestables
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Configuración para manejar elementos lentos y overlay */
  timeout: 30000, // 30s por test - overlay puede causar lentitud
  expect: {
    timeout: 8000, // Elementos pueden tardar por overlay z-index
  },
  
  /* Paralelismo controlado para evitar conflicts */
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 1, // Un worker para evitar port conflicts
  
  /* Reporter optimizado para debugging */
  reporter: [
    ['html', { outputFolder: 'test-results/html' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['line'],
    ['allure-playwright']
  ],
  
  /* Configuración global */
  use: {
    /* Base URL de desarrollo */
    baseURL: 'http://localhost:5174',
    
    /* Timeouts aumentados por debug overlay */
    actionTimeout: 10000,
    navigationTimeout: 15000,
    
    /* Captura para debugging */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    /* Headers para bypass cache */
    extraHTTPHeaders: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  },

  /* Configuración de proyectos multi-device */
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    
    /* Desktop Chrome - Configuración principal */
    {
      name: 'desktop-chrome',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        // Simular conexión rápida para evitar timeouts
        contextOptions: {
          reducedMotion: 'reduce' // Reducir animaciones
        }
      },
      dependencies: ['setup'],
    },
    
    /* Mobile - Vista móvil PWA */
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        viewport: { width: 375, height: 667 },
        isMobile: true,
        hasTouch: true,
      },
      dependencies: ['setup'],
    },
    
    /* Desktop Firefox - Cross-browser */
    {
      name: 'desktop-firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
      },
      dependencies: ['setup'],
    }
  ],

  /* Servidor local para desarrollo */
  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:5174',
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
    // Backend también debe estar corriendo
    {
      command: 'cd ../backend && npm run dev',
      url: 'http://localhost:3001/api/games',
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    }
  ],

  /* Configuración de output */
  outputDir: 'test-results/',
  
  /* Global setup para limpiar estado */
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
});