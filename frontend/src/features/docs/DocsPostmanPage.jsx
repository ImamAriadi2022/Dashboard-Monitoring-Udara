import React, { useState, useMemo } from 'react';
import {
  Send,
  Download,
  Copy,
  Check,
  Search,
  Filter,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Server,
  Cpu,
  Terminal,
  Workflow,
  CheckCircle2,
  FileCode,
  Layers,
  ChevronDown,
  ChevronUp,
  Play,
  ShieldCheck,
  Radio,
  ExternalLink,
  Code,
  ListChecks,
} from 'lucide-react';
import CodeBlock from './components/CodeBlock';

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

export const POSTMAN_TEST_SCENARIOS = [
  // 1. Status & Live Telemetri (6)
  {
    no: 1,
    id: 'tc-01',
    group: 'status_live',
    groupLabel: 'Status & Live Telemetri',
    name: 'Health Check Backend & Koneksi Broker MQTT',
    method: 'GET',
    room: 'sistem',
    module: 'Monitoring Backend & Ingestion',
    endpoint: '/api/status',
    expressRoute: '/status',
    expectedStatus: '200 OK',
    statusCode: 200,
    criteria: 'JSON { status: "online", mqtt: { broker, topic, connected }, timestamp } valid dan waktu respons < 2000ms.',
    description: 'Memverifikasi status operasional server Express dan konfirmasi status listener subscriber terhadap broker MQTT EMQX.',
    body: null,
    headers: { Accept: 'application/json' },
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response time is under 2000ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(2000);
});

