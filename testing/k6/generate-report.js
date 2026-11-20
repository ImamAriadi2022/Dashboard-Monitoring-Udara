const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const k6Dir = __dirname;
const reportsDir = path.join(k6Dir, 'reports');
const screenshotsDir = path.join(reportsDir, 'screenshots');

fs.mkdirSync(screenshotsDir, { recursive: true });

const liveSummaryPath = path.join(reportsDir, 'latency-summary.json');
const crudSummaryPath = path.join(reportsDir, 'crud-summary.json');
const terminalTxtPath = path.join(reportsDir, 'k6-terminal-output.txt');

if (!fs.existsSync(liveSummaryPath)) {
  console.error('File tidak ditemukan:', liveSummaryPath);
  process.exit(1);
}

const live = JSON.parse(fs.readFileSync(liveSummaryPath, 'utf8'));
const crud = fs.existsSync(crudSummaryPath) ? JSON.parse(fs.readFileSync(crudSummaryPath, 'utf8')) : null;
const rawTerminal = fs.existsSync(terminalTxtPath) ? fs.readFileSync(terminalTxtPath, 'utf8') : '';

function cleanTerminalOutput(raw) {
  if (!raw) return '(Log terminal tidak tersedia)';
  // Hilangkan ANSI color escapes dan progress lines "running (..)" yang menimpa baris
  const noAnsi = raw.replace(/\x1B\[[0-9;]*[A-Za-z]/g, '');
  const lines = noAnsi.split(/\r?\n/);
  const filtered = [];
  let inSummary = false;
  let capturedBanner = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/\r/g, '');
    if (line.includes('execution:') || line.includes('script:') || line.includes('scenarios:')) {
      capturedBanner = true;
    }
    if (line.includes('█ THRESHOLDS') || line.includes('█ TOTAL RESULTS')) {
      inSummary = true;
    }
    // Simpan banner awal (k6 logo + execution + scenarios), lalu langsung loncat ke TOTAL RESULTS
    if (!capturedBanner && i < 15) {
      filtered.push(line);
    } else if (capturedBanner && !inSummary) {
      if (line.trim().startsWith('running (')) continue;
      if (
        line.includes('execution:') ||
        line.includes('script:') ||
        line.includes('output:') ||
        line.includes('scenarios:') ||
        line.includes('* ')
      ) {
        filtered.push(line);
      }
    } else if (inSummary) {
      filtered.push(line);
    }
  }

  return filtered.join('\n').trim();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function fmtMs(v) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return '-';
  return Number(v).toFixed(2);
}

function getMetric(summary, key) {
  return summary?.metrics?.[key] || null;
}

function checkThresholdOk(metricObj) {
  if (!metricObj || !metricObj.thresholds) return true;
  // Di JSON --summary-export k6, nilai boolean `false` berarti "tidak gagal" (LULUS ✓),
  // sedangkan di handleSummary objeknya berbentuk `{ ok: true }`.
  return Object.values(metricObj.thresholds).every((t) =>
    typeof t === 'boolean' ? t === false : Boolean(t?.ok)
  );
}

const endpointRows = [
  { key: 'http_req_duration{endpoint:status}', label: 'GET /api/status', desc: 'Health check Express & status MQTT broker', sla: '< 300 ms' },
  { key: 'http_req_duration{endpoint:latest}', label: 'GET /api/latest?room=...', desc: 'Data sensor live terbaru per ruangan (4 ruang)', sla: '< 350 ms' },
  { key: 'http_req_duration{endpoint:readings_1d_1m}', label: 'GET /api/readings (1d, 1m)', desc: 'Agregasi grafik 1 hari interval 1 menit', sla: '< 600 ms' },
  { key: 'http_req_duration{endpoint:readings_7d_15m}', label: 'GET /api/readings (7d, 15m)', desc: 'Agregasi grafik 7 hari interval 15 menit', sla: '< 600 ms' },
  { key: 'http_req_duration{endpoint:readings_30d_30m}', label: 'GET /api/readings (30d, 30m)', desc: 'Agregasi grafik 30 hari interval 30 menit', sla: '< 600 ms' },
  { key: 'http_req_duration{endpoint:readings_logs}', label: 'GET /api/readings/logs', desc: 'Log tabel terurut DESC + paginasi SQLite', sla: '< 500 ms' },
  { key: 'http_req_duration{endpoint:download_csv}', label: 'GET /api/download (CSV)', desc: 'Ekspor CSV riwayat sensor ruangan', sla: '< 1500 ms' },
].map((item, idx) => {
  const m = getMetric(live, item.key);
  return {
    no: idx + 1,
    ...item,
    m,
    ok: checkThresholdOk(m),
  };
});

