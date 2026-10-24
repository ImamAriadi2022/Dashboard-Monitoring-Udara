import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './features/landing/LandingPage';
import DashboardPage from './features/dashboard/DashboardPage';
import { fetchLatest } from './services/api';

export default function App() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'dashboard'
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    async function getLatest() {
      try {
        const d = await fetchLatest();
        if (d && d.id) setInitialData(d);
      } catch (err) {
        // Backend not online or initial load
      }
    }
    getLatest();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
      />

      <div className="flex-1">
        {currentView === 'landing' ? (
          <LandingPage
            onOpenDashboard={() => setCurrentView('dashboard')}
            latest={initialData}
          />
        ) : (
          <DashboardPage onBackToHome={() => setCurrentView('landing')} />
        )}
      </div>

      {currentView === 'landing' && <Footer />}
    </div>
  );
}
