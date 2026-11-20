import http from 'k6/http';
import { check, sleep } from 'k6';

// Dijalankan terhadap backend lokal dengan database SQLite terisolasi (mis. http://127.0.0.1:3318)
// agar pengujian WRITE (POST/PUT/DELETE) tidak mengotori database produksi VPS.
const BASE_URL = (__ENV.BASE_URL || 'http://127.0.0.1:3318').replace(/\/+$/, '');
const ROOMS = ['h5', 'lab_td', 'lab_kom', 'seminar'];

export const options = {
  summaryTrendStats: ['min', 'avg', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
  scenarios: {
    crud_lifecycle: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '5s', target: 5 },
        { duration: '15s', target: 10 },
        { duration: '5s', target: 0 },
      ],
      gracefulRampDown: '5s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
    'http_req_duration{endpoint:post_readings}': ['p(95)<150'],
    'http_req_duration{endpoint:put_readings}': ['p(95)<150'],
    'http_req_duration{endpoint:delete_readings}': ['p(95)<150'],
  },
};

export default function () {
  const room = ROOMS[(__VU + __ITER) % ROOMS.length];
  const headers = { 'Content-Type': 'application/json' };

  // 1. CREATE (POST /readings)
  const createPayload = JSON.stringify({
    room,
    temperature: 26.8,
    humidity: 57.5,
    wind_speed: 1.3,
    fan_rpm: 1100,
    relay_state: 'ON',
    air_quality: 'Baik',
  });
  const resPost = http.post(`${BASE_URL}/readings`, createPayload, {
    headers,
    tags: { endpoint: 'post_readings' },
  });
  const okPost = check(resPost, {
    'POST /readings 201': (r) => r.status === 201 && r.json('success') === true,
  });

  if (!okPost) {
    sleep(0.2);
    return;
  }

  const createdId = resPost.json('id');

  // 2. UPDATE (PUT /readings/:id)
  const updatePayload = JSON.stringify({
    room,
    temperature: 27.4,
    humidity: 58.2,
    wind_speed: 1.6,
    fan_rpm: 1250,
    relay_state: 'ON',
    air_quality: 'Baik',
  });
  const resPut = http.put(`${BASE_URL}/readings/${createdId}`, updatePayload, {
    headers,
    tags: { endpoint: 'put_readings' },
  });
  check(resPut, {
    'PUT /readings/:id 200': (r) => r.status === 200 && r.json('success') === true,
  });

  // 3. DELETE (DELETE /readings/:id) -> langsung bersihkan baris uji
  const resDel = http.del(`${BASE_URL}/readings/${createdId}`, null, {
    tags: { endpoint: 'delete_readings' },
  });
  check(resDel, {
    'DELETE /readings/:id 200': (r) => r.status === 200 && r.json('success') === true,
  });

  sleep(0.2);
}
