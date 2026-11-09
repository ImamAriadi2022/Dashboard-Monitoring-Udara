import React, { useState, useMemo } from 'react';
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
  ClipboardCheck,
  Copy,
  Check,
} from 'lucide-react';
import CodeBlock from './components/CodeBlock';

const ROUTE_DEFINITIONS = [
  {
    no: 1,
    anchor: 'ep-status',
    method: 'GET',
    path: '/api/status',
    expressPath: '/status',
    category: 'Monitoring',
    summary: 'Health check server Express & status koneksi MQTT Broker EMQX.',
    usage: 'Monitoring kesiapan sistem & status subscriber MQTT',
  },
  {
    no: 2,
    anchor: 'ep-latest',
    method: 'GET',
    path: '/api/latest',
    expressPath: '/latest',
    category: 'Live Telemetri',
    summary: 'Mengambil 1 rekaman sensor paling terakhir per ruangan (atau all).',
    usage: 'Landing Page, kartu metrik live, & status LIVE/OFFLINE (poll 3 detik)',
  },
  {
    no: 3,
    anchor: 'ep-readings',
    method: 'GET',
    path: '/api/readings',
    expressPath: '/readings',
    category: 'Grafik & Query',
    summary: 'Deret waktu pembacaan per ruangan (agregasi 1m/15m/30m, raw, afterId, & mode Admin).',
    usage: 'Grafik Suhu/Kelembapan/Angin di Dashboard & tabel utama /admin',
  },
  {
    no: 4,
    anchor: 'ep-logs',
    method: 'GET',
    path: '/api/readings/logs',
    expressPath: '/readings/logs',
    category: 'Tabel Log',
    summary: 'Log riwayat mentah terurut tegas DESC dengan paginasi & pencarian server-side.',
    usage: 'Tab Log Riwayat Data per ruangan (h5, lab_td, lab_kom, seminar, all)',
  },
  {
    no: 5,
    anchor: 'ep-download',
    method: 'GET',
    path: '/api/download',
    expressPath: '/download',
    category: 'Ekspor CSV',
    summary: 'Mengunduh seluruh rekaman SQLite sesuai ruangan & rentang waktu dalam format CSV.',
    usage: 'Tombol Unduh Data (.CSV) pada Dashboard untuk tiap ruangan',
  },
  {
    no: 6,
    anchor: 'ep-create',
    method: 'POST',
    path: '/api/readings',
    expressPath: '/readings',
    category: 'CRUD Admin',
    summary: 'Menambahkan 1 rekaman sensor baru secara manual via HTTP JSON.',
    usage: 'Panel /admin (Tambah Data Manual) & input telemetri via HTTP',
  },
  {
    no: 7,
    anchor: 'ep-update',
    method: 'PUT',
    path: '/api/readings/:id',
    expressPath: '/readings/:id',
    category: 'CRUD Admin',
    summary: 'Memperbarui nilai rekaman sensor yang sudah ada berdasarkan ID.',
    usage: 'Panel /admin (Edit Rekaman)',
  },
  {
    no: 8,
    anchor: 'ep-delete',
    method: 'DELETE',
    path: '/api/readings/:id',
    expressPath: '/readings/:id',
    category: 'CRUD Admin',
    summary: 'Menghapus 1 baris rekaman sensor dari database SQLite berdasarkan ID.',
    usage: 'Panel /admin (Hapus Anomali)',
  },
];

