import React from 'react';
import { Gauge, Sparkles, AlertOctagon, ShieldCheck } from 'lucide-react';
import MetricCard from './MetricCard';
import SensorChart from './SensorChart';
import TimeRangeSelector from './TimeRangeSelector';

export default function AirQualityTab({
  latest,
  history,
  timeRange,
  onSelectTimeRange,
  onDownload,
  roomName,
}) {
  const co2 = latest?.co2 ?? null;
  const tvoc = latest?.tvoc ?? null;

  const getCO2HealthImpact = () => {
    if (!co2) return {
      title: 'Menunggu Data Sensor',
      desc: 'Menghubungkan ke sensor SGP30...',
      color: 'text-slate-700',
      bg: 'bg-slate-50 border-slate-200',
    };
    if (co2 < 700) {
      return {
        title: `Kondisi Udara Sangat Sehat di ${roomName}`,
        desc: 'Konsentrasi CO₂ rendah, sirkulasi oksigen baik. Sangat kondusif untuk konsentrasi belajar dan pernapasan.',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50 border-emerald-200',
      };
    }
    if (co2 <= 800) {
      return {
        title: `Kondisi Waspada di ${roomName} (Mulai Pengap)`,
        desc: 'Kadar CO₂ mulai meningkat karena sirkulasi udara tertutup. Dapat memicu rasa kantuk ringan.',
        color: 'text-amber-700',
        bg: 'bg-amber-50 border-amber-200',
      };
    }
    return {
      title: `Kondisi Buruk / Bahaya Kualitas Udara di ${roomName}`,
      desc: 'Konsentrasi CO₂ melewati ambang batas toleransi (> 800 ppm). Sistem otomatis menyalakan relay kipas sirkulasi.',
      color: 'text-rose-700',
      bg: 'bg-rose-50 border-rose-200',
    };
  };

  const impact = getCO2HealthImpact();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-[#0f2942] flex items-center gap-2">
            <Gauge className="h-5 w-5 text-emerald-600" />
            <span>Kualitas Gas dan Karbondioksida {roomName}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Mendeteksi gas Karbondioksida (CO₂) dan Senyawa Organik Mudah Menguap (TVOC).
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
          <Sparkles className="h-4 w-4 text-emerald-600" />
          <span className="text-slate-700 font-medium">Sensor: Sensirion SGP30 MOx</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Kadar Gas CO₂"
          value={co2}
          unit="PPM"
          icon={Gauge}
          status={latest?.co2_status || (co2 ? (co2 < 700 ? 'Baik' : co2 <= 800 ? 'Sedang' : 'Buruk') : 'Normal')}
          subtitle="Batas sehat: < 700 ppm"
        />

        <MetricCard
          title="TVOC (Volatile Compounds)"
          value={tvoc}
          unit="PPB"
          icon={Sparkles}
          status={tvoc !== null ? (tvoc < 50 ? 'Baik' : 'Sedang') : 'Normal'}
          subtitle="Batas aman: < 50 ppb"
        />

        <MetricCard
          title="Kategori Kualitas Udara"
          value={latest?.air_quality || '--'}
          status={latest?.air_quality === 'Baik' || latest?.air_quality === 'Sangat Baik' ? 'Baik' : 'Sedang'}
          subtitle="Status Gabungan Sensor"
        />
      </div>

      {/* Health Impact Assessment */}
      <div className={`rounded-2xl border p-5 flex items-start gap-4 ${impact.bg}`}>
        <div className={`p-3 rounded-xl bg-white border border-slate-200 shadow-xs ${impact.color}`}>
          {co2 > 800 ? <AlertOctagon className="h-6 w-6 text-rose-600" /> : <ShieldCheck className="h-6 w-6 text-emerald-600" />}
        </div>
        <div>
          <div className={`text-sm font-bold ${impact.color}`}>{impact.title}</div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{impact.desc}</p>
        </div>
      </div>

      {/* Time Range Filter Bar with Room Download */}
      <TimeRangeSelector
        timeRange={timeRange}
        onSelectTimeRange={onSelectTimeRange}
        onDownload={onDownload}
        roomName={roomName}
      />

      {/* CO2 Chart */}
      <SensorChart
        title={`Grafik Trend Konsentrasi CO₂ (PPM) (${roomName})`}
        data={history}
        dataKey="co2"
        label="Kadar CO₂"
        color="#059669"
        unit="ppm"
        timeRange={timeRange}
      />
    </div>
  );
}
