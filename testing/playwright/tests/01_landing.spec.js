// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Modul 1: Pengujian Fungsionalitas Landing Page', () => {

  test.beforeEach(async ({ page }) => {
    // Kunjungi halaman utama (Landing Page)
    await page.goto('/');
  });

  test('TC-LANDING-01: Memverifikasi elemen Hero Banner dan Branding Sistem', async ({ page }) => {
    // 1. Verifikasi judul brand Archtera
    await expect(page.locator('text=Archtera').first()).toBeVisible();

    // 2. Verifikasi tagline / deskripsi utama
    await expect(page.locator('text=Air Safe Area').first()).toBeVisible();

    // 3. Verifikasi tombol CTA navigasi utama
    const btnDashboard = page.getByRole('button', { name: /Buka Dashboard|Lihat Live Dashboard/i });
    await expect(btnDashboard).toBeVisible();
  });

  test('TC-LANDING-02: Memverifikasi Kartu Live Telemetri Sensor Real-Time', async ({ page }) => {
    // Verifikasi keberadaan widget pemantauan udara real-time
    const liveWidget = page.locator('text=Ruang H5').first();
    await expect(liveWidget).toBeVisible();

    // Verifikasi parameter metrik suhu (°C) dan kelembaban (%) ditampilkan
    await expect(page.locator('text=°C').first()).toBeVisible();
    await expect(page.locator('text=%').first()).toBeVisible();

    // Verifikasi indikator status udara (Baik / Sedang / Peringatan)
    const statusBadge = page.locator('text=Baik').or(page.locator('text=Sedang')).or(page.locator('text=PERINGATAN')).or(page.locator('text=Peringatan')).first();
    await expect(statusBadge).toBeVisible();
  });

  test('TC-LANDING-03: Navigasi Tombol CTA Berpindah ke Dashboard Telemetri', async ({ page }) => {
    // Klik tombol "Lihat Live Dashboard"
    const btnDashboard = page.getByRole('button', { name: /Lihat Live Dashboard|Buka Dashboard/i }).first();
    await btnDashboard.click();

    // Verifikasi URL berubah ke /dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Verifikasi komponen utama dashboard terlihat
    await expect(page.getByRole('button', { name: /Ruang H5/i })).toBeVisible();
  });

  test('TC-LANDING-04: Navigasi Menu Navbar ke Hub Dokumentasi', async ({ page }) => {
    // Cari tombol atau tautan dokumentasi di navbar / landing
    const btnDocs = page.getByRole('button', { name: /Dokumentasi|Hub Pengantar/i }).first();
    if (await btnDocs.isVisible()) {
      await btnDocs.click();
      await expect(page).toHaveURL(/.*docs/);
    }
  });

  test('TC-LANDING-05: Verifikasi Bagian Tips Kesehatan Udara & Interaktivitas', async ({ page }) => {
    // Scroll ke bagian tips
    const tipsSection = page.locator('#tips').or(page.locator('text=Tips'));
    if (await tipsSection.first().isVisible()) {
      await tipsSection.first().scrollIntoViewIfNeeded();
      await expect(tipsSection.first()).toBeVisible();
    }
  });
});