const FUNCTIONAL_TEST_ENDPOINTS = [
  // Status & Live (6)
  {
    no: 1,
    group: 'status_live',
    method: 'GET',
    room: 'sistem',
    module: 'Monitoring Backend',
    endpoint: '/api/status',
    expectedStatus: '200 OK',
    criteria: 'JSON { status: "online", mqtt: { broker, topic, connected }, timestamp } valid.',
  },
  {
    no: 2,
    group: 'status_live',
    method: 'GET',
    room: 'h5',
    module: 'Landing & Dashboard Live',
    endpoint: '/api/latest?room=h5',
    expectedStatus: '200 OK',
    criteria: 'Mengembalikan 1 record terbaru room "h5" (recorded_at & id tertinggi).',
  },
  {
    no: 3,
    group: 'status_live',
    method: 'GET',
    room: 'lab_td',
    module: 'Dashboard Live',
    endpoint: '/api/latest?room=lab_td',
    expectedStatus: '200 OK',
    criteria: 'Mengembalikan 1 record terbaru room "lab_td".',
  },
  {
    no: 4,
    group: 'status_live',
    method: 'GET',
    room: 'lab_kom',
    module: 'Dashboard Live',
    endpoint: '/api/latest?room=lab_kom',
    expectedStatus: '200 OK',
    criteria: 'Mengembalikan 1 record terbaru room "lab_kom".',
  },
  {
    no: 5,
    group: 'status_live',
    method: 'GET',
    room: 'seminar',
    module: 'Dashboard Live',
    endpoint: '/api/latest?room=seminar',
    expectedStatus: '200 OK',
    criteria: 'Mengembalikan 1 record terbaru room "seminar".',
  },
  {
    no: 6,
    group: 'status_live',
    method: 'GET',
    room: 'all',
    module: 'Lintas Ruangan',
    endpoint: '/api/latest?room=all',
    expectedStatus: '200 OK',
    criteria: 'Mengembalikan 1 record paling akhir dari seluruh ruangan.',
  },

  // Readings / Grafik & Admin List (8)
  {
    no: 7,
    group: 'readings',
    method: 'GET',
    room: 'h5',
    module: 'Grafik Ruang H5 (1m)',
    endpoint: '/api/readings?room=h5&range=1d&interval=1m',
    expectedStatus: '200 OK',
    criteria: 'Array kronologis (ASC) bucket rata-rata 1 menit 24 jam terakhir, ada sample_count.',
  },
  {
    no: 8,
    group: 'readings',
    method: 'GET',
    room: 'lab_td',
    module: 'Grafik Ruang Lab TD (1m)',
    endpoint: '/api/readings?room=lab_td&range=7d&interval=1m',
    expectedStatus: '200 OK',
    criteria: 'Array ASC bucket 1 menit untuk "lab_td" 7 hari terakhir (hanya data lab_td).',
  },
  {
    no: 9,
    group: 'readings',
    method: 'GET',
    room: 'lab_kom',
    module: 'Grafik Ruang Lab Kom (15m)',
    endpoint: '/api/readings?room=lab_kom&range=7d&interval=15m',
    expectedStatus: '200 OK',
    criteria: 'Array ASC bucket 15 menit (:00/:15/:30/:45) khusus room "lab_kom".',
  },
  {
    no: 10,
    group: 'readings',
    method: 'GET',
    room: 'seminar',
    module: 'Grafik Ruang Seminar (30m)',
    endpoint: '/api/readings?room=seminar&range=30d&interval=30m',
    expectedStatus: '200 OK',
    criteria: 'Array ASC bucket 30 menit (:00/:30) 30 hari terakhir khusus "seminar".',
  },
  {
    no: 11,
    group: 'readings',
    method: 'GET',
    room: 'h5',
    module: 'Readings Raw Terbaru',
    endpoint: '/api/readings?room=h5&range=1d&interval=raw&limit=2000',
    expectedStatus: '200 OK',
    criteria: 'Mengembalikan maks 2000 baris mentah paling baru dalam urutan ASC.',
  },
  {
    no: 12,
    group: 'readings',
    method: 'GET',
    room: 'h5',
    module: 'Readings Inkremental',
    endpoint: '/api/readings?room=h5&afterId=5370',
    expectedStatus: '200 OK',
    criteria: 'Hanya mengembalikan baris "h5" dengan id > 5370 secara ASC.',
  },
  {
    no: 13,
    group: 'readings',
    method: 'GET',
    room: 'all',
    module: 'Panel Admin (Semua Ruangan)',
    endpoint: '/api/readings?room=all&limit=200&order=desc',
    expectedStatus: '200 OK',
    criteria: 'Mengembalikan maks 200 record terbaru lintas ruangan terurut DESC.',
  },
  {
    no: 14,
    group: 'readings',
    method: 'GET',
    room: 'lab_td',
    module: 'Panel Admin (Filter Ruangan)',
    endpoint: '/api/readings?room=lab_td&limit=200&order=desc',
    expectedStatus: '200 OK',
    criteria: 'Mengembalikan maks 200 record terbaru "lab_td" DESC (uji pula h5, lab_kom, seminar).',
  },

  // Log Riwayat Data (6)
  {
    no: 15,
    group: 'logs',
    method: 'GET',
    room: 'h5',
    module: 'Log Riwayat Ruang H5',
    endpoint: '/api/readings/logs?room=h5&range=7d&page=1&pageSize=50',
    expectedStatus: '200 OK',
    criteria: 'rows urut DESC tanpa lompatan ID, totalAll akurat, page=1, totalPages >= 1.',
  },
  {
    no: 16,
    group: 'logs',
    method: 'GET',
    room: 'lab_td',
    module: 'Log Riwayat Ruang Lab TD',
    endpoint: '/api/readings/logs?room=lab_td&range=7d&page=1&pageSize=50',
    expectedStatus: '200 OK',
    criteria: 'rows khusus "lab_td" urut DESC dengan metadata total & paginasi lengkap.',
  },
  {
    no: 17,
    group: 'logs',
    method: 'GET',
    room: 'lab_kom',
    module: 'Log Riwayat Ruang Lab Kom',
    endpoint: '/api/readings/logs?room=lab_kom&range=7d&page=1&pageSize=50',
    expectedStatus: '200 OK',
    criteria: 'rows khusus "lab_kom" urut DESC dengan metadata total & paginasi lengkap.',
  },
  {
    no: 18,
    group: 'logs',
    method: 'GET',
    room: 'seminar',
    module: 'Log Riwayat Ruang Seminar',
    endpoint: '/api/readings/logs?room=seminar&range=7d&page=1&pageSize=50',
    expectedStatus: '200 OK',
    criteria: 'rows khusus "seminar" urut DESC dengan metadata total & paginasi lengkap.',
  },
  {
    no: 19,
    group: 'logs',
    method: 'GET',
    room: 'h5',
    module: 'Log Paginasi & Pencarian WIB',
    endpoint: '/api/readings/logs?room=h5&range=1d&page=2&pageSize=25&search=09:59',
    expectedStatus: '200 OK',
    criteria: 'Pencarian jam WIB / #ID / nilai bekerja; pageSize=25 & page di-clamp aman.',
  },
  {
    no: 20,
    group: 'logs',
    method: 'GET',
    room: 'all',
    module: 'Log Lintas Ruangan',
    endpoint: '/api/readings/logs?room=all&range=30d&page=1&pageSize=100',
    expectedStatus: '200 OK',
    criteria: 'Mengembalikan hingga 100 baris terbaru dari semua ruangan dalam 30 hari terakhir.',
  },

  // Unduh CSV (5)
  {
    no: 21,
    group: 'download',
    method: 'GET',
    room: 'h5',
    module: 'Unduh CSV Ruang H5',
    endpoint: '/api/download?room=h5&range=1d',
    expectedStatus: '200 OK',
    criteria: 'Content-Type text/csv, lampiran .csv isi rekaman "h5" 1 hari urut ASC.',
  },
  {
    no: 22,
    group: 'download',
    method: 'GET',
    room: 'lab_td',
    module: 'Unduh CSV Ruang Lab TD',
    endpoint: '/api/download?room=lab_td&range=7d',
    expectedStatus: '200 OK',
    criteria: 'File .csv isi rekaman "lab_td" 7 hari urut ASC.',
  },
  {
    no: 23,
    group: 'download',
    method: 'GET',
    room: 'lab_kom',
    module: 'Unduh CSV Ruang Lab Kom',
    endpoint: '/api/download?room=lab_kom&range=7d',
    expectedStatus: '200 OK',
    criteria: 'File .csv isi rekaman "lab_kom" 7 hari urut ASC.',
  },
  {
    no: 24,
    group: 'download',
    method: 'GET',
    room: 'seminar',
    module: 'Unduh CSV Ruang Seminar',
    endpoint: '/api/download?room=seminar&range=30d',
    expectedStatus: '200 OK',
    criteria: 'File .csv isi rekaman "seminar" 30 hari urut ASC.',
  },
  {
    no: 25,
    group: 'download',
    method: 'GET',
    room: 'all',
    module: 'Unduh CSV Semua Ruangan',
    endpoint: '/api/download?room=all&range=all',
    expectedStatus: '200 OK',
    criteria: 'File .csv lengkap berisi seluruh rekaman lintas ruangan dari database.',
  },

  // CRUD Admin (3)
  {
    no: 26,
    group: 'crud',
    method: 'POST',
    room: 'all',
    module: 'Admin: Tambah Data',
    endpoint: '/api/readings',
    expectedStatus: '201 Created',
    criteria: 'Body JSON tersimpan; respons { success: true, id }; muncul di /latest & /logs.',
  },
  {
    no: 27,
    group: 'crud',
    method: 'PUT',
    room: 'all',
    module: 'Admin: Edit Data',
    endpoint: '/api/readings/:id',
    expectedStatus: '200 / 400 / 404',
    criteria: 'Data terupdate (200); ID non-numerik -> 400; ID tidak ada -> 404.',
  },
  {
    no: 28,
    group: 'crud',
    method: 'DELETE',
    room: 'all',
    module: 'Admin: Hapus Data',
    endpoint: '/api/readings/:id',
    expectedStatus: '200 / 400 / 404',
    criteria: 'Baris terhapus permanen (200); uji ulang ID sama -> 404.',
  },
];

