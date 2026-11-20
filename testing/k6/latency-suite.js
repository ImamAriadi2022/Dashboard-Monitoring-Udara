import http from 'k6/http';
import { check, group, sleep } from 'k6';

const BASE_URL = (__ENV.BASE_URL || 'https://archtera.web.id/api').replace(/\/+$/, '');
const ROOMS = ['h5', 'lab_td', 'lab_kom', 'seminar'];

function pickRoom(index) {
  if (typeof index === 'number') {
    return ROOMS[index % ROOMS.length];
  }
  return ROOMS[Math.floor(Math.random() * ROOMS.length)];
}

export const options = {
  summaryTrendStats: ['min', 'avg', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
  scenarios: {
    // 1. Baseline & Smoke Verification (1 VU sepi beban, cek semua 4 ruangan + all)
    baseline_smoke: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 4,
      startTime: '0s',
      maxDuration: '30s',
      gracefulStop: '5s',
      exec: 'runBaselineSmoke',
    },
    // 2. Live Polling Dashboard (15 VU meniru tab Overview/Hero polling /latest tiap ~1.5s)
    live_polling: {
      executor: 'constant-vus',
      vus: 15,
      duration: '30s',
      startTime: '10s',
      gracefulStop: '5s',
      exec: 'runLivePolling',
    },
    // 3. Analytics & Logs Load (Ramp 0 -> 10 -> 25 VU ubah filter grafik 1d/7d/30d, log paginasi, & sample CSV)
    analytics_load: {
      executor: 'ramping-vus',
      startTime: '43s',
      startVUs: 0,
      stages: [
        { duration: '8s', target: 10 },
        { duration: '20s', target: 25 },
        { duration: '10s', target: 25 },
        { duration: '7s', target: 0 },
      ],
      gracefulRampDown: '5s',
      exec: 'runAnalyticsAndLogs',
    },
    // 4. Spike Resilience Test (Lonjakan mendadak 5 -> 40 VU lalu turun)
    spike_test: {
      executor: 'ramping-vus',
      startTime: '91s',
      startVUs: 5,
      stages: [
        { duration: '5s', target: 40 },
        { duration: '15s', target: 40 },
        { duration: '10s', target: 0 },
      ],
      gracefulRampDown: '5s',
      exec: 'runSpikeBurst',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],

    // Threshold & sub-metric terpisah per Endpoint
    'http_req_duration{endpoint:status}': ['p(95)<300'],
    'http_req_duration{endpoint:latest}': ['p(95)<350'],
    'http_req_duration{endpoint:readings_1d_1m}': ['p(95)<600'],
    'http_req_duration{endpoint:readings_7d_15m}': ['p(95)<600'],
    'http_req_duration{endpoint:readings_30d_30m}': ['p(95)<600'],
    'http_req_duration{endpoint:readings_logs}': ['p(95)<500'],
    'http_req_duration{endpoint:download_csv}': ['p(95)<1500'],

    // Threshold & sub-metric terpisah per Skenario Beban
    'http_req_duration{scenario:baseline_smoke}': ['p(95)<500'],
    'http_req_duration{scenario:live_polling}': ['p(95)<400'],
    'http_req_duration{scenario:analytics_load}': ['p(95)<700'],
    'http_req_duration{scenario:spike_test}': ['p(95)<1000'],

    // Server Processing / TTFB (waiting time) pada endpoint kritis
    'http_req_waiting{endpoint:latest}': ['p(95)<300'],
    'http_req_waiting{endpoint:readings_1d_1m}': ['p(95)<450'],
  },
};

export function runBaselineSmoke() {
  const room = pickRoom(__ITER);

  group('baseline_all_endpoints', () => {
    const rStatus = http.get(`${BASE_URL}/status`, { tags: { endpoint: 'status' } });
    check(rStatus, {
      'status 200 OK': (r) => r.status === 200,
      'status payload online': (r) => r.json('status') === 'online',
    });

    const rLatest = http.get(`${BASE_URL}/latest?room=${room}`, {
      tags: { endpoint: 'latest', room },
    });
    check(rLatest, {
      'latest 200 OK': (r) => r.status === 200,
      'latest is object': (r) => r.json() !== null && typeof r.json() === 'object',
    });

    const rChart1m = http.get(`${BASE_URL}/readings?room=${room}&range=1d&interval=1m`, {
      tags: { endpoint: 'readings_1d_1m', room },
    });
    check(rChart1m, {
      'readings 1d/1m 200 OK': (r) => r.status === 200,
      'readings 1d/1m array': (r) => Array.isArray(r.json()),
    });

    const rChart15m = http.get(`${BASE_URL}/readings?room=${room}&range=7d&interval=15m`, {
      tags: { endpoint: 'readings_7d_15m', room },
    });
    check(rChart15m, {
      'readings 7d/15m 200 OK': (r) => r.status === 200,
      'readings 7d/15m array': (r) => Array.isArray(r.json()),
    });

    const rChart30m = http.get(`${BASE_URL}/readings?room=${room}&range=30d&interval=30m`, {
      tags: { endpoint: 'readings_30d_30m', room },
    });
    check(rChart30m, {
      'readings 30d/30m 200 OK': (r) => r.status === 200,
      'readings 30d/30m array': (r) => Array.isArray(r.json()),
    });

    const rLogs = http.get(`${BASE_URL}/readings/logs?room=${room}&range=7d&page=1&pageSize=25`, {
      tags: { endpoint: 'readings_logs', room },
    });
    check(rLogs, {
      'logs 200 OK': (r) => r.status === 200,
      'logs has rows array': (r) => Array.isArray(r.json('rows')),
    });

    const rCsv = http.get(`${BASE_URL}/download?room=${room}&range=1d`, {
      tags: { endpoint: 'download_csv', room },
    });
    check(rCsv, {
      'csv 200 OK': (r) => r.status === 200,
      'csv content-type': (r) => String(r.headers['Content-Type'] || '').includes('text/csv'),
    });
  });

  sleep(0.3);
}

