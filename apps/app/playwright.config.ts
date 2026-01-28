import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key',
      NEXT_PUBLIC_SIMPLE_ANALYTICS_ENABLED:
        process.env.NEXT_PUBLIC_SIMPLE_ANALYTICS_ENABLED || 'false',
      DATABASE_URL:
        process.env.DATABASE_URL ||
        'postgresql://playwright:playwright@localhost:5432/postgres?pgbouncer=true',
      DIRECT_URL:
        process.env.DIRECT_DATABASE_URL ||
        process.env.DIRECT_URL ||
        'postgresql://playwright:playwright@localhost:5432/postgres',
      BETTER_AUTH_SECRET:
        process.env.BETTER_AUTH_SECRET || 'playwright-default-secret-0123456789abcd',
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || 'http://127.0.0.1:3000',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'test-google-client-id',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || 'test-google-client-secret',
    },
  },
});