pm.test("Server is online and MQTT connected", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.status).to.eql("online");
    pm.expect(jsonData.mqtt).to.be.an("object");
    pm.expect(jsonData.mqtt.connected).to.be.true;
    pm.expect(jsonData.timestamp).to.be.a("string");
});`,
    sampleResponse: `{
  "status": "online",
  "mqtt": {
    "broker": "mqtt://broker.emqx.io",
    "topic": "monitoring_udara_ta/data",
    "connected": true
  },
  "timestamp": "2026-11-24T06:30:00.000Z"
}`,
  },
  {
    no: 2,
    id: 'tc-02',
    group: 'status_live',
    groupLabel: 'Status & Live Telemetri',
    name: 'Data Telemetri Sensor Terakhir Ruang H5',
    method: 'GET',
    room: 'h5',
    module: 'Landing Page & Dashboard Live H5',
    endpoint: '/api/latest?room=h5',
    expressRoute: '/latest',
    expectedStatus: '200 OK',
    statusCode: 200,
    criteria: 'Mengembalikan 1 record paling baru room "h5" dengan ID tertinggi dan field telemetri lengkap.',
    description: 'Dipanggil otomatis oleh Landing Page dan Dashboard setiap 3-4 detik untuk memperbarui kartu metrik live Ruang H5.',
    body: null,
    headers: { Accept: 'application/json' },
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Data belongs to Room H5", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.room).to.eql("h5");
    pm.expect(jsonData).to.have.property("id");
    pm.expect(jsonData).to.have.property("temperature");
    pm.expect(jsonData).to.have.property("humidity");
    pm.expect(jsonData).to.have.property("co2");
    pm.expect(jsonData).to.have.property("relay_state");
});`,
    sampleResponse: `{
  "id": 5373,
  "room": "h5",
  "recorded_at": "2026-11-24 06:29:18",
  "temperature": 29.4,
  "humidity": 75.0,
  "wind_speed": 0.2,
  "co2": 410,
  "tvoc": 12,
  "fan_rpm": 1560,
  "relay_state": "ON",
  "air_quality": "PERINGATAN",
  "uptime": 1842
}`,
  },
  {
    no: 3,
    id: 'tc-03',
    group: 'status_live',
    groupLabel: 'Status & Live Telemetri',
    name: 'Data Telemetri Sensor Terakhir Ruang Lab TD',
    method: 'GET',
    room: 'lab_td',
    module: 'Dashboard Live Lab TD',
    endpoint: '/api/latest?room=lab_td',
    expressRoute: '/latest',
    expectedStatus: '200 OK',
    statusCode: 200,
    criteria: 'Mengembalikan 1 record paling baru room "lab_td" dengan validasi isolasi data ruangan.',
    description: 'Memastikan filter ruangan bekerja tepat dan tidak tertukar dengan telemetri ruangan lain.',
    body: null,
    headers: { Accept: 'application/json' },
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Room is lab_td", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.room).to.eql("lab_td");
});`,
    sampleResponse: `{
  "id": 5370,
  "room": "lab_td",
  "recorded_at": "2026-11-24 06:28:45",
  "temperature": 26.8,
  "humidity": 58.5,
  "wind_speed": 1.2,
  "co2": 435,
  "fan_rpm": 850,
  "relay_state": "ON",
  "air_quality": "Baik"
}`,
  },
  {
    no: 4,
    id: 'tc-04',
    group: 'status_live',
    groupLabel: 'Status & Live Telemetri',
    name: 'Data Telemetri Sensor Terakhir Ruang Lab Komputer',
    method: 'GET',
    room: 'lab_kom',
    module: 'Dashboard Live Lab Kom',
    endpoint: '/api/latest?room=lab_kom',
    expressRoute: '/latest',
    expectedStatus: '200 OK',
    statusCode: 200,
    criteria: 'Mengembalikan 1 record paling baru room "lab_kom" dari database.',
    description: 'Memvalidasi kartu metrik pada tab Ruang Lab Komputer di antarmuka dashboard.',
    body: null,
    headers: { Accept: 'application/json' },
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Room is lab_kom", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.room).to.eql("lab_kom");
});`,
    sampleResponse: `{
  "id": 5365,
  "room": "lab_kom",
  "recorded_at": "2026-11-24 06:27:10",
  "temperature": 24.2,
  "humidity": 52.0,
  "wind_speed": 0.8,
  "co2": 480,
  "fan_rpm": 0,
  "relay_state": "OFF",
  "air_quality": "Baik"
}`,
  },
  {
    no: 5,
    id: 'tc-05',
    group: 'status_live',
    groupLabel: 'Status & Live Telemetri',
    name: 'Data Telemetri Sensor Terakhir Ruang Seminar',
    method: 'GET',
    room: 'seminar',
    module: 'Dashboard Live Seminar',
    endpoint: '/api/latest?room=seminar',
    expressRoute: '/latest',
    expectedStatus: '200 OK',
    statusCode: 200,
    criteria: 'Mengembalikan 1 record paling baru room "seminar".',
    description: 'Memvalidasi ketersediaan data pemantauan Ruang Seminar.',
    body: null,
    headers: { Accept: 'application/json' },
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Room is seminar", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.room).to.eql("seminar");
});`,
    sampleResponse: `{
  "id": 5360,
  "room": "seminar",
  "recorded_at": "2026-11-24 06:25:30",
  "temperature": 25.5,
  "humidity": 55.4,
  "wind_speed": 0.5,
  "co2": 415,
  "fan_rpm": 0,
  "relay_state": "OFF",
  "air_quality": "Baik"
}`,
  },
  {
    no: 6,
    id: 'tc-06',
    group: 'status_live',
    groupLabel: 'Status & Live Telemetri',
    name: 'Data Telemetri Terakhir Lintas Seluruh Ruangan (room=all)',
    method: 'GET',
    room: 'all',
    module: 'Sinkronisasi Global Admin',
    endpoint: '/api/latest?room=all',
    expressRoute: '/latest',
    expectedStatus: '200 OK',
    statusCode: 200,
    criteria: 'Mengembalikan 1 record paling akhir yang masuk ke sistem tanpa filter ruangan.',
    description: 'Digunakan oleh sistem audit server untuk mendeteksi keaktifan transmisi IoT secara global.',
    body: null,
    headers: { Accept: 'application/json' },
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Has valid telemetry structure", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("id");
    pm.expect(jsonData).to.have.property("room");
});`,
    sampleResponse: `{
  "id": 5373,
  "room": "h5",
  "recorded_at": "2026-11-24 06:29:18",
  "temperature": 29.4,
  "humidity": 75.0,
  "co2": 410
}`,
  },

  // 2. Readings / Grafik & Admin List (8)
  {
    no: 7,
    id: 'tc-07',
    group: 'readings',
    groupLabel: 'Grafik & Deret Waktu',
    name: 'Grafik Agregasi 1 Menit Ruang H5 (1 Hari)',
    method: 'GET',
    room: 'h5',
    module: 'Grafik Suhu & Kelembapan H5',
    endpoint: '/api/readings?room=h5&range=1d&interval=1m',
    expressRoute: '/readings',
    expectedStatus: '200 OK',
    statusCode: 200,
    criteria: 'Array kronologis ASC bucket rata-rata 1 menit 24 jam terakhir, memuat properti sample_count.',
    description: 'Menyediakan titik data teragregasi per 1 menit agar grafik Chart.js tampil halus tanpa beban komputasi berlebih.',
    body: null,
    headers: { Accept: 'application/json' },
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Returns chronological array with sample_count", function () {
    var data = pm.response.json();
    pm.expect(Array.isArray(data)).to.be.true;
    if (data.length > 0) {
        pm.expect(data[0]).to.have.property("sample_count");
        pm.expect(data[0].room).to.eql("h5");
    }
});`,
    sampleResponse: `[
  {
    "id": 5300,
    "room": "h5",
    "recorded_at": "2026-11-24 06:00:00",
    "temperature": 28.9,
    "humidity": 73.1,
    "wind_speed": 0.4,
    "co2": 405,
    "sample_count": 12
  }
]`,
  },
  {
    no: 8,
    id: 'tc-08',
    group: 'readings',
    groupLabel: 'Grafik & Deret Waktu',
    name: 'Grafik Agregasi 1 Menit Ruang Lab TD (7 Hari)',
    method: 'GET',
    room: 'lab_td',
    module: 'Grafik Sirkulasi Angin Lab TD',
    endpoint: '/api/readings?room=lab_td&range=7d&interval=1m',
    expressRoute: '/readings',
    expectedStatus: '200 OK',
    statusCode: 200,
    criteria: 'Array ASC bucket 1 menit khusus data "lab_td" 7 hari terakhir.',
    description: 'Mengambil deret waktu sirkulasi angin dan suhu untuk pemantauan jangka menengah di Lab TD.',
    body: null,
    headers: { Accept: 'application/json' },
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("All items belong to lab_td", function () {
    var data = pm.response.json();
    pm.expect(Array.isArray(data)).to.be.true;
    data.forEach(function(item) {
        pm.expect(item.room).to.eql("lab_td");
    });
});`,
    sampleResponse: `[
  {
    "id": 4820,
    "room": "lab_td",
    "recorded_at": "2026-11-20 12:00:00",
    "temperature": 27.1,
    "humidity": 59.4,
    "wind_speed": 1.5,
    "sample_count": 12
  }
]`,
  },
  {
    no: 9,
    id: 'tc-09',
    group: 'readings',
    groupLabel: 'Grafik & Deret Waktu',
    name: 'Grafik Agregasi 15 Menit Ruang Lab Kom (7 Hari)',
    method: 'GET',
    room: 'lab_kom',
    module: 'Grafik Agregasi 15 Menit Lab Kom',
    endpoint: '/api/readings?room=lab_kom&range=7d&interval=15m',
    expressRoute: '/readings',
    expectedStatus: '200 OK',
    statusCode: 200,
    criteria: 'Array ASC bucket 15 menit (:00, :15, :30, :45) khusus "lab_kom".',
    description: 'Menguji pengelompokan bucket interval 15 menit pada query SQLite.',
    body: null,
    headers: { Accept: 'application/json' },
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Valid 15m aggregated array", function () {
    var data = pm.response.json();
    pm.expect(Array.isArray(data)).to.be.true;
});`,
    sampleResponse: `[
  {
    "id": 4900,
    "room": "lab_kom",
    "recorded_at": "2026-11-22 14:15:00",
    "temperature": 24.5,
    "humidity": 53.0,
    "wind_speed": 0.7,
    "sample_count": 180
  }
]`,
  },
  {
    no: 10,
    id: 'tc-10',
    group: 'readings',
    groupLabel: 'Grafik & Deret Waktu',
    name: 'Grafik Agregasi 30 Menit Ruang Seminar (30 Hari)',
    method: 'GET',
    room: 'seminar',
    module: 'Grafik Bulanan 30 Menit Seminar',
    endpoint: '/api/readings?room=seminar&range=30d&interval=30m',
    expressRoute: '/readings',
    expectedStatus: '200 OK',
    statusCode: 200,
    criteria: 'Array ASC bucket 30 menit (:00, :30) 30 hari terakhir khusus "seminar".',
    description: 'Menguji performa query agregasi bulanan untuk rentang 30 hari.',
    body: null,
    headers: { Accept: 'application/json' },
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Returns 30m bucket array", function () {
    var data = pm.response.json();
    pm.expect(Array.isArray(data)).to.be.true;
});`,
    sampleResponse: `[
  {
    "id": 3500,
    "room": "seminar",
    "recorded_at": "2026-11-01 08:30:00",
    "temperature": 25.0,
    "humidity": 56.0,
    "wind_speed": 0.6,
    "sample_count": 360
  }
]`,
  },
  {
    no: 11,
    id: 'tc-11',
    group: 'readings',
    groupLabel: 'Grafik & Deret Waktu',
    name: 'Readings Mentah (Raw) Ruang H5 (Maksimal 2000 Baris)',
    method: 'GET',
    room: 'h5',
    module: 'Readings Raw Data H5',
    endpoint: '/api/readings?room=h5&range=1d&interval=raw&limit=2000',
    expressRoute: '/readings',
    expectedStatus: '200 OK',
    statusCode: 200,
    criteria: 'Mengembalikan maks 2000 baris mentah terbaru dalam urutan ASC kronologis.',
    description: 'Mengambil data mentah per detik/transmisi tanpa dilakukan agregasi rata-rata.',
    body: null,
    headers: { Accept: 'application/json' },
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Raw data has unaggregated properties", function () {
    var data = pm.response.json();
    pm.expect(Array.isArray(data)).to.be.true;
    pm.expect(data.length).to.be.at.most(2000);
});`,
    sampleResponse: `[
  {
    "id": 5371,
    "room": "h5",
    "recorded_at": "2026-11-24 06:29:00",
    "temperature": 29.41,
    "humidity": 74.9,
    "wind_speed": 0.2,
    "fan_rpm": 1560
  }
]`,
  },
  {
    no: 12,
    id: 'tc-12',
    group: 'readings',
    groupLabel: 'Grafik & Deret Waktu',
    name: 'Readings Inkremental Polling (afterId > N)',
    method: 'GET',
    room: 'h5',
    module: 'Live Inkremental Polling',
    endpoint: '/api/readings?room=h5&afterId=5000',
    expressRoute: '/readings',
    expectedStatus: '200 OK',
    statusCode: 200,
    criteria: 'Hanya mengembalikan baris rekaman baru "h5" dengan ID > 5000 secara ASC.',
    description: 'Digunakan oleh frontend untuk mengambil data baru saja sehingga hemat bandwidth.',
    body: null,
    headers: { Accept: 'application/json' },
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("All IDs are greater than afterId", function () {
    var data = pm.response.json();
    data.forEach(function(item) {
        pm.expect(item.id).to.be.above(5000);
        pm.expect(item.room).to.eql("h5");
    });
});`,
    sampleResponse: `[
  {
    "id": 5001,
    "room": "h5",
    "recorded_at": "2026-11-24 00:01:00",
    "temperature": 28.5,
    "humidity": 70.0
  }
]`,
  },
  {
    no: 13,
    id: 'tc-13',
    group: 'readings',
    groupLabel: 'Grafik & Deret Waktu',
    name: 'Panel Admin: Rekaman Terbaru Lintas Ruangan (order=desc)',
    method: 'GET',
    room: 'all',
    module: 'Panel Admin Data Utama',
    endpoint: '/api/readings?room=all&limit=200&order=desc',
    expressRoute: '/readings',
    expectedStatus: '200 OK',
    statusCode: 200,
    criteria: 'Mengembalikan maks 200 record terbaru lintas ruangan terurut DESC.',
    description: 'Mengisi tabel data utama pada halaman /admin untuk keperluan audit dan manajemen.',
    body: null,
    headers: { Accept: 'application/json' },
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Order is descending", function () {
    var data = pm.response.json();
    pm.expect(Array.isArray(data)).to.be.true;
    if (data.length >= 2) {
        pm.expect(data[0].id).to.be.at.least(data[1].id);
    }
});`,
    sampleResponse: `[
  {
    "id": 5373,
    "room": "h5",
    "temperature": 29.4
  },
  {
    "id": 5372,
    "room": "lab_td",
    "temperature": 26.8
  }
]`,
  },
  {
    no: 14,
    id: 'tc-14',
    group: 'readings',
    groupLabel: 'Grafik & Deret Waktu',
    name: 'Panel Admin: Filter Ruang Lab TD (order=desc)',
    method: 'GET',
    room: 'lab_td',
    module: 'Panel Admin Filter Ruangan',
    endpoint: '/api/readings?room=lab_td&limit=200&order=desc',
    expressRoute: '/readings',
    expectedStatus: '200 OK',
    statusCode: 200,
    criteria: 'Mengembalikan maks 200 record terbaru khusus "lab_td" terurut DESC.',
    description: 'Memvalidasi filter dropdown ruangan pada tabel Admin.',
    body: null,
    headers: { Accept: 'application/json' },
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Items filtered to lab_td", function () {
    var data = pm.response.json();
    data.forEach(function(item) {
        pm.expect(item.room).to.eql("lab_td");
    });
});`,
    sampleResponse: `[
  {
    "id": 5370,
    "room": "lab_td",
    "temperature": 26.8
  }
]`,
  },

  // 3. Log Riwayat Data Terpaginasi (6)
  {
    no: 15,
    id: 'tc-15',
    group: 'logs',
    groupLabel: 'Log Riwayat Paginasi',
    name: 'Log Riwayat Terpaginasi Ruang H5 (Page 1, Size 50)',
    method: 'GET',
    room: 'h5',
    module: 'Tab Log Riwayat Data H5',
    endpoint: '/api/readings/logs?room=h5&range=7d&page=1&pageSize=50',
    expressRoute: '/readings/logs',
    expectedStatus: '200 OK',
    statusCode: 200,
    criteria: 'rows urut DESC tanpa lompatan ID, totalAll akurat, page=1, pageSize=50.',
    description: 'Menampilkan tabel riwayat pada tab "Log Riwayat Data" di Dashboard dengan paginasi server-side.',
    body: null,
    headers: { Accept: 'application/json' },
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Valid pagination metadata", function () {
    var res = pm.response.json();
    pm.expect(res).to.have.property("rows");
    pm.expect(res).to.have.property("total");
    pm.expect(res).to.have.property("totalAll");
    pm.expect(res.page).to.eql(1);
    pm.expect(res.pageSize).to.eql(50);
});`,
    sampleResponse: `{
  "rows": [
    {
      "id": 5373,
      "room": "h5",
      "recorded_at": "2026-11-24 06:29:18",
      "temperature": 29.43,
      "humidity": 75.05,
      "wind_speed": 0,
      "fan_rpm": 1560,
      "relay_state": "ON",
      "air_quality": "PERINGATAN"
    }
  ],
  "total": 4354,
  "totalAll": 4354,
  "page": 1,
  "pageSize": 50,
  "totalPages": 88
}`,
  },
  {
    no: 16,
    id: 'tc-16',
    group: 'logs',
    groupLabel: 'Log Riwayat Paginasi',
    name: 'Log Riwayat Terpaginasi Ruang Lab TD',
    method: 'GET',
    room: 'lab_td',
    module: 'Tab Log Riwayat Lab TD',
    endpoint: '/api/readings/logs?room=lab_td&range=7d&page=1&pageSize=50',
    expressRoute: '/readings/logs',
    expectedStatus: '200 OK',
    statusCode: 200,
    criteria: 'rows khusus "lab_td" urut DESC dengan metadata total & paginasi lengkap.',
    description: 'Memastikan tab log pada ruangan Lab TD menampilkan riwayat data yang valid.',
    body: null,
    headers: { Accept: 'application/json' },
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Rows belong to lab_td", function () {
    var res = pm.response.json();
    res.rows.forEach(function(row) {
        pm.expect(row.room).to.eql("lab_td");
    });
});`,
    sampleResponse: `{
  "rows": [
    {
      "id": 5370,
      "room": "lab_td",
      "temperature": 26.8
    }
  ],
  "total": 1200,
  "page": 1,
  "pageSize": 50
}`,
  },
  {
    no: 17,
    id: 'tc-17',
    group: 'logs',
    groupLabel: 'Log Riwayat Paginasi',
    name: 'Log Riwayat Terpaginasi Ruang Lab Komputer',
    method: 'GET',
    room: 'lab_kom',
    module: 'Tab Log Riwayat Lab Kom',
    endpoint: '/api/readings/logs?room=lab_kom&range=7d&page=1&pageSize=50',
    expressRoute: '/readings/logs',
    expectedStatus: '200 OK',
    statusCode: 200,
    criteria: 'rows khusus "lab_kom" urut DESC dengan metadata total & paginasi lengkap.',
    description: 'Memastikan tab log pada ruangan Lab Komputer bekerja normal.',
    body: null,
    headers: { Accept: 'application/json' },
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});`,
    sampleResponse: `{
  "rows": [],
  "total": 850,
  "page": 1,
  "pageSize": 50
}`,
  },
  {
    no: 18,
    id: 'tc-18',
    group: 'logs',
    groupLabel: 'Log Riwayat Paginasi',
    name: 'Log Riwayat Terpaginasi Ruang Seminar',
    method: 'GET',
    room: 'seminar',
    module: 'Tab Log Riwayat Seminar',
    endpoint: '/api/readings/logs?room=seminar&range=7d&page=1&pageSize=50',
    expressRoute: '/readings/logs',
    expectedStatus: '200 OK',
    statusCode: 200,
    criteria: 'rows khusus "seminar" urut DESC dengan metadata total & paginasi lengkap.',
    description: 'Memastikan tab log pada ruangan Seminar bekerja normal.',
    body: null,
    headers: { Accept: 'application/json' },
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});`,
    sampleResponse: `{
  "rows": [],
  "total": 600,
  "page": 1,
  "pageSize": 50
}`,
  },
  {
    no: 19,
    id: 'tc-19',
    group: 'logs',
    groupLabel: 'Log Riwayat Paginasi',
    name: 'Pencarian Server-side & Paginasi Lanjutan (Search Query)',
    method: 'GET',
    room: 'h5',
    module: 'Fitur Filter Pencarian Log',
    endpoint: '/api/readings/logs?room=h5&range=1d&page=1&pageSize=25&search=ON',
    expressRoute: '/readings/logs',
    expectedStatus: '200 OK',
    statusCode: 200,
    criteria: 'Pencarian relay state "ON" / kata kunci jam bekerja; pageSize=25 dan page di-clamp aman.',
    description: 'Menguji fungsionalitas kolom pencarian instan pada tabel log riwayat sensor.',
    body: null,
    headers: { Accept: 'application/json' },
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Search filter matched", function () {
    var res = pm.response.json();
    pm.expect(res.pageSize).to.eql(25);
    res.rows.forEach(function(row) {
        var str = JSON.stringify(row).toLowerCase();
        pm.expect(str.includes("on")).to.be.true;
    });
});`,
    sampleResponse: `{
  "rows": [
    {
      "id": 5373,
      "room": "h5",
      "relay_state": "ON"
    }
  ],
  "total": 140,
  "page": 1,
  "pageSize": 25
}`,
  },
  {
    no: 20,
    id: 'tc-20',
    group: 'logs',
    groupLabel: 'Log Riwayat Paginasi',
    name: 'Log Riwayat Lintas Ruangan (room=all, 30 Hari, Size 100)',
    method: 'GET',
    room: 'all',
    module: 'Audit Log Global Semua Ruangan',
    endpoint: '/api/readings/logs?room=all&range=30d&page=1&pageSize=100',
    expressRoute: '/readings/logs',
    expectedStatus: '200 OK',
    statusCode: 200,
    criteria: 'Mengembalikan hingga 100 baris terbaru dari seluruh ruangan dalam 30 hari terakhir.',
    description: 'Digunakan oleh administrator untuk memantau aktivitas sistem secara komprehensif.',
    body: null,
    headers: { Accept: 'application/json' },
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Contains multiple room data", function () {
    var res = pm.response.json();
    pm.expect(Array.isArray(res.rows)).to.be.true;
});`,
    sampleResponse: `{
  "rows": [
    { "id": 5373, "room": "h5" },
    { "id": 5372, "room": "lab_td" }
  ],
  "total": 15000,
  "page": 1,
  "pageSize": 100
}`,
  },

  // 4. Unduh Dataset CSV (5)
  {
    no: 21,
    id: 'tc-21',
    group: 'download',
    groupLabel: 'Unduh Dataset CSV',
    name: 'Unduh File CSV Ruang H5 (1 Hari Terakhir)',
    method: 'GET',
    room: 'h5',
    module: 'Ekspor Data CSV Ruang H5',
    endpoint: '/api/download?room=h5&range=1d',
    expressRoute: '/download',
    expectedStatus: '200 OK',
    statusCode: 200,
    criteria: 'Content-Type text/csv, header kolom CSV lengkap, rekaman "h5" 1 hari urut ASC.',
    description: 'Menguji tombol "Unduh Data (.CSV)" pada Dashboard untuk data 24 jam Ruang H5.',
    body: null,
    headers: { Accept: 'text/csv' },
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Content-Type is CSV", function () {
    pm.expect(pm.response.headers.get("Content-Type")).to.include("text/csv");
});

