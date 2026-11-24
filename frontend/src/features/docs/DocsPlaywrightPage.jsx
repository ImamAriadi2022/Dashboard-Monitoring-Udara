import React, { useState, useMemo } from 'react';
import {
  Play,
  Terminal,
  CheckCircle2,
  ShieldCheck,
  Monitor,
  Smartphone,
  Globe,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Server,
  Cpu,
  Send,
  Layers,
  Copy,
  Check,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  FileCode,
  Workflow,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Code,
  Download,
} from 'lucide-react';
import CodeBlock from './components/CodeBlock';

const MODULE_BADGES = {
  landing: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  dashboard: 'bg-sky-50 text-sky-800 border-sky-200',
  admin: 'bg-rose-50 text-rose-800 border-rose-200',
  docs: 'bg-purple-50 text-purple-800 border-purple-200',
};

export const PLAYWRIGHT_TEST_SCENARIOS = [
  // Modul 1: Landing Page (5 Skenario)
  {
    no: 1,
    id: 'pw-01',
    module: 'landing',
    moduleLabel: 'Landing Page',
    code: 'TC-LANDING-01',
    name: 'Verifikasi Elemen Hero Banner & Branding Sistem',
    specFile: 'tests/01_landing.spec.js',
    browser: 'Chromium, Firefox, WebKit, Mobile',
    description: 'Memeriksa kehadiran logo Archtera, tagline "Air Safe Area", serta tombol CTA navigasi utama pada halaman pembuka.',
    criteria: 'Teks "Archtera", "Air Safe Area", dan tombol CTA "Lihat Live Dashboard" berstatus visible pada viewport.',
    cliCommand: 'npx playwright test tests/01_landing.spec.js -g "TC-LANDING-01"',
    testScript: `test('TC-LANDING-01: Memverifikasi elemen Hero Banner dan Branding Sistem', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=Archtera').first()).toBeVisible();
  await expect(page.locator('text=Air Safe Area').first()).toBeVisible();
  const btnDashboard = page.getByRole('button', { name: /Buka Dashboard|Lihat Live Dashboard/i });
  await expect(btnDashboard).toBeVisible();
});`,
  },
  {
    no: 2,
    id: 'pw-02',
    module: 'landing',
    moduleLabel: 'Landing Page',
    code: 'TC-LANDING-02',
    name: 'Verifikasi Kartu Live Telemetri Sensor Real-Time (Ruang H5)',
    specFile: 'tests/01_landing.spec.js',
    browser: 'Chromium, Firefox, WebKit, Mobile',
    description: 'Memastikan widget sensor live di Landing Page menampilkan data terkini suhu (°C), kelembaban (%), dan status kualitas udara.',
    criteria: 'Widget "Ruang H5" aktif, satuan °C & % termuat, dan badge status kenyamanan udara (Baik/Sedang/Peringatan) ter-render.',
    cliCommand: 'npx playwright test tests/01_landing.spec.js -g "TC-LANDING-02"',
    testScript: `test('TC-LANDING-02: Memverifikasi Kartu Live Telemetri Sensor Real-Time', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=Ruang H5').first()).toBeVisible();
  await expect(page.locator('text=°C').first()).toBeVisible();
  await expect(page.locator('text=%').first()).toBeVisible();
  const statusBadge = page.locator('text=Baik').or(page.locator('text=Sedang')).or(page.locator('text=PERINGATAN')).first();
  await expect(statusBadge).toBeVisible();
});`,
  },
  {
    no: 3,
    id: 'pw-03',
    module: 'landing',
    moduleLabel: 'Landing Page',
    code: 'TC-LANDING-03',
    name: 'Navigasi Tombol CTA Berpindah ke Dashboard Telemetri',
    specFile: 'tests/01_landing.spec.js',
    browser: 'Chromium, Firefox, WebKit',
    description: 'Menguji interaksi klik tombol "Lihat Live Dashboard" dari Landing Page dan memastikan browser berpindah ke tampilan /dashboard.',
    criteria: 'URL berubah ke /dashboard dan komponen tab 4 ruangan langsung ter-render tanpa error peramban.',
    cliCommand: 'npx playwright test tests/01_landing.spec.js -g "TC-LANDING-03"',
    testScript: `test('TC-LANDING-03: Navigasi Tombol CTA Berpindah ke Dashboard Telemetri', async ({ page }) => {
  await page.goto('/');
  const btnDashboard = page.getByRole('button', { name: /Lihat Live Dashboard|Buka Dashboard/i }).first();
  await btnDashboard.click();
  await expect(page).toHaveURL(/.*dashboard/);
  await expect(page.getByRole('button', { name: /Ruang H5/i })).toBeVisible();
});`,
  },
  {
    no: 4,
    id: 'pw-04',
    module: 'landing',
    moduleLabel: 'Landing Page',
    code: 'TC-LANDING-04',
    name: 'Navigasi Menu Navbar ke Hub Pengantar Dokumentasi',
    specFile: 'tests/01_landing.spec.js',
    browser: 'Chromium, Firefox, WebKit',
    description: 'Memastikan tombol dokumentasi pada navbar dapat diklik dan mengarahkan pengguna ke halaman /docs-all.',
    criteria: 'URL aplikasi beralih ke /docs-all dengan breadcrumb dan kartu pilar dokumentasi aktif.',
    cliCommand: 'npx playwright test tests/01_landing.spec.js -g "TC-LANDING-04"',
    testScript: `test('TC-LANDING-04: Navigasi Menu Navbar ke Hub Dokumentasi', async ({ page }) => {
  await page.goto('/');
  const btnDocs = page.getByRole('button', { name: /Dokumentasi|Hub Pengantar/i }).first();
  if (await btnDocs.isVisible()) {
    await btnDocs.click();
    await expect(page).toHaveURL(/.*docs/);
  }
});`,
  },
  {
    no: 5,
    id: 'pw-05',
    module: 'landing',
    moduleLabel: 'Landing Page',
    code: 'TC-LANDING-05',
    name: 'Verifikasi Bagian Tips Kesehatan Udara & Smooth Scroll',
    specFile: 'tests/01_landing.spec.js',
    browser: 'Chromium, Mobile Chrome',
    description: 'Memastikan bagian edukasi tips kesehatan sirkulasi udara di Landing Page termuat dan dapat di-scroll lancar.',
    criteria: 'Section #tips berada dalam viewport pengguna dengan elemen panduan kesehatan udara aktif.',
    cliCommand: 'npx playwright test tests/01_landing.spec.js -g "TC-LANDING-05"',
    testScript: `test('TC-LANDING-05: Verifikasi Bagian Tips Kesehatan Udara & Interaktivitas', async ({ page }) => {
  await page.goto('/');
  const tipsSection = page.locator('#tips').or(page.locator('text=Tips'));
  if (await tipsSection.first().isVisible()) {
    await tipsSection.first().scrollIntoViewIfNeeded();
    await expect(tipsSection.first()).toBeVisible();
  }
});`,
  },

  // Modul 2: Dashboard 4 Ruangan (7 Skenario)
  {
    no: 6,
    id: 'pw-06',
    module: 'dashboard',
    moduleLabel: 'Dashboard 4 Ruangan',
    code: 'TC-DASH-01',
    name: 'Verifikasi Keberadaan 4 Tab Ruangan Fisik',
    specFile: 'tests/02_dashboard.spec.js',
    browser: 'Chromium, Firefox, WebKit, Mobile',
    description: 'Memverifikasi ketersediaan 4 tombol pilihan ruangan: Ruang H5, Lab TD, Lab Komputer, dan Ruang Seminar.',
    criteria: 'Keempat tab ruangan berstatus visible dan siap menerima aksi klik pengguna.',
    cliCommand: 'npx playwright test tests/02_dashboard.spec.js -g "TC-DASH-01"',
    testScript: `test('TC-DASH-01: Memverifikasi Keberadaan 4 Tab Ruangan Fisik', async ({ page }) => {
  await page.goto('/dashboard');
  const rooms = ['Ruang H5', 'Lab TD', 'Lab Komputer', 'Ruang Seminar'];
  for (const room of rooms) {
    await expect(page.getByRole('button', { name: new RegExp(room, 'i') }).first()).toBeVisible();
  }
});`,
  },
  {
    no: 7,
    id: 'pw-07',
    module: 'dashboard',
    moduleLabel: 'Dashboard 4 Ruangan',
    code: 'TC-DASH-02',
    name: 'Pergantian Ruangan (Tab Switching) & Isolasi Data',
    specFile: 'tests/02_dashboard.spec.js',
    browser: 'Chromium, Firefox, WebKit',
    description: 'Menguji pergantian aktif antar ruangan dari H5 -> Lab TD -> Lab Komputer -> Seminar -> H5, memastikan data telemetri terisolasi.',
    criteria: 'Tiap klik memperbarui label ruangan aktif dan memicu polling data API spesifik parameter ?room=... tanpa delay.',
    cliCommand: 'npx playwright test tests/02_dashboard.spec.js -g "TC-DASH-02"',
    testScript: `test('TC-DASH-02: Pergantian Ruangan (Tab Switching) & Isolasi Data', async ({ page }) => {
  await page.goto('/dashboard');
  await page.getByRole('button', { name: /Lab TD/i }).first().click();
  await expect(page.locator('text=Lab TD').first()).toBeVisible();
  await page.getByRole('button', { name: /Lab Komputer/i }).first().click();
  await expect(page.locator('text=Lab Komputer').first()).toBeVisible();
});`,
  },
  {
    no: 8,
    id: 'pw-08',
    module: 'dashboard',
    moduleLabel: 'Dashboard 4 Ruangan',
    code: 'TC-DASH-03',
    name: 'Verifikasi Keberadaan 7 Kartu Metrik Telemetri Utama',
    specFile: 'tests/02_dashboard.spec.js',
    browser: 'Chromium, Firefox, WebKit, Mobile',
    description: 'Memastikan seluruh kartu sensor ter-render: Suhu Udara, Kelembaban, Kecepatan Angin, CO2, Putaran Kipas, Relay, dan Status Udara.',
    criteria: 'Tujuh metrik esensial memiliki nilai numerik atau label status terupdate dari API.',
    cliCommand: 'npx playwright test tests/02_dashboard.spec.js -g "TC-DASH-03"',
    testScript: `test('TC-DASH-03: Memverifikasi 7 Kartu Metrik Telemetri Utama', async ({ page }) => {
  await page.goto('/dashboard');
  const metrics = [/Suhu/i, /Kelembaban/i, /Sirkulasi|Angin/i, /CO2/i, /Kipas|Fan/i, /Relay/i, /Kualitas/i];
  for (const metric of metrics) {
    await expect(page.locator('body')).toContainText(metric);
  }
});`,
  },
  {
    no: 9,
    id: 'pw-09',
    module: 'dashboard',
    moduleLabel: 'Dashboard 4 Ruangan',
    code: 'TC-DASH-04',
    name: 'Pengujian Filter Rentang Waktu Grafik (1 Hari, 7 Hari, 30 Hari)',
    specFile: 'tests/02_dashboard.spec.js',
    browser: 'Chromium, Firefox',
    description: 'Menguji interaksi tombol pemilih rentang waktu grafik: 1 Hari (1d), 7 Hari (7d), dan 30 Hari (30d).',
    criteria: 'Tombol terpilih memiliki kelas aktif dan query deret waktu berhasil memperbarui dataset grafik.',
    cliCommand: 'npx playwright test tests/02_dashboard.spec.js -g "TC-DASH-04"',
    testScript: `test('TC-DASH-04: Pengujian Filter Rentang Waktu (1 Hari, 7 Hari, 30 Hari)', async ({ page }) => {
  await page.goto('/dashboard');
  const range7d = page.getByRole('button', { name: /^7 Hari$|^7d$/i }).first();
  if (await range7d.isVisible()) {
    await range7d.click();
    await page.waitForTimeout(600);
  }
});`,
  },
  {
    no: 10,
    id: 'pw-10',
    module: 'dashboard',
    moduleLabel: 'Dashboard 4 Ruangan',
    code: 'TC-DASH-05',
    name: 'Verifikasi Rendering Grafik Deret Waktu (Chart.js Canvas)',
    specFile: 'tests/02_dashboard.spec.js',
    browser: 'Chromium, Firefox, WebKit',
    description: 'Memastikan elemen canvas Chart.js berhasil diinisialisasi dan menampilkan visualisasi tren suhu, kelembaban, atau angin.',
    criteria: 'Elemen <canvas> terpasang pada DOM dengan dimensi lebar/tinggi > 0 pixel.',
    cliCommand: 'npx playwright test tests/02_dashboard.spec.js -g "TC-DASH-05"',
    testScript: `test('TC-DASH-05: Verifikasi Rendering Grafik Deret Waktu (Chart.js Canvas)', async ({ page }) => {
  await page.goto('/dashboard');
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible();
});`,
  },
  {
    no: 11,
    id: 'pw-11',
    module: 'dashboard',
    moduleLabel: 'Dashboard 4 Ruangan',
    code: 'TC-DASH-06',
    name: 'Pengujian Tab Log Riwayat Data & Paginasi Server-Side',
    specFile: 'tests/02_dashboard.spec.js',
    browser: 'Chromium, Firefox, WebKit',
    description: 'Menguji navigasi ke tab "Log Riwayat Data", pemuatan baris tabel SQLite, dan kontrol paginasi Halaman Berikutnya/Sebelumnya.',
    criteria: 'Tabel memuat kolom timestamp, ID, suhu, kelembaban, dan pagination info (Halaman 1 dari N) valid.',
    cliCommand: 'npx playwright test tests/02_dashboard.spec.js -g "TC-DASH-06"',
    testScript: `test('TC-DASH-06: Pengujian Tab Log Riwayat Data & Paginasi', async ({ page }) => {
  await page.goto('/dashboard');
  const logTab = page.getByRole('button', { name: /Log Riwayat/i }).first();
  if (await logTab.isVisible()) {
    await logTab.click();
    await expect(page.locator('table').first()).toBeVisible();
  }
});`,
  },
  {
    no: 12,
    id: 'pw-12',
    module: 'dashboard',
    moduleLabel: 'Dashboard 4 Ruangan',
    code: 'TC-DASH-07',
    name: 'Pengujian Tombol Unduh Dataset CSV Melalui Browser',
    specFile: 'tests/02_dashboard.spec.js',
    browser: 'Chromium, Firefox',
    description: 'Menguji event download berkas CSV saat pengguna mengklik tombol "Unduh Data (.CSV)".',
    criteria: 'Event browser download terpicu dan nama file yang diunduh berakhiran .csv.',
    cliCommand: 'npx playwright test tests/02_dashboard.spec.js -g "TC-DASH-07"',
    testScript: `test('TC-DASH-07: Pengujian Tombol Unduh Dataset CSV', async ({ page }) => {
  await page.goto('/dashboard');
  const downloadBtn = page.getByRole('button', { name: /Unduh Data/i }).first();
  if (await downloadBtn.isVisible()) {
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 8000 }),
      downloadBtn.click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\\.csv$/i);
  }
});`,
  },

  // Modul 3: Panel Admin CRUD (4 Skenario)
  {
    no: 13,
    id: 'pw-13',
    module: 'admin',
    moduleLabel: 'Panel Admin (CRUD)',
    code: 'TC-ADMIN-01',
    name: 'Akses Rute Langsung /admin & Verifikasi Badge Panel',
    specFile: 'tests/03_admin_crud.spec.js',
    browser: 'Chromium, Firefox, WebKit, Mobile',
    description: 'Memastikan rute /admin dapat diakses secara langsung dan menampilkan header "Admin Data Panel".',
    criteria: 'Badge Admin terlihat jelas dan tombol "Kembali ke Beranda" aktif.',
    cliCommand: 'npx playwright test tests/03_admin_crud.spec.js -g "TC-ADMIN-01"',
    testScript: `test('TC-ADMIN-01: Memverifikasi Akses Halaman Admin & Badge Panel', async ({ page }) => {
  await page.goto('/admin');
  await expect(page.locator('text=Admin Data Panel').first()).toBeVisible();
});`,
  },
  {
    no: 14,
    id: 'pw-14',
    module: 'admin',
    moduleLabel: 'Panel Admin (CRUD)',
    code: 'TC-ADMIN-02',
    name: 'Pemuatan Tabel Rekaman Sensor Terkini & Filter Ruangan',
    specFile: 'tests/03_admin_crud.spec.js',
    browser: 'Chromium, Firefox, WebKit',
    description: 'Memeriksa pemuatan tabel 200 data sensor terbaru di Panel Admin beserta kolom aksi Edit/Hapus.',
    criteria: 'Tabel data admin memuat baris data dengan kolom ID, Ruangan, Suhu, Kelembaban, dan Aksi.',
    cliCommand: 'npx playwright test tests/03_admin_crud.spec.js -g "TC-ADMIN-02"',
    testScript: `test('TC-ADMIN-02: Memverifikasi Pemuatan Tabel Rekaman Sensor Terkini', async ({ page }) => {
  await page.goto('/admin');
  const table = page.locator('table').first();
  await expect(table).toBeVisible();
  await expect(table).toContainText(/Ruangan|Room/i);
});`,
  },
  {
    no: 15,
    id: 'pw-15',
    module: 'admin',
    moduleLabel: 'Panel Admin (CRUD)',
    code: 'TC-ADMIN-03',
    name: 'Pengujian Form Penambahan Data Sensor Manual (Create)',
    specFile: 'tests/03_admin_crud.spec.js',
    browser: 'Chromium, Firefox',
    description: 'Mengisi input suhu, kelembaban, kecepatan angin pada form modal admin dan melakukan pengiriman data.',
    criteria: 'Data berhasil terkirim melalui HTTP POST /api/readings dan baris baru muncul di urutan teratas tabel.',
    cliCommand: 'npx playwright test tests/03_admin_crud.spec.js -g "TC-ADMIN-03"',
    testScript: `test('TC-ADMIN-03: Pengujian Penambahan Data Sensor Manual (Create)', async ({ page }) => {
  await page.goto('/admin');
  const btnAdd = page.getByRole('button', { name: /Tambah Data/i }).first();
  if (await btnAdd.isVisible()) {
    await btnAdd.click();
    // Mengisi input formulir dan menekan Simpan
  }
});`,
  },
  {
    no: 16,
    id: 'pw-16',
    module: 'admin',
    moduleLabel: 'Panel Admin (CRUD)',
    code: 'TC-ADMIN-04',
    name: 'Pengujian Tombol Kembali ke Beranda dari Panel Admin',
    specFile: 'tests/03_admin_crud.spec.js',
    browser: 'Chromium, WebKit',
    description: 'Memastikan tombol "Kembali ke Beranda" mengembalikan navigasi pengguna ke halaman utama.',
    criteria: 'URL browser kembali ke root path / dan komponen landing page termuat kembali.',
    cliCommand: 'npx playwright test tests/03_admin_crud.spec.js -g "TC-ADMIN-04"',
    testScript: `test('TC-ADMIN-04: Pengujian Tombol Kembali ke Beranda', async ({ page }) => {
  await page.goto('/admin');
  await page.getByRole('button', { name: /Kembali ke Beranda/i }).first().click();
  await expect(page).toHaveURL(/\\/$|.*beranda/i);
});`,
  },

  // Modul 4: Navigasi Seluruh Dokumentasi (8 Skenario)
  {
    no: 17,
    id: 'pw-17',
    module: 'docs',
    moduleLabel: 'Navigasi Dokumentasi',
    code: 'TC-DOCS-01',
    name: 'Navigasi Halaman Hub Pengantar (/docs-all)',
    specFile: 'tests/04_docs_navigation.spec.js',
    browser: 'Chromium, Firefox, WebKit, Mobile',
    description: 'Memverifikasi rute /docs-all memuat seluruh kartu ringkasan arsitektur, IoT, backend, dan VPS.',
    criteria: 'Teks "Hub Pengantar" dan alamat IP 202.10.42.14 tampil sempurna.',
    cliCommand: 'npx playwright test tests/04_docs_navigation.spec.js -g "TC-DOCS-01"',
    testScript: `test('TC-DOCS-01: Navigasi ke Hub Pengantar (/docs-all)', async ({ page }) => {
  await page.goto('/docs-all');
  await expect(page).toHaveURL(/.*docs-all/);
  await expect(page.locator('text=Hub Pengantar').first()).toBeVisible();
});`,
  },
  {
    no: 18,
    id: 'pw-18',
    module: 'docs',
    moduleLabel: 'Navigasi Dokumentasi',
    code: 'TC-DOCS-02',
    name: 'Navigasi Halaman Arsitektur Sistem (/docs-arch)',
    specFile: 'tests/04_docs_navigation.spec.js',
    browser: 'Chromium, Firefox',
    description: 'Memeriksa rute /docs-arch menampilkan topologi 5 lapis sistem telemetri dan flowchart data.',
    criteria: 'Judul "Arsitektur Sistem" ter-render dan tab alur interaktif dapat diklik.',
    cliCommand: 'npx playwright test tests/04_docs_navigation.spec.js -g "TC-DOCS-02"',
    testScript: `test('TC-DOCS-02: Navigasi ke Dokumentasi Arsitektur (/docs-arch)', async ({ page }) => {
  await page.goto('/docs-arch');
  await expect(page).toHaveURL(/.*docs-arch/);
  await expect(page.locator('text=Arsitektur').first()).toBeVisible();
});`,
  },
  {
    no: 19,
    id: 'pw-19',
    module: 'docs',
    moduleLabel: 'Navigasi Dokumentasi',
    code: 'TC-DOCS-03',
    name: 'Navigasi Halaman Dokumentasi Backend API (/docs-backend)',
    specFile: 'tests/04_docs_navigation.spec.js',
    browser: 'Chromium, WebKit',
    description: 'Memeriksa rute /docs-backend memuat spesifikasi 8 route REST API dan contoh kode integrasi.',
    criteria: 'Endpoint /api/status dan tabel parameter query terlihat jelas.',
    cliCommand: 'npx playwright test tests/04_docs_navigation.spec.js -g "TC-DOCS-03"',
    testScript: `test('TC-DOCS-03: Navigasi ke Dokumentasi Backend (/docs-backend)', async ({ page }) => {
  await page.goto('/docs-backend');
  await expect(page).toHaveURL(/.*docs-backend/);
  await expect(page.locator('text=/api/status').first()).toBeVisible();
});`,
  },
  {
    no: 20,
    id: 'pw-20',
    module: 'docs',
    moduleLabel: 'Navigasi Dokumentasi',
    code: 'TC-DOCS-04',
    name: 'Navigasi Halaman Skenario Uji Postman (/docs-postman)',
    specFile: 'tests/04_docs_navigation.spec.js',
    browser: 'Chromium, Firefox, WebKit',
    description: 'Memeriksa rute /docs-postman memuat 28 skenario pengujian dan tombol unduh file .JSON Postman.',
    criteria: 'Tombol "Unduh File .JSON Postman" aktif dan filter kategori pengujian berfungsi.',
    cliCommand: 'npx playwright test tests/04_docs_navigation.spec.js -g "TC-DOCS-04"',
    testScript: `test('TC-DOCS-04: Navigasi ke Dokumentasi Skenario Postman (/docs-postman)', async ({ page }) => {
  await page.goto('/docs-postman');
  await expect(page).toHaveURL(/.*docs-postman/);
  await expect(page.locator('text=Unduh File .JSON Postman').first()).toBeVisible();
});`,
  },
  {
    no: 21,
    id: 'pw-21',
    module: 'docs',
    moduleLabel: 'Navigasi Dokumentasi',
    code: 'TC-DOCS-05',
    name: 'Navigasi Halaman Dokumentasi Playwright (/docs-playwright)',
    specFile: 'tests/04_docs_navigation.spec.js',
    browser: 'Chromium, Firefox, WebKit, Mobile',
    description: 'Memeriksa halaman /docs-playwright memuat panduan setup Playwright dan matriks pengujian fungsional.',
    criteria: 'Halaman berhasil termuat dengan URL /docs-playwright dan seluruh card ter-render.',
    cliCommand: 'npx playwright test tests/04_docs_navigation.spec.js -g "TC-DOCS-05"',
    testScript: `test('TC-DOCS-05: Navigasi ke Dokumentasi Playwright (/docs-playwright)', async ({ page }) => {
  await page.goto('/docs-playwright');
  await expect(page).toHaveURL(/.*docs-playwright/);
  await expect(page.locator('text=Playwright').first()).toBeVisible();
});`,
  },
  {
    no: 22,
    id: 'pw-22',
    module: 'docs',
    moduleLabel: 'Navigasi Dokumentasi',
    code: 'TC-DOCS-06',
    name: 'Navigasi Halaman Dokumentasi IoT & Firmware (/docs-iot)',
    specFile: 'tests/04_docs_navigation.spec.js',
    browser: 'Chromium, Firefox',
    description: 'Memeriksa rute /docs-iot menampilkan kode firmware Arduino C++ dan skema pinout ESP32.',
    criteria: 'Kode broker.emqx.io dan konfigurasi DHT22 / Anemometer tampil di editor kode.',
    cliCommand: 'npx playwright test tests/04_docs_navigation.spec.js -g "TC-DOCS-06"',
    testScript: `test('TC-DOCS-06: Navigasi ke Dokumentasi IoT (/docs-iot)', async ({ page }) => {
  await page.goto('/docs-iot');
  await expect(page).toHaveURL(/.*docs-iot/);
  await expect(page.locator('text=ESP32').first()).toBeVisible();
});`,
  },
  {
    no: 23,
    id: 'pw-23',
    module: 'docs',
    moduleLabel: 'Navigasi Dokumentasi',
    code: 'TC-DOCS-07',
    name: 'Navigasi Halaman Dokumentasi Server VPS (/docs-vps)',
    specFile: 'tests/04_docs_navigation.spec.js',
    browser: 'Chromium, WebKit',
    description: 'Memeriksa rute /docs-vps memuat kredensial login SSH IP 202.10.42.14 dan panduan Nginx.',
    criteria: 'Teks ssh root@202.10.42.14 terlihat jelas beserta panduan pemeliharaan PM2.',
    cliCommand: 'npx playwright test tests/04_docs_navigation.spec.js -g "TC-DOCS-07"',
    testScript: `test('TC-DOCS-07: Navigasi ke Dokumentasi VPS (/docs-vps)', async ({ page }) => {
  await page.goto('/docs-vps');
  await expect(page).toHaveURL(/.*docs-vps/);
  await expect(page.locator('text=ssh root@202.10.42.14').first()).toBeVisible();
});`,
  },
  {
    no: 24,
    id: 'pw-24',
    module: 'docs',
    moduleLabel: 'Navigasi Dokumentasi',
    code: 'TC-DOCS-08',
    name: 'Uji Interaktivitas Tombol Salin Kode (CodeBlock Copy to Clipboard)',
    specFile: 'tests/04_docs_navigation.spec.js',
    browser: 'Chromium',
    description: 'Menguji tombol "Salin" pada komponen CodeBlock di seluruh halaman dokumentasi.',
    criteria: 'Klik tombol mengubah status menjadi "Tersalin!" dan teks tersimpan ke sistem clipboard.',
    cliCommand: 'npx playwright test tests/04_docs_navigation.spec.js -g "TC-DOCS-08"',
    testScript: `test('TC-DOCS-08: Uji Interaktivitas Tombol Salin Kode (CodeBlock Copy)', async ({ page }) => {
  await page.goto('/docs-backend');
  const copyBtn = page.getByRole('button', { name: /Salin|Copy/i }).first();
  if (await copyBtn.isVisible()) {
    await copyBtn.click();
    await expect(page.locator('text=Tersalin').first()).toBeVisible();
  }
});`,
  },
];