export function runLivePolling() {
  const room = pickRoom(__VU + __ITER);

  const rLatest = http.get(`${BASE_URL}/latest?room=${room}`, {
    tags: { endpoint: 'latest', room },
  });
  check(rLatest, {
    'live /latest 200 OK': (r) => r.status === 200,
  });

  // Setiap 6 iterasi sekali, simulasikan refresh bucket grafik 1 menit saat ada data baru
  if (__ITER % 6 === 0) {
    const rChart = http.get(`${BASE_URL}/readings?room=${room}&range=1d&interval=1m`, {
      tags: { endpoint: 'readings_1d_1m', room },
    });
    check(rChart, {
      'live refresh chart 200 OK': (r) => r.status === 200,
    });
  }

  sleep(1.0);
}

export function runAnalyticsAndLogs() {
  const room = pickRoom(__VU + __ITER);
  const step = __ITER % 4;

  if (step === 0) {
    const r = http.get(`${BASE_URL}/readings?room=${room}&range=1d&interval=1m`, {
      tags: { endpoint: 'readings_1d_1m', room },
    });
    check(r, { 'analytics 1d/1m 200 OK': (res) => res.status === 200 });
  } else if (step === 1) {
    const r = http.get(`${BASE_URL}/readings?room=${room}&range=7d&interval=15m`, {
      tags: { endpoint: 'readings_7d_15m', room },
    });
    check(r, { 'analytics 7d/15m 200 OK': (res) => res.status === 200 });
  } else if (step === 2) {
    const r = http.get(`${BASE_URL}/readings?room=${room}&range=30d&interval=30m`, {
      tags: { endpoint: 'readings_30d_30m', room },
    });
    check(r, { 'analytics 30d/30m 200 OK': (res) => res.status === 200 });
  } else {
    const page = (__ITER % 3) + 1;
    const r = http.get(`${BASE_URL}/readings/logs?room=${room}&range=7d&page=${page}&pageSize=50`, {
      tags: { endpoint: 'readings_logs', room },
    });
    check(r, { 'logs paginated 200 OK': (res) => res.status === 200 });
  }

  // Sampel berkala endpoint /status & /download agar persentil terukur tanpa membanjiri bandwidth
  if (__ITER % 10 === 0) {
    const rSt = http.get(`${BASE_URL}/status`, { tags: { endpoint: 'status' } });
    check(rSt, { 'status health 200 OK': (res) => res.status === 200 });
  }
  if (__VU % 5 === 1 && __ITER % 12 === 0) {
    const rDl = http.get(`${BASE_URL}/download?room=${room}&range=1d`, {
      tags: { endpoint: 'download_csv', room },
    });
    check(rDl, { 'download csv 200 OK': (res) => res.status === 200 });
  }

  sleep(0.8);
}

export function runSpikeBurst() {
  const room = pickRoom(__VU + __ITER);
  const mod = __ITER % 3;

  if (mod === 0) {
    const r = http.get(`${BASE_URL}/latest?room=${room}`, {
      tags: { endpoint: 'latest', room },
    });
    check(r, { 'spike /latest 200 OK': (res) => res.status === 200 });
  } else if (mod === 1) {
    const r = http.get(`${BASE_URL}/readings?room=${room}&range=7d&interval=15m`, {
      tags: { endpoint: 'readings_7d_15m', room },
    });
    check(r, { 'spike /readings 200 OK': (res) => res.status === 200 });
  } else {
    const r = http.get(`${BASE_URL}/readings/logs?room=${room}&range=7d&page=1&pageSize=25`, {
      tags: { endpoint: 'readings_logs', room },
    });
    check(r, { 'spike /logs 200 OK': (res) => res.status === 200 });
  }

  sleep(0.4);
}