const scenarioRows = [
  { key: 'http_req_duration{scenario:baseline_smoke}', label: '1. Baseline Smoke', vus: '1 VU (Fixed)', sla: '< 500 ms', desc: 'Verifikasi semua endpoint lintas 4 ruangan saat server tenang' },
  { key: 'http_req_duration{scenario:live_polling}', label: '2. Live Polling Dashboard', vus: '15 VU Konstan', sla: '< 400 ms', desc: 'Simulasi pemantauan live real-time (/latest + refresh grafik)' },
  { key: 'http_req_duration{scenario:analytics_load}', label: '3. Analytics & Logs Load', vus: '0 -> 25 VU Ramp', sla: '< 700 ms', desc: 'Simulasi perpindahan filter 1d/7d/30d, log paginasi, & CSV' },
  { key: 'http_req_duration{scenario:spike_test}', label: '4. Spike Resilience Test', vus: '5 -> 40 VU Burst', sla: '< 1000 ms', desc: 'Lonjakan trafik mendadak 40 pengguna konkuren' },
].map((item) => {
  const m = getMetric(live, item.key);
  return { ...item, m, ok: checkThresholdOk(m) };
});

const crudRows = crud
  ? [
      { key: 'http_req_duration{endpoint:post_readings}', label: 'POST /readings', sla: '< 150 ms', desc: 'Tambah 1 rekaman telemetri baru ke SQLite' },
      { key: 'http_req_duration{endpoint:put_readings}', label: 'PUT /readings/:id', sla: '< 150 ms', desc: 'Perbarui rekaman telemetri berdasarkan ID' },
      { key: 'http_req_duration{endpoint:delete_readings}', label: 'DELETE /readings/:id', sla: '< 150 ms', desc: 'Hapus rekaman telemetri berdasarkan ID' },
    ].map((item) => {
      const m = getMetric(crud, item.key);
      return { ...item, m, ok: checkThresholdOk(m) };
    })
  : [];

const totalReqs = live.metrics?.http_reqs?.count || 0;
const rps = live.metrics?.http_reqs?.rate || 0;
const globalDur = live.metrics?.http_req_duration || {};
const globalWait = live.metrics?.http_req_waiting || {};
const waitLatest = getMetric(live, 'http_req_waiting{endpoint:latest}') || {};
const waitChart1m = getMetric(live, 'http_req_waiting{endpoint:readings_1d_1m}') || {};
const failRate = (live.metrics?.http_req_failed?.value || 0) * 100;
const checkRate = (live.metrics?.checks?.value || 0) * 100;
const checkPasses = live.metrics?.checks?.passes || 0;
const checkFails = live.metrics?.checks?.fails || 0;

const cleanedCli = cleanTerminalOutput(rawTerminal);

