const fs = require('fs');
const path = require('path');

const baseUrl = 'https://archtera.web.id/api';
const baseIp = '202.10.42.14';

const rawScenarios = [
  // 1. Status & Live Telemetri (6)
  {
    no: 1,
    group: 'status_live',
    name: 'Health Check Backend & Koneksi Broker MQTT',
    method: 'GET',
    room: 'sistem',
    endpoint: '/api/status',
    criteria: 'JSON { status: "online", mqtt: { broker, topic, connected }, timestamp } valid dan waktu respons < 2000ms.',
    body: null,
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
  },
  {
    no: 2,
    group: 'status_live',
    name: 'Data Telemetri Sensor Terakhir Ruang H5',
    method: 'GET',
    room: 'h5',
    endpoint: '/api/latest?room=h5',
    criteria: 'Mengembalikan 1 record paling baru room "h5" dengan ID tertinggi dan field telemetri lengkap.',
    body: null,
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
  },
  {
    no: 3,
    group: 'status_live',
    name: 'Data Telemetri Sensor Terakhir Ruang Lab TD',
    method: 'GET',
    room: 'lab_td',
    endpoint: '/api/latest?room=lab_td',
    criteria: 'Mengembalikan 1 record paling baru room "lab_td" dengan validasi isolasi data ruangan.',
    body: null,
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Room is lab_td", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.room).to.eql("lab_td");
});`,
  },
  {
    no: 4,
    group: 'status_live',
    name: 'Data Telemetri Sensor Terakhir Ruang Lab Komputer',
    method: 'GET',
    room: 'lab_kom',
    endpoint: '/api/latest?room=lab_kom',
    criteria: 'Mengembalikan 1 record paling baru room "lab_kom" dari database.',
    body: null,
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Room is lab_kom", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.room).to.eql("lab_kom");
});`,
  },
  {
    no: 5,
    group: 'status_live',
    name: 'Data Telemetri Sensor Terakhir Ruang Seminar',
    method: 'GET',
    room: 'seminar',
    endpoint: '/api/latest?room=seminar',
    criteria: 'Mengembalikan 1 record paling baru room "seminar".',
    body: null,
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Room is seminar", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.room).to.eql("seminar");
});`,
  },
  {
    no: 6,
    group: 'status_live',
    name: 'Data Telemetri Terakhir Lintas Seluruh Ruangan (room=all)',
    method: 'GET',
    room: 'all',
    endpoint: '/api/latest?room=all',
    criteria: 'Mengembalikan 1 record paling akhir yang masuk ke sistem tanpa filter ruangan.',
    body: null,
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Has valid telemetry structure", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("id");
    pm.expect(jsonData).to.have.property("room");
});`,
  },

  // 2. Readings / Grafik & Admin List (8)
  {
    no: 7,
    group: 'readings',
    name: 'Grafik Agregasi 1 Menit Ruang H5 (1 Hari)',
    method: 'GET',
    room: 'h5',
    endpoint: '/api/readings?room=h5&range=1d&interval=1m',
    criteria: 'Array kronologis ASC bucket rata-rata 1 menit 24 jam terakhir, memuat properti sample_count.',
    body: null,
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
  },
  {
    no: 8,
    group: 'readings',
    name: 'Grafik Agregasi 1 Menit Ruang Lab TD (7 Hari)',
    method: 'GET',
    room: 'lab_td',
    endpoint: '/api/readings?room=lab_td&range=7d&interval=1m',
    criteria: 'Array ASC bucket 1 menit khusus data "lab_td" 7 hari terakhir.',
    body: null,
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
  },
  {
    no: 9,
    group: 'readings',
    name: 'Grafik Agregasi 15 Menit Ruang Lab Kom (7 Hari)',
    method: 'GET',
    room: 'lab_kom',
    endpoint: '/api/readings?room=lab_kom&range=7d&interval=15m',
    criteria: 'Array ASC bucket 15 menit (:00, :15, :30, :45) khusus "lab_kom".',
    body: null,
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Valid 15m aggregated array", function () {
    var data = pm.response.json();
    pm.expect(Array.isArray(data)).to.be.true;
});`,
  },
  {
    no: 10,
    group: 'readings',
    name: 'Grafik Agregasi 30 Menit Ruang Seminar (30 Hari)',
    method: 'GET',
    room: 'seminar',
    endpoint: '/api/readings?room=seminar&range=30d&interval=30m',
    criteria: 'Array ASC bucket 30 menit (:00, :30) 30 hari terakhir khusus "seminar".',
    body: null,
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Returns 30m bucket array", function () {
    var data = pm.response.json();
    pm.expect(Array.isArray(data)).to.be.true;
});`,
  },
  {
    no: 11,
    group: 'readings',
    name: 'Readings Mentah (Raw) Ruang H5 (Maksimal 2000 Baris)',
    method: 'GET',
    room: 'h5',
    endpoint: '/api/readings?room=h5&range=1d&interval=raw&limit=2000',
    criteria: 'Mengembalikan maks 2000 baris mentah terbaru dalam urutan ASC kronologis.',
    body: null,
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Raw data has unaggregated properties", function () {
    var data = pm.response.json();
    pm.expect(Array.isArray(data)).to.be.true;
    pm.expect(data.length).to.be.at.most(2000);
});`,
  },
  {
    no: 12,
    group: 'readings',
    name: 'Readings Inkremental Polling (afterId > N)',
    method: 'GET',
    room: 'h5',
    endpoint: '/api/readings?room=h5&afterId=5000',
    criteria: 'Hanya mengembalikan baris rekaman baru "h5" dengan ID > 5000 secara ASC.',
    body: null,
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
  },
  {
    no: 13,
    group: 'readings',
    name: 'Panel Admin: Rekaman Terbaru Lintas Ruangan (order=desc)',
    method: 'GET',
    room: 'all',
    endpoint: '/api/readings?room=all&limit=200&order=desc',
    criteria: 'Mengembalikan maks 200 record terbaru lintas ruangan terurut DESC.',
    body: null,
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
  },
  {
    no: 14,
    group: 'readings',
    name: 'Panel Admin: Filter Ruang Lab TD (order=desc)',
    method: 'GET',
    room: 'lab_td',
    endpoint: '/api/readings?room=lab_td&limit=200&order=desc',
    criteria: 'Mengembalikan maks 200 record terbaru khusus "lab_td" terurut DESC.',
    body: null,
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Items filtered to lab_td", function () {
    var data = pm.response.json();
    data.forEach(function(item) {
        pm.expect(item.room).to.eql("lab_td");
    });
});`,
  },

  // 3. Log Riwayat Data Terpaginasi (6)
  {
    no: 15,
    group: 'logs',
    name: 'Log Riwayat Terpaginasi Ruang H5 (Page 1, Size 50)',
    method: 'GET',
    room: 'h5',
    endpoint: '/api/readings/logs?room=h5&range=7d&page=1&pageSize=50',
    criteria: 'rows urut DESC tanpa lompatan ID, totalAll akurat, page=1, pageSize=50.',
    body: null,
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
  },
  {
    no: 16,
    group: 'logs',
    name: 'Log Riwayat Terpaginasi Ruang Lab TD',
    method: 'GET',
    room: 'lab_td',
    endpoint: '/api/readings/logs?room=lab_td&range=7d&page=1&pageSize=50',
    criteria: 'rows khusus "lab_td" urut DESC dengan metadata total & paginasi lengkap.',
    body: null,
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Rows belong to lab_td", function () {
    var res = pm.response.json();
    res.rows.forEach(function(row) {
        pm.expect(row.room).to.eql("lab_td");
    });
});`,
  },
  {
    no: 17,
    group: 'logs',
    name: 'Log Riwayat Terpaginasi Ruang Lab Komputer',
    method: 'GET',
    room: 'lab_kom',
    endpoint: '/api/readings/logs?room=lab_kom&range=7d&page=1&pageSize=50',
    criteria: 'rows khusus "lab_kom" urut DESC dengan metadata total & paginasi lengkap.',
    body: null,
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});`,
  },
  {
    no: 18,
    group: 'logs',
    name: 'Log Riwayat Terpaginasi Ruang Seminar',
    method: 'GET',
    room: 'seminar',
    endpoint: '/api/readings/logs?room=seminar&range=7d&page=1&pageSize=50',
    criteria: 'rows khusus "seminar" urut DESC dengan metadata total & paginasi lengkap.',
    body: null,
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});`,
  },
  {
    no: 19,
    group: 'logs',
    name: 'Pencarian Server-side & Paginasi Lanjutan (Search Query)',
    method: 'GET',
    room: 'h5',
    endpoint: '/api/readings/logs?room=h5&range=1d&page=1&pageSize=25&search=ON',
    criteria: 'Pencarian relay state "ON" / kata kunci jam bekerja; pageSize=25 dan page di-clamp aman.',
    body: null,
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
  },
  {
    no: 20,
    group: 'logs',
    name: 'Log Riwayat Lintas Ruangan (room=all, 30 Hari, Size 100)',
    method: 'GET',
    room: 'all',
    endpoint: '/api/readings/logs?room=all&range=30d&page=1&pageSize=100',
    criteria: 'Mengembalikan hingga 100 baris terbaru dari seluruh ruangan dalam 30 hari terakhir.',
    body: null,
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Contains multiple room data", function () {
    var res = pm.response.json();
    pm.expect(Array.isArray(res.rows)).to.be.true;
});`,
  },

  // 4. Unduh Dataset CSV (5)
  {
    no: 21,
    group: 'download',
    name: 'Unduh File CSV Ruang H5 (1 Hari Terakhir)',
    method: 'GET',
    room: 'h5',
    endpoint: '/api/download?room=h5&range=1d',
    criteria: 'Content-Type text/csv, header kolom CSV lengkap, rekaman "h5" 1 hari urut ASC.',
    body: null,
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
  },
  {
    no: 22,
    group: 'download',
    name: 'Unduh File CSV Ruang Lab TD (7 Hari Terakhir)',
    method: 'GET',
    room: 'lab_td',
    endpoint: '/api/download?room=lab_td&range=7d',
    criteria: 'File .csv isi rekaman "lab_td" 7 hari urut ASC tanpa tercampur ruangan lain.',
    body: null,
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Content-Type is text/csv", function () {
    pm.expect(pm.response.headers.get("Content-Type")).to.include("text/csv");
});`,
  },
  {
    no: 23,
    group: 'download',
    name: 'Unduh File CSV Ruang Lab Komputer (7 Hari Terakhir)',
    method: 'GET',
    room: 'lab_kom',
    endpoint: '/api/download?room=lab_kom&range=7d',
    criteria: 'File .csv isi rekaman "lab_kom" 7 hari urut ASC.',
    body: null,
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});`,
  },
  {
    no: 24,
    group: 'download',
    name: 'Unduh File CSV Ruang Seminar (30 Hari Terakhir)',
    method: 'GET',
    room: 'seminar',
    endpoint: '/api/download?room=seminar&range=30d',
    criteria: 'File .csv isi rekaman "seminar" 30 hari urut ASC.',
    body: null,
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});`,
  },
  {
    no: 25,
    group: 'download',
    name: 'Unduh File CSV Seluruh Ruangan (Seluruh Riwayat / all)',
    method: 'GET',
    room: 'all',
    endpoint: '/api/download?room=all&range=all',
    criteria: 'File .csv lengkap berisi seluruh rekaman lintas ruangan dari basis data SQLite.',
    body: null,
    pmTestScript: `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Contains multiple rooms", function () {
    var txt = pm.response.text();
    pm.expect(txt).to.include("h5");
});`,
  },

  // 5. CRUD Admin Data Sensor (3)
  {
    no: 26,
    group: 'crud',
    name: 'Admin: Tambah Data Sensor Baru (Injeksi HTTP POST)',
    method: 'POST',
    room: 'lab_td',
    endpoint: '/api/readings',
    criteria: 'Body JSON tersimpan ke basis data; respons { success: true, id: <ID> }; langsung muncul di /latest & /logs.',
    body: JSON.stringify({
      room: 'lab_td',
      temperature: 27.4,
      humidity: 58.2,
      wind_speed: 1.4,
      co2: 420,
      fan_rpm: 980,
      relay_state: 'ON',
      air_quality: 'Baik',
      uptime: 3600
    }, null, 2),
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
  },
  {
    no: 27,
    group: 'crud',
    name: 'Admin: Perbarui Rekaman Sensor Berdasarkan ID (HTTP PUT)',
    method: 'PUT',
    room: 'lab_td',
    endpoint: '/api/readings/{{test_record_id}}',
    criteria: 'Data terupdate (200 OK); ID non-numerik menghasilkan 400 Bad Request; ID tidak ada menghasilkan 404 Not Found.',
    body: JSON.stringify({
      room: 'lab_td',
      temperature: 28.0,
      humidity: 59.0,
      wind_speed: 1.6,
      co2: 415,
      fan_rpm: 1100,
      relay_state: 'ON',
      air_quality: 'Baik'
    }, null, 2),
    pmTestScript: `pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});