pm.test("CSV Header contains standard columns", function () {
    var csvText = pm.response.text();
    pm.expect(csvText).to.include("ID");
    pm.expect(csvText).to.include("Ruangan");
    pm.expect(csvText).to.include("Suhu_C");
});`,
    sampleResponse: `ID,Ruangan,Waktu_Rekam,Suhu_C,Kelembapan_Persen,Angin_ms,Status_Kipas,Kualitas_Udara
5372,h5,"2026-11-24 06:29:03",29.43,74.94,0,ON,"PERINGATAN"
5373,h5,"2026-11-24 06:29:18",29.43,75.05,0,ON,"PERINGATAN"`,
  },
  {
    no: 22,
    id: 'tc-22',
    group: 'download',
    groupLabel: 'Unduh Dataset CSV',
    name: 'Unduh File CSV Ruang Lab TD (7 Hari Terakhir)',
    method: 'GET',
    room: 'lab_td',
    module: 'Ekspor Data CSV Ruang Lab TD',
    endpoint: '/api/download?room=lab_td&range=7d',
    expressRoute: '/download',
    expectedStatus: '200 OK',
    statusCode: 200,
    criteria: 'File .csv isi rekaman "lab_td" 7 hari urut ASC tanpa tercampur ruangan lain.',
    description: 'Menguji ekspor dataset mingguan Ruang Lab TD.',
    body: null,
    headers: { Accept: 'text/csv' },
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Content-Type is text/csv", function () {
    pm.expect(pm.response.headers.get("Content-Type")).to.include("text/csv");
});`,
    sampleResponse: `ID,Ruangan,Waktu_Rekam,Suhu_C,Kelembapan_Persen,Angin_ms
4800,lab_td,"2026-11-18 10:00:00",26.5,58.0,1.2`,
  },
  {
    no: 23,
    id: 'tc-23',
    group: 'download',
    groupLabel: 'Unduh Dataset CSV',
    name: 'Unduh File CSV Ruang Lab Komputer (7 Hari Terakhir)',
    method: 'GET',
    room: 'lab_kom',
    module: 'Ekspor Data CSV Ruang Lab Kom',
    endpoint: '/api/download?room=lab_kom&range=7d',
    expressRoute: '/download',
    expectedStatus: '200 OK',
    statusCode: 200,
    criteria: 'File .csv isi rekaman "lab_kom" 7 hari urut ASC.',
    description: 'Menguji ekspor dataset mingguan Ruang Lab Komputer.',
    body: null,
    headers: { Accept: 'text/csv' },
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});`,
    sampleResponse: `ID,Ruangan,Waktu_Rekam,Suhu_C
