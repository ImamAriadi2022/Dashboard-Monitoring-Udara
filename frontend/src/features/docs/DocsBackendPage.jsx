import React, { useState } from 'react';
import {
  Server,
  Database,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Terminal,
  FileCode,
  BookOpen,
  Workflow,
  ListChecks,
  Radio,
} from 'lucide-react';
import CodeBlock from './components/CodeBlock';

const ENDPOINT_SUMMARY = [
  {
    no: 1,
    anchor: 'ep-status',
    method: 'GET',
    path: '/api/status',
    expressPath: '/status',
    category: 'Monitoring',
    summary: 'Health check server Express & status koneksi MQTT Broker.',
    usage: 'Monitoring sistem & kesiapan backend',
  },
  {
    no: 2,
    anchor: 'ep-latest',
    method: 'GET',
    path: '/api/latest',
    expressPath: '/latest',
    category: 'Live Telemetri',
    summary: 'Mengambil 1 rekaman sensor paling terakhir per ruangan.',
    usage: 'Kartu metrik live & indikator LIVE/OFFLINE (poll 3 detik)',
  },
  {
    no: 3,
    anchor: 'ep-readings',
    method: 'GET',
    path: '/api/readings',
    expressPath: '/readings',
    category: 'Grafik & Riwayat',
    summary: 'Mengambil deret waktu terurut ASC dengan agregasi 1m / 15m / 30m atau raw.',
    usage: 'Grafik Chart.js & data terbaru Panel Admin',
  },
  {
    no: 4,
    anchor: 'ep-logs',
    method: 'GET',
    path: '/api/readings/logs',
    expressPath: '/readings/logs',
    category: 'Tabel Log',
    summary: 'Mengambil log lengkap terurut DESC dengan paginasi & pencarian server-side.',
    usage: 'Tab Log Riwayat Data (halaman, cari ID/jam WIB, total asli DB)',
  },
  {
    no: 5,
    anchor: 'ep-download',
    method: 'GET',
    path: '/api/download',
    expressPath: '/download',
    category: 'Ekspor CSV',
    summary: 'Mengunduh seluruh rekaman SQLite sesuai ruangan & rentang waktu sebagai CSV.',
    usage: 'Tombol Unduh Data (.CSV) pada Dashboard',
  },
  {
    no: 6,
    anchor: 'ep-create',
    method: 'POST',
    path: '/api/readings',
    expressPath: '/readings',
    category: 'CRUD Admin',
    summary: 'Menambahkan rekaman data sensor baru secara manual via HTTP POST.',
    usage: 'Panel /admin (Tambah Data Manual) & integrasi HTTP',
  },
  {
    no: 7,
    anchor: 'ep-update',
    method: 'PUT',
    path: '/api/readings/:id',
    expressPath: '/readings/:id',
    category: 'CRUD Admin',
    summary: 'Memperbarui nilai rekaman sensor berdasarkan ID database.',
    usage: 'Panel /admin (Edit Rekaman)',
  },
  {
    no: 8,
    anchor: 'ep-delete',
    method: 'DELETE',
    path: '/api/readings/:id',
    expressPath: '/readings/:id',
    category: 'CRUD Admin',
    summary: 'Menghapus 1 baris rekaman sensor dari SQLite berdasarkan ID.',
    usage: 'Panel /admin (Hapus Anomali)',
  },
  {
    no: 9,
    anchor: 'ep-simulate',
    method: 'POST',
    path: '/api/simulate',
    expressPath: '/simulate',
    category: 'Simulasi',
    summary: 'Menyuntikkan 1 rekaman simulasi acak realistis sesuai baseline ruangan.',
    usage: 'Pengujian & demonstrasi alur dashboard tanpa hardware fisik',
  },
];

const METHOD_BADGES = {
  GET: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  POST: 'bg-sky-100 text-sky-800 border border-sky-200',
  PUT: 'bg-amber-100 text-amber-800 border border-amber-200',
  DELETE: 'bg-rose-100 text-rose-800 border border-rose-200',
};

