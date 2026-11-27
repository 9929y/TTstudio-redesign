import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 90000,
  workers: 1,
  reporter: [['list']],
  webServer: { command: 'npm run dev', url: 'http://localhost:5183/TikTokStudio_prototype.html', reuseExistingServer: true, timeout: 180000 },
  use: {
    baseURL: 'http://localhost:5183',
    viewport: { width: 1300, height: 940 },
    deviceScaleFactor: 1.5,
    channel: 'chrome',
    screenshot: 'only-on-failure',
  },
});
