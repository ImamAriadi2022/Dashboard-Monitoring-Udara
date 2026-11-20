const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const reportsDir = path.join(__dirname, 'reports');
const screenshotsDir = path.join(reportsDir, 'screenshots');
fs.mkdirSync(screenshotsDir, { recursive: true });

const htmlPath = path.join(reportsDir, 'flowchart-alur-pengujian.html');
const outPng = path.join(screenshotsDir, '00_diagram_alur_pengujian_k6.png');

const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Diagram Alur Prosedur Pengujian Latensi k6</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 20px;
      background: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #0f172a;
    }
    .frame {
      width: 1160px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 14px;
      padding: 22px 24px 18px 24px;
    }
    .title {
      text-align: center;
      font-size: 16px;
      font-weight: 800;
      color: #0f2942;
      margin-bottom: 4px;
    }
    .subtitle {
      text-align: center;
      font-size: 12px;
      color: #475569;
      margin-bottom: 14px;
    }
  </style>
</head>
<body>
  <div class="frame">
    <div class="title">Diagram Alur Prosedur Pengujian Latensi REST API Archtera (Grafana k6)</div>
    <div class="subtitle">Pemisahan Jalur Uji Produksi (Read &amp; Analytics) dengan Uji Operasi Tulis CRUD Terisolasi</div>
    <svg viewBox="0 0 1110 680" width="1110" height="680" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
        </marker>
        <marker id="arrowBlue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#0284c7" />
        </marker>
        <marker id="arrowAmber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#d97706" />
        </marker>
      </defs>

      <!-- TAHAP 1: PERSIAPAN -->
      <rect x="205" y="10" width="700" height="68" rx="10" fill="#f8fafc" stroke="#0f2942" stroke-width="2" />
      <text x="555" y="34" text-anchor="middle" font-size="14" font-weight="800" fill="#0f2942" font-family="system-ui, sans-serif">
        1. Tahap Persiapan &amp; Perancangan Skrip Pengujian (Grafana k6 v2.2.0)
      </text>
      <text x="555" y="55" text-anchor="middle" font-size="11" fill="#334155" font-family="system-ui, sans-serif">
        Pemetaan 8 Endpoint REST API  •  Rotasi 4 Ruangan (h5, lab_td, lab_kom, seminar)  •  Penetapan 20 Batas SLA p(95)
      </text>

      <!-- CABANG KIRI & KANAN DARI TAHAP 1 -->
      <path d="M 420 78 L 420 102 L 275 102 L 275 124" fill="none" stroke="#0284c7" stroke-width="2" marker-end="url(#arrowBlue)" />
      <path d="M 690 78 L 690 102 L 835 102 L 835 124" fill="none" stroke="#d97706" stroke-width="2" marker-end="url(#arrowAmber)" />

      <!-- JALUR KIRI: LIVE VPS SUITE -->
      <rect x="20" y="128" width="510" height="416" rx="12" fill="#f0f9ff" stroke="#7dd3fc" stroke-width="1.5" stroke-dasharray="6,4" />
      <text x="275" y="152" text-anchor="middle" font-size="13" font-weight="800" fill="#0369a1" font-family="system-ui, sans-serif">
        2. Jalur Uji Live VPS (latency-suite.js)
      </text>
      <text x="275" y="169" text-anchor="middle" font-size="10.5" fill="#0c4a6e" font-family="ui-monospace, monospace">
        Target: https://archtera.web.id/api (HTTPS -&gt; Nginx -&gt; Express -&gt; SQLite)
      </text>

      <!-- Skenario 1 -->
      <rect x="40" y="185" width="470" height="54" rx="8" fill="#ffffff" stroke="#0284c7" stroke-width="1.5" />
      <text x="275" y="207" text-anchor="middle" font-size="12.5" font-weight="700" fill="#0f2942" font-family="system-ui, sans-serif">
        Skenario 1: Baseline Smoke Test (t = 0–3s)
      </text>
      <text x="275" y="226" text-anchor="middle" font-size="10.2" fill="#475569" font-family="system-ui, sans-serif">
        1 VU tetap • 4 iterasi • Ketujuh varian GET lintas 4 ruangan • SLA p(95) &lt; 500 ms
      </text>
      <line x1="275" y1="239" x2="275" y2="255" stroke="#0284c7" stroke-width="1.8" marker-end="url(#arrowBlue)" />

      <!-- Skenario 2 -->
      <rect x="40" y="259" width="470" height="54" rx="8" fill="#ffffff" stroke="#0284c7" stroke-width="1.5" />
      <text x="275" y="281" text-anchor="middle" font-size="12.5" font-weight="700" fill="#0f2942" font-family="system-ui, sans-serif">
        Skenario 2: Live Polling Dashboard (t = 10–40s)
      </text>
      <text x="275" y="300" text-anchor="middle" font-size="10.2" fill="#475569" font-family="system-ui, sans-serif">
        15 VUs konstan (30s) • Poll /latest (1s) + refresh grafik 1m • SLA p(95) &lt; 400 ms
      </text>
      <line x1="275" y1="313" x2="275" y2="329" stroke="#0284c7" stroke-width="1.8" marker-end="url(#arrowBlue)" />

      <!-- Skenario 3 -->
      <rect x="40" y="333" width="470" height="54" rx="8" fill="#ffffff" stroke="#0284c7" stroke-width="1.5" />
      <text x="275" y="355" text-anchor="middle" font-size="12.5" font-weight="700" fill="#0f2942" font-family="system-ui, sans-serif">
        Skenario 3: Analytics &amp; Logs Load (t = 43–88s)
      </text>
      <text x="275" y="374" text-anchor="middle" font-size="10.2" fill="#475569" font-family="system-ui, sans-serif">
        Ramp 0 -&gt; 25 VUs (45s) • Grafik 1d/7d/30d, Log Paginasi, CSV • SLA p(95) &lt; 700 ms
      </text>
      <line x1="275" y1="387" x2="275" y2="403" stroke="#0284c7" stroke-width="1.8" marker-end="url(#arrowBlue)" />

      <!-- Skenario 4 -->
      <rect x="40" y="407" width="470" height="54" rx="8" fill="#ffffff" stroke="#0284c7" stroke-width="1.5" />
      <text x="275" y="429" text-anchor="middle" font-size="12.5" font-weight="700" fill="#0f2942" font-family="system-ui, sans-serif">
        Skenario 4: Spike Resilience Test (t = 91–121s)
      </text>
      <text x="275" y="448" text-anchor="middle" font-size="10.2" fill="#475569" font-family="system-ui, sans-serif">
        Burst 5 -&gt; 40 -&gt; 0 VUs (30s) • Lonjakan 40 pengguna konkuren • SLA p(95) &lt; 1000 ms
      </text>
      <line x1="275" y1="461" x2="275" y2="477" stroke="#0284c7" stroke-width="1.8" marker-end="url(#arrowBlue)" />

      <!-- Output Live -->
      <rect x="40" y="481" width="470" height="46" rx="8" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5" />
      <text x="275" y="501" text-anchor="middle" font-size="12" font-weight="700" fill="#0369a1" font-family="system-ui, sans-serif">
        Ekspor Output: 3.344 Requests (0,00% Error)
      </text>
      <text x="275" y="518" text-anchor="middle" font-size="10.2" fill="#0c4a6e" font-family="ui-monospace, monospace">
        latency-summary.json &amp; k6-terminal-output.txt
      </text>

      <!-- JALUR KANAN: ISOLATED CRUD SUITE -->
      <rect x="580" y="128" width="510" height="416" rx="12" fill="#fffbeb" stroke="#fcd34d" stroke-width="1.5" stroke-dasharray="6,4" />
      <text x="835" y="152" text-anchor="middle" font-size="13" font-weight="800" fill="#b45309" font-family="system-ui, sans-serif">
        3. Jalur Uji CRUD Terisolasi (run-crud-isolated.js)
      </text>
      <text x="835" y="169" text-anchor="middle" font-size="10.5" fill="#78350f" font-family="ui-monospace, monospace">
        Target: http://127.0.0.1:3318 (Salinan Database SQLite Lokal)
      </text>

      <!-- Step 3A -->
      <rect x="600" y="185" width="470" height="72" rx="8" fill="#ffffff" stroke="#d97706" stroke-width="1.5" />
      <text x="835" y="209" text-anchor="middle" font-size="12.5" font-weight="700" fill="#0f2942" font-family="system-ui, sans-serif">
        Tahap 3A: Isolasi Basis Data &amp; Server Lokal
      </text>
      <text x="835" y="229" text-anchor="middle" font-size="10.5" fill="#475569" font-family="system-ui, sans-serif">
        Salin backend/air_data.db ke direktori sementara OS (temp)
      </text>
      <text x="835" y="246" text-anchor="middle" font-size="10.5" fill="#475569" font-family="system-ui, sans-serif">
        Jalankan Express port 3318 dengan DISABLE_MQTT=1 + cek /status
      </text>
      <line x1="835" y1="257" x2="835" y2="281" stroke="#d97706" stroke-width="1.8" marker-end="url(#arrowAmber)" />

      <!-- Step 3B -->
      <rect x="600" y="285" width="470" height="90" rx="8" fill="#ffffff" stroke="#d97706" stroke-width="1.5" />
      <text x="835" y="309" text-anchor="middle" font-size="12.5" font-weight="700" fill="#0f2942" font-family="system-ui, sans-serif">
        Tahap 3B: Eksekusi Siklus CRUD Berantai (crud-isolated.js)
      </text>
      <text x="835" y="329" text-anchor="middle" font-size="10.5" fill="#475569" font-family="system-ui, sans-serif">
        Profil Beban: Ramping 1 -&gt; 5 -&gt; 10 -&gt; 0 VUs (25 detik)
      </text>
      <text x="835" y="347" text-anchor="middle" font-size="10" font-weight="700" fill="#92400e" font-family="ui-monospace, monospace">
        POST /readings -&gt; ambil ID -&gt; PUT /readings/:id -&gt; DELETE /readings/:id
      </text>
      <text x="835" y="365" text-anchor="middle" font-size="10.5" fill="#475569" font-family="system-ui, sans-serif">
        SLA p(95) &lt; 150 ms per operasi • Total 495 siklus penuh (1.485 Requests)
      </text>
      <line x1="835" y1="375" x2="835" y2="399" stroke="#d97706" stroke-width="1.8" marker-end="url(#arrowAmber)" />

      <!-- Step 3C -->
      <rect x="600" y="403" width="470" height="62" rx="8" fill="#ffffff" stroke="#d97706" stroke-width="1.5" />
      <text x="835" y="427" text-anchor="middle" font-size="12.5" font-weight="700" fill="#0f2942" font-family="system-ui, sans-serif">
        Tahap 3C: Pembersihan Lingkungan Otomatis
      </text>
      <text x="835" y="448" text-anchor="middle" font-size="10.5" fill="#475569" font-family="system-ui, sans-serif">
        Matikan proses Express sementara &amp; hapus berkas DB temp (-wal/-shm)
      </text>
      <line x1="835" y1="465" x2="835" y2="477" stroke="#d97706" stroke-width="1.8" marker-end="url(#arrowAmber)" />

      <!-- Output CRUD -->
      <rect x="600" y="481" width="470" height="46" rx="8" fill="#fef3c7" stroke="#d97706" stroke-width="1.5" />
      <text x="835" y="501" text-anchor="middle" font-size="12" font-weight="700" fill="#92400e" font-family="system-ui, sans-serif">
        Ekspor Output CRUD: 1.485 Requests (0,00% Error)
      </text>
      <text x="835" y="518" text-anchor="middle" font-size="10.2" fill="#78350f" font-family="ui-monospace, monospace">
        crud-summary.json (Database Produksi VPS Tetap Bersih)
      </text>

      <!-- CONVERGE TO TAHAP 4 -->
      <path d="M 275 544 L 275 568 L 445 568 L 445 592" fill="none" stroke="#475569" stroke-width="2" marker-end="url(#arrow)" />
      <path d="M 835 544 L 835 568 L 665 568 L 665 592" fill="none" stroke="#475569" stroke-width="2" marker-end="url(#arrow)" />

      <!-- TAHAP 4: KOMPILASI LAPORAN -->
      <rect x="125" y="596" width="860" height="72" rx="10" fill="#ecfdf5" stroke="#059669" stroke-width="2" />
      <text x="555" y="622" text-anchor="middle" font-size="14" font-weight="800" fill="#065f46" font-family="system-ui, sans-serif">
        4. Tahap Kompilasi Statistik, Grafik Visual &amp; Validasi Ambang Batas SLA
      </text>
      <text x="555" y="643" text-anchor="middle" font-size="11.2" fill="#064e3b" font-family="system-ui, sans-serif">
        generate-report.js + Headless Chrome 2x DPI -&gt; Tabel Persentil, TTFB (http_req_waiting), Grafik Batang SVG, &amp; Dokumen Word (.docx)
      </text>
    </svg>
  </div>
</body>
</html>`;

fs.writeFileSync(htmlPath, html, 'utf8');

const chromeCandidates = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];
const browserExe = chromeCandidates.find((p) => fs.existsSync(p));
if (!browserExe) {
  throw new Error('Chrome/Edge tidak ditemukan untuk merender flowchart PNG.');
}

const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');
execFileSync(
  browserExe,
  [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=2',
    '--window-size=1220,800',
    `--screenshot=${outPng}`,
    fileUrl,
  ],
  { stdio: 'ignore' }
);

console.log('Flowchart PNG tersimpan:', outPng);
