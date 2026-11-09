const express  = require('express');
const mqtt     = require('mqtt');
const Database = require('better-sqlite3');
const path     = require('path');

// ---------- Database ----------
const dbPath = process.env.DB_PATH || path.join(__dirname, 'air_data.db');
const db = new Database(dbPath);

db.prepare(`
  CREATE TABLE IF NOT EXISTS readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    temperature REAL,
    humidity REAL,
    wind_speed REAL,
    co2 INTEGER,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// Migrasi: tambahkan kolom baru jika tabel lama sudah ada
const newColumns = {
  tvoc: 'INTEGER',
  fan_rpm: 'REAL',
  relay_state: 'TEXT',
  air_quality: 'TEXT',
  temp_status: 'TEXT',
  hum_status: 'TEXT',
  co2_status: 'TEXT',
  uptime: 'INTEGER',
  room: "TEXT DEFAULT 'h5'",
};

const existing = db.prepare('PRAGMA table_info(readings)').all().map(c => c.name);
for (const [name, type] of Object.entries(newColumns)) {
  if (!existing.includes(name)) {
    db.prepare(`ALTER TABLE readings ADD COLUMN ${name} ${type}`).run();
  }
}

// Pastikan data lama memiliki nilai room default 'h5'
db.prepare("UPDATE readings SET room = 'h5' WHERE room IS NULL OR room = ''").run();

// Index untuk mempercepat query riwayat, pencarian, & agregasi grafik
db.prepare('CREATE INDEX IF NOT EXISTS idx_readings_room_time_id ON readings(room, recorded_at DESC, id DESC)').run();
db.prepare('CREATE INDEX IF NOT EXISTS idx_readings_time_id ON readings(recorded_at DESC, id DESC)').run();

const insert = db.prepare(`
  INSERT INTO readings
    (temperature, humidity, wind_speed, co2, tvoc, fan_rpm, relay_state,
     air_quality, temp_status, hum_status, co2_status, uptime, room)
  VALUES
    (@temperature, @humidity, @wind_speed, @co2, @tvoc, @fan_rpm, @relay_state,
     @air_quality, @temp_status, @hum_status, @co2_status, @uptime, @room)
`);

// ---------- MQTT Configuration (Public Broker EMQX) ----------
const MQTT_URL   = process.env.MQTT_URL || 'mqtt://broker.emqx.io';
const MQTT_TOPIC = process.env.MQTT_TOPIC || 'monitoring_udara_ta/data';

let client = { connected: false };
if (process.env.DISABLE_MQTT !== '1') {
  console.log(`Menghubungkan ke MQTT Broker: ${MQTT_URL}`);
  console.log(`Topik MQTT: ${MQTT_TOPIC}`);

  client = mqtt.connect(MQTT_URL, {
    reconnectPeriod: 3000,
    connectTimeout: 10000,
  });

  client.on('connect', () => {
    console.log(`[MQTT] Terhubung ke ${MQTT_URL}`);
    client.subscribe(MQTT_TOPIC, (err) => {
      if (err) {
        console.error(`[MQTT] Gagal subscribe ke topik ${MQTT_TOPIC}:`, err.message);
      } else {
        console.log(`[MQTT] Berhasil subscribe ke topik: ${MQTT_TOPIC}`);
      }
    });
  });

  client.on('error', (err) => {
    console.error('[MQTT Error]:', err.message);
  });

  client.on('reconnect', () => {
    console.log('[MQTT] Mencoba menyambung kembali ke broker...');
  });

  client.on('message', (_, payload) => {
    try {
      // Sanitasi data jika Arduino/ESP mengirim "nan" atau "inf"
      const raw = payload.toString().replace(/:\s*-?(?:nan|inf|infinity)/gi, ':null');
      const d = JSON.parse(raw);
      const detail = d.air_quality_detail || {};
      const room = (d.room || 'h5').toLowerCase();

      const info = insert.run({
        temperature: d.temperature ?? null,
        humidity:    d.humidity ?? null,
        wind_speed:  d.wind_speed ?? null,
        co2:         d.co2 ?? null,
        tvoc:        d.tvoc ?? null,
        fan_rpm:     d.fan_rpm ?? null,
        relay_state: d.relay_state ?? null,
        air_quality: d.air_quality ?? null,
        temp_status: detail.temperature ?? null,
        hum_status:  detail.humidity ?? null,
        co2_status:  detail.co2 ?? null,
        uptime:      d.uptime ?? null,
        room,
      });
      console.log(`[MQTT Data Diterima [${room}] ID ${info.lastInsertRowid}]: Temp: ${d.temperature}°C, Hum: ${d.humidity}%, CO2: ${d.co2}ppm`);
    } catch (e) {
      console.error('Parse/insert error:', e.message);
    }
  });
}

// ---------- REST API ----------
const app = express();

// Middleware CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// Status & Health Check
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    mqtt: {
      broker: MQTT_URL,
      topic: MQTT_TOPIC,
      connected: client.connected,
    },
    timestamp: new Date().toISOString()
  });
});

function buildRangeCondition(range) {
  if (range === '1d' || range === '24h') {
    return "recorded_at >= datetime('now', '-1 day')";
  }
  if (range === '3d') {
    return "recorded_at >= datetime('now', '-3 days')";
  }
  if (range === '7d') {
    return "recorded_at >= datetime('now', '-7 days')";
  }
  if (range === '30d' || range === '1m' || range === '1month') {
    return "recorded_at >= datetime('now', '-30 days')";
  }
  return null;
}

const INTERVAL_SECONDS = {
  '1m': 60,
  '15m': 900,
  '30m': 1800,
};

// Ambil riwayat pembacaan berdasarkan ruangan, rentang waktu (1d, 7d, 30d),
// & interval agregasi grafik (1m, 15m, 30m, atau raw)
app.get('/readings', (req, res) => {
  try {
    const room = (req.query.room || 'h5').toLowerCase();
    const range = (req.query.range || '').toLowerCase();
    const interval = (req.query.interval || 'raw').toLowerCase();
    const order = (req.query.order || 'asc').toLowerCase();
    const afterId = parseInt(req.query.afterId, 10) || 0;

    const bucketSec = INTERVAL_SECONDS[interval] || 0;
    const defaultLimit = bucketSec > 0 ? 45000 : 2000;
    const maxLimit = bucketSec > 0 ? 50000 : 10000;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || defaultLimit, 1), maxLimit);

    const conditions = ['1=1'];
    const params = [];

    if (room && room !== 'all') {
      conditions.push('room = ?');
      params.push(room);
    }

    const rangeCond = buildRangeCondition(range);
    if (rangeCond) {
      conditions.push(rangeCond);
    }

    // 1. Query inkremental (hanya data terbaru setelah afterId, khusus raw)
    if (afterId > 0 && bucketSec === 0) {
      conditions.push('id > ?');
      params.push(afterId);
      const sql = `
        SELECT * FROM readings
        WHERE ${conditions.join(' AND ')}
        ORDER BY recorded_at ASC, id ASC
        LIMIT ?
      `;
      const rows = db.prepare(sql).all(...params, limit);
      return res.json(rows);
    }

    // 2. Query agregasi untuk grafik (Per 1 Menit / 15 Menit / 30 Menit)
    if (bucketSec > 0) {
      conditions.push('recorded_at IS NOT NULL');
      conditions.push("strftime('%s', recorded_at) IS NOT NULL");

      const bucketExpr = `(CAST(strftime('%s', recorded_at) AS INTEGER) / ${bucketSec}) * ${bucketSec}`;
      const roomSelect = room && room !== 'all' ? 'MAX(room) AS room' : "'all' AS room";
      const sql = `
        SELECT
          MAX(id) AS id,
          ${roomSelect},
          datetime(${bucketExpr}, 'unixepoch') AS recorded_at,
          ROUND(AVG(temperature), 2) AS temperature,
          ROUND(AVG(humidity), 2) AS humidity,
          ROUND(AVG(wind_speed), 2) AS wind_speed,
          CAST(ROUND(AVG(co2)) AS INTEGER) AS co2,
          CAST(ROUND(AVG(tvoc)) AS INTEGER) AS tvoc,
          ROUND(AVG(fan_rpm), 1) AS fan_rpm,
          COUNT(*) AS sample_count
        FROM readings
        WHERE ${conditions.join(' AND ')}
        GROUP BY ${bucketExpr}
        ORDER BY ${bucketExpr} DESC
        LIMIT ?
      `;

      const rows = db.prepare(sql).all(...params, limit);
      return res.json(order === 'desc' ? rows : rows.reverse());
    }

    // 3. Query raw: selalu ambil data PALING BARU terlebih dahulu agar tidak terpotong di data lama
    const sql = `
      SELECT * FROM readings
      WHERE ${conditions.join(' AND ')}
      ORDER BY recorded_at DESC, id DESC
      LIMIT ?
    `;
    const rows = db.prepare(sql).all(...params, limit);
    res.json(order === 'desc' ? rows : rows.reverse());
  } catch (err) {
    console.error('Error GET /readings:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Ambil Log Riwayat Data terurut (terbaru -> terlama) dengan paginasi & pencarian server-side
app.get('/readings/logs', (req, res) => {
  try {
    const room = (req.query.room || 'h5').toLowerCase();
    const range = (req.query.range || '').toLowerCase();
    const search = (req.query.search || '').trim();
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || req.query.limit, 10) || 50, 1), 200);

    const baseConditions = ['1=1'];
    const baseParams = [];

    if (room && room !== 'all') {
      baseConditions.push('room = ?');
      baseParams.push(room);
    }

    const rangeCond = buildRangeCondition(range);
    if (rangeCond) {
      baseConditions.push(rangeCond);
    }

    const baseWhere = baseConditions.join(' AND ');
    const totalAllRow = db.prepare(`SELECT COUNT(*) AS count FROM readings WHERE ${baseWhere}`).get(...baseParams);
    const totalAll = totalAllRow ? totalAllRow.count : 0;

    const filteredConditions = [...baseConditions];
    const filteredParams = [...baseParams];

    if (search) {
      const like = `%${search}%`;
      const likeNoHash = `%${search.startsWith('#') ? search.slice(1).trim() : search}%`;
      const likeColon = `%${search.replace(/\./g, ':')}%`;
      filteredConditions.push(`(
        CAST(id AS TEXT) LIKE ?
        OR ('#' || CAST(id AS TEXT)) LIKE ?
        OR COALESCE(room, '') LIKE ?
        OR COALESCE(recorded_at, '') LIKE ?
        OR COALESCE(datetime(recorded_at, '+7 hours'), '') LIKE ?
        OR COALESCE(CAST(temperature AS TEXT), '') LIKE ?
        OR COALESCE(CAST(humidity AS TEXT), '') LIKE ?
        OR COALESCE(CAST(wind_speed AS TEXT), '') LIKE ?
        OR COALESCE(CAST(co2 AS TEXT), '') LIKE ?
        OR COALESCE(relay_state, '') LIKE ?
        OR COALESCE(air_quality, '') LIKE ?
      )`);
      filteredParams.push(likeNoHash, like, like, likeColon, likeColon, like, like, like, like, like, like);
    }

    const filteredWhere = filteredConditions.join(' AND ');
    const totalRow = db.prepare(`SELECT COUNT(*) AS count FROM readings WHERE ${filteredWhere}`).get(...filteredParams);
    const total = totalRow ? totalRow.count : 0;
    const totalPages = Math.max(Math.ceil(total / pageSize), 1);
    const safePage = Math.min(page, totalPages);
    const safeOffset = (safePage - 1) * pageSize;

    const rows = db.prepare(`
      SELECT * FROM readings
      WHERE ${filteredWhere}
      ORDER BY recorded_at DESC, id DESC
      LIMIT ? OFFSET ?
    `).all(...filteredParams, pageSize, safeOffset);

    res.json({
      rows,
      total,
      totalAll,
      page: safePage,
      pageSize,
      totalPages,
    });
  } catch (err) {
    console.error('Error GET /readings/logs:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Ambil pembacaan paling akhir per ruangan
app.get('/latest', (req, res) => {
  const room = (req.query.room || 'h5').toLowerCase();
  let query = 'SELECT * FROM readings';
  const params = [];

  if (room !== 'all') {
    query += ' WHERE room = ?';
    params.push(room);
  }

  query += ' ORDER BY recorded_at DESC, id DESC LIMIT 1';
  const row = db.prepare(query).get(...params);
  res.json(row || {});
});

// ---------- CRUD ENDPOINTS UNTUK HALAMAN /admin ----------

// Helper parse angka aman (hindari NaN dari string kosong/tidak valid)
function parseFloatOrNull(val) {
  if (val === null || val === undefined || val === '') return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function parseIntOrDefault(val, fallback = 0) {
  if (val === null || val === undefined || val === '') return fallback;
  const n = parseInt(val, 10);
  return Number.isFinite(n) ? n : fallback;
}

// 1. Tambah Data Baru (CREATE)
app.post('/readings', (req, res) => {
  try {
    const d = req.body || {};
    const room = (d.room || 'lab_td').toLowerCase();
    const temp = parseFloatOrNull(d.temperature);
    const hum = parseFloatOrNull(d.humidity);
    const wind = parseFloatOrNull(d.wind_speed);
    const fan = parseIntOrDefault(d.fan_rpm, 0);
    const relay = d.relay_state ? String(d.relay_state).toUpperCase() : (temp !== null && temp > 29 ? 'ON' : 'OFF');
    const airQuality = d.air_quality || (temp !== null && temp > 32 ? 'Buruk' : temp !== null && temp > 29 ? 'Sedang' : 'Baik');

    const stmt = db.prepare(`
      INSERT INTO readings (room, temperature, humidity, wind_speed, fan_rpm, relay_state, air_quality, temp_status, hum_status, uptime)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      room,
      temp,
      hum,
      wind,
      fan,
      relay,
      airQuality,
      temp !== null && temp > 30 ? 'Sedang' : 'Baik',
      hum !== null && hum > 70 ? 'Sedang' : 'Baik',
      parseIntOrDefault(d.uptime, 3600)
    );

    res.status(201).json({
      success: true,
      id: info.lastInsertRowid,
      message: 'Data sensor berhasil ditambahkan'
    });
  } catch (err) {
    console.error('Error POST /readings:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Edit Data Eksisting (UPDATE)
app.put('/readings/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ success: false, error: 'ID tidak valid' });

    const d = req.body || {};
    const room = (d.room || 'lab_td').toLowerCase();
    const temp = parseFloatOrNull(d.temperature);
    const hum = parseFloatOrNull(d.humidity);
    const wind = parseFloatOrNull(d.wind_speed);
    const fan = parseIntOrDefault(d.fan_rpm, 0);
    const relay = d.relay_state ? String(d.relay_state).toUpperCase() : 'OFF';
    const airQuality = d.air_quality || (temp !== null && temp > 32 ? 'Buruk' : temp !== null && temp > 29 ? 'Sedang' : 'Baik');

    const stmt = db.prepare(`
      UPDATE readings
      SET room = ?, temperature = ?, humidity = ?, wind_speed = ?, fan_rpm = ?, relay_state = ?, air_quality = ?
      WHERE id = ?
    `);

    const result = stmt.run(room, temp, hum, wind, fan, relay, airQuality, id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Data dengan ID tersebut tidak ditemukan' });
    }

    res.json({
      success: true,
      message: `Data ID #${id} berhasil diperbarui`
    });
  } catch (err) {
    console.error('Error PUT /readings/:id:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Hapus Data (DELETE)
app.delete('/readings/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: 'ID tidak valid' });

    const stmt = db.prepare('DELETE FROM readings WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Data tidak ditemukan' });
    }

    res.json({
      success: true,
      message: `Data ID #${id} berhasil dihapus`
    });
  } catch (err) {
    console.error('Error DELETE /readings/:id:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint unduh CSV langsung dari database SQLite per ruangan dan rentang waktu
app.get('/download', (req, res) => {
  const room = (req.query.room || 'lab_td').toLowerCase();
  const range = (req.query.range || 'all').toLowerCase();

  let query = 'SELECT * FROM readings WHERE 1=1';
  const params = [];

  if (room !== 'all') {
    query += ' AND room = ?';
    params.push(room);
  }

  const rangeCond = buildRangeCondition(range);
  if (rangeCond) {
    query += ` AND ${rangeCond}`;
  }

  query += ' ORDER BY recorded_at ASC, id ASC';
  const rows = db.prepare(query).all(...params);

  const headers = ['ID', 'Ruangan', 'Waktu_Rekam', 'Suhu_C', 'Kelembapan_Persen', 'Angin_ms', 'Status_Kipas', 'Kualitas_Udara'];
  const csvLines = [headers.join(',')];

  for (const r of rows) {
    csvLines.push([
      r.id,
      r.room || 'lab_td',
      `"${r.recorded_at}"`,
      r.temperature ?? '',
      r.humidity ?? '',
      r.wind_speed ?? '',
      r.relay_state ?? '',
      `"${r.air_quality ?? ''}"`
    ].join(','));
  }

  const csvContent = csvLines.join('\r\n');
  const filename = `data_sensor_${room}_${range || 'semua'}_${new Date().toISOString().slice(0, 10)}.csv`;

  res.header('Content-Type', 'text/csv');
  res.header('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csvContent);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[API] Server berjalan pada http://localhost:${PORT}`);
});
