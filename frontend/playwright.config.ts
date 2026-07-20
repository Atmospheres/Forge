import { defineConfig, devices } from '@playwright/test';

try {
  process.loadEnvFile('.env.e2e');
} catch {
  // Not set up yet -- global.setup.ts gives a clear error naming the
  // missing vars, so there's nothing useful to do here besides not crash.
}

/**
 * Runs against the real backend + real Postgres + real Auth0 login, not a
 * mock. See e2e/README.md for the one-time setup (an isolated E2E database,
 * a dedicated Auth0 test user, and pointing the backend at both).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // tests share one Auth0 test account and one database
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/user.json' },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