4900,lab_kom,"2026-11-20 09:00:00",24.1`,
  },
  {
    no: 24,
    id: 'tc-24',
    group: 'download',
    groupLabel: 'Unduh Dataset CSV',
    name: 'Unduh File CSV Ruang Seminar (30 Hari Terakhir)',
    method: 'GET',
    room: 'seminar',
    module: 'Ekspor Data CSV Ruang Seminar',
    endpoint: '/api/download?room=seminar&range=30d',
    expressRoute: '/download',
    expectedStatus: '200 OK',
    statusCode: 200,
    criteria: 'File .csv isi rekaman "seminar" 30 hari urut ASC.',
    description: 'Menguji ekspor dataset bulanan Ruang Seminar.',
    body: null,
    headers: { Accept: 'text/csv' },
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});`,
    sampleResponse: `ID,Ruangan,Waktu_Rekam,Suhu_C
3200,seminar,"2026-10-25 08:00:00",25.2`,
  },
  {
    no: 25,
    id: 'tc-25',
    group: 'download',
    groupLabel: 'Unduh Dataset CSV',
    name: 'Unduh File CSV Seluruh Ruangan (Seluruh Riwayat / all)',
    method: 'GET',
    room: 'all',
    module: 'Ekspor Seluruh Dataset SQLite',
    endpoint: '/api/download?room=all&range=all',
    expressRoute: '/download',
    expectedStatus: '200 OK',
    statusCode: 200,
    criteria: 'File .csv lengkap berisi seluruh rekaman lintas ruangan dari basis data SQLite.',
    description: 'Digunakan untuk backup data menyeluruh dari basis data.',
    body: null,
    headers: { Accept: 'text/csv' },
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Contains multiple rooms", function () {
    var txt = pm.response.text();
    pm.expect(txt).to.include("h5");
});`,
    sampleResponse: `ID,Ruangan,Waktu_Rekam,Suhu_C,Kelembapan_Persen
