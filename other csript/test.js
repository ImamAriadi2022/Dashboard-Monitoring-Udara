// latensi-iot.js — jalankan: node latensi-iot.js
const mqtt = require('mqtt');

const BASE  = 'https://archtera.web.id/api';
const TOPIC = 'monitoring_udara_ta/data';
const ROOM  = 'uji_latensi';
const N = 30, POLL_MS = 50;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const client = mqtt.connect('mqtt://broker.emqx.io');

client.on('connect', async () => {
  const hasil = [];
  for (let i = 1; i <= N; i++) {
    const marker = 1000 + i;
    const payload = JSON.stringify({
      temperature: 25, humidity: 60, wind_speed: 1,
      co2: marker, tvoc: 10, fan_rpm: 0, relay_state: 'OFF',
      air_quality: 'Baik', air_quality_detail: {}, uptime: i,
    });

    const t0 = performance.now();
    client.publish(TOPIC, payload, { qos: 1 });

    let ketemu = false;
    while (performance.now() - t0 < 10000) {
      try {
        const r = await fetch(`${BASE}/latest`);
        const d = await r.json();
        if (d.co2 === marker) { ketemu = true; break; }
      } catch (e) { /* abaikan error sesaat */ }
      await sleep(POLL_MS);
    }
    const dt = performance.now() - t0;
    hasil.push(ketemu ? dt : null);
    console.log(`#${i} ${ketemu ? dt.toFixed(0) + ' ms' : 'HILANG/TIMEOUT'}`);
    await sleep(1000);
  }

  const ok = hasil.filter(x => x !== null).sort((a, b) => a - b);

  if (ok.length === 0) {
    console.log('Tidak ada paket yang berhasil');
    client.end();
    return;
  }

  const avg = ok.reduce((a, b) => a + b, 0) / ok.length;
  const p95 = ok[Math.max(0, Math.ceil(ok.length * 0.95) - 1)];
  console.log(`\nTerkirim: ${ok.length}/${N}  Avg: ${avg.toFixed(0)} ms  ` +
              `Min: ${ok[0].toFixed(0)}  Max: ${ok.at(-1).toFixed(0)}  ` +
              `P95: ${p95.toFixed(0)} ms`);

  // bersihkan data uji
  const rows = await (await fetch(`${BASE}/readings?room=${ROOM}&limit=2000`)).json();
  for (const row of rows) await fetch(`${BASE}/readings/${row.id}`, { method: 'DELETE' });
  console.log(`Data uji dihapus: ${rows.length} baris`);
  client.end();
});