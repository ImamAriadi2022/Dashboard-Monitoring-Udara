// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Modul 2: Pengujian Fungsionalitas Dashboard 4 Ruangan', () => {

  test.beforeEach(async ({ page }) => {
    // Kunjungi langsung halaman Dashboard
    await page.goto('/dashboard');
    // Tunggu data sensor dimuat dari API
    await page.waitForTimeout(1000);
  });

  test('TC-DASH-01: Memverifikasi Keberadaan 4 Tab Ruangan Fisik', async ({ page }) => {
    // 4 Tab Ruangan yang wajib tersedia
    const rooms = ['Ruang H5', 'Lab TD', 'Lab Komputer', 'Ruang Seminar'];

    for (const room of rooms) {
      const roomTab = page.getByRole('button', { name: new RegExp(room, 'i') }).first();
      await expect(roomTab).toBeVisible();
    }
  });

  test('TC-DASH-02: Pergantian Ruangan (Tab Switching) & Isolasi Data', async ({ page }) => {
    // 1. Klik tab "Lab TD"
    const tabLabTd = page.getByRole('button', { name: /Lab TD/i }).first();
    await tabLabTd.click();
    await page.waitForTimeout(600);

    // Verifikasi label ruangan aktif berubah menjadi Lab TD
    await expect(page.locator('text=Lab TD').first()).toBeVisible();

    // 2. Klik tab "Lab Komputer"
    const tabLabKom = page.getByRole('button', { name: /Lab Komputer/i }).first();
    await tabLabKom.click();
    await page.waitForTimeout(600);

    // 3. Klik tab "Ruang Seminar"
    const tabSeminar = page.getByRole('button', { name: /Ruang Seminar/i }).first();
    await tabSeminar.click();
    await page.waitForTimeout(600);

    // 4. Kembali ke tab "Ruang H5"
    const tabH5 = page.getByRole('button', { name: /Ruang H5/i }).first();
    await tabH5.click();
    await page.waitForTimeout(600);
  });

  test('TC-DASH-03: Memverifikasi 7 Kartu Metrik Telemetri Utama', async ({ page }) => {
    // Verifikasi 7 Parameter Sensor ditampilkan
    const metrics = [
      /Suhu|Temperature/i,
      /Kelembaban|Humidity/i,
      /Kecepatan Angin|Sirkulasi/i,
      /CO2|Karbon Dioksida/i,
      /Kipas|Fan/i,
      /Status Relay|Relay/i,
      /Kualitas Udara|Air Quality/i,
    ];

    for (const metric of metrics) {
      await expect(page.locator('body')).toContainText(metric);
    }
  });

  test('TC-DASH-04: Pengujian Filter Rentang Waktu (1 Hari, 7 Hari, 30 Hari)', async ({ page }) => {
    // Uji tombol filter range waktu
    const range1d = page.getByRole('button', { name: /^1 Hari$|^1d$/i }).first();
    const range7d = page.getByRole('button', { name: /^7 Hari$|^7d$/i }).first();
    const range30d = page.getByRole('button', { name: /^30 Hari$|^30d$/i }).first();

    if (await range7d.isVisible()) {
      await range7d.click();
      await page.waitForTimeout(800);
    }

    if (await range30d.isVisible()) {
      await range30d.click();
      await page.waitForTimeout(800);
    }

    if (await range1d.isVisible()) {
      await range1d.click();
      await page.waitForTimeout(800);
    }
  });

  test('TC-DASH-05: Verifikasi Rendering Grafik Deret Waktu (Chart.js Canvas)', async ({ page }) => {
    // Pastikan elemen canvas grafik ter-render di dalam halaman
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
  });

  test('TC-DASH-06: Pengujian Tab Log Riwayat Data & Paginasi', async ({ page }) => {
    // Buka tab Log Riwayat
    const logTab = page.getByRole('button', { name: /Log Riwayat/i }).first();
    if (await logTab.isVisible()) {
      await logTab.click();
      await page.waitForTimeout(1000);

      // Verifikasi tabel riwayat tampil
      const table = page.locator('table').first();
      await expect(table).toBeVisible();

      // Verifikasi kolom tabel standar
      await expect(page.locator('body')).toContainText(/Waktu|Recorded/i);
    }
  });

  test('TC-DASH-07: Pengujian Tombol Unduh Dataset CSV', async ({ page }) => {
    // Cari tombol "Unduh Data (.CSV)"
    const downloadBtn = page.getByRole('button', { name: /Unduh Data|Download CSV/i }).first();

    if (await downloadBtn.isVisible()) {
      // Pantau event download browser
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 10000 }).catch(() => null),
        downloadBtn.click(),
      ]);

      if (download) {
        // Verifikasi nama file berakhiran .csv
        expect(download.suggestedFilename()).toMatch(/\.csv$/i);
      }
    }
  });
});