function buildSvgGroupedBarChart(items, opts = {}) {
  const width = opts.width || 1080;
  const rowH = 44;
  const topPad = 32;
  const bottomPad = 42;
  const leftLabelW = 240;
  const rightPad = 76;
  const plotW = width - leftLabelW - rightPad;
  const height = topPad + items.length * rowH + bottomPad;

  const maxVal = Math.max(
    100,
    ...items.flatMap((it) => [it.avg || 0, it.med || 0, it.p95 || 0, it.p99 || 0])
  );
  const scaleMax = Math.ceil((maxVal * 1.12) / 50) * 50;

  const tickCount = 5;
  const gridLines = [];
  for (let i = 0; i <= tickCount; i++) {
    const val = Math.round((scaleMax / tickCount) * i);
    const x = leftLabelW + (val / scaleMax) * plotW;
    gridLines.push(`
      <line x1="${x.toFixed(1)}" y1="${topPad - 6}" x2="${x.toFixed(1)}" y2="${height - bottomPad + 6}" stroke="#e2e8f0" stroke-dasharray="${i === 0 ? 'none' : '3,3'}" stroke-width="1"/>
      <text x="${x.toFixed(1)}" y="${height - bottomPad + 22}" text-anchor="middle" font-size="11" fill="#64748b" font-family="ui-monospace, monospace">${val} ms</text>
    `);
  }

  const rowsSvg = items
    .map((it, idx) => {
      const yBase = topPad + idx * rowH;
      const bars = [
        { val: it.avg || 0, color: '#0ea5e9', offset: 2, label: 'Avg' },
        { val: it.p95 || 0, color: '#10b981', offset: 14, label: 'p(95)' },
        { val: it.p99 || 0, color: '#f59e0b', offset: 26, label: 'p(99)' },
      ];
      return `
        <text x="${leftLabelW - 12}" y="${yBase + 22}" text-anchor="end" font-size="12" font-weight="600" fill="#0f2942" font-family="system-ui, -apple-system, sans-serif">${escapeHtml(it.name)}</text>
        ${bars
          .map((b) => {
            const w = Math.max(2, (b.val / scaleMax) * plotW);
            const y = yBase + b.offset;
            return `
              <rect x="${leftLabelW}" y="${y}" width="${w.toFixed(1)}" height="9" rx="3" fill="${b.color}"/>
              <text x="${(leftLabelW + w + 6).toFixed(1)}" y="${y + 8}" font-size="10" font-weight="600" fill="#334155" font-family="ui-monospace, monospace">${b.val.toFixed(1)} ms</text>
            `;
          })
          .join('')}
      `;
    })
    .join('');

  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg" style="display:block; background:#ffffff;">
      <g>
        <rect x="${leftLabelW}" y="4" width="12" height="10" rx="2" fill="#0ea5e9"/>
        <text x="${leftLabelW + 17}" y="13" font-size="11" font-weight="600" fill="#334155" font-family="system-ui, sans-serif">Rata-rata (Avg)</text>
        <rect x="${leftLabelW + 135}" y="4" width="12" height="10" rx="2" fill="#10b981"/>
        <text x="${leftLabelW + 152}" y="13" font-size="11" font-weight="600" fill="#334155" font-family="system-ui, sans-serif">Persentil ke-95 p(95)</text>
        <rect x="${leftLabelW + 305}" y="4" width="12" height="10" rx="2" fill="#f59e0b"/>
        <text x="${leftLabelW + 322}" y="13" font-size="11" font-weight="600" fill="#334155" font-family="system-ui, sans-serif">Persentil ke-99 p(99)</text>
      </g>
      ${gridLines.join('')}
      ${rowsSvg}
    </svg>
  `;
}

const endpointChartSvg = buildSvgGroupedBarChart(
  endpointRows.map((r) => ({
    name: r.label,
    avg: r.m?.avg || 0,
    med: r.m?.med || 0,
    p95: r.m?.['p(95)'] || 0,
    p99: r.m?.['p(99)'] || 0,
  }))
);

const scenarioChartSvg = buildSvgGroupedBarChart(
  scenarioRows.map((r) => ({
    name: r.label,
    avg: r.m?.avg || 0,
    med: r.m?.med || 0,
    p95: r.m?.['p(95)'] || 0,
    p99: r.m?.['p(99)'] || 0,
  })),
  { width: 1080 }
);

const generatedDate = new Date().toLocaleString('id-ID', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Laporan Pengujian Latensi REST API Archtera (Grafana k6)</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 28px;
      background: #f1f5f9;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    .container {
      max-width: 1180px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 28px;
    }
    .card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 16px;
      padding: 28px 32px;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.05);
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .badge-tag {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #047857;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      padding: 4px 10px;
      border-radius: 999px;
      margin-bottom: 8px;
    }
    h1, h2 {
      margin: 0;
      color: #0f2942;
    }
    h1 { font-size: 22px; font-weight: 800; }
    h2 { font-size: 18px; font-weight: 800; }
    .sub {
      margin-top: 6px;
      font-size: 13px;
      color: #475569;
    }
    .meta-box {
      text-align: right;
      font-size: 12px;
      color: #475569;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 10px 14px;
      border-radius: 10px;
      line-height: 1.55;
      flex-shrink: 0;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 14px;
      margin-bottom: 22px;
    }
    .kpi {
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      border-radius: 12px;
      padding: 14px 16px;
    }
    .kpi .k-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.04em;
    }
    .kpi .k-val {
      margin-top: 6px;
      font-size: 24px;
      font-weight: 800;
      color: #0f2942;
      font-family: ui-monospace, monospace;
    }
    .kpi .k-note {
      margin-top: 4px;
      font-size: 11px;
      color: #059669;
      font-weight: 600;
    }
    .chart-wrap {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px 18px;
      background: #ffffff;
    }
    .chart-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f2942;
      margin-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12.5px;
      margin-top: 10px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 9px 10px;
      text-align: left;
    }
    th {
      background: #f1f5f9;
      color: #0f2942;
      font-weight: 700;
      font-size: 11.5px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    tbody tr:nth-child(even) { background: #f8fafc; }
    td.num, th.num {
      text-align: right;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-weight: 600;
    }
    .ep-name {
      font-family: ui-monospace, monospace;
      font-weight: 700;
      color: #0f2942;
    }
    .ep-desc {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .status-pass {
      display: inline-block;
      background: #dcfce7;
      color: #166534;
      border: 1px solid #86efac;
      font-weight: 700;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 999px;
      white-space: nowrap;
    }
    .status-fail {
      display: inline-block;
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #fca5a5;
      font-weight: 700;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 999px;
      white-space: nowrap;
    }
    .term-window {
      background: #0f172a;
      color: #e2e8f0;
      border-radius: 14px;
      overflow: hidden;
      border: 1px solid #334155;
      box-shadow: 0 10px 28px rgba(15, 23, 42, 0.2);
    }
    .term-bar {
      background: #1e293b;
      padding: 10px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #334155;
      font-size: 12px;
      font-family: ui-monospace, monospace;
      color: #94a3b8;
    }
    .dots { display: flex; gap: 7px; align-items: center; }
    .dot { width: 11px; height: 11px; border-radius: 50%; }
    .term-body {
      padding: 16px 20px;
      font-family: "Cascadia Mono", "Consolas", ui-monospace, monospace;
      font-size: 11.2px;
      line-height: 1.42;
      white-space: pre-wrap;
      word-break: break-word;
      margin: 0;
    }
    .note-box {
      margin-top: 14px;
      padding: 11px 14px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 10px;
      font-size: 12px;
      color: #1e3a8a;
      line-height: 1.5;
    }
    body.capture-only {
      padding: 20px;
      background: #ffffff;
    }
    body.capture-only .container {
      max-width: 1180px;
    }
    body.capture-only .capture-section {
      display: none;
    }
    body.capture-only .capture-section.active {
      display: block;
    }
  </style>
</head>
<body>
  <div class="container">

    <!-- SECTION 1: TERMINAL OUTPUT -->
    <section id="cap-terminal" class="capture-section">
      <div class="term-window">
        <div class="term-bar">
          <div class="dots">
            <span class="dot" style="background:#ef4444"></span>
            <span class="dot" style="background:#f59e0b"></span>
            <span class="dot" style="background:#10b981"></span>
            <span style="margin-left:10px;color:#e2e8f0;font-weight:700;">PowerShell — k6 run testing\\k6\\latency-suite.js</span>
          </div>
          <span>Target: https://archtera.web.id/api</span>
        </div>
        <pre class="term-body">${escapeHtml(cleanedCli)}</pre>
      </div>
    </section>

    <!-- SECTION 2: RINGKASAN & GRAFIK LATENSI PER ENDPOINT -->
    <section id="cap-charts" class="card capture-section">
      <div class="header-row">
        <div>
          <span class="badge-tag">Laporan Pengujian Latensi Sistem • Grafana k6 v2.2.0</span>
          <h1>Ringkasan Performa &amp; Grafik Latensi API per Endpoint</h1>
          <div class="sub">Sistem Monitoring Kualitas Udara Archtera (4 Ruangan: H5, Lab TD, Lab Kom, Seminar)</div>
        </div>
        <div class="meta-box">
          <div>Target URL: <strong>https://archtera.web.id/api</strong></div>
          <div>Waktu Uji: ${escapeHtml(generatedDate)} WIB</div>
          <div>Total Durasi Uji: ~121 detik (4 Skenario)</div>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi">
          <div class="k-label">Total Permintaan</div>
          <div class="k-val">${totalReqs.toLocaleString('id-ID')}</div>
          <div class="k-note">Throughput ${rps.toFixed(2)} req/s</div>
        </div>
        <div class="kpi">
          <div class="k-label">Rata-Rata Latensi</div>
          <div class="k-val">${fmtMs(globalDur.avg)} ms</div>
          <div class="k-note">Median p50: ${fmtMs(globalDur.med)} ms</div>
        </div>
        <div class="kpi">
          <div class="k-label">Persentil ke-95 p(95)</div>
          <div class="k-val">${fmtMs(globalDur['p(95)'])} ms</div>
          <div class="k-note">p(99): ${fmtMs(globalDur['p(99)'])} ms</div>
        </div>
        <div class="kpi">
          <div class="k-label">Server TTFB (Avg)</div>
          <div class="k-val">${fmtMs(globalWait.avg)} ms</div>
          <div class="k-note">Waiting p(95): ${fmtMs(globalWait['p(95)'])} ms</div>
        </div>
        <div class="kpi">
          <div class="k-label">Keberhasilan Request</div>
          <div class="k-val">${checkRate.toFixed(2)}%</div>
          <div class="k-note">Error HTTP: ${failRate.toFixed(2)}% (${checkPasses}/${checkPasses + checkFails})</div>
        </div>
      </div>

      <div class="chart-wrap">
        <div class="chart-title">Perbandingan Latensi (Avg, p95, p99 dalam milidetik) per Endpoint REST API</div>
        ${endpointChartSvg}
      </div>
    </section>

    <!-- SECTION 3: TABEL METRIK DETAIL & THRESHOLD SLA -->
    <section id="cap-table" class="card capture-section">
      <div class="header-row">
        <div>
          <span class="badge-tag">Detail Statistik Persentil &amp; SLA Thresholds</span>
          <h2>Tabel Pengukuran Latensi Lengkap per Endpoint &amp; Waktu Proses Server (TTFB)</h2>
          <div class="sub">Pengukuran statistik k6 mencakup <code>min</code>, <code>avg</code>, <code>med (p50)</code>, <code>p(90)</code>, <code>p(95)</code>, <code>p(99)</code>, dan <code>max</code>.</div>
        </div>
        <div class="meta-box">
          <div>Server: Node.js Express + SQLite</div>
          <div>Proxy: Nginx Reverse Proxy + SSL</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>Endpoint REST API</th>
            <th class="num">Min (ms)</th>
            <th class="num">Avg (ms)</th>
            <th class="num">Med / p50</th>
            <th class="num">p(90)</th>
            <th class="num">p(95)</th>
            <th class="num">p(99)</th>
            <th class="num">Max (ms)</th>
            <th>SLA p(95)</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${endpointRows
            .map(
              (r) => `
            <tr>
              <td>${r.no}</td>
              <td>
                <div class="ep-name">${escapeHtml(r.label)}</div>
                <div class="ep-desc">${escapeHtml(r.desc)}</div>
              </td>
              <td class="num">${fmtMs(r.m?.min)}</td>
              <td class="num">${fmtMs(r.m?.avg)}</td>
              <td class="num">${fmtMs(r.m?.med)}</td>
              <td class="num">${fmtMs(r.m?.['p(90)'])}</td>
              <td class="num">${fmtMs(r.m?.['p(95)'])}</td>
              <td class="num">${fmtMs(r.m?.['p(99)'])}</td>
              <td class="num">${fmtMs(r.m?.max)}</td>
              <td>${escapeHtml(r.sla)}</td>
              <td><span class="${r.ok ? 'status-pass' : 'status-fail'}">${r.ok ? 'LULUS ✓' : 'GAGAL ✗'}</span></td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table>

      <div style="margin-top:20px;">
        <h2 style="font-size:15px;">Pemisahan Latensi Server (TTFB / <code>http_req_waiting</code>) pada Endpoint Kritis</h2>
        <table>
          <thead>
            <tr>
              <th>Metrik Waktu Tunggu Server (TTFB)</th>
              <th class="num">Min (ms)</th>
              <th class="num">Avg (ms)</th>
              <th class="num">Med (ms)</th>
              <th class="num">p(95) (ms)</th>
              <th class="num">p(99) (ms)</th>
              <th class="num">Max (ms)</th>
              <th>Batas SLA p(95)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span class="ep-name">http_req_waiting</span> (Seluruh Request)</td>
              <td class="num">${fmtMs(globalWait.min)}</td>
              <td class="num">${fmtMs(globalWait.avg)}</td>
              <td class="num">${fmtMs(globalWait.med)}</td>
              <td class="num">${fmtMs(globalWait['p(95)'])}</td>
              <td class="num">${fmtMs(globalWait['p(99)'])}</td>
              <td class="num">${fmtMs(globalWait.max)}</td>
              <td>Monitoring</td>
              <td><span class="status-pass">TERUKUR ✓</span></td>
            </tr>
            <tr>
              <td><span class="ep-name">http_req_waiting{endpoint:latest}</span></td>
              <td class="num">${fmtMs(waitLatest.min)}</td>
              <td class="num">${fmtMs(waitLatest.avg)}</td>
              <td class="num">${fmtMs(waitLatest.med)}</td>
              <td class="num">${fmtMs(waitLatest['p(95)'])}</td>
              <td class="num">${fmtMs(waitLatest['p(99)'])}</td>
              <td class="num">${fmtMs(waitLatest.max)}</td>
              <td>&lt; 300 ms</td>
              <td><span class="${checkThresholdOk(waitLatest) ? 'status-pass' : 'status-fail'}">${checkThresholdOk(waitLatest) ? 'LULUS ✓' : 'GAGAL ✗'}</span></td>
            </tr>
            <tr>
              <td><span class="ep-name">http_req_waiting{endpoint:readings_1d_1m}</span></td>
              <td class="num">${fmtMs(waitChart1m.min)}</td>
              <td class="num">${fmtMs(waitChart1m.avg)}</td>
              <td class="num">${fmtMs(waitChart1m.med)}</td>
              <td class="num">${fmtMs(waitChart1m['p(95)'])}</td>
              <td class="num">${fmtMs(waitChart1m['p(99)'])}</td>
              <td class="num">${fmtMs(waitChart1m.max)}</td>
              <td>&lt; 450 ms</td>
              <td><span class="${checkThresholdOk(waitChart1m) ? 'status-pass' : 'status-fail'}">${checkThresholdOk(waitChart1m) ? 'LULUS ✓' : 'GAGAL ✗'}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- SECTION 4: PERBANDINGAN SKENARIO BEBAN & CRUD TERISOLASI -->
    <section id="cap-scenarios" class="card capture-section">
      <div class="header-row">
        <div>
          <span class="badge-tag">Evaluasi Skenario Beban &amp; Uji Operasi Tulis CRUD</span>
          <h2>Perbandingan Latensi Lintas Skenario Beban &amp; Siklus CRUD SQLite</h2>
          <div class="sub">Mengukur stabilitas server dari 1 VU (Baseline) hingga lonjakan 40 VU konkuren (Spike Test) serta latensi Write DB lokal terisolasi.</div>
        </div>
        <div class="meta-box">
          <div>Skenario Read: Live VPS</div>
          <div>Skenario CRUD Write: DB Terisolasi</div>
        </div>
      </div>

      <div class="chart-wrap" style="margin-bottom:18px;">
        <div class="chart-title">Grafik Latensi per Skenario Beban (ms)</div>
        ${scenarioChartSvg}
      </div>

      <table>
        <thead>
          <tr>
            <th>Skenario Pengujian (Live VPS)</th>
            <th>Beban VU</th>
            <th class="num">Min (ms)</th>
            <th class="num">Avg (ms)</th>
            <th class="num">Med (ms)</th>
            <th class="num">p(95) (ms)</th>
            <th class="num">p(99) (ms)</th>
            <th class="num">Max (ms)</th>
            <th>SLA p(95)</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${scenarioRows
            .map(
              (r) => `
            <tr>
              <td>
                <div class="ep-name">${escapeHtml(r.label)}</div>
                <div class="ep-desc">${escapeHtml(r.desc)}</div>
              </td>
              <td><strong>${escapeHtml(r.vus)}</strong></td>
              <td class="num">${fmtMs(r.m?.min)}</td>
              <td class="num">${fmtMs(r.m?.avg)}</td>
              <td class="num">${fmtMs(r.m?.med)}</td>
              <td class="num">${fmtMs(r.m?.['p(95)'])}</td>
              <td class="num">${fmtMs(r.m?.['p(99)'])}</td>
              <td class="num">${fmtMs(r.m?.max)}</td>
              <td>${escapeHtml(r.sla)}</td>
              <td><span class="${r.ok ? 'status-pass' : 'status-fail'}">${r.ok ? 'LULUS ✓' : 'GAGAL ✗'}</span></td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table>

      ${
        crudRows.length > 0
          ? `
      <div style="margin-top:20px;">
        <h2 style="font-size:15px;">Hasil Uji Latensi Operasi Tulis CRUD Admin (<code>testing/k6/crud-isolated.js</code> • DB Terisolasi)</h2>
        <table>
          <thead>
            <tr>
              <th>Operasi HTTP CRUD</th>
              <th class="num">Min (ms)</th>
              <th class="num">Avg (ms)</th>
              <th class="num">Med (ms)</th>
              <th class="num">p(90) (ms)</th>
              <th class="num">p(95) (ms)</th>
              <th class="num">p(99) (ms)</th>
              <th class="num">Max (ms)</th>
              <th>SLA p(95)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${crudRows
              .map(
                (r) => `
              <tr>
                <td>
                  <div class="ep-name">${escapeHtml(r.label)}</div>
                  <div class="ep-desc">${escapeHtml(r.desc)}</div>
                </td>
                <td class="num">${fmtMs(r.m?.min)}</td>
                <td class="num">${fmtMs(r.m?.avg)}</td>
                <td class="num">${fmtMs(r.m?.med)}</td>
                <td class="num">${fmtMs(r.m?.['p(90)'])}</td>
                <td class="num">${fmtMs(r.m?.['p(95)'])}</td>
                <td class="num">${fmtMs(r.m?.['p(99)'])}</td>
                <td class="num">${fmtMs(r.m?.max)}</td>
                <td>${escapeHtml(r.sla)}</td>
                <td><span class="${r.ok ? 'status-pass' : 'status-fail'}">${r.ok ? 'LULUS ✓' : 'GAGAL ✗'}</span></td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>`
          : ''
      }

      <div class="note-box">
        <strong>Catatan Metodologi Pengujian:</strong> Skenario pembacaan (GET) dijalankan langsung ke server produksi <code>https://archtera.web.id/api</code> guna mengukur performa nyata melewati internet, TLS, Nginx, Express, dan SQLite. Skenario CRUD (POST/PUT/DELETE) dijalankan terhadap salinan database SQLite terisolasi (<code>1–10 VU ramp</code>) sehingga urutan ID dan kebersihan data historis IoT pada server produksi tetap terjaga.
      </div>
    </section>

  </div>

  <script>
    (function () {
      const params = new URLSearchParams(window.location.search);
      const sec = params.get('section');
      if (sec) {
        document.body.classList.add('capture-only');
        const target = document.getElementById('cap-' + sec);
        if (target) target.classList.add('active');
      }
    })();
  </script>
</body>
</html>`;

const htmlPath = path.join(reportsDir, 'laporan-latensi-k6.html');
fs.writeFileSync(htmlPath, html, 'utf8');
console.log('HTML report dibuat:', htmlPath);

// Ambil screenshot PNG via Google Chrome headless jika tersedia
const chromeCandidates = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];
const browserExe = chromeCandidates.find((p) => fs.existsSync(p));

if (browserExe) {
  const captures = [
    { section: 'terminal', file: '01_terminal_eksekusi_k6.png', size: '1220,2240' },
    { section: 'charts', file: '02_ringkasan_dan_grafik_latensi.png', size: '1240,860' },
    { section: 'table', file: '03_tabel_metrik_dan_threshold.png', size: '1240,940' },
    { section: 'scenarios', file: '04_skenario_beban_dan_crud.png', size: '1240,1150' },
  ];

  const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');
  for (const cap of captures) {
    const outPng = path.join(screenshotsDir, cap.file);
    execFileSync(
      browserExe,
      [
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        '--force-device-scale-factor=2',
        `--window-size=${cap.size}`,
        `--screenshot=${outPng}`,
        `${fileUrl}?section=${cap.section}`,
      ],
      { stdio: 'ignore' }
    );
    console.log('Screenshot tersimpan:', outPng);
  }
} else {
  console.warn('Chrome/Edge tidak ditemukan, lewati screenshot PNG otomatis.');
}