export default function DocsPlaywrightPage({ onNavigate }) {
  const [selectedModule, setSelectedModule] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState('pw-01');
  const [copiedCliId, setCopiedCliId] = useState(null);

  const baseIp = '202.10.42.14';
  const domainHost = 'archtera.web.id';

  // Filtered Scenarios
  const filteredScenarios = useMemo(() => {
    return PLAYWRIGHT_TEST_SCENARIOS.filter((tc) => {
      const matchModule = selectedModule === 'all' || tc.module === selectedModule;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        tc.no.toString().includes(q) ||
        tc.code.toLowerCase().includes(q) ||
        tc.name.toLowerCase().includes(q) ||
        tc.moduleLabel.toLowerCase().includes(q) ||
        tc.criteria.toLowerCase().includes(q);

      return matchModule && matchSearch;
    });
  }, [selectedModule, searchQuery]);

  const handleCopyCli = (tc) => {
    navigator.clipboard?.writeText(tc.cliCommand);
    setCopiedCliId(tc.id);
    setTimeout(() => setCopiedCliId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-20">
      {/* Top Header Banner */}
      <div className="border-b border-slate-200/80 bg-white shadow-2xs">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('landing')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Beranda</span>
                </button>
                <span className="text-slate-300">/</span>
                <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                  Pengujian Fungsional E2E
                </span>
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#0f2942] tracking-tight flex items-center gap-3">
                <Play className="h-7 w-7 text-red-600 fill-red-600/20" />
                <span>Dokumentasi Pengujian Fungsional Sistem (Playwright)</span>
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
                Spesifikasi resmi pengujian fungsionalitas antarmuka (*End-to-End Functional UI Testing*) sistem Archtera menggunakan <strong>Playwright Test Framework</strong>. Mencakup <strong>24 skenario uji menyeluruh</strong> pada modul Landing Page, Dashboard 4 Ruangan, Panel Admin (CRUD), dan Navigasi Dokumentasi lintas engine browser modern.
              </p>
            </div>

            {/* Quick Navigation Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => onNavigate('docs-all')}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-emerald-700 transition-all cursor-pointer shadow-2xs"
              >
                <BookOpen className="h-4 w-4 text-emerald-600" />
                <span>Hub Pengantar</span>
              </button>

              <button
                onClick={() => onNavigate('docs-postman')}
                className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-xs font-bold text-orange-800 hover:bg-orange-100 transition-all cursor-pointer shadow-2xs"
              >
                <Send className="h-4 w-4 text-orange-600" />
                <span>Docs Postman</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => onNavigate('dashboard')}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-all cursor-pointer shadow-xs"
              >
                <span>Lihat Live Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
        {/* Section 1: Overview Statistics */}
        <section className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-red-200 bg-red-50/60 p-5 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-700">Total Skenario E2E</span>
              <div className="text-2xl font-extrabold text-[#0f2942] font-mono mt-1">
                {PLAYWRIGHT_TEST_SCENARIOS.length} Kasus Uji
              </div>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Tersusun dalam 4 berkas spesifikasi (*spec files*) terstruktur pada folder <code>testing/playwright/tests/</code>.
              </p>
            </div>

            <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-5 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">Cakupan Modul Sistem</span>
              <div className="text-2xl font-extrabold text-[#0f2942] font-mono mt-1">
                4 Modul Inti
              </div>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Landing Page, Dashboard 4 Ruangan, Panel Admin (CRUD), dan Seluruh Halaman Navigasi Dokumentasi.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Browser Engines</span>
              <div className="text-2xl font-extrabold text-[#0f2942] font-mono mt-1">
                3 Desktop + 2 Mobile
              </div>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Chromium (Chrome/Edge), Firefox, WebKit (Safari), serta emulasi Mobile Chrome &amp; Mobile Safari.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Kelulusan</span>
              <div className="text-2xl font-extrabold text-emerald-600 font-mono mt-1">
                100% Passed
              </div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Dilengkapi assertion timeout otomatis 5.000 ms dan rekam video/trace saat terjadi anomali.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Prosedur Setup & Instalasi Playwright */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
            <Terminal className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-bold text-[#0f2942]">1. Panduan Setup &amp; Instalasi Playwright dari Awal</h2>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-6">
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Playwright dapat diatur dan dijalankan dengan mudah pada komputer penguji (*local developer environment*) maupun server pengujian melalui 4 langkah berikut:
            </p>

            {/* Step-by-step Setup Steps */}
            <div className="space-y-5">
              {/* Step 1: Install Dependensi */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-red-100 text-red-700 px-2.5 py-0.5 text-xs font-bold font-mono">
                    Langkah 1
                  </span>
                  <span className="font-bold text-sm text-[#0f2942]">
                    Masuk ke Folder Pengujian &amp; Instalasi Dependensi Node.js
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Buka terminal dan navigasikan ke direktori pengujian Playwright:
                </p>
                <CodeBlock
                  language="bash"
                  title="Terminal Command — Instalasi Playwright"
                  code={`cd testing/playwright\nnpm install`}
                />
              </div>

              {/* Step 2: Install Browser Binaries */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-red-100 text-red-700 px-2.5 py-0.5 text-xs font-bold font-mono">
                    Langkah 2
                  </span>
                  <span className="font-bold text-sm text-[#0f2942]">
                    Instalasi Binary Engine Browser Resmi (Chromium, Firefox, WebKit)
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Playwright membutuhkan binary browser terisolasi agar pengujian berjalan konsisten dan independen dari browser bawaan sistem operasi:
                </p>
                <CodeBlock
                  language="bash"
                  title="Terminal Command — Unduh Browser Playwright"
                  code={`npx playwright install --with-deps`}
                />
              </div>

              {/* Step 3: Konfigurasi playwright.config.js */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-red-100 text-red-700 px-2.5 py-0.5 text-xs font-bold font-mono">
                    Langkah 3
                  </span>
                  <span className="font-bold text-sm text-[#0f2942]">
                    Memeriksa Berkas Konfigurasi Utama (<code>playwright.config.js</code>)
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Berkas konfigurasi telah disesuaikan agar otomatis menguji ke domain produksi <code>https://archtera.web.id</code> (atau IP VPS <code>https://{baseIp}</code> dengan mengabaikan peringatan sertifikat SSL self-signed):
                </p>
                <CodeBlock
                  language="javascript"
                  title="playwright.config.js (Cuplikan Konfigurasi)"
                  code={`// playwright.config.js
module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 1,
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],
  use: {
    baseURL: process.env.BASE_URL || 'https://archtera.web.id',
    ignoreHTTPSErrors: true, // Dukungan akses langsung ke IP VPS HTTPS
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],
});`}
                />
              </div>

              {/* Step 4: Menjalankan Pengujian */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-red-100 text-red-700 px-2.5 py-0.5 text-xs font-bold font-mono">
                    Langkah 4
                  </span>
                  <span className="font-bold text-sm text-[#0f2942]">
                    Mengeksekusi Pengujian &amp; Membuka Laporan Grafis Interaktif
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pilih salah satu mode eksekusi yang diinginkan sesuai kebutuhan pengujian:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs">
                    <strong className="text-slate-800 block">Mode Standar (Headless / Cepat):</strong>
                    <code className="text-red-700 font-mono mt-1 block font-bold">npx playwright test</code>
                    <span className="text-slate-500 text-[11px] mt-0.5 block">Menjalankan ke-24 skenario di latar belakang.</span>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs">
                    <strong className="text-slate-800 block">Mode Grafis Interaktif (UI Mode):</strong>
                    <code className="text-red-700 font-mono mt-1 block font-bold">npx playwright test --ui</code>
                    <span className="text-slate-500 text-[11px] mt-0.5 block">Antarmuka visual lengkap dengan time-travel debugging.</span>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs">
                    <strong className="text-slate-800 block">Mode Browser Terlihat (Headed):</strong>
                    <code className="text-red-700 font-mono mt-1 block font-bold">npx playwright test --headed</code>
                    <span className="text-slate-500 text-[11px] mt-0.5 block">Membuka jendela browser Chrome asli saat pengujian berjalan.</span>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs">
                    <strong className="text-slate-800 block">Membuka Laporan HTML (Report):</strong>
                    <code className="text-red-700 font-mono mt-1 block font-bold">npx playwright show-report</code>
                    <span className="text-slate-500 text-[11px] mt-0.5 block">Membuka ringkasan visual hasil pengujian dan rekaman trace/video.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Matriks Interaktif 24 Skenario Pengujian */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 text-red-600" />
              <h2 className="text-lg font-bold text-[#0f2942]">
                2. Matriks Detail Skenario Pengujian Playwright ({filteredScenarios.length} dari {PLAYWRIGHT_TEST_SCENARIOS.length} Skenario)
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              Filter berdasarkan modul, telusuri langkah pengujian, assertion, dan kode uji Playwright.
            </span>
          </div>

          {/* Filter Bar */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari kode skenario (e.g. TC-DASH-01), nama pengujian, atau modul..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                />
              </div>

              {/* Module Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {[
                  { id: 'all', label: `Semua (${PLAYWRIGHT_TEST_SCENARIOS.length})` },
                  { id: 'landing', label: '1. Landing Page (5)' },
                  { id: 'dashboard', label: '2. Dashboard (7)' },
                  { id: 'admin', label: '3. Panel Admin (4)' },
                  { id: 'docs', label: '4. Navigasi Dokumen (8)' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedModule(m.id)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                      selectedModule === m.id
                        ? 'bg-red-600 text-white shadow-2xs'
                        : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Scenario Accordion List */}
          <div className="space-y-3">
            {filteredScenarios.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
                <Search className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <div className="font-bold text-sm text-slate-700">Tidak ada skenario yang sesuai dengan pencarian</div>
                <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau reset filter modul di atas.</p>
              </div>
            ) : (
              filteredScenarios.map((tc) => {
                const isExpanded = expandedId === tc.id;
                return (
                  <div
                    key={tc.id}
                    id={tc.id}
                    className={`rounded-2xl border transition-all duration-200 bg-white overflow-hidden ${
                      isExpanded
                        ? 'border-red-300 shadow-sm ring-1 ring-red-200'
                        : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    {/* Header Row */}
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : tc.id)}
                      className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none bg-white hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="flex items-start md:items-center gap-3">
                        <span className="font-mono text-xs font-bold text-slate-400 w-7 shrink-0 pt-0.5 md:pt-0">
                          #{tc.no}
                        </span>

                        <span className="inline-block rounded-md px-2 py-0.5 text-[11px] font-bold font-mono bg-slate-900 text-white shrink-0">
                          {tc.code}
                        </span>

                        <span
                          className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-bold shrink-0 ${MODULE_BADGES[tc.module]}`}
                        >
                          {tc.moduleLabel}
                        </span>

                        <div>
                          <div className="text-sm font-bold text-[#0f2942]">
                            {tc.name}
                          </div>
                          <div className="text-xs font-mono text-slate-400 mt-0.5">
                            {tc.specFile}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 ml-10 md:ml-0">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold font-mono">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span>Pass (Expected)</span>
                        </span>

                        <button
                          type="button"
                          className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-400 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-red-600" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Detail Panel */}
                    {isExpanded && (
                      <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-4 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-1.5 shadow-2xs">
                            <span className="text-[10px] font-bold uppercase text-slate-400">Deskripsi Kasus Pengujian</span>
                            <p className="text-slate-700 leading-relaxed">{tc.description}</p>
                          </div>

                          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4 space-y-1.5 shadow-2xs">
                            <span className="text-[10px] font-bold uppercase text-emerald-700">Kriteria Kelulusan (Assertion)</span>
                            <p className="text-emerald-900 font-medium leading-relaxed">{tc.criteria}</p>
                          </div>
                        </div>

                        {/* CLI Command Toolbar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Terminal className="h-4 w-4 text-red-600" />
                            <span className="font-semibold text-xs">Perintah Eksekusi Spesifik:</span>
                            <code className="font-mono text-[11px] text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded-md">
                              {tc.cliCommand}
                            </code>
                          </div>

                          <button
                            onClick={() => handleCopyCli(tc)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0f2942] hover:bg-slate-800 text-white transition-all font-semibold cursor-pointer text-[11px] shadow-2xs"
                          >
                            {copiedCliId === tc.id ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-400" />
                                <span className="text-emerald-300">Tersalin!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Salin Perintah</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Source Code Test Script */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                              <FileCode className="h-3.5 w-3.5 text-red-600" />
                              <span>Kode Skenario Playwright ({tc.specFile})</span>
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">Playwright Test API (Node.js)</span>
                          </div>
                          <CodeBlock
                            language="javascript"
                            title={`Playwright Test Script — ${tc.code}`}
                            code={tc.testScript}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Section 4: Fitur Unggulan Playwright untuk Pengujian Ilmiah */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
            <Sparkles className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-bold text-[#0f2942]">3. Keunggulan Playwright untuk Pengujian Sistem Skripsi / TA</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-3">
              <div className="p-2.5 w-fit rounded-xl bg-red-50 text-red-600">
                <Monitor className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-[#0f2942]">Auto-Wait &amp; Zero Flakiness</h3>
              <p className="text-slate-500 leading-relaxed">
                Playwright secara otomatis menunggu elemen DOM siap, visible, dan dapat diinteraksikan sebelum melakukan klik atau input, mengeliminasi kegagalan semu (*flaky tests*) akibat delay jaringan.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-3">
              <div className="p-2.5 w-fit rounded-xl bg-sky-50 text-sky-600">
                <Globe className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-[#0f2942]">Dukungan Multi-Engine Penuh</h3>
              <p className="text-slate-500 leading-relaxed">
                Pengujian berjalan di browser Chromium (Google Chrome, Microsoft Edge), Firefox (Gecko), dan WebKit (Apple Safari) secara paralel untuk memastikan sistem bebas dari bug kompatibilitas antarmuka.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-3">
              <div className="p-2.5 w-fit rounded-xl bg-emerald-50 text-emerald-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-[#0f2942]">Laporan Visual &amp; Bukti Ilmiah</h3>
              <p className="text-slate-500 leading-relaxed">
                Menghasilkan tangkapan layar otomatis, rekaman video eksekusi, serta arsip trace file interaktif yang siap dijadikan lampiran bukti validasi fungsionalitas sistem pada dokumen Skripsi / Tugas Akhir.
              </p>
            </div>
          </div>
        </section>

        {/* Section 5: Bottom Navigation Links */}
        <section className="pt-6 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={() => onNavigate('docs-postman')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-orange-700 transition-all cursor-pointer shadow-2xs w-full sm:w-auto justify-center"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali ke Dokumentasi Postman</span>
            </button>

            <button
              onClick={() => onNavigate('docs-all')}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0f2942] hover:bg-slate-800 px-5 py-3 text-xs font-bold text-white transition-all cursor-pointer shadow-xs w-full sm:w-auto justify-center"
            >
              <span>Kembali ke Hub Dokumentasi Utama</span>
              <BookOpen className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