export default function DocsBackendPage({ onNavigate }) {
  const [activeLang, setActiveLang] = useState('curl');
  const domainHost = 'archtera.web.id';
  const baseIp = '202.155.17.57';
  const baseUrl = `https://${domainHost}/api`;

  const codeExamples = {
    curl: `# 1. Periksa status server & koneksi MQTT
curl -X GET "${baseUrl}/status"

# 2. Ambil data telemetri terakhir Ruang H5
curl -X GET "${baseUrl}/latest?room=h5"

# 3. Ambil data grafik rata-rata per 15 menit (1 hari terakhir)
curl -X GET "${baseUrl}/readings?room=h5&range=1d&interval=15m"

# 4. Ambil log terurut terbaru->terlama halaman 1 + cari jam 09:59 WIB
curl -X GET "${baseUrl}/readings/logs?room=h5&range=7d&page=1&pageSize=50&search=09:59"

# 5. Unduh file CSV 30 hari Ruang Seminar
curl -o data_seminar.csv "${baseUrl}/download?room=seminar&range=30d"

# 6. Tambah data manual (POST)
curl -X POST "${baseUrl}/readings" \\
  -H "Content-Type: application/json" \\
  -d '{"room":"lab_td","temperature":27.4,"humidity":58.2,"wind_speed":1.4,"fan_rpm":980,"relay_state":"ON"}'`,

    js: `// Menggunakan JavaScript Fetch API (ES6+)
const BASE_URL = '${baseUrl}';

// 1. Ambil data real-time sensor terbaru
async function getLatestData(room = 'h5') {
  const response = await fetch(\`\${BASE_URL}/latest?room=\${room}\`);
  if (!response.ok) throw new Error(\`HTTP error! status: \${response.status}\`);
  return await response.json();
}

// 2. Ambil riwayat grafik dengan agregasi (1m, 15m, atau 30m)
async function getChartHistory(room = 'h5', range = '1d', interval = '15m') {
  const response = await fetch(
    \`\${BASE_URL}/readings?room=\${room}&range=\${range}&interval=\${interval}\`
  );
  return await response.json();
}

// 3. Ambil log terpaginasi terbaru -> terlama
async function getPaginatedLogs(room = 'h5', page = 1, pageSize = 50, search = '') {
  const qs = new URLSearchParams({ room, range: '7d', page, pageSize, search });
  const response = await fetch(\`\${BASE_URL}/readings/logs?\${qs.toString()}\`);
  return await response.json(); // { rows, total, totalAll, page, pageSize, totalPages }
}

getChartHistory('h5', '7d', '15m').then((rows) => {
  console.log(\`Diterima \${rows.length} titik grafik agregasi\`);
});`,

    python: `import requests

BASE_URL = "${baseUrl}"

# 1. Cek status koneksi backend & broker MQTT
def check_status():
    res = requests.get(f"{BASE_URL}/status", timeout=10)
    res.raise_for_status()
    return res.json()

# 2. Ambil grafik agregasi per 15 menit (1m / 15m / 30m)
def get_aggregated_readings(room="h5", range_param="1d", interval="15m"):
    res = requests.get(
        f"{BASE_URL}/readings",
        params={"room": room, "range": range_param, "interval": interval},
        timeout=10,
    )
    res.raise_for_status()
    return res.json()

# 3. Ambil log riwayat data per halaman (terurut terbaru -> terlama)
def get_logs(room="h5", page=1, page_size=50, search=""):
    res = requests.get(
        f"{BASE_URL}/readings/logs",
        params={"room": room, "range": "7d", "page": page, "pageSize": page_size, "search": search},
        timeout=10,
    )
    res.raise_for_status()
    return res.json()

# 4. Unduh dataset CSV langsung ke file lokal
def download_csv(room="h5", range_param="30d", filename="sensor_data.csv"):
    res = requests.get(f"{BASE_URL}/download", params={"room": room, "range": range_param}, timeout=20)
    res.raise_for_status()
    with open(filename, "wb") as f:
        f.write(res.content)
    print(f"Dataset berhasil disimpan ke {filename}")

if __name__ == "__main__":
    print(check_status())
    logs = get_logs("h5", page=1, page_size=10)
    print(f"Total rekaman H5 di DB: {logs['totalAll']}")`,

    nodejs: `// Menggunakan Node.js bawaan (v18+)
const BASE_URL = '${baseUrl}';

async function inspectSystem() {
  const [statusRes, logsRes, chartRes] = await Promise.all([
    fetch(\`\${BASE_URL}/status\`).then((r) => r.json()),
    fetch(\`\${BASE_URL}/readings/logs?room=h5&range=7d&page=1&pageSize=5\`).then((r) => r.json()),
    fetch(\`\${BASE_URL}/readings?room=h5&range=1d&interval=30m\`).then((r) => r.json()),
  ]);

  console.log('MQTT Connected:', statusRes.mqtt?.connected);
  console.log('Total baris H5 di DB:', logsRes.totalAll);
  console.log('Jumlah titik grafik 30m (1d):', chartRes.length);
}

inspectSystem();`,
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
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  Dokumentasi Teknis
                </span>
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#0f2942] tracking-tight flex items-center gap-3">
                <Server className="h-7 w-7 text-emerald-600" />
                <span>Dokumentasi Backend &amp; REST API</span>
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                Referensi lengkap seluruh <strong>9 Endpoint REST API</strong> pada <code>backend/bridge.js</code>, arsitektur Nginx reverse proxy SSL, skema database SQLite (<code>air_data.db</code>), dan jalur masuk data MQTT di server <strong>{domainHost}</strong> (<code>{baseIp}</code>).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => onNavigate('docs-all')}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-emerald-700 transition-all cursor-pointer shadow-2xs"
              >
                <BookOpen className="h-4 w-4 text-emerald-600" />
                <span>Hub Pengantar</span>
              </button>

              <button
                onClick={() => onNavigate('docs-arch')}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-indigo-700 transition-all cursor-pointer shadow-2xs"
              >
                <Workflow className="h-4 w-4 text-indigo-600" />
                <span>Arsitektur &amp; Alur</span>
              </button>

              <button
                onClick={() => onNavigate('docs-iot')}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-emerald-700 transition-all cursor-pointer shadow-2xs"
              >
                <Cpu className="h-4 w-4 text-cyan-600" />
                <span>Buka Dokumen IoT</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => onNavigate('docs-vps')}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-amber-700 transition-all cursor-pointer shadow-2xs"
              >
                <Terminal className="h-4 w-4 text-amber-600" />
                <span>Akses VPS</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => onNavigate('dashboard')}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-all cursor-pointer shadow-xs"
              >
                <span>Buka Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-12">
        {/* Section 1: Server Architecture & Endpoint Inventory Overview */}
        <section className="space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-[#0f2942]">1. Arsitektur Server &amp; Inventaris Endpoint Sistem</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Total Endpoint API</span>
              <div className="text-xl font-extrabold text-[#0f2942] font-mono mt-1">9 REST Endpoint</div>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Terdiri dari <strong>5 GET</strong>, <strong>2 POST</strong>, <strong>1 PUT</strong>, dan <strong>1 DELETE</strong> di <code>backend/bridge.js</code> (+ 1 MQTT Subscriber).
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Base Path Produksi</span>
              <div className="text-sm font-bold text-emerald-700 font-mono mt-1 break-all">{baseUrl}</div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Atau via IP: <code>https://{baseIp}/api</code>. Nginx mem-proxy <code>/api/*</code> ke Express <code>127.0.0.1:3000/*</code>.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ingestion IoT (MQTT)</span>
              <div className="text-sm font-bold text-[#0f2942] font-mono mt-1">broker.emqx.io:1883</div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Subscribe topik <code>monitoring_udara_ta/data</code> lalu otomatis menulis ke SQLite.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Penyimpanan Database</span>
              <div className="text-sm font-bold text-slate-800 font-mono mt-1">SQLite (air_data.db)</div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Tabel <code>readings</code> dengan indeks komposit waktu + ruangan &amp; sanitasi nilai <code>NaN/Inf</code>.
              </p>
            </div>
          </div>

          {/* Complete Summary Table of all 9 endpoints */}
          <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-[#0f2942]">
                  Daftar Lengkap Seluruh Endpoint Sistem (Total: {ENDPOINT_SUMMARY.length} Endpoint)
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono font-bold">
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">5 GET</span>
                <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800">2 POST</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">1 PUT</span>
                <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">1 DELETE</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase">
                  <tr>
                    <th className="py-2.5 px-4 w-10">#</th>
                    <th className="py-2.5 px-4">Method</th>
                    <th className="py-2.5 px-4">Endpoint Publik (via Nginx)</th>
                    <th className="py-2.5 px-4">Route Express Lokal</th>
                    <th className="py-2.5 px-4">Kategori</th>
                    <th className="py-2.5 px-4">Fungsi &amp; Penggunaan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ENDPOINT_SUMMARY.map((ep) => (
                    <tr key={ep.no} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4 font-mono text-slate-400 font-semibold">{ep.no}</td>
                      <td className="py-2.5 px-4">
                        <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold font-mono ${METHOD_BADGES[ep.method]}`}>
                          {ep.method}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-[#0f2942]">
                        <a href={`#${ep.anchor}`} className="hover:text-emerald-600 underline decoration-slate-300 underline-offset-2">
                          {ep.path}
                        </a>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-500">{ep.expressPath}</td>
                      <td className="py-2.5 px-4">
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
                          {ep.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">
                        <div className="font-medium text-slate-700">{ep.summary}</div>
                        <div className="text-[11px] text-slate-400">{ep.usage}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3 bg-cyan-50/60 border-t border-cyan-100 flex items-center gap-2 text-xs text-cyan-900">
              <Radio className="h-4 w-4 text-cyan-700 shrink-0" />
              <span>
                <strong>Catatan Jalur IoT:</strong> Perangkat ESP32 mengirim payload JSON lewat protokol <strong>MQTT</strong> ke topik <code>monitoring_udara_ta/data</code> (bukan HTTP), lalu service <code>bridge.js</code> menyimpannya ke SQLite agar langsung terbaca oleh 9 endpoint REST API di atas.
              </span>
            </div>
          </div>
        </section>

        {/* Section 2: Detailed REST API Endpoints Specification */}
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2.5">
              <Terminal className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-[#0f2942]">2. Spesifikasi Detail Ke-9 Endpoint REST API</h2>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-500">
              Total aktif di backend/bridge.js: 9 endpoint
            </span>
          </div>

          <div className="space-y-6">
            {/* Endpoint 1: GET /api/status */}
            <div id="ep-status" className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4 scroll-mt-20">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-slate-400">#1</span>
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-bold font-mono ${METHOD_BADGES.GET}`}>
                    GET
                  </span>
                  <span className="text-base font-bold text-[#0f2942] font-mono">/api/status</span>
                </div>
                <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium">
                  Health Check &amp; Status MQTT
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Mengembalikan status operasional server backend Express dan konfirmasi keterhubungan listener terhadap broker MQTT EMQX (<code>mqtt.connected</code>). Tidak memerlukan parameter apa pun.
              </p>

              <CodeBlock
                language="json"
                title="Response 200 OK — GET /api/status"
                code={`{
  "status": "online",
  "mqtt": {
    "broker": "mqtt://broker.emqx.io",
    "topic": "monitoring_udara_ta/data",
    "connected": true
  },
  "timestamp": "2026-11-09T03:15:00.000Z"
}`}
              />
            </div>

            {/* Endpoint 2: GET /api/latest */}
            <div id="ep-latest" className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4 scroll-mt-20">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-slate-400">#2</span>
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-bold font-mono ${METHOD_BADGES.GET}`}>
                    GET
                  </span>
                  <span className="text-base font-bold text-[#0f2942] font-mono">/api/latest</span>
                </div>
                <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium">
                  Data Sensor Terakhir
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Mengambil 1 rekaman telemetri sensor paling terakhir (<code>ORDER BY recorded_at DESC, id DESC LIMIT 1</code>). Dipanggil frontend setiap 3 detik untuk kartu metrik live dan status koneksi <code>LIVE</code> / <code>OFFLINE</code>. Mengembalikan <code>{`{}`}</code> jika ruangan belum memiliki data.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Query Parameter</th>
                      <th className="py-2.5 px-3">Tipe</th>
                      <th className="py-2.5 px-3">Default</th>
                      <th className="py-2.5 px-3">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2 px-3 font-mono text-emerald-700 font-bold">room</td>
                      <td className="py-2 px-3 font-mono text-slate-500">string</td>
                      <td className="py-2 px-3 font-mono text-slate-500">'h5'</td>
                      <td className="py-2 px-3 text-slate-600">
                        Kode ruangan: <code>h5</code>, <code>lab_td</code>, <code>lab_kom</code>, <code>seminar</code>, atau <code>all</code>.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <CodeBlock
                language="json"
                title="Response 200 OK — GET /api/latest?room=h5"
                code={`{
  "id": 5373,
  "temperature": 29.43,
  "humidity": 75.05,
  "wind_speed": 0,
  "co2": 400,
  "recorded_at": "2026-11-09 02:59:18",
  "tvoc": 0,
  "fan_rpm": 1560,
  "relay_state": "ON",
  "air_quality": "PERINGATAN",
  "temp_status": "PERINGATAN",
  "hum_status": "BAHAYA",
  "co2_status": "AMAN",
  "uptime": 1842,
  "room": "h5"
}`}
              />
            </div>

            {/* Endpoint 3: GET /api/readings */}
            <div id="ep-readings" className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4 scroll-mt-20">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-slate-400">#3</span>
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-bold font-mono ${METHOD_BADGES.GET}`}>
                    GET
                  </span>
                  <span className="text-base font-bold text-[#0f2942] font-mono">/api/readings</span>
                </div>
                <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium">
                  Grafik Agregasi &amp; Deret Waktu
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Mengembalikan daftar deret waktu pembacaan sensor untuk grafik dashboard maupun panel admin. Mendukung agregasi rata-rata per bucket waktu (<code>1m</code>, <code>15m</code>, <code>30m</code>) langsung di SQLite serta selalu memprioritaskan data/bucket paling baru (<code>DESC LIMIT</code>) sebelum diurutkan ke <code>order</code> target agar tidak terpotong di data lama.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Query Parameter</th>
                      <th className="py-2.5 px-3">Tipe</th>
                      <th className="py-2.5 px-3">Default</th>
                      <th className="py-2.5 px-3">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2 px-3 font-mono text-emerald-700 font-bold">room</td>
                      <td className="py-2 px-3 font-mono text-slate-500">string</td>
                      <td className="py-2 px-3 font-mono text-slate-500">'h5'</td>
                      <td className="py-2 px-3 text-slate-600">
                        <code>h5</code>, <code>lab_td</code>, <code>lab_kom</code>, <code>seminar</code>, atau <code>all</code>.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-emerald-700 font-bold">range</td>
                      <td className="py-2 px-3 font-mono text-slate-500">string</td>
                      <td className="py-2 px-3 font-mono text-slate-500">'' (semua)</td>
                      <td className="py-2 px-3 text-slate-600">
                        Filter waktu: <code>1d</code> / <code>24h</code> (1 hari), <code>7d</code> (7 hari), <code>30d</code> / <code>1m</code> / <code>1month</code> (1 bulan / 30 hari), atau <code>3d</code>.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-emerald-700 font-bold">interval</td>
                      <td className="py-2 px-3 font-mono text-slate-500">string</td>
                      <td className="py-2 px-3 font-mono text-slate-500">'raw'</td>
                      <td className="py-2 px-3 text-slate-600">
                        Agregasi rata-rata grafik: <code>1m</code> (per 1 menit), <code>15m</code> (per 15 menit), <code>30m</code> (per 30 menit), atau <code>raw</code> (baris asli). Menambahkan field <code>sample_count</code> per titik.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-emerald-700 font-bold">limit</td>
                      <td className="py-2 px-3 font-mono text-slate-500">integer</td>
                      <td className="py-2 px-3 font-mono text-slate-500">45000 / 2000</td>
                      <td className="py-2 px-3 text-slate-600">
                        Untuk mode agregasi: default <code>45000</code> (maks <code>50000</code>). Untuk mode <code>raw</code>: default <code>2000</code> (maks <code>10000</code>).
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-emerald-700 font-bold">order</td>
                      <td className="py-2 px-3 font-mono text-slate-500">string</td>
                      <td className="py-2 px-3 font-mono text-slate-500">'asc'</td>
                      <td className="py-2 px-3 text-slate-600">
                        <code>asc</code> (kronologis lama -&gt; baru untuk grafik) atau <code>desc</code> (baru -&gt; lama).
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-emerald-700 font-bold">afterId</td>
                      <td className="py-2 px-3 font-mono text-slate-500">integer</td>
                      <td className="py-2 px-3 font-mono text-slate-500">0</td>
                      <td className="py-2 px-3 text-slate-600">
                        Khusus mode <code>raw</code>: hanya mengambil data baru dengan <code>id &gt; afterId</code> secara inkremental.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <CodeBlock
                language="json"
                title="Response 200 OK — GET /api/readings?room=h5&range=1d&interval=15m&limit=2"
                code={`[
  {
    "id": 5368,
    "room": "h5",
    "recorded_at": "2026-11-09 02:30:00",
    "temperature": 29.41,
    "humidity": 74.82,
    "wind_speed": 0.45,
    "co2": 405,
    "tvoc": 2,
    "fan_rpm": 1560,
    "sample_count": 60
  },
  {
    "id": 5373,
    "room": "h5",
    "recorded_at": "2026-11-09 02:45:00",
    "temperature": 29.46,
    "humidity": 75.01,
    "wind_speed": 0.62,
    "co2": 402,
    "tvoc": 1,
    "fan_rpm": 1564,
    "sample_count": 58
  }
]`}
              />
            </div>

            {/* Endpoint 4: GET /api/readings/logs */}
            <div id="ep-logs" className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4 scroll-mt-20">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-slate-400">#4</span>
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-bold font-mono ${METHOD_BADGES.GET}`}>
                    GET
                  </span>
                  <span className="text-base font-bold text-[#0f2942] font-mono">/api/readings/logs</span>
                </div>
                <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium">
                  Log Riwayat Terpaginasi
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Endpoint khusus untuk tab <strong>Log Riwayat Data</strong>. Mengembalikan baris mentah database secara utuh dengan urutan tegas terbaru ke terlama (<code>ORDER BY recorded_at DESC, id DESC</code>), lengkap dengan metadata paginasi, total baris asli database (<code>totalAll</code>), dan pencarian server-side ke seluruh rekaman.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Query Parameter</th>
                      <th className="py-2.5 px-3">Tipe</th>
                      <th className="py-2.5 px-3">Default</th>
                      <th className="py-2.5 px-3">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2 px-3 font-mono text-emerald-700 font-bold">room</td>
                      <td className="py-2 px-3 font-mono text-slate-500">string</td>
                      <td className="py-2 px-3 font-mono text-slate-500">'h5'</td>
                      <td className="py-2 px-3 text-slate-600">Kode ruangan target atau <code>all</code>.</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-emerald-700 font-bold">range</td>
                      <td className="py-2 px-3 font-mono text-slate-500">string</td>
                      <td className="py-2 px-3 font-mono text-slate-500">'' (semua)</td>
                      <td className="py-2 px-3 text-slate-600">
                        <code>1d</code>, <code>7d</code>, <code>30d</code> (atau kosong untuk semua waktu).
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-emerald-700 font-bold">search</td>
                      <td className="py-2 px-3 font-mono text-slate-500">string</td>
                      <td className="py-2 px-3 font-mono text-slate-500">''</td>
                      <td className="py-2 px-3 text-slate-600">
                        Mencari di seluruh kolom: ID (<code>5373</code> atau <code>#5373</code>), ruangan, timestamp UTC &amp; WIB (<code>09:59</code> / <code>09.59</code>), suhu, kelembapan, angin, CO2, relay, &amp; status udara.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-emerald-700 font-bold">page</td>
                      <td className="py-2 px-3 font-mono text-slate-500">integer</td>
                      <td className="py-2 px-3 font-mono text-slate-500">1</td>
                      <td className="py-2 px-3 text-slate-600">Nomor halaman (otomatis dibatasi maksimal ke <code>totalPages</code>).</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-emerald-700 font-bold">pageSize</td>
                      <td className="py-2 px-3 font-mono text-slate-500">integer</td>
                      <td className="py-2 px-3 font-mono text-slate-500">50</td>
                      <td className="py-2 px-3 text-slate-600">Jumlah baris per halaman (alias: <code>limit</code>, maks <code>200</code>).</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <CodeBlock
                language="json"
                title="Response 200 OK — GET /api/readings/logs?room=h5&range=7d&page=1&pageSize=2"
                code={`{
  "rows": [
    {
      "id": 5373,
      "room": "h5",
      "recorded_at": "2026-11-09 02:59:18",
      "temperature": 29.43,
      "humidity": 75.05,
      "wind_speed": 0,
      "fan_rpm": 1560,
      "relay_state": "ON",
      "air_quality": "PERINGATAN"
    },
    {
      "id": 5372,
      "room": "h5",
      "recorded_at": "2026-11-09 02:59:03",
      "temperature": 29.43,
      "humidity": 74.94,
      "wind_speed": 0,
      "fan_rpm": 1560,
      "relay_state": "ON",
      "air_quality": "PERINGATAN"
    }
  ],
  "total": 4354,
  "totalAll": 4354,
  "page": 1,
  "pageSize": 2,
  "totalPages": 2177
}`}
              />
            </div>

            {/* Endpoint 5: GET /api/download */}
            <div id="ep-download" className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4 scroll-mt-20">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-slate-400">#5</span>
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-bold font-mono ${METHOD_BADGES.GET}`}>
                    GET
                  </span>
                  <span className="text-base font-bold text-[#0f2942] font-mono">/api/download</span>
                </div>
                <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium">
                  Unduh Dataset CSV
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Menghasilkan dan mengunduh file <code>text/csv</code> langsung dari SQLite dalam urutan kronologis (<code>ORDER BY recorded_at ASC, id ASC</code>) tanpa pemotongan jumlah baris.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Query Parameter</th>
                      <th className="py-2.5 px-3">Tipe</th>
                      <th className="py-2.5 px-3">Default</th>
                      <th className="py-2.5 px-3">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2 px-3 font-mono text-emerald-700 font-bold">room</td>
                      <td className="py-2 px-3 font-mono text-slate-500">string</td>
                      <td className="py-2 px-3 font-mono text-slate-500">'lab_td'</td>
                      <td className="py-2 px-3 text-slate-600">Kode ruangan atau <code>all</code>.</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-emerald-700 font-bold">range</td>
                      <td className="py-2 px-3 font-mono text-slate-500">string</td>
                      <td className="py-2 px-3 font-mono text-slate-500">'all'</td>
                      <td className="py-2 px-3 text-slate-600">
                        <code>1d</code>, <code>7d</code>, <code>30d</code>, atau <code>all</code>.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <CodeBlock
                language="csv"
                title="Format Output CSV — GET /api/download?room=h5&range=1d"
                code={`ID,Ruangan,Waktu_Rekam,Suhu_C,Kelembapan_Persen,Angin_ms,Status_Kipas,Kualitas_Udara
5372,h5,"2026-11-09 02:59:03",29.43,74.94,0,ON,"PERINGATAN"
5373,h5,"2026-11-09 02:59:18",29.43,75.05,0,ON,"PERINGATAN"`}
              />
            </div>

            {/* Endpoint 6: POST /api/readings */}
            <div id="ep-create" className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4 scroll-mt-20">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-slate-400">#6</span>
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-bold font-mono ${METHOD_BADGES.POST}`}>
                    POST
                  </span>
                  <span className="text-base font-bold text-[#0f2942] font-mono">/api/readings</span>
                </div>
                <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium">
                  Tambah Data Manual (CRUD Admin)
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Menyimpan 1 rekaman telemetri baru ke tabel <code>readings</code> melalui JSON body. Digunakan oleh Panel Administrator (<code>/admin</code>) dan integrasi eksternal berbasis HTTP POST.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Field JSON Body</th>
                      <th className="py-2.5 px-3">Tipe</th>
                      <th className="py-2.5 px-3">Keterangan / Default</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2 px-3 font-mono text-sky-700 font-bold">room</td>
                      <td className="py-2 px-3 font-mono text-slate-500">string</td>
                      <td className="py-2 px-3 text-slate-600">Kode ruangan (default: <code>'lab_td'</code>).</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-sky-700 font-bold">temperature, humidity, wind_speed</td>
                      <td className="py-2 px-3 font-mono text-slate-500">number | null</td>
                      <td className="py-2 px-3 text-slate-600">Nilai sensor suhu (°C), kelembapan (%), kecepatan angin (m/s).</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-sky-700 font-bold">fan_rpm, uptime</td>
                      <td className="py-2 px-3 font-mono text-slate-500">integer</td>
                      <td className="py-2 px-3 text-slate-600">Default <code>fan_rpm: 0</code>, <code>uptime: 3600</code>.</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-sky-700 font-bold">relay_state, air_quality</td>
                      <td className="py-2 px-3 font-mono text-slate-500">string</td>
                      <td className="py-2 px-3 text-slate-600">Opsional; otomatis dihitung dari suhu jika dikosongkan.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <CodeBlock
                language="json"
                title="Response 201 Created — POST /api/readings"
                code={`{
  "success": true,
  "id": 5374,
  "message": "Data sensor berhasil ditambahkan"
}`}
              />
            </div>

            {/* Endpoint 7: PUT /api/readings/:id */}
            <div id="ep-update" className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4 scroll-mt-20">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-slate-400">#7</span>
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-bold font-mono ${METHOD_BADGES.PUT}`}>
                    PUT
                  </span>
                  <span className="text-base font-bold text-[#0f2942] font-mono">/api/readings/:id</span>
                </div>
                <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium">
                  Perbarui Data (CRUD Admin)
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Memperbarui kolom <code>room</code>, <code>temperature</code>, <code>humidity</code>, <code>wind_speed</code>, <code>fan_rpm</code>, <code>relay_state</code>, dan <code>air_quality</code> untuk baris dengan path parameter <code>:id</code> tertentu. Mengembalikan HTTP <code>400</code> jika ID invalid atau <code>404</code> jika ID tidak ditemukan.
              </p>

              <CodeBlock
                language="json"
                title="Response 200 OK — PUT /api/readings/5374"
                code={`{
  "success": true,
  "message": "Data ID #5374 berhasil diperbarui"
}`}
              />
            </div>

            {/* Endpoint 8: DELETE /api/readings/:id */}
            <div id="ep-delete" className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4 scroll-mt-20">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-slate-400">#8</span>
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-bold font-mono ${METHOD_BADGES.DELETE}`}>
                    DELETE
                  </span>
                  <span className="text-base font-bold text-[#0f2942] font-mono">/api/readings/:id</span>
                </div>
                <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium">
                  Hapus Data (CRUD Admin)
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Menghapus 1 baris rekaman permanen dari SQLite berdasarkan path parameter <code>:id</code> (misalnya data uji coba atau entri anomali di <code>/admin</code>). Mengembalikan <code>404</code> apabila ID tidak ada di database.
              </p>

              <CodeBlock
                language="json"
                title="Response 200 OK — DELETE /api/readings/5374"
                code={`{
  "success": true,
  "message": "Data ID #5374 berhasil dihapus"
}`}
              />
            </div>

            {/* Endpoint 9: POST /api/simulate */}
            <div id="ep-simulate" className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4 scroll-mt-20">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-slate-400">#9</span>
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-bold font-mono ${METHOD_BADGES.POST}`}>
                    POST
                  </span>
                  <span className="text-base font-bold text-[#0f2942] font-mono">/api/simulate</span>
                </div>
                <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium">
                  Simulasi Telemetry &amp; Pengujian
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Menyuntikkan 1 rekaman simulasi realistis langsung ke SQLite tanpa perlu perangkat ESP32 terhubung. Parameter body JSON (<code>room</code>, <code>temperature</code>, <code>humidity</code>, <code>wind_speed</code>, <code>co2</code>, <code>tvoc</code>, <code>fan_rpm</code>, <code>relay_state</code>) bersifat opsional — field yang tidak dikirim otomatis diisi acak di sekitar baseline ruangan (<code>h5</code>, <code>lab_kom</code>, <code>seminar</code>, <code>lab_td</code>).
              </p>

              <CodeBlock
                language="json"
                title="Response 200 OK — POST /api/simulate"
                code={`{
  "success": true,
  "insertedId": 5375,
  "room": "h5"
}`}
              />
            </div>
          </div>
        </section>

        {/* Section 3: Database SQLite Schema */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
            <Database className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-[#0f2942]">3. Skema Database SQLite (<code>air_data.db</code>)</h2>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
              <span>
                Tabel utama: <strong className="font-mono text-[#0f2942]">readings</strong> (15 kolom)
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                Indeks: idx_readings_room_time_id, idx_readings_time_id
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase">
                  <tr>
                    <th className="py-3 px-4">Nama Kolom</th>
                    <th className="py-3 px-4">Tipe Data</th>
                    <th className="py-3 px-4">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr>
                    <td className="py-2.5 px-4 text-emerald-700 font-bold">id</td>
                    <td className="py-2.5 px-4 text-slate-500">INTEGER PK AUTO</td>
                    <td className="py-2.5 px-4 font-sans text-slate-600">ID unik auto-increment tiap rekaman data</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 text-emerald-700 font-bold">room</td>
                    <td className="py-2.5 px-4 text-slate-500">TEXT DEFAULT &apos;h5&apos;</td>
                    <td className="py-2.5 px-4 font-sans text-slate-600">
                      Kode ruangan: <code>h5</code>, <code>lab_td</code>, <code>lab_kom</code>, <code>seminar</code>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 text-orange-700 font-bold">temperature</td>
                    <td className="py-2.5 px-4 text-slate-500">REAL</td>
                    <td className="py-2.5 px-4 font-sans text-slate-600">Suhu udara ruangan (°C) dari sensor DHT22/DHT11</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 text-purple-700 font-bold">humidity</td>
                    <td className="py-2.5 px-4 text-slate-500">REAL</td>
                    <td className="py-2.5 px-4 font-sans text-slate-600">Kelembaban relatif udara (%) dari sensor DHT22/DHT11</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 text-cyan-700 font-bold">wind_speed</td>
                    <td className="py-2.5 px-4 text-slate-500">REAL</td>
                    <td className="py-2.5 px-4 font-sans text-slate-600">Kecepatan aliran udara (m/s) dari Anemometer</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 text-slate-800 font-bold">co2 / tvoc</td>
                    <td className="py-2.5 px-4 text-slate-500">INTEGER</td>
                    <td className="py-2.5 px-4 font-sans text-slate-600">Kadar eCO2 (ppm) &amp; TVOC (ppb) opsional dari sensor SGP30</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 text-slate-800 font-bold">fan_rpm</td>
                    <td className="py-2.5 px-4 text-slate-500">REAL</td>
                    <td className="py-2.5 px-4 font-sans text-slate-600">Kecepatan putaran kipas ekstraksi (RPM) dari tachometer</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 text-slate-800 font-bold">relay_state</td>
                    <td className="py-2.5 px-4 text-slate-500">TEXT</td>
                    <td className="py-2.5 px-4 font-sans text-slate-600">Status saklar aktuator kipas: <code>ON</code> atau <code>OFF</code></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 text-slate-800 font-bold">air_quality</td>
                    <td className="py-2.5 px-4 text-slate-500">TEXT</td>
                    <td className="py-2.5 px-4 font-sans text-slate-600">Status evaluasi umum udara (mis. <code>Baik</code>, <code>Sedang</code>, <code>PERINGATAN</code>)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 text-slate-800 font-bold">temp_status, hum_status, co2_status</td>
                    <td className="py-2.5 px-4 text-slate-500">TEXT</td>
                    <td className="py-2.5 px-4 font-sans text-slate-600">Status detail masing-masing parameter dari objek <code>air_quality_detail</code></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 text-slate-800 font-bold">uptime</td>
                    <td className="py-2.5 px-4 text-slate-500">INTEGER</td>
                    <td className="py-2.5 px-4 font-sans text-slate-600">Lama waktu nyala mikrokontroler ESP32 dalam detik</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 text-slate-800 font-bold">recorded_at</td>
                    <td className="py-2.5 px-4 text-slate-500">DATETIME DEFAULT CURRENT_TIMESTAMP</td>
                    <td className="py-2.5 px-4 font-sans text-slate-600">Timestamp UTC otomatis SQLite (<code>YYYY-MM-DD HH:MM:SS</code>), dikonversi ke WIB (+7 jam) pada frontend</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Section 4: Code Implementation Examples */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2.5">
              <FileCode className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-[#0f2942]">4. Contoh Implementasi Kode</h2>
            </div>

            {/* Language Selector Buttons */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              {['curl', 'js', 'python', 'nodejs'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveLang(lang)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    activeLang === lang
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lang === 'js' ? 'JavaScript' : lang === 'python' ? 'Python' : lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <CodeBlock
            language={activeLang === 'js' ? 'javascript' : activeLang}
            title={`Contoh Penggunaan API (${activeLang.toUpperCase()})`}
            code={codeExamples[activeLang]}
          />
        </section>

        {/* Section 5: PM2 Process Management */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
            <Terminal className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-[#0f2942]">5. Manajemen Service Backend di VPS (PM2)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-[#0f2942]">Perintah Monitoring Service</h3>
              <p className="text-slate-500 leading-relaxed">
                Backend dikelola oleh <code>pm2</code> dengan nama service <code>air-backend</code>.
              </p>
              <CodeBlock
                language="bash"
                title="Terminal SSH VPS"
                code={`# Melihat status service
pm2 status

# Melihat log streaming data MQTT masuk
pm2 logs air-backend --lines 50

# Restart backend jika ada perubahan
pm2 restart air-backend`}
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-[#0f2942]">Perintah Pengujian Nginx</h3>
              <p className="text-slate-500 leading-relaxed">
                Jika konfigurasi SSL atau reverse proxy diubah di <code>/etc/nginx/sites-available/air-dashboard</code>:
              </p>
              <CodeBlock
                language="bash"
                title="Terminal SSH VPS"
                code={`# Uji sintaks konfigurasi Nginx
sudo nginx -t

# Restart web server Nginx
sudo systemctl restart nginx

# Cek status web server
sudo systemctl status nginx`}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
