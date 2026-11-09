// Dynamic API Base URL:
// 1. If VITE_API_URL env var is provided, use it.
// 2. In local Vite development (port 5173), uses http://localhost:3000.
// 3. In production with SSL / Nginx, uses relative path '/api' so both frontend
//    and backend are served securely over HTTPS without Mixed-Content errors.
const API_BASE = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined' && window.location.port === '5173'
    ? 'http://localhost:3000'
    : '/api'
);

export function parseUtcTimestamp(timestamp) {
  if (!timestamp) return null;
  const str = String(timestamp).trim();
  if (!str) return null;
  if (str.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(str)) {
    return new Date(str);
  }
  return new Date(str.replace(' ', 'T') + 'Z');
}

export async function fetchLatest(room = 'h5') {
  const res = await fetch(`${API_BASE}/latest?room=${encodeURIComponent(room)}`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function fetchReadings({
  room = 'h5',
  range = '7d',
  interval = 'raw',
  limit,
  afterId,
  order,
} = {}) {
  const query = new URLSearchParams();
  if (room) query.append('room', room);
  if (range) query.append('range', range);
  if (interval) query.append('interval', interval);
  if (limit) query.append('limit', limit);
  if (afterId) query.append('afterId', afterId);
  if (order) query.append('order', order);

  const res = await fetch(`${API_BASE}/readings?${query.toString()}`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function fetchReadingLogs({
  room = 'h5',
  range = '7d',
  search = '',
  page = 1,
  pageSize = 50,
} = {}) {
  const query = new URLSearchParams();
  if (room) query.append('room', room);
  if (range) query.append('range', range);
  if (search) query.append('search', search);
  if (page) query.append('page', page);
  if (pageSize) query.append('pageSize', pageSize);

  const res = await fetch(`${API_BASE}/readings/logs?${query.toString()}`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export async function fetchStatus() {
  const res = await fetch(`${API_BASE}/status`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

export function getDownloadUrl(room = 'h5', range = '30d') {
  return `${API_BASE}/download?room=${encodeURIComponent(room)}&range=${encodeURIComponent(range)}`;
}

// ---------- CRUD APIs untuk Halaman /admin ----------

export async function createReading(data) {
  const res = await fetch(`${API_BASE}/readings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP error ${res.status}`);
  }
  return await res.json();
}

export async function updateReading(id, data) {
  const res = await fetch(`${API_BASE}/readings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP error ${res.status}`);
  }
  return await res.json();
}

export async function deleteReading(id) {
  const res = await fetch(`${API_BASE}/readings/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP error ${res.status}`);
  }
  return await res.json();
}
