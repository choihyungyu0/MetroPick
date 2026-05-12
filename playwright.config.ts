import { defineConfig, devices } from '@playwright/test'

const shouldStartWebServer = process.env.METROPICK_E2E_MANAGED !== '1'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  ...(shouldStartWebServer
    ? {
        webServer: {
          command: 'node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4173',
          gracefulShutdown: { signal: 'SIGINT', timeout: 500 },
          url: 'http://127.0.0.1:4173',
          reuseExistingServer: !process.env.CI,
        },
      }
    : {}),
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