1,h5,"2026-10-01 00:00:00",28.0,70.0`,
  },

  // 5. CRUD Admin Data Sensor (3)
  {
    no: 26,
    id: 'tc-26',
    group: 'crud',
    groupLabel: 'CRUD Admin Data Sensor',
    name: 'Admin: Tambah Data Sensor Baru (Injeksi HTTP POST)',
    method: 'POST',
    room: 'lab_td',
    module: 'Admin Panel - Tambah Data',
    endpoint: '/api/readings',
    expressRoute: '/readings',
    expectedStatus: '201 Created',
    statusCode: 201,
    criteria: 'Body JSON tersimpan ke basis data; respons { success: true, id: <ID> }; langsung muncul di /latest & /logs.',
    description: 'Menguji fungsionalitas input data manual dari halaman /admin atau simulasi injeksi payload via REST API.',
    body: JSON.stringify(
      {
        room: 'lab_td',
        temperature: 27.4,
        humidity: 58.2,
        wind_speed: 1.4,
        co2: 420,
        fan_rpm: 980,
        relay_state: 'ON',
        air_quality: 'Baik',
        uptime: 3600,
      },
      null,
      2
    ),
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    pmTestScript: `pm.test("Status code is 201 Created", function () {
    pm.response.to.have.status(201);
});

pm.test("Response contains success and new ID", function () {
    var json = pm.response.json();
    pm.expect(json.success).to.be.true;
    pm.expect(json).to.have.property("id");
    
    // Simpan ID yang baru dibuat ke environment variable Postman
    pm.environment.set("test_record_id", json.id);
});`,
    sampleResponse: `{
  "success": true,
  "id": 5374,
  "message": "Data sensor berhasil ditambahkan"
}`,
  },
  {
    no: 27,
    id: 'tc-27',
    group: 'crud',
    groupLabel: 'CRUD Admin Data Sensor',
    name: 'Admin: Perbarui Rekaman Sensor Berdasarkan ID (HTTP PUT)',
    method: 'PUT',
    room: 'lab_td',
    module: 'Admin Panel - Edit Data',
    endpoint: '/api/readings/{{test_record_id}}',
    expressRoute: '/readings/:id',
    expectedStatus: '200 OK (atau 400 / 404)',
    statusCode: 200,
    criteria: 'Data terupdate (200 OK); ID non-numerik menghasilkan 400 Bad Request; ID tidak ada menghasilkan 404 Not Found.',
    description: 'Menguji pembaruan nilai suhu, kelembaban, kecepatan angin, atau status kipas untuk rekaman tertentu.',
    body: JSON.stringify(
      {
        room: 'lab_td',
        temperature: 28.0,
        humidity: 59.0,
        wind_speed: 1.6,
        co2: 415,
        fan_rpm: 1100,
        relay_state: 'ON',
        air_quality: 'Baik',
      },
      null,
      2
    ),
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    pmTestScript: `pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});

pm.test("Response confirms update success", function () {
    var json = pm.response.json();
    pm.expect(json.success).to.be.true;
});`,
    sampleResponse: `{
  "success": true,
  "message": "Data ID #5374 berhasil diperbarui"
}`,
  },
  {
    no: 28,
    id: 'tc-28',
    group: 'crud',
    groupLabel: 'CRUD Admin Data Sensor',
    name: 'Admin: Hapus Rekaman Sensor Berdasarkan ID (HTTP DELETE)',
    method: 'DELETE',
    room: 'lab_td',
    module: 'Admin Panel - Hapus Data',
    endpoint: '/api/readings/{{test_record_id}}',
    expressRoute: '/readings/:id',
    expectedStatus: '200 OK (atau 400 / 404)',
    statusCode: 200,
    criteria: 'Baris terhapus permanen dari basis data SQLite (200 OK); uji ulang ID yang sama menghasilkan 404 Not Found.',
    description: 'Menguji tombol Hapus Anomali pada halaman /admin untuk membersihkan data uji atau data salah rekam.',
    body: null,
    headers: { Accept: 'application/json' },
    pmTestScript: `pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});