pm.test("Response confirms update success", function () {
    var json = pm.response.json();
    pm.expect(json.success).to.be.true;
});`,
  },
  {
    no: 28,
    group: 'crud',
    name: 'Admin: Hapus Rekaman Sensor Berdasarkan ID (HTTP DELETE)',
    method: 'DELETE',
    room: 'lab_td',
    endpoint: '/api/readings/{{test_record_id}}',
    criteria: 'Baris terhapus permanen dari basis data SQLite (200 OK); uji ulang ID yang sama menghasilkan 404 Not Found.',
    body: null,
    pmTestScript: `pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});

pm.test("Response confirms deletion", function () {
    var json = pm.response.json();
    pm.expect(json.success).to.be.true;
});`,
  },
];

const foldersMap = {
  status_live: { name: '01. Status & Health (6 Requests)', item: [] },
  readings: { name: '02. Readings & Grafik Telemetri (8 Requests)', item: [] },
  logs: { name: '03. Log Riwayat Terpaginasi (6 Requests)', item: [] },
  download: { name: '04. Unduh Dataset CSV (5 Requests)', item: [] },
  crud: { name: '05. CRUD Admin Data Sensor (3 Requests)', item: [] },
};

rawScenarios.forEach((tc) => {
  const [pathPart, queryPart] = tc.endpoint.replace('/api/', '').split('?');
  const pathSegments = pathPart.split('/').filter(Boolean);

  const queryParams = [];
  if (queryPart) {
    queryPart.split('&').forEach((kv) => {
      const [k, v] = kv.split('=');
      queryParams.push({ key: k, value: v || '' });
    });
  }

  const postmanItem = {
    name: `#${tc.no} - ${tc.name}`,
    request: {
      method: tc.method,
      header: tc.body ? [{ key: 'Content-Type', value: 'application/json', type: 'text' }] : [],
      url: {
        raw: `{{base_url}}/${pathPart}${queryPart ? '?' + queryPart : ''}`,
        host: ['{{base_url}}'],
        path: pathSegments,
        query: queryParams,
      },
      description: `Kriteria Pengujian: ${tc.criteria}`,
    },
    response: [],
  };

  if (tc.body) {
    postmanItem.request.body = {
      mode: 'raw',
      raw: tc.body,
      options: { raw: { language: 'json' } },
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

const collectionData = {
  info: {
    _postman_id: 'archtera-functional-test-collection-v2',
    name: 'Archtera REST API - Functional Testing Suite',
    description:
      'Koleksi pengujian fungsionalitas menyeluruh seluruh 8 route REST API dan 28 skenario operasional per ruangan sistem Archtera Monitoring Kualitas Udara.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: [
    { key: 'base_url', value: baseUrl, type: 'string', description: 'URL Basis HTTPS Produksi' },
    { key: 'ip_base_url', value: `https://${baseIp}/api`, type: 'string', description: 'URL Basis IP Publik VPS' },
    { key: 'test_record_id', value: '5374', type: 'string', description: 'ID dinamis hasil CRUD TC-26' },
  ],
  item: Object.values(foldersMap),
};

const outDir = path.join(__dirname);
fs.writeFileSync(
  path.join(outDir, 'Archtera_API_Functional_Testing.postman_collection.json'),
  JSON.stringify(collectionData, null, 2),
  'utf-8'
);

console.log('Postman Collection generated successfully with', rawScenarios.length, 'scenarios!');
