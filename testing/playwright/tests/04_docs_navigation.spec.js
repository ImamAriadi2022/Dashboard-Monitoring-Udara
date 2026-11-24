// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Modul 4: Pengujian Fungsionalitas Navigasi Seluruh Dokumentasi', () => {

  test('TC-DOCS-01: Navigasi ke Hub Pengantar (/docs-all)', async ({ page }) => {
    await page.goto('/docs-all');
    await expect(page).toHaveURL(/.*docs-all/);
    await expect(page.locator('text=Hub Pengantar').first()).toBeVisible();
    await expect(page.locator('text=202.10.42.14').first()).toBeVisible();
  });

  test('TC-DOCS-02: Navigasi ke Dokumentasi Arsitektur (/docs-arch)', async ({ page }) => {
    await page.goto('/docs-arch');
    await expect(page).toHaveURL(/.*docs-arch/);
    await expect(page.locator('text=Arsitektur').first()).toBeVisible();
  });

  test('TC-DOCS-03: Navigasi ke Dokumentasi Backend (/docs-backend)', async ({ page }) => {
    await page.goto('/docs-backend');
    await expect(page).toHaveURL(/.*docs-backend/);
    await expect(page.locator('text=Backend').first()).toBeVisible();
    await expect(page.locator('text=/api/status').first()).toBeVisible();
  });

  test('TC-DOCS-04: Navigasi ke Dokumentasi Skenario Postman (/docs-postman)', async ({ page }) => {
    await page.goto('/docs-postman');
    await expect(page).toHaveURL(/.*docs-postman/);
    await expect(page.locator('text=Postman').first()).toBeVisible();
    await expect(page.locator('text=Unduh File .JSON Postman').first()).toBeVisible();
  });

  test('TC-DOCS-05: Navigasi ke Dokumentasi Playwright (/docs-playwright)', async ({ page }) => {
    await page.goto('/docs-playwright');
    await expect(page).toHaveURL(/.*docs-playwright/);
    await expect(page.locator('text=Playwright').first()).toBeVisible();
  });

  test('TC-DOCS-06: Navigasi ke Dokumentasi IoT (/docs-iot)', async ({ page }) => {
    await page.goto('/docs-iot');
    await expect(page).toHaveURL(/.*docs-iot/);
    await expect(page.locator('text=ESP32').first()).toBeVisible();
    await expect(page.locator('text=broker.emqx.io').first()).toBeVisible();
  });

  test('TC-DOCS-07: Navigasi ke Dokumentasi VPS (/docs-vps)', async ({ page }) => {
    await page.goto('/docs-vps');
    await expect(page).toHaveURL(/.*docs-vps/);
    await expect(page.locator('text=202.10.42.14').first()).toBeVisible();
    await expect(page.locator('text=ssh root@202.10.42.14').first()).toBeVisible();
  });

  test('TC-DOCS-08: Uji Interaktivitas Tombol Salin Kode (CodeBlock Copy)', async ({ page }) => {
    await page.goto('/docs-backend');
    const copyBtn = page.getByRole('button', { name: /Salin|Copy/i }).first();
    if (await copyBtn.isVisible()) {
      await copyBtn.click();
      await expect(page.locator('text=Tersalin').first()).toBeVisible();
    }
  });
});