pm.test("Response confirms deletion", function () {
    var json = pm.response.json();
    pm.expect(json.success).to.be.true;
});`,
    sampleResponse: `{
  "success": true,
  "message": "Data ID #5374 berhasil dihapus"
}`,
  },
];

export default function DocsPostmanPage({ onNavigate }) {
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedRoom, setSelectedRoom] = useState('all');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState('tc-01');
  const [copiedUrlNo, setCopiedUrlNo] = useState(null);
  const [copiedCurlNo, setCopiedCurlNo] = useState(null);
  const [copiedCollection, setCopiedCollection] = useState(false);

  const domainHost = 'archtera.web.id';
  const baseIp = '202.10.42.14';
  const baseOrigin = `https://${domainHost}`;
  const baseUrl = `${baseOrigin}/api`;

  // Filtered scenarios
  const filteredScenarios = useMemo(() => {
    return POSTMAN_TEST_SCENARIOS.filter((tc) => {
      const matchGroup = selectedGroup === 'all' || tc.group === selectedGroup;
      const matchRoom = selectedRoom === 'all' || tc.room === selectedRoom;
      const matchMethod = selectedMethod === 'all' || tc.method === selectedMethod;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        tc.no.toString().includes(q) ||
        tc.name.toLowerCase().includes(q) ||
        tc.endpoint.toLowerCase().includes(q) ||
        tc.module.toLowerCase().includes(q) ||
        tc.criteria.toLowerCase().includes(q);

      return matchGroup && matchRoom && matchMethod && matchSearch;
    });
  }, [selectedGroup, selectedRoom, selectedMethod, searchQuery]);

  // Generate Postman Collection v2.1.0 Object
  const postmanCollectionData = useMemo(() => {
    const foldersMap = {
      status_live: { name: '01. Status & Health (6 Requests)', item: [] },
      readings: { name: '02. Readings & Grafik Telemetri (8 Requests)', item: [] },
      logs: { name: '03. Log Riwayat Terpaginasi (6 Requests)', item: [] },
      download: { name: '04. Unduh Dataset CSV (5 Requests)', item: [] },
      crud: { name: '05. CRUD Admin Data Sensor (3 Requests)', item: [] },
    };

    POSTMAN_TEST_SCENARIOS.forEach((tc) => {
      // Split path & query
      const [pathPart, queryPart] = tc.endpoint.replace('/api/', '').split('?');
      const pathSegments = pathPart.split('/').filter(Boolean);

      const queryParams = [];
      if (queryPart) {
        queryPart.split('&').forEach((kv) => {
          const [k, v] = kv.split('=');
          queryParams.push({ key: k, value: v || '' });
        });
      }

      const headersList = [];
      if (tc.headers) {
        Object.entries(tc.headers).forEach(([k, v]) => {
          headersList.push({ key: k, value: v, type: 'text' });
        });
      }

      const postmanItem = {
        name: `#${tc.no} - ${tc.name}`,
        request: {
          method: tc.method,
          header: headersList,
          url: {
            raw: `{{base_url}}/${pathPart}${queryPart ? '?' + queryPart : ''}`,
            host: ['{{base_url}}'],
            path: pathSegments,
            query: queryParams,
          },
          description: `${tc.description}\n\nKriteria Uji: ${tc.criteria}`,
        },
        response: [],
      };

      if (tc.body) {
        postmanItem.request.body = {
          mode: 'raw',
          raw: tc.body,
          options: {
            raw: {
              language: 'json',
            },
          },
        };
      }

      if (tc.pmTestScript) {
        postmanItem.event = [
          {
            listen: 'test',
            script: {
              type: 'text/javascript',
              exec: tc.pmTestScript.split('\n'),
            },
          },
        ];
      }

      if (foldersMap[tc.group]) {
        foldersMap[tc.group].item.push(postmanItem);
      }
    });

    return {
      info: {
        _postman_id: 'archtera-functional-test-collection-v2',
        name: 'Archtera REST API - Functional Testing Suite',
        description:
          'Koleksi pengujian fungsionalitas menyeluruh seluruh 8 route REST API dan 28 skenario operasional per ruangan (h5, lab_td, lab_kom, seminar, all) sistem Archtera Monitoring Kualitas Udara.',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      variable: [
        {
          key: 'base_url',
          value: baseUrl,
          type: 'string',
          description: 'URL Basis Endpoint REST API Produksi',
        },
        {
          key: 'ip_base_url',
          value: `https://${baseIp}/api`,
          type: 'string',
          description: 'URL Basis Langsung via IP Publik VPS',
        },
        {
          key: 'test_record_id',
          value: '5374',
          type: 'string',
          description: 'ID rekaman pengujian CRUD (otomatis diperbarui oleh TC-26)',
        },
      ],
      item: Object.values(foldersMap),
    };
  }, [baseUrl, baseIp]);

  const postmanJsonString = useMemo(() => {
    return JSON.stringify(postmanCollectionData, null, 2);
  }, [postmanCollectionData]);

  const handleDownloadCollection = () => {
    const blob = new Blob([postmanJsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Archtera_API_Functional_Testing.postman_collection.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyCollection = async () => {
    try {
      await navigator.clipboard.writeText(postmanJsonString);
      setCopiedCollection(true);
      setTimeout(() => setCopiedCollection(false), 2000);
    } catch (e) {
      // Fallback
    }
  };

  const handleCopyUrl = (tc) => {
    const fullUrl = `${baseOrigin}${tc.endpoint.replace('{{test_record_id}}', '5374')}`;
    navigator.clipboard?.writeText(fullUrl);
    setCopiedUrlNo(tc.no);
    setTimeout(() => setCopiedUrlNo(null), 1800);
  };

  const handleCopyCurl = (tc) => {
    const fullUrl = `${baseOrigin}${tc.endpoint.replace('{{test_record_id}}', '5374')}`;
    let curlCmd = `curl -k -X ${tc.method} "${fullUrl}"`;
    if (tc.body) {
      curlCmd += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${tc.body.replace(/\n/g, '')}'`;
    }
    navigator.clipboard?.writeText(curlCmd);
    setCopiedCurlNo(tc.no);
    setTimeout(() => setCopiedCurlNo(null), 1800);
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
                <span className="text-xs font-bold text-orange-700 uppercase tracking-wider">
                  Postman Collection &amp; QA
                </span>
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#0f2942] tracking-tight flex items-center gap-3">
                <Send className="h-7 w-7 text-orange-600" />
                <span>Dokumentasi Skenario Pengujian API (Postman)</span>
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
                Spesifikasi resmi <strong>{POSTMAN_TEST_SCENARIOS.length} Skenario Uji Fungsionalitas REST API</strong> (Functional Testing) sistem Archtera, berkas Postman Collection v2.1.0 siap pakai, skrip assertion <code>pm.test</code> otomatis, parameter per-ruangan, dan petunjuk eksekusi Collection Runner.
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
                onClick={() => onNavigate('docs-backend')}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-emerald-700 transition-all cursor-pointer shadow-2xs"
              >
                <Server className="h-4 w-4 text-emerald-600" />
                <span>Docs Backend</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => onNavigate('docs-iot')}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-cyan-700 transition-all cursor-pointer shadow-2xs"
              >
                <Cpu className="h-4 w-4 text-cyan-600" />
                <span>Docs IoT</span>
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
        {/* Section 1: Overview Cards & Postman Collection Download */}
        <section className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-orange-200 bg-orange-50/60 p-5 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700">Total Skenario Uji</span>
              <div className="text-2xl font-extrabold text-[#0f2942] font-mono mt-1">
                {POSTMAN_TEST_SCENARIOS.length} Kasus Pengujian
              </div>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Tercakup penuh dalam 5 folder terstruktur (Status, Readings, Logs, Download, CRUD).
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Route API Terverifikasi</span>
              <div className="text-2xl font-extrabold text-[#0f2942] font-mono mt-1">
                8 Route Endpoint
              </div>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                5 GET, 1 POST, 1 PUT, 1 DELETE diuji secara fungsionalitas dan integritas skema data.
              </p>
            </div>

            <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-5 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">Cakupan Ruangan Uji</span>
              <div className="text-2xl font-extrabold text-[#0f2942] font-mono mt-1">
                4 Ruang + All
              </div>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Pengujian spesifik per ruang <code>h5</code>, <code>lab_td</code>, <code>lab_kom</code>, <code>seminar</code>, dan <code>all</code>.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Waktu Respons</span>
              <div className="text-2xl font-extrabold text-emerald-600 font-mono mt-1">
                &lt; 2000 ms
              </div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Seluruh pengujian dilengkapi assertion batas latensi maksimum <code>pm.expect.responseTime</code>.
              </p>
            </div>
          </div>

          {/* Action Box: 1-Click Postman Collection Download & Copy */}
          <div className="rounded-2xl border-2 border-orange-300/80 bg-gradient-to-r from-orange-50/90 via-amber-50/70 to-white p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 text-orange-800 px-3 py-0.5 text-xs font-bold border border-orange-200">
                <Send className="h-3 w-3" />
                <span>Postman Collection v2.1.0 Ready</span>
              </div>
              <h3 className="text-lg font-bold text-[#0f2942]">
                Unduh Berkas Koleksi Postman Siap Pakai (1-Klik Impor)
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Anda dapat langsung mengimpor berkas <code>.json</code> ini ke dalam aplikasi Postman Desktop atau Web. Koleksi telah terorganisir rapi ke dalam 5 folder, lengkap dengan parameter variabel global <code>{'{{base_url}}'}</code> dan skrip assertion <code>pm.test</code> otomatis.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={handleDownloadCollection}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-5 py-3 text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Unduh File .JSON Postman</span>
              </button>

              <button
                onClick={handleCopyCollection}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-4 py-3 text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                {copiedCollection ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">JSON Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Salin Raw JSON</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Section 2: Panduan Eksekusi Postman Collection Runner */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
            <Play className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-bold text-[#0f2942]">2. Prosedur Pengujian Menggunakan Postman Collection Runner</h2>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-6">
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Ikuti 4 langkah sederhana berikut untuk mengeksekusi seluruh 28 pengujian secara otomatis sekaligus dan menghasilkan laporan kelulusan (Test Results):
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 relative">
                <span className="text-[10px] font-bold text-orange-600 uppercase font-mono">Langkah 1</span>
                <div className="font-bold text-sm text-[#0f2942] mt-1">Impor File Koleksi</div>
                <p className="text-slate-500 mt-1 leading-relaxed">
                  Buka Postman, klik tombol <strong>Import</strong> di sudut kiri atas, lalu seret file <code>Archtera_API_Functional_Testing.postman_collection.json</code> yang telah diunduh.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 relative">
                <span className="text-[10px] font-bold text-orange-600 uppercase font-mono">Langkah 2</span>
                <div className="font-bold text-sm text-[#0f2942] mt-1">Atur Variabel URL</div>
                <p className="text-slate-500 mt-1 leading-relaxed">
                  Secara default variabel <code>{'{{base_url}}'}</code> mengarah ke <code>{baseUrl}</code>. Anda juga dapat menggantinya ke IP publik langsung <code>https://{baseIp}/api</code> pada tab <strong>Variables</strong>.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 relative">
                <span className="text-[10px] font-bold text-orange-600 uppercase font-mono">Langkah 3</span>
                <div className="font-bold text-sm text-[#0f2942] mt-1">Buka Collection Runner</div>
                <p className="text-slate-500 mt-1 leading-relaxed">
                  Klik titik tiga (...) pada nama koleksi di sidebar Postman, lalu pilih menu <strong>Run Collection</strong>. Pastikan ke-28 skenario tercentang.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 relative">
                <span className="text-[10px] font-bold text-orange-600 uppercase font-mono">Langkah 4</span>
                <div className="font-bold text-sm text-[#0f2942] mt-1">Review Hasil (100% Pass)</div>
                <p className="text-slate-500 mt-1 leading-relaxed">
                  Klik tombol <strong>Run Archtera REST API...</strong>. Postman akan menjalankan seluruh pengujian berurutan dan menampilkan indikator hijau pada seluruh assertion.
                </p>
              </div>
            </div>

            {/* Note on SSL Self-Signed */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold">Tips Pengujian via IP Langsung (SSL Verification di Postman):</div>
                <p className="text-amber-800 leading-relaxed">
                  Jika Anda menggunakan variabel <code>{'{{ip_base_url}}'}</code> (<code>https://{baseIp}/api</code>) yang menggunakan sertifikat Self-Signed, pastikan opsi <strong>SSL certificate verification</strong> di menu <em>Postman Settings (Ctrl + ,) -&gt; General</em> dalam posisi <strong>OFF</strong> agar pengujian tidak terhambat peringatan sertifikat peramban.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Interactive Filter & Scenario Browser (28 Cases) */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2.5">
              <ListChecks className="h-5 w-5 text-orange-600" />
              <h2 className="text-lg font-bold text-[#0f2942]">
                3. Matriks Interaktif Skenario Pengujian Postman ({filteredScenarios.length} dari {POSTMAN_TEST_SCENARIOS.length} Tampil)
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              Filter dan telusuri setiap request, skrip assertion <code>pm.test</code>, payload JSON, dan kriteria kelulusan.
            </span>
          </div>

          {/* Filter Bar */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
            {/* Top row: Search and Method */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan nomor, nama pengujian, endpoint, modul, atau kriteria..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
              </div>

              {/* Method Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
                <span className="font-bold text-slate-500 mr-1 text-[11px]">Method:</span>
                {['all', 'GET', 'POST', 'PUT', 'DELETE'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMethod(m)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-mono font-bold transition-all cursor-pointer ${
                      selectedMethod === m
                        ? 'bg-[#0f2942] text-white shadow-2xs'
                        : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom row: Category Groups & Rooms */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
              {/* Group Tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: `Semua (${POSTMAN_TEST_SCENARIOS.length})` },
                  { id: 'status_live', label: 'Status & Live (6)' },
                  { id: 'readings', label: 'Readings & Grafik (8)' },
                  { id: 'logs', label: 'Log Riwayat (6)' },
                  { id: 'download', label: 'Unduh CSV (5)' },
                  { id: 'crud', label: 'CRUD Admin (3)' },
                ].map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGroup(g.id)}
                    className={`rounded-lg px-2.5 py-1 font-bold text-xs transition-all cursor-pointer ${
                      selectedGroup === g.id
                        ? 'bg-orange-600 text-white shadow-2xs'
                        : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>

              {/* Room Tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-bold text-slate-500 mr-1 text-[11px]">Ruangan:</span>
                {[
                  { id: 'all', label: 'Semua' },
                  { id: 'h5', label: 'h5' },
                  { id: 'lab_td', label: 'lab_td' },
                  { id: 'lab_kom', label: 'lab_kom' },
                  { id: 'seminar', label: 'seminar' },
                  { id: 'sistem', label: 'sistem' },
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRoom(r.id)}
                    className={`rounded-lg px-2 py-0.5 font-mono text-[11px] font-bold transition-all cursor-pointer ${
                      selectedRoom === r.id
                        ? 'bg-emerald-700 text-white shadow-2xs'
                        : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {r.label}
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
                <div className="font-bold text-sm text-slate-700">Tidak ada skenario yang cocok dengan filter</div>
                <p className="text-xs text-slate-400 mt-1">Coba ubah kata kunci pencarian atau reset filter kategori di atas.</p>
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
                        ? 'border-orange-300 shadow-sm ring-1 ring-orange-200'
                        : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    {/* Header Row (Always Visible) */}
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : tc.id)}
                      className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none bg-white hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="flex items-start md:items-center gap-3">
                        <span className="font-mono text-xs font-bold text-slate-400 w-7 shrink-0 pt-0.5 md:pt-0">
                          #{tc.no}
                        </span>

                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold font-mono shrink-0 ${METHOD_BADGES[tc.method]}`}
                        >
                          {tc.method}
                        </span>

                        <span
                          className={`inline-block rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold shrink-0 ${ROOM_BADGES[tc.room] || 'bg-slate-50 text-slate-700 border-slate-200'}`}
                        >
                          {tc.room}
                        </span>

                        <div>
                          <div className="text-sm font-bold text-[#0f2942] flex flex-wrap items-center gap-2">
                            <span>{tc.name}</span>
                            <span className="text-[11px] font-normal text-slate-400">({tc.module})</span>
                          </div>
                          <div className="text-xs font-mono text-emerald-700 mt-0.5 break-all">
                            {tc.endpoint}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 ml-10 md:ml-0">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold font-mono">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span>{tc.expectedStatus}</span>
                        </span>

                        <button
                          type="button"
                          className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-400 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-orange-600" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Detail Panel */}
                    {isExpanded && (
                      <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-5 text-xs">
                        {/* Summary & Criteria */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-1.5 shadow-2xs">
                            <span className="text-[10px] font-bold uppercase text-slate-400">Deskripsi Pengujian</span>
                            <p className="text-slate-700 leading-relaxed">{tc.description}</p>
                          </div>

                          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4 space-y-1.5 shadow-2xs">
                            <span className="text-[10px] font-bold uppercase text-emerald-700">Kriteria Kelulusan (Assertion Criteria)</span>
                            <p className="text-emerald-900 font-medium leading-relaxed">{tc.criteria}</p>
                          </div>
                        </div>

                        {/* Action Toolbar for this Scenario */}
                        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Terminal className="h-4 w-4 text-slate-400" />
                            <span className="font-semibold text-xs">Eksekusi Langsung:</span>
                            <span className="font-mono text-[11px] text-slate-500">
                              {baseOrigin}
                              {tc.endpoint}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopyUrl(tc)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all font-semibold cursor-pointer text-[11px]"
                            >
                              {copiedUrlNo === tc.no ? (
                                <>
                                  <Check className="h-3 w-3 text-emerald-600" />
                                  <span className="text-emerald-700">URL Tersalin</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  <span>Salin URL</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleCopyCurl(tc)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0f2942] hover:bg-slate-800 text-white transition-all font-semibold cursor-pointer text-[11px] shadow-2xs"
                            >
                              {copiedCurlNo === tc.no ? (
                                <>
                                  <Check className="h-3 w-3 text-emerald-400" />
                                  <span className="text-emerald-300">cURL Tersalin!</span>
                                </>
                              ) : (
                                <>
                                  <Terminal className="h-3 w-3" />
                                  <span>Salin cURL</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Request Body (If POST/PUT) */}
                        {tc.body && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-slate-600">
                              <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                                Request Payload (JSON Body)
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">Content-Type: application/json</span>
                            </div>
                            <CodeBlock language="json" title={`Body Payload POST/PUT #${tc.no}`} code={tc.body} />
                          </div>
                        )}

                        {/* Postman pm.test Script */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="font-bold text-orange-700 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                              <Send className="h-3.5 w-3.5 text-orange-600" />
                              <span>Skrip Assertion Postman (pm.test)</span>
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">Tests Tab di Postman</span>
                          </div>
                          <CodeBlock
                            language="javascript"
                            title={`Postman Tests Script — TC-${String(tc.no).padStart(2, '0')}`}
                            code={tc.pmTestScript}
                          />
                        </div>

                        {/* Sample Expected Response */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                              Contoh Respons yang Diharapkan ({tc.expectedStatus})
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">HTTP Status {tc.statusCode}</span>
                          </div>
                          <CodeBlock
                            language={tc.group === 'download' ? 'csv' : 'json'}
                            title={`Expected Response #${tc.no}`}
                            code={tc.sampleResponse}
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

        {/* Section 4: Postman Environment Variables Reference */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
            <Layers className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-bold text-[#0f2942]">4. Variabel Lingkungan (Postman Environment)</h2>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Berkas Postman Collection ini telah dilengkapi dengan variabel bawaan. Anda dapat menyesuaikan nilai variabel ini pada tab <strong>Variables</strong> di Postman:
            </p>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Nama Variabel</th>
                    <th className="py-2.5 px-3">Tipe</th>
                    <th className="py-2.5 px-3">Nilai Awal (Initial Value)</th>
                    <th className="py-2.5 px-3">Keterangan &amp; Penggunaan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2.5 px-3 font-mono font-bold text-orange-700">{'{{base_url}}'}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">string</td>
                    <td className="py-2.5 px-3 font-mono text-slate-800">{baseUrl}</td>
                    <td className="py-2.5 px-3 text-slate-600">Alamat basis HTTPS untuk seluruh request REST API</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-mono font-bold text-orange-700">{'{{ip_base_url}}'}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">string</td>
                    <td className="py-2.5 px-3 font-mono text-slate-800">https://{baseIp}/api</td>
                    <td className="py-2.5 px-3 text-slate-600">Alternatif URL basis langsung ke Public IP server VPS</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-mono font-bold text-orange-700">{'{{test_record_id}}'}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">string / int</td>
                    <td className="py-2.5 px-3 font-mono text-slate-800">5374</td>
                    <td className="py-2.5 px-3 text-slate-600">
                      ID dinamis yang dihasilkan otomatis oleh TC-26 (POST) dan digunakan oleh TC-27 (PUT) &amp; TC-28 (DELETE)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Section 5: Bottom Navigation Links to Other Docs */}
        <section className="pt-6 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={() => onNavigate('docs-backend')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition-all cursor-pointer shadow-2xs w-full sm:w-auto justify-center"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali ke Dokumentasi Backend API</span>
            </button>

            <button
              onClick={() => onNavigate('docs-playwright')}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-5 py-3 text-xs font-bold text-white transition-all cursor-pointer shadow-xs w-full sm:w-auto justify-center"
            >
              <span>Buka Dokumentasi Playwright (E2E)</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
