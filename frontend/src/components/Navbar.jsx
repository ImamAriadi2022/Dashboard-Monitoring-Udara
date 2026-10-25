import React, { useState } from 'react';
import { Leaf, ArrowLeft, Menu, X, Server, Cpu, LayoutDashboard, FileText } from 'lucide-react';

export default function Navbar({ currentView, onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Beranda');

  const navLinks = [
    { label: 'Beranda', href: '#beranda' },
    { label: 'Data & Sensor', href: '#sensor' },
    { label: 'Tips Udara', href: '#tips' },
    { label: 'Tentang', href: '#tentang' },
  ];

  const handleLinkClick = (e, link) => {
    e.preventDefault();
    setActiveTab(link.label);
    const el = document.querySelector(link.href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  // If on Docs views: docs-backend or docs-iot
  if (currentView === 'docs-backend' || currentView === 'docs-iot') {
    return (
      <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200/80 shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Brand */}
          <div 
            onClick={() => onNavigate('landing')}
            className="flex cursor-pointer items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm shadow-emerald-500/30">
              <Leaf className="h-5 w-5 fill-white stroke-white" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight text-[#0f2942]">AirSafe</span>
              <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/60">
                Dokumentasi
              </span>
            </div>
          </div>

          {/* Navigation Links for Docs */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => onNavigate('docs-backend')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentView === 'docs-backend'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Server className="h-3.5 w-3.5 text-emerald-600" />
              <span>Docs Backend</span>
            </button>

            <button
              onClick={() => onNavigate('docs-iot')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentView === 'docs-iot'
                  ? 'bg-cyan-50 text-cyan-800 border border-cyan-300 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Cpu className="h-3.5 w-3.5 text-cyan-600" />
              <span>Docs IoT</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('dashboard')}
              className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-all cursor-pointer shadow-2xs"
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-emerald-700" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => onNavigate('landing')}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Beranda</span>
            </button>
          </div>
        </div>
      </header>
    );
  }

  // If on Dashboard: minimal navbar (logo + doc links + kembali ke beranda)
  if (currentView === 'dashboard') {
    return (
      <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200/80 shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Brand */}
          <div 
            onClick={() => onNavigate('landing')}
            className="flex cursor-pointer items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm shadow-emerald-500/30">
              <Leaf className="h-5 w-5 fill-white stroke-white" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight text-[#0f2942]">AirSafe</span>
              <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/60">
                RuangSehat
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('docs-backend')}
              className="hidden sm:flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition-all cursor-pointer shadow-2xs"
            >
              <Server className="h-3.5 w-3.5 text-emerald-600" />
              <span>Docs API</span>
            </button>

            <button
              onClick={() => onNavigate('docs-iot')}
              className="hidden sm:flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-cyan-700 transition-all cursor-pointer shadow-2xs"
            >
              <Cpu className="h-3.5 w-3.5 text-cyan-600" />
              <span>Docs IoT</span>
            </button>

            {/* Kembali ke Beranda button */}
            <button
              onClick={() => onNavigate('landing')}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Kembali ke Beranda</span>
            </button>
          </div>
        </div>
      </header>
    );
  }

  // On Landing Page: Clean navbar with Docs links
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200/80 shadow-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        
        {/* Brand */}
        <div 
          onClick={() => {
            onNavigate('landing');
            setActiveTab('Beranda');
          }}
          className="flex cursor-pointer items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm shadow-emerald-500/30">
            <Leaf className="h-5 w-5 fill-white stroke-white" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-bold tracking-tight text-[#0f2942]">AirSafe</span>
            <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/60">
              RuangSehat
            </span>
          </div>
        </div>

        {/* Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = activeTab === link.label;
            return (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link)}
                className={`relative py-1 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-emerald-600 font-semibold after:absolute after:bottom-[-13px] after:left-0 after:right-0 after:h-[2.5px] after:rounded-full after:bg-emerald-500'
                    : 'text-slate-600 hover:text-emerald-600'
                }`}
              >
                {link.label}
              </a>
            );
          })}

          <div className="h-4 w-px bg-slate-200 mx-1" />

          {/* Quick Docs links in navbar */}
          <button
            onClick={() => onNavigate('docs-backend')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer py-1"
          >
            <Server className="h-3.5 w-3.5 text-emerald-600" />
            <span>Docs Backend</span>
          </button>

          <button
            onClick={() => onNavigate('docs-iot')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-cyan-700 transition-colors cursor-pointer py-1"
          >
            <Cpu className="h-3.5 w-3.5 text-cyan-600" />
            <span>Docs IoT</span>
          </button>
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden cursor-pointer"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-600"
              >
                {link.label}
              </a>
            ))}

            <div className="border-t border-slate-100 pt-2 mt-1 space-y-1">
              <button
                onClick={() => {
                  onNavigate('docs-backend');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-700"
              >
                <Server className="h-4 w-4 text-emerald-600" />
                <span>Dokumentasi Backend (/docs-backend)</span>
              </button>

              <button
                onClick={() => {
                  onNavigate('docs-iot');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-cyan-700"
              >
                <Cpu className="h-4 w-4 text-cyan-600" />
                <span>Dokumentasi IoT (/docs-iot)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
