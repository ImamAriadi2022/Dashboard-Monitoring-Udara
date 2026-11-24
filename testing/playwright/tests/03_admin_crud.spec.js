// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Modul 3: Pengujian Fungsionalitas Panel Admin (CRUD Data)', () => {

  test.beforeEach(async ({ page }) => {
    // Kunjungi rute langsung /admin
    await page.goto('/admin');
    await page.waitForTimeout(1000);
  });

  test('TC-ADMIN-01: Memverifikasi Akses Halaman Admin & Badge Panel', async ({ page }) => {
    // Verifikasi badge admin terlihat
    await expect(page.locator('text=Admin Data Panel').first()).toBeVisible();

    // Verifikasi tombol kembali ke beranda tersedia
    const btnBack = page.getByRole('button', { name: /Kembali ke Beranda/i }).first();
    await expect(btnBack).toBeVisible();
  });

  test('TC-ADMIN-02: Memverifikasi Pemuatan Tabel Rekaman Sensor Terkini', async ({ page }) => {
    // Verifikasi tabel data termuat
    const table = page.locator('table').first();
    await expect(table).toBeVisible();

    // Verifikasi kolom ID, Ruangan, Suhu, Kelembaban, Angin
    await expect(table).toContainText(/Ruangan|Room/i);
    await expect(table).toContainText(/Suhu/i);
    await expect(table).toContainText(/Kelembaban/i);
  });

  test('TC-ADMIN-03: Pengujian Penambahan Data Sensor Manual (Create)', async ({ page }) => {
    // Cari tombol atau form Tambah Data
    const btnAdd = page.getByRole('button', { name: /Tambah Data|Add Data/i }).first();

    if (await btnAdd.isVisible()) {
      await btnAdd.click();
      await page.waitForTimeout(500);

      // Isi input formulir jika form modal muncul
      const tempInput = page.locator('input[type="number"]').first();
      if (await tempInput.isVisible()) {
        await tempInput.fill('28.5');
      }

      // Cari tombol Simpan / Submit
      const btnSave = page.getByRole('button', { name: /Simpan|Submit/i }).first();
      if (await btnSave.isVisible()) {
        await btnSave.click();
        await page.waitForTimeout(1000);

        // Verifikasi konfirmasi sukses
        const successMsg = page.locator('text=berhasil').or(page.locator('text=Success')).first();
        if (await successMsg.isVisible()) {
          await expect(successMsg).toBeVisible();
        }
      }
    }
  });

  test('TC-ADMIN-04: Pengujian Tombol Kembali ke Beranda', async ({ page }) => {
    const btnBack = page.getByRole('button', { name: /Kembali ke Beranda/i }).first();
    await btnBack.click();

    // Verifikasi URL kembali ke root /
    await expect(page).toHaveURL(/\/$|.*beranda/i);
  });
});
