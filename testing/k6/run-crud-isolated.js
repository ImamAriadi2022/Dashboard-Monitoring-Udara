const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '../..');
const srcDb = path.join(repoRoot, 'backend/air_data.db');
const tmpDb = path.join(os.tmpdir(), `archtera_k6_crud_${Date.now()}.db`);
const summaryOut = path.join(__dirname, 'reports/crud-summary.json');
const k6Script = path.join(__dirname, 'crud-isolated.js');
const PORT = 3318;

fs.mkdirSync(path.dirname(summaryOut), { recursive: true });
if (fs.existsSync(srcDb)) {
  fs.copyFileSync(srcDb, tmpDb);
}

async function waitForHealth(url) {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch (_) {
      // tunggu server menyala
    }
    await new Promise((res) => setTimeout(res, 150));
  }
  throw new Error('Backend lokal terisolasi gagal menyala.');
}

async function main() {
  const srv = spawn('node', [path.join(repoRoot, 'backend/bridge.js')], {
    env: {
      ...process.env,
      PORT: String(PORT),
      DB_PATH: tmpDb,
      DISABLE_MQTT: '1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  try {
    await waitForHealth(`http://127.0.0.1:${PORT}/status`);
    console.log(`[CRUD Uji Terisolasi] Server lokal aktif di port ${PORT}. Menjalankan k6...`);

    const k6Res = spawnSync(
      'k6',
      ['run', '--summary-export', summaryOut, '-e', `BASE_URL=http://127.0.0.1:${PORT}`, k6Script],
      { stdio: 'inherit' }
    );

    if (k6Res.status !== 0) {
      process.exitCode = k6Res.status || 1;
    }
  } finally {
    srv.kill('SIGTERM');
    setTimeout(() => {
      for (const suffix of ['', '-wal', '-shm']) {
        try {
          if (fs.existsSync(tmpDb + suffix)) fs.unlinkSync(tmpDb + suffix);
        } catch (_) {}
      }
    }, 300);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
