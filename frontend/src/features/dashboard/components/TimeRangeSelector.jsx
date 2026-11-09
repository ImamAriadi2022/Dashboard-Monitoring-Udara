import React from 'react';
import { Calendar, Clock, Download } from 'lucide-react';

export default function TimeRangeSelector({
  timeRange,
  onSelectTimeRange,
  chartInterval = '1m',
  onSelectChartInterval,
  showIntervalSelector = true,
  onDownload,
  roomName = 'Ruangan',
}) {
  const ranges = [
    { id: '3d', label: '3 Hari Terakhir' },
    { id: '7d', label: '7 Hari Terakhir' },
    { id: '30d', label: '1 Bulan Terakhir' },
  ];

  const intervals = [
    { id: '1m', label: 'Per 1 Menit' },
    { id: '15m', label: 'Per 15 Menit' },
    { id: '30m', label: 'Per 30 Menit' },
  ];

  return (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
      <div className="flex flex-wrap items-center gap-3">
        {/* Time Range Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <Calendar className="h-4 w-4" />
          </div>
          <span className="text-xs font-bold text-slate-700">Rentang Waktu:</span>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {ranges.map((r) => (
              <button
                key={r.id}
                onClick={() => onSelectTimeRange(r.id)}
                className={`rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  timeRange === r.id
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Aggregation Interval Buttons (Per 1 Menit, 15 Menit, 30 Menit) */}
        {showIntervalSelector && onSelectChartInterval && (
          <div className="flex flex-wrap items-center gap-2 xl:border-l xl:border-slate-200 xl:pl-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
              <Clock className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-slate-700">Pembacaan Grafik:</span>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {intervals.map((iv) => (
                <button
                  key={iv.id}
                  onClick={() => onSelectChartInterval(iv.id)}
                  className={`rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    chartInterval === iv.id
                      ? 'bg-[#0f2942] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {iv.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Direct Room Download Button */}
      <button
        onClick={onDownload}
        className="flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50/80 px-4 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 hover:border-emerald-400 transition-all shadow-2xs cursor-pointer shrink-0"
        title={`Unduh file CSV data riwayat asli dari database backend untuk ${roomName}`}
      >
        <Download className="h-3.5 w-3.5 text-emerald-700" />
        <span>Unduh Data {roomName} (.CSV)</span>
      </button>
    </div>
  );
}
