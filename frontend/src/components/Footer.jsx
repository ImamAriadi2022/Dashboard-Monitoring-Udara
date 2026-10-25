import React from 'react';
import { Leaf, Server, Cpu, LayoutDashboard } from 'lucide-react';

export default function Footer({ onNavigate }) {
  return (
    <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
      <div className="mx-auto max-w-7xl px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Leaf className="h-3.5 w-3.5 fill-white stroke-white" />
          </div>
          <span className="font-bold text-[#0f2942]">AirSafe RuangSehat</span>
          <span>&copy; {new Date().getFullYear()}</span>
        </div>

        {/* Documentation & Quick Navigation Links */}
        {onNavigate && (
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <button
              onClick={() => onNavigate('docs-backend')}
              className="flex items-center gap-1.5 font-medium text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
            >
              <Server className="h-3.5 w-3.5 text-emerald-600" />
              <span>Dokumentasi Backend</span>
            </button>

            <span className="text-slate-300">•</span>

            <button
              onClick={() => onNavigate('docs-iot')}
              className="flex items-center gap-1.5 font-medium text-slate-600 hover:text-cyan-700 transition-colors cursor-pointer"
            >
              <Cpu className="h-3.5 w-3.5 text-cyan-600" />
              <span>Dokumentasi IoT</span>
            </button>

            <span className="text-slate-300">•</span>

            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-1.5 font-medium text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-emerald-600" />
              <span>Dashboard Telemetri</span>
            </button>
          </div>
        )}

        <div className="text-slate-400 text-[11px]">
          Host Production: <strong className="font-mono text-slate-600">202.155.17.57</strong> (SSL Enkripsi)
        </div>
      </div>
    </footer>
  );
}
