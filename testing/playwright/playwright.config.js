// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Konfigurasi Resmi Playwright Test untuk Sistem Archtera — Air Safe Area
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',
  /* Jalankan pengujian secara paralel */
  fullyParallel: true,
  /* Gagal build pada CI jika test.only tertinggal */
  forbidOnly: !!process.env.CI,
  /* Ulangi pengujian jika gagal di CI */
  retries: process.env.CI ? 2 : 1,
  /* Batas pekerja paralel */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter hasil pengujian */
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list']
  ],
  /* Pengaturan global untuk seluruh browser */
  use: {
    /* Base URL aplikasi (dapat dioverride via variabel environment) */
    baseURL: process.env.BASE_URL || 'https://archtera.web.id',

    /* Abaikan sertifikat SSL self-signed jika menguji ke IP VPS langsung */
    ignoreHTTPSErrors: true,

    /* Ambil tangkapan layar saat pengujian gagal */
    screenshot: 'only-on-failure',

    /* Rekam jejak trace untuk debugging */
    trace: 'on-first-retry',

    /* Rekam video untuk kegagalan pengujian */
    video: 'retain-on-failure',

    /* Timeout per aksi (10 detik) */
    actionTimeout: 10000,
  },

  /* Timeout per test case (30 detik) */
  timeout: 30000,

  /* Ekspektasi timeout assertion (5 detik) */
  expect: {
    timeout: 5000,
  },

  /* Matriks Browser Pengujian Cross-Browser */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    /* Uji Tampilan Mobile */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
});
