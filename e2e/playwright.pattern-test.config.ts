import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración específica para test de patrones sin globalSetup
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Un test a la vez para esta verificación
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1, // Un worker para mejor debugging
  reporter: [
    ['html'],
    ['list'],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on',
    screenshot: 'on',
    video: 'on',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ],

  /* Intentar iniciar el servidor automáticamente */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true, // Usar servidor existente si está corriendo
    timeout: 60000,
  },

  timeout: 120000, // 2 minutos por test
  expect: {
    timeout: 15000,
  },

  outputDir: 'test-results/',
});