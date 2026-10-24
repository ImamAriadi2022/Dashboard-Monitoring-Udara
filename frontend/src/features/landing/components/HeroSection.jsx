import React from 'react';
import {
  Leaf,
  ShieldCheck,
  MapPin,
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
} from 'lucide-react';

export default function HeroSection({ onOpenDashboard, latest }) {
  // Derive AQI or score based on sensor reading
  const co2 = latest?.co2 ?? 480;
  const temp = latest?.temperature ?? 26.8;
  const humid = latest?.humidity ?? 58;
  const wind = latest?.wind_speed ?? 1.2;
  const tvoc = latest?.tvoc ?? 14;

  const aqiScore = Math.min(Math.round((co2 / 1000) * 80), 100) || 42;

  return (
    <section id="beranda" className="relative overflow-hidden bg-gradient-to-b from-[#e3f2fd]/70 via-[#f0f9ff]/50 to-[#f8fafc] pt-10 pb-16 border-b border-slate-200/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Top Hero Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Headlines & Call To Action */}
          <div className="lg:col-span-7 space-y-5">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-emerald-700">
              Udara Bersih, Hidup Lebih Sehat
            </span>

            <h1 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold text-[#0f2942] tracking-tight leading-tight">
              Pantau Kualitas Udara <br className="hidden sm:inline" />
              di Sekitarmu
            </h1>

            <p className="text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed">
              Dapatkan informasi kualitas udara dan kelancaran sirkulasi secara real-time untuk menjaga kenyamanan dan kesehatan lingkungan ruangan.
            </p>

            {/* Prominent Call to Action Button */}
            <div className="pt-2">
              <button
                onClick={onOpenDashboard}
                className="inline-flex items-center gap-3 rounded-full bg-emerald-600 px-7 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-700 hover:scale-[1.02] transition-all cursor-pointer"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Buka Dashboard Telemetri</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* Badges Row */}
            <div className="pt-4 flex flex-wrap items-center gap-4 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-1.5">
                <Leaf className="h-4 w-4 text-emerald-600" />
                <span>Data Real-Time</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Akurat & Terpercaya</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <span>Sensor DHT22 & SGP30</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Floating Widget */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-[0_4px_20px_rgba(15,41,66,0.06)]">
              
              {/* Card Location Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#0f2942]">Stasiun Ruang H5</h3>
                    <p className="text-[11px] text-slate-400">Node IoT Pemantauan Aktif</p>
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  <div className="font-semibold text-slate-700">Real-Time Live</div>
                  <div>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
              </div>

              {/* AQI Score & Status Circle */}
              <div className="py-5 flex items-center gap-6">
                {/* Circular Gauge */}
                <div className="relative flex h-24 w-24 flex-shrink-0 flex-col items-center justify-center rounded-full border-4 border-emerald-500 bg-emerald-50/40">
                  <span className="text-3xl font-extrabold text-[#0f2942] leading-none">{aqiScore}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">AQI Index</span>
                </div>

                {/* Status text */}
                <div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 fill-emerald-100" />
                    <span className="text-lg font-bold text-emerald-700">
                      {latest?.air_quality || 'Baik'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Kualitas udara masih baik dan aman untuk aktivitas belajar & kerja.
                  </p>
                </div>
              </div>

              {/* 5 Pollutants / Sensor Metrics Columns */}
              <div className="grid grid-cols-5 gap-2 pt-4 border-t border-slate-100 text-center">
                <div className="rounded-lg bg-slate-50 p-2">
                  <div className="text-[10px] text-slate-400 font-semibold">Suhu</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">{temp}°C</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-2">
                  <div className="text-[10px] text-slate-400 font-semibold">Lembap</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">{humid}%</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-2">
                  <div className="text-[10px] text-slate-400 font-semibold">CO₂</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">{co2}</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-2">
                  <div className="text-[10px] text-slate-400 font-semibold">TVOC</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">{tvoc}</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-2">
                  <div className="text-[10px] text-slate-400 font-semibold">Angin</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">{wind}m/s</div>
                </div>
              </div>

              {/* Quick Link to Dashboard */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Buka visualisasi mendalam</span>
                <button
                  onClick={onOpenDashboard}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  <span>Lihat Detail Dashboard</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