const METHOD_BADGES = {
  GET: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  POST: 'bg-sky-100 text-sky-800 border border-sky-200',
  PUT: 'bg-amber-100 text-amber-800 border border-amber-200',
  DELETE: 'bg-rose-100 text-rose-800 border border-rose-200',
};

const ROOM_BADGES = {
  h5: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  lab_td: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  lab_kom: 'bg-cyan-50 text-cyan-800 border-cyan-200',
  seminar: 'bg-purple-50 text-purple-800 border-purple-200',
  all: 'bg-slate-100 text-slate-700 border-slate-200',
  sistem: 'bg-amber-50 text-amber-800 border-amber-200',
};

export default function DocsBackendPage({ onNavigate }) {
  const [activeLang, setActiveLang] = useState('curl');
  const [testGroupFilter, setTestGroupFilter] = useState('all');
  const [testRoomFilter, setTestRoomFilter] = useState('all_filter');
  const [copiedTestNo, setCopiedTestNo] = useState(null);

  const domainHost = 'archtera.web.id';
  const baseIp = '202.155.17.57';
  const baseOrigin = `https://${domainHost}`;
  const baseUrl = `${baseOrigin}/api`;

  const filteredTests = useMemo(() => {
    return FUNCTIONAL_TEST_ENDPOINTS.filter((item) => {
      const matchGroup = testGroupFilter === 'all' || item.group === testGroupFilter;
      const matchRoom = testRoomFilter === 'all_filter' || item.room === testRoomFilter;
      return matchGroup && matchRoom;
    });
  }, [testGroupFilter, testRoomFilter]);

  const handleCopyTestUrl = (testItem) => {
    const fullUrl = `${baseOrigin}${testItem.endpoint}`;
    navigator.clipboard?.writeText(fullUrl);
    setCopiedTestNo(testItem.no);
    setTimeout(() => setCopiedTestNo(null), 1800);
  };

  const codeExamples = {
    curl: `# 1. Cek kesehatan server & MQTT
curl -X GET "${baseUrl}/status"

# 2. Ambil pembacaan terakhir & grafik agregasi per ruangan (h5, lab_td, lab_kom, seminar)
for ROOM in h5 lab_td lab_kom seminar; do
  echo "=== ROOM: $ROOM ==="
  curl -s "${baseUrl}/latest?room=$ROOM"
  curl -s "${baseUrl}/readings?room=$ROOM&range=1d&interval=15m"
  curl -s "${baseUrl}/readings/logs?room=$ROOM&range=7d&page=1&pageSize=10"
done

# 3. Unduh CSV Ruang H5 (1 hari terakhir)
curl -o data_h5_1d.csv "${baseUrl}/download?room=h5&range=1d"

# 4. CRUD Data Admin: POST -> PUT -> DELETE
curl -X POST "${baseUrl}/readings" \\
  -H "Content-Type: application/json" \\
  -d '{"room":"lab_td","temperature":27.4,"humidity":58.2,"wind_speed":1.4,"fan_rpm":980,"relay_state":"ON"}'

curl -X PUT "${baseUrl}/readings/5374" \\
  -H "Content-Type: application/json" \\
  -d '{"room":"lab_td","temperature":28.0,"humidity":59.0,"wind_speed":1.6,"fan_rpm":1100,"relay_state":"ON"}'

curl -X DELETE "${baseUrl}/readings/5374"`,

    js: `// Uji fungsionalitas seluruh ruangan & endpoint dengan JavaScript Fetch API
const BASE_URL = '${baseUrl}';
const ROOMS = ['h5', 'lab_td', 'lab_kom', 'seminar'];

// 1. Cek status server + status terbaru + grafik + log per masing-masing ruangan
async function verifyAllRoomsTelemetry() {
  const status = await fetch(\`\${BASE_URL}/status\`).then((r) => r.json());
  console.log('Backend Online:', status.status, '| MQTT:', status.mqtt?.connected);

  for (const room of ROOMS) {
    const [latest, chart15m, logs] = await Promise.all([
      fetch(\`\${BASE_URL}/latest?room=\${room}\`).then((r) => r.json()),
      fetch(\`\${BASE_URL}/readings?room=\${room}&range=1d&interval=15m\`).then((r) => r.json()),
      fetch(\`\${BASE_URL}/readings/logs?room=\${room}&range=7d&page=1&pageSize=50\`).then((r) => r.json()),
    ]);

    console.log(\`[\${room}] Latest ID: #\${latest.id} | Titik Grafik 15m: \${chart15m.length} | Total DB: \${logs.totalAll}\`);
  }
}

// 2. Uji CRUD penuh (POST -> PUT -> DELETE)
async function testCrudFlow() {
  const created = await fetch(\`\${BASE_URL}/readings\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room: 'lab_td', temperature: 26.8, humidity: 57.5, wind_speed: 1.3 }),
  }).then((r) => r.json());

  await fetch(\`\${BASE_URL}/readings/\${created.id}\`, {
    method: 'PUT',
    headers: { 'Content-Type: application/json' },
    body: JSON.stringify({ room: 'lab_td', temperature: 27.1, humidity: 58.0, wind_speed: 1.5, relay_state: 'ON' }),
  });

  await fetch(\`\${BASE_URL}/readings/\${created.id}\`, { method: 'DELETE' });
}`,

    python: `import requests

BASE_URL = "${baseUrl}"
ROOMS = ["h5", "lab_td", "lab_kom", "seminar"]

def run_functional_checks():
    # 1. Status Server & MQTT
    st = requests.get(f"{BASE_URL}/status", timeout=10).json()
    assert st["status"] == "online"

    # 2. Uji pembacaan /latest, /readings (grafik), /readings/logs, dan /download per ruangan
    for room in ROOMS:
        latest = requests.get(f"{BASE_URL}/latest", params={"room": room}, timeout=10).json()
        chart = requests.get(
            f"{BASE_URL}/readings",
            params={"room": room, "range": "1d", "interval": "15m"},
            timeout=10,
        ).json()
        logs = requests.get(
            f"{BASE_URL}/readings/logs",
            params={"room": room, "range": "7d", "page": 1, "pageSize": 25},
            timeout=10,
        ).json()
        csv_res = requests.get(
            f"{BASE_URL}/download",
            params={"room": room, "range": "1d"},
            timeout=15,
        )
        assert csv_res.status_code == 200
        print(f"[{room}] latest=#{latest.get('id')} | chart_15m={len(chart)} | logs_totalAll={logs['totalAll']}")

if __name__ == "__main__":
    run_functional_checks()`,

    nodejs: `// Node.js 18+ Automated Smoke Check untuk 8 Route & 4 Ruangan
const BASE_URL = '${baseUrl}';
const ROOMS = ['h5', 'lab_td', 'lab_kom', 'seminar'];

async function runChecks() {
  const status = await fetch(\`\${BASE_URL}/status\`).then((r) => r.json());
  console.log('Status:', status.status, '| MQTT connected:', status.mqtt?.connected);

  for (const room of ROOMS) {
    const [latest, chart1m, chart15m, logs] = await Promise.all([
      fetch(\`\${BASE_URL}/latest?room=\${room}\`).then((r) => r.json()),
      fetch(\`\${BASE_URL}/readings?room=\${room}&range=1d&interval=1m\`).then((r) => r.json()),
      fetch(\`\${BASE_URL}/readings?room=\${room}&range=7d&interval=15m\`).then((r) => r.json()),
      fetch(\`\${BASE_URL}/readings/logs?room=\${room}&range=7d&page=1&pageSize=10\`).then((r) => r.json()),
    ]);
    console.log(room, { latestId: latest.id, pt1m: chart1m.length, pt15m: chart15m.length, totalDb: logs.totalAll });
  }
}

runChecks();`,
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
                  Dokumentasi Teknis &amp; Acuan Uji API
                </span>
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#0f2942] tracking-tight flex items-center gap-3">
                <Server className="h-7 w-7 text-emerald-600" />
                <span>Dokumentasi Backend &amp; REST API</span>
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
                Acuan resmi pengujian fungsionalitas API sistem Archtera: mencakup <strong>{ROUTE_DEFINITIONS.length} Route Endpoint Inti</strong> (<code>5 GET</code>, <code>1 POST</code>, <code>1 PUT</code>, <code>1 DELETE</code>) dan <strong>{FUNCTIONAL_TEST_ENDPOINTS.length} Skenario Endpoint Operasional Per Ruangan</strong> (<code>h5</code>, <code>lab_td</code>, <code>lab_kom</code>, <code>seminar</code>, &amp; <code>all</code>) pada <strong>{domainHost}</strong> (<code>{baseIp}</code>).
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
        {/* Section 1: Server Architecture & Route Inventory */}
        <section className="space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-[#0f2942]">1. Arsitektur Server &amp; Inventaris Route Endpoint</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Total Route Handler Backend</span>
              <div className="text-xl font-extrabold text-[#0f2942] font-mono mt-1">
                {ROUTE_DEFINITIONS.length} Route REST API
              </div>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Terdiri dari <strong>5 GET</strong>, <strong>1 POST</strong>, <strong>1 PUT</strong>, dan <strong>1 DELETE</strong> di <code>backend/bridge.js</code>.
              </p>
            </div>

            <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-5 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">Patokan Uji Fungsionalitas</span>
              <div className="text-xl font-extrabold text-[#0f2942] font-mono mt-1">
                {FUNCTIONAL_TEST_ENDPOINTS.length} Skenario Endpoint
              </div>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Mencakup pembacaan per <strong>4 Ruangan</strong> (<code>h5</code>, <code>lab_td</code>, <code>lab_kom</code>, <code>seminar</code>), <code>all</code>, log, CSV, &amp; CRUD.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Base Path Produksi</span>
              <div className="text-sm font-bold text-emerald-700 font-mono mt-1 break-all">{baseUrl}</div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Atau via IP: <code>https://{baseIp}/api</code>. Nginx proxy <code>/api/*</code> -&gt; Express <code>127.0.0.1:3000/*</code>.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ingestion IoT (MQTT) &amp; DB</span>
              <div className="text-sm font-bold text-[#0f2942] font-mono mt-1">EMQX MQTT + SQLite</div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Topik <code>monitoring_udara_ta/data</code> -&gt; tabel <code>readings</code> di <code>air_data.db</code>.
              </p>
            </div>
          </div>

          {/* Table of 8 Core Express Routes */}
          <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-[#0f2942]">
                  Daftar {ROUTE_DEFINITIONS.length} Route Endpoint Inti (<code>backend/bridge.js</code>)
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono font-bold">
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">5 GET</span>
                <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800">1 POST</span>
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
                    <th className="py-2.5 px-4">Fungsi &amp; Penggunaan Sistem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ROUTE_DEFINITIONS.map((ep) => (
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
                <strong>Catatan Jalur IoT &amp; Ruangan:</strong> Perangkat ESP32 mem-publish JSON ke broker MQTT (topik <code>monitoring_udara_ta/data</code>) dengan field <code>room</code> (<code>h5</code>, <code>lab_td</code>, <code>lab_kom</code>, atau <code>seminar</code>). Seluruh endpoint pembacaan memisahkan data per ruangan via query <code>?room=...</code>.
              </span>
            </div>
          </div>
        </section>

        {/* Section 2: Complete 28-Case QA / Functional Testing Matrix (Per-Room & Module) */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2.5">
              <ClipboardCheck className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-[#0f2942]">
                2. Matriks Lengkap Endpoint Uji Fungsionalitas ({FUNCTIONAL_TEST_ENDPOINTS.length} Skenario Aktif)
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              Patokan lengkap uji endpoint per ruangan (<code>h5</code>, <code>lab_td</code>, <code>lab_kom</code>, <code>seminar</code>) &amp; fitur aplikasi.
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
            {/* Filter Controls */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Group Filter */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: `Semua (${FUNCTIONAL_TEST_ENDPOINTS.length})` },
                  { id: 'status_live', label: 'Status & Live (6)' },
                  { id: 'readings', label: 'Readings / Grafik & Admin (8)' },
                  { id: 'logs', label: 'Log Riwayat (6)' },
                  { id: 'download', label: 'Unduh CSV (5)' },
                  { id: 'crud', label: 'CRUD Admin (3)' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setTestGroupFilter(tab.id)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      testGroupFilter === tab.id
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Room Filter */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-bold text-slate-500 mr-1">Filter Ruangan:</span>
                {[
                  { id: 'all_filter', label: 'Semua' },
                  { id: 'h5', label: 'h5' },
                  { id: 'lab_td', label: 'lab_td' },
                  { id: 'lab_kom', label: 'lab_kom' },
                  { id: 'seminar', label: 'seminar' },
                  { id: 'all', label: 'room=all' },
                ].map((rf) => (
                  <button
                    key={rf.id}
                    onClick={() => setTestRoomFilter(rf.id)}
                    className={`rounded-lg px-2.5 py-1 font-mono text-[11px] font-bold transition-all cursor-pointer ${
                      testRoomFilter === rf.id
                        ? 'bg-[#0f2942] text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {rf.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase">
                  <tr>
                    <th className="py-2.5 px-3 w-10">#</th>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3">Ruangan</th>
                    <th className="py-2.5 px-3">Modul / Fitur UI</th>
                    <th className="py-2.5 px-3">URL Endpoint Lengkap</th>
                    <th className="py-2.5 px-3">HTTP</th>
                    <th className="py-2.5 px-3">Kriteria Lulus Pengujian</th>
                    <th className="py-2.5 px-3 text-right">Salin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTests.map((t) => (
                    <tr key={t.no} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-400 font-semibold">{t.no}</td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold font-mono ${METHOD_BADGES[t.method]}`}>
                          {t.method}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold ${ROOM_BADGES[t.room]}`}>
                          {t.room}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-700 whitespace-nowrap">{t.module}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#0f2942] break-all min-w-[260px]">
                        {t.endpoint}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] font-semibold text-emerald-700 whitespace-nowrap">
                        {t.expectedStatus}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 min-w-[240px]">{t.criteria}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleCopyTestUrl(t)}
                          title={`Salin ${baseOrigin}${t.endpoint}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all cursor-pointer"
                        >
                          {copiedTestNo === t.no ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-600" />
                              <span className="text-emerald-700">Tersalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>URL</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Section 3: Detailed Specification per Backend Route (8 Routes) */}
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2.5">
              <Terminal className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-[#0f2942]">
                3. Spesifikasi Detail Ke-{ROUTE_DEFINITIONS.length} Route REST API
              </h2>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-500">
              Terdaftar di backend/bridge.js: {ROUTE_DEFINITIONS.length} route aktif
            </span>
          </div>

          <div className="space-y-6">
            {/* Route #1: GET /api/status */}
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

            {/* Route #2: GET /api/latest */}
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
                  Data Sensor Terakhir Per Ruangan
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Mengambil 1 rekaman telemetri sensor paling terakhir (<code>ORDER BY recorded_at DESC, id DESC LIMIT 1</code>). Dipanggil oleh Landing Page (<code>room=h5</code>) serta Dashboard setiap 3 detik untuk kartu metrik live dan indikator <code>LIVE</code> / <code>OFFLINE</code> tiap ruangan. Mengembalikan <code>{`{}`}</code> jika ruangan belum memiliki data.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Query Parameter</th>
                      <th className="py-2.5 px-3">Tipe</th>
                      <th className="py-2.5 px-3">Default</th>
                      <th className="py-2.5 px-3">Keterangan &amp; Ruangan Valid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2 px-3 font-mono text-emerald-700 font-bold">room</td>
                      <td className="py-2 px-3 font-mono text-slate-500">string</td>
                      <td className="py-2 px-3 font-mono text-slate-500">&apos;h5&apos;</td>
                      <td className="py-2 px-3 text-slate-600">
                        Wajib diuji per ruangan: <code>h5</code>, <code>lab_td</code>, <code>lab_kom</code>, <code>seminar</code>, atau <code>all</code>.
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

            {/* Route #3: GET /api/readings */}
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
                  Grafik Agregasi &amp; Deret Waktu Per Ruangan
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Endpoint utama pembacaan data grafik Suhu, Kelembapan, &amp; Kecepatan Angin untuk masing-masing ruangan (<code>h5</code>, <code>lab_td</code>, <code>lab_kom</code>, <code>seminar</code>) serta daftar 200 data terbaru di Panel <code>/admin</code>. Mendukung agregasi rata-rata SQLite per interval (<code>1m</code>, <code>15m</code>, <code>30m</code>) agar tidak terjadi fluktuasi tajam, serta selalu mengambil data/bucket paling baru terlebih dahulu sebelum diurutkan ke <code>order</code> tujuan.
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
                      <td className="py-2 px-3 font-mono text-slate-500">&apos;h5&apos;</td>
                      <td className="py-2 px-3 text-slate-600">
                        Kode ruangan target: <code>h5</code>, <code>lab_td</code>, <code>lab_kom</code>, <code>seminar</code>, atau <code>all</code>.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-emerald-700 font-bold">range</td>
                      <td className="py-2 px-3 font-mono text-slate-500">string</td>
                      <td className="py-2 px-3 font-mono text-slate-500">&apos;&apos; (semua)</td>
                      <td className="py-2 px-3 text-slate-600">
                        Filter rentang waktu: <code>1d</code> / <code>24h</code> (1 hari), <code>7d</code> (7 hari), <code>30d</code> / <code>1m</code> / <code>1month</code> (1 bulan / 30 hari), atau <code>3d</code>.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-emerald-700 font-bold">interval</td>
                      <td className="py-2 px-3 font-mono text-slate-500">string</td>
                      <td className="py-2 px-3 font-mono text-slate-500">&apos;raw&apos;</td>
                      <td className="py-2 px-3 text-slate-600">
                        Mode grafik: <code>1m</code> (rata-rata 1 menit), <code>15m</code> (rata-rata 15 menit), <code>30m</code> (rata-rata 30 menit), atau <code>raw</code> (baris asli). Mode agregasi menyertakan <code>sample_count</code>.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-emerald-700 font-bold">limit</td>
                      <td className="py-2 px-3 font-mono text-slate-500">integer</td>
                      <td className="py-2 px-3 font-mono text-slate-500">45000 / 2000</td>
                      <td className="py-2 px-3 text-slate-600">
                        Agregasi: default <code>45000</code> (maks <code>50000</code>). Mode <code>raw</code>: default <code>2000</code> (maks <code>10000</code>). Panel Admin memakai <code>limit=200</code>.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-emerald-700 font-bold">order</td>
                      <td className="py-2 px-3 font-mono text-slate-500">string</td>
                      <td className="py-2 px-3 font-mono text-slate-500">&apos;asc&apos;</td>
                      <td className="py-2 px-3 text-slate-600">
                        <code>asc</code> (kronologis lama -&gt; baru untuk grafik) atau <code>desc</code> (baru -&gt; lama untuk Admin).
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-emerald-700 font-bold">afterId</td>
                      <td className="py-2 px-3 font-mono text-slate-500">integer</td>
                      <td className="py-2 px-3 font-mono text-slate-500">0</td>
                      <td className="py-2 px-3 text-slate-600">
                        Khusus mode <code>raw</code>: mengambil rekaman baru dengan <code>id &gt; afterId</code> secara inkremental.
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

            {/* Route #4: GET /api/readings/logs */}
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
                  Log Riwayat Terpaginasi Per Ruangan
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Mengembalikan daftar log mentah lengkap per ruangan (<code>h5</code>, <code>lab_td</code>, <code>lab_kom</code>, <code>seminar</code>, <code>all</code>) dalam urutan ketat terbaru ke terlama (<code>ORDER BY recorded_at DESC, id DESC</code>), lengkap dengan total baris asli database (<code>totalAll</code>), paginasi server-side, dan pencarian ke seluruh isi tabel.
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
                      <td className="py-2 px-3 font-mono text-slate-500">&apos;h5&apos;</td>
                      <td className="py-2 px-3 text-slate-600">Kode ruangan (<code>h5</code>, <code>lab_td</code>, <code>lab_kom</code>, <code>seminar</code>) atau <code>all</code>.</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-emerald-700 font-bold">range</td>
                      <td className="py-2 px-3 font-mono text-slate-500">string</td>
                      <td className="py-2 px-3 font-mono text-slate-500">&apos;&apos; (semua)</td>
                      <td className="py-2 px-3 text-slate-600">
                        <code>1d</code>, <code>7d</code>, <code>30d</code> (atau kosong untuk semua rekaman).
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-emerald-700 font-bold">search</td>
                      <td className="py-2 px-3 font-mono text-slate-500">string</td>
                      <td className="py-2 px-3 font-mono text-slate-500">&apos;&apos;</td>
                      <td className="py-2 px-3 text-slate-600">
                        Pencarian pada <code>id</code> (mendukung <code>#5373</code> &amp; <code>5373</code>), <code>room</code>, timestamp UTC &amp; WIB (<code>09:59</code> / <code>09.59</code>), suhu, kelembapan, angin, CO2, relay, dan kualitas udara.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-emerald-700 font-bold">page</td>
                      <td className="py-2 px-3 font-mono text-slate-500">integer</td>
                      <td className="py-2 px-3 font-mono text-slate-500">1</td>
                      <td className="py-2 px-3 text-slate-600">Nomor halaman (otomatis di-clamp maksimal ke <code>totalPages</code>).</td>
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

            {/* Route #5: GET /api/download */}
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
                  Unduh Dataset CSV Per Ruangan
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Menghasilkan file <code>text/csv</code> langsung dari database SQLite dalam urutan kronologis (<code>ORDER BY recorded_at ASC, id ASC</code>) tanpa batasan jumlah baris untuk ruangan yang dipilih.
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
                      <td className="py-2 px-3 font-mono text-slate-500">&apos;lab_td&apos;</td>
                      <td className="py-2 px-3 text-slate-600">
                        Kode ruangan (<code>h5</code>, <code>lab_td</code>, <code>lab_kom</code>, <code>seminar</code>) atau <code>all</code>.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-emerald-700 font-bold">range</td>
                      <td className="py-2 px-3 font-mono text-slate-500">string</td>
                      <td className="py-2 px-3 font-mono text-slate-500">&apos;all&apos;</td>
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

            {/* Route #6: POST /api/readings */}
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
                Menyimpan 1 rekaman telemetri baru ke tabel <code>readings</code> melalui JSON body (dipakai oleh form &ldquo;Tambah Data Manual&rdquo; pada halaman <code>/admin</code> dan uji injeksi HTTP POST).
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
                      <td className="py-2 px-3 text-slate-600">
                        Kode ruangan target (<code>h5</code>, <code>lab_td</code>, <code>lab_kom</code>, <code>seminar</code>; default: <code>&apos;lab_td&apos;</code>).
                      </td>
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
                      <td className="py-2 px-3 text-slate-600">Opsional; otomatis dihitung dari nilai suhu apabila dikosongkan.</td>
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

            {/* Route #7: PUT /api/readings/:id */}
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
                Memperbarui kolom <code>room</code>, <code>temperature</code>, <code>humidity</code>, <code>wind_speed</code>, <code>fan_rpm</code>, <code>relay_state</code>, dan <code>air_quality</code> untuk baris dengan path parameter <code>:id</code> tertentu. Mengembalikan HTTP <code>400</code> jika <code>:id</code> bukan angka valid atau HTTP <code>404</code> jika rekaman tidak ditemukan.
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

            {/* Route #8: DELETE /api/readings/:id */}
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
                Menghapus 1 baris rekaman permanen dari SQLite berdasarkan path parameter <code>:id</code> (dipakai tombol Hapus di <code>/admin</code>). Mengembalikan <code>400</code> untuk ID tidak valid atau <code>404</code> apabila ID tidak ditemukan.
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
          </div>
        </section>

        {/* Section 4: Database SQLite Schema */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
            <Database className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-[#0f2942]">4. Skema Database SQLite (<code>air_data.db</code>)</h2>
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
                    <td className="py-2.5 px-4 font-sans text-slate-600">Status evaluasi umum udara (<code>Baik</code>, <code>Sedang</code>, <code>PERINGATAN</code>, <code>Buruk</code>)</td>
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

        {/* Section 5: Code Implementation Examples */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2.5">
              <FileCode className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-[#0f2942]">5. Contoh Skrip Pengujian &amp; Integrasi API</h2>
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
            title={`Skrip Uji Fungsionalitas Endpoint (${activeLang.toUpperCase()})`}
            code={codeExamples[activeLang]}
          />
        </section>

        {/* Section 6: PM2 Process Management */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
            <Terminal className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-[#0f2942]">6. Manajemen Service Backend di VPS (PM2)</h2>
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
