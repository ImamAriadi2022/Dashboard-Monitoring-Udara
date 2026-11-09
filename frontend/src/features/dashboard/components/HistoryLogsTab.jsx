import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  Download,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import TimeRangeSelector from './TimeRangeSelector';
import { fetchReadingLogs, parseUtcTimestamp } from '../../../services/api';

export default function HistoryLogsTab({
  roomId = 'h5',
  timeRange,
  onSelectTimeRange,
  onDownload,
  roomName,
  latestId,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pageSize, setPageSize] = useState(50);
  const [refreshTick, setRefreshTick] = useState(0);

  const filterKey = `${roomId}|${timeRange}|${debouncedSearch}|${pageSize}`;
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  const currentPage = pageState.key === filterKey ? pageState.page : 1;

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalAll, setTotalAll] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const prevQueryKeyRef = useRef(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch logs from SQLite backend; only show loading state when filter/page/manual-refresh changes
  useEffect(() => {
    const queryKey = `${filterKey}|${currentPage}|${refreshTick}`;
    const isFilterOrPageChange = prevQueryKeyRef.current !== queryKey;
    prevQueryKeyRef.current = queryKey;

    // If only latestId ticked while staying on page >= 2, skip auto-refresh to avoid disrupting paging
    if (!isFilterOrPageChange && currentPage !== 1) {
      return undefined;
    }

    let isCancelled = false;

    async function runFetch() {
      if (isFilterOrPageChange) {
        setLoading(true);
      }
      try {
        const res = await fetchReadingLogs({
          room: roomId,
          range: timeRange,
          search: debouncedSearch,
          page: currentPage,
          pageSize,
        });
        if (isCancelled) return;
        setRows(Array.isArray(res?.rows) ? res.rows : []);
        setTotal(res?.total ?? 0);
        setTotalAll(res?.totalAll ?? res?.total ?? 0);
        setTotalPages(Math.max(res?.totalPages ?? 1, 1));
        setError(null);
      } catch (err) {
        if (isCancelled) return;
        console.error('Gagal memuat log riwayat:', err);
        setError(err.message);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    runFetch();
    return () => {
      isCancelled = true;
    };
  }, [filterKey, roomId, timeRange, debouncedSearch, currentPage, pageSize, refreshTick, latestId]);

  const goToPage = (nextPage) => {
    const clamped = Math.min(Math.max(1, nextPage), totalPages);
    setPageState({ key: filterKey, page: clamped });
  };

  const formatTimestamp = (ts) => {
    const date = parseUtcTimestamp(ts);
    if (!date || Number.isNaN(date.getTime())) return '--';
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const displayPage = Math.min(currentPage, totalPages);
  const startRow = total === 0 ? 0 : (displayPage - 1) * pageSize + 1;
  const endRow = Math.min(displayPage * pageSize, total);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-[#0f2942] flex items-center gap-2">
            <Database className="h-5 w-5 text-purple-600" />
            <span>Log Riwayat Data Telemetri {roomName}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar lengkap rekaman pembacaan sensor langsung dari database SQLite (urut terbaru ke terlama).
          </p>
        </div>

        <button
          onClick={onDownload}
          disabled={totalAll === 0}
          className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-all shadow-2xs disabled:opacity-40 cursor-pointer"
        >
          <Download className="h-4 w-4 text-emerald-700" />
          <span>Unduh CSV {roomName}</span>
        </button>
      </div>

      {/* Time Range Filter Bar (without chart interval selector since log shows raw rows) */}
      <TimeRangeSelector
        timeRange={timeRange}
        onSelectTimeRange={onSelectTimeRange}
        showIntervalSelector={false}
        onDownload={onDownload}
        roomName={roomName}
      />

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari ID, nilai sensor, jam (09:59), status..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none transition-all shadow-2xs"
            />
          </div>

          <button
            onClick={() => setRefreshTick((t) => t + 1)}
            disabled={loading}
            title="Muat ulang data dari database"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span>Tampilkan:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value={25}>25 baris</option>
              <option value={50}>50 baris</option>
              <option value={100}>100 baris</option>
            </select>
          </div>
          <div>
            Total Data Database:{' '}
            <strong className="text-slate-800">{totalAll.toLocaleString('id-ID')}</strong> baris
            {debouncedSearch && (
              <span className="ml-1 text-emerald-700 font-semibold">
                ({total.toLocaleString('id-ID')} cocok)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Ruangan</th>
                <th className="py-3 px-4">Waktu Rekam</th>
                <th className="py-3 px-4">Suhu (°C)</th>
                <th className="py-3 px-4">Kelembapan (%)</th>
                <th className="py-3 px-4">Angin (m/s)</th>
                <th className="py-3 px-4">Relay Kipas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-400">
                    Memuat rekaman data dari database...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-rose-500">
                    Gagal memuat data log: {error}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-400">
                    Tidak ada rekaman data pada rentang waktu atau kata kunci pencarian ini.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400 font-medium">#{row.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700 uppercase font-mono">
                      {row.room || roomId}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {formatTimestamp(row.recorded_at)}
                    </td>
                    <td className="py-3 px-4 font-bold text-orange-700 font-mono">
                      {row.temperature != null ? `${row.temperature}°` : '--'}
                    </td>
                    <td className="py-3 px-4 font-bold text-purple-700 font-mono">
                      {row.humidity != null ? `${row.humidity}%` : '--'}
                    </td>
                    <td className="py-3 px-4 font-bold text-cyan-700 font-mono">
                      {row.wind_speed != null ? `${row.wind_speed}` : '--'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.relay_state === 'ON'
                            ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {row.relay_state || 'OFF'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-xs text-slate-600">
          <div>
            Menampilkan{' '}
            <strong className="text-slate-800">
              {startRow.toLocaleString('id-ID')}–{endRow.toLocaleString('id-ID')}
            </strong>{' '}
            dari <strong className="text-slate-800">{total.toLocaleString('id-ID')}</strong> data
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => goToPage(1)}
              disabled={displayPage <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Halaman Pertama (Terbaru)"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => goToPage(displayPage - 1)}
              disabled={displayPage <= 1}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Sebelumnya</span>
            </button>

            <span className="px-3 py-1 font-mono font-bold text-[#0f2942]">
              Hal {displayPage} / {totalPages}
            </span>

            <button
              onClick={() => goToPage(displayPage + 1)}
              disabled={displayPage >= totalPages}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Berikutnya</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => goToPage(totalPages)}
              disabled={displayPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Halaman Terakhir (Terlama)"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
