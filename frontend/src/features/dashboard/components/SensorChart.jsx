import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { parseUtcTimestamp } from '../../../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const INTERVAL_LABELS = {
  '1m': 'Per 1 Menit',
  '15m': 'Per 15 Menit',
  '30m': 'Per 30 Menit',
};

export default function SensorChart({
  title,
  data = [],
  dataKey,
  label,
  color = '#059669',
  unit = '',
  timeRange = '7d',
  chartInterval = '1m',
}) {
  const { labels, fullTimestamps, values, totalSamples, latestValue } = useMemo(() => {
    const lbls = [];
    const fullTs = [];
    const vals = [];
    let samplesSum = 0;
    let lastValid = null;

    for (const d of data) {
      const date = parseUtcTimestamp(d.recorded_at);
      if (!date || Number.isNaN(date.getTime())) {
        lbls.push('');
        fullTs.push('--');
      } else {
        const hhmm = date.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).replace('.', ':');

        if (timeRange === '1d' || timeRange === '3d') {
          const dd = String(date.getDate()).padStart(2, '0');
          const mm = String(date.getMonth() + 1).padStart(2, '0');
          lbls.push(`${dd}/${mm} ${hhmm}`);
        } else {
          const shortDate = date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
          });
          lbls.push(`${shortDate} ${hhmm}`);
        }

        fullTs.push(
          date.toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }).replace(/\./g, ':')
        );
      }

      const v = d[dataKey] ?? null;
      vals.push(v);
      if (v !== null && v !== undefined) {
        lastValid = v;
      }
      samplesSum += Number(d.sample_count || 1);
    }

    return {
      labels: lbls,
      fullTimestamps: fullTs,
      values: vals,
      totalSamples: samplesSum,
      latestValue: lastValid,
    };
  }, [data, dataKey, timeRange]);

  const intervalText = INTERVAL_LABELS[chartInterval] || 'Per 1 Menit';

  const chartData = {
    labels,
    datasets: [
      {
        label: `${label} (${unit})`,
        data: values,
        borderColor: color,
        backgroundColor: `${color}18`,
        fill: true,
        tension: data.length > 5000 ? 0 : 0.3,
        spanGaps: true,
        borderWidth: 2,
        pointRadius: data.length > 80 ? 0 : 2.5,
        pointHoverRadius: 5,
        pointBackgroundColor: color,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: data.length > 5000 ? 0 : 250 },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#0f172a',
        bodyColor: '#334155',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        displayColors: false,
        callbacks: {
          title: (items) => {
            const idx = items?.[0]?.dataIndex;
            if (idx == null) return '';
            return fullTimestamps[idx] || labels[idx];
          },
          label: (context) => {
            const val = context.parsed.y;
            return `${label}: ${val !== null && val !== undefined ? val : '--'} ${unit}`;
          },
          afterLabel: (context) => {
            const row = data[context.dataIndex];
            if (row && row.sample_count > 1) {
              return `Rata-rata dari ${row.sample_count} rekaman (${intervalText})`;
            }
            return `Interval: ${intervalText}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(241, 245, 249, 1)',
        },
        ticks: {
          color: '#64748b',
          maxRotation: 0,
          autoSkip: true,
          autoSkipPadding: 20,
          font: { size: 10 },
          maxTicksLimit: timeRange === '30d' ? 7 : timeRange === '1d' ? 8 : 6,
        },
      },
      y: {
        grid: {
          color: 'rgba(241, 245, 249, 1)',
        },
        ticks: {
          color: '#64748b',
          font: { size: 10 },
        },
      },
    },
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div>
          <h3 className="text-sm font-bold text-[#0f2942]">{title}</h3>
          <p className="text-[11px] text-slate-400">
            {intervalText} • {data.length.toLocaleString('id-ID')} titik grafik
            {totalSamples > data.length
              ? ` (rata-rata dari ${totalSamples.toLocaleString('id-ID')} rekaman database)`
              : ' tercatat di database backend'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-xs font-mono font-bold" style={{ color }}>
            {latestValue !== null ? `${latestValue} ${unit}` : '--'}
          </span>
        </div>
      </div>
      <div className="h-60 sm:h-72 w-full">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            Tidak ada rekaman data pada rentang waktu ini.
          </div>
        ) : (
          <Line data={chartData} options={options} />
        )}
      </div>
    </div>
  );
}
