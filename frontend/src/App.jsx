import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './features/landing/LandingPage';
import DashboardPage from './features/dashboard/DashboardPage';
import DocsBackendPage from './features/docs/DocsBackendPage';
import DocsIotPage from './features/docs/DocsIotPage';
import { fetchLatest } from './services/api';

const pathToView = (pathname) => {
  const cleanPath = (pathname || '').toLowerCase().replace(/\/+$/, '');
  if (cleanPath === '/docs-backend') return 'docs-backend';
  if (cleanPath === '/docs-iot') return 'docs-iot';
  if (cleanPath === '/dashboard') return 'dashboard';
  return 'landing';
};

const viewToPath = (view) => {
  switch (view) {
    case 'docs-backend':
      return '/docs-backend';
    case 'docs-iot':
      return '/docs-iot';
    case 'dashboard':
      return '/dashboard';
    default:
      return '/';
  }
};

export default function App() {
  const [currentView, setCurrentView] = useState(() => pathToView(window.location.pathname));
  const [initialData, setInitialData] = useState(null);

  const navigateTo = (view) => {
    setCurrentView(view);
    const newPath = viewToPath(view);
    if (window.location.pathname !== newPath) {
      window.history.pushState({}, '', newPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentView(pathToView(window.location.pathname));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardPage onBackToHome={() => navigateTo('landing')} onNavigate={navigateTo} />;
      case 'docs-backend':
        return <DocsBackendPage onNavigate={navigateTo} />;
      case 'docs-iot':
        return <DocsIotPage onNavigate={navigateTo} />;
      case 'landing':
      default:
        return (
          <LandingPage
            onOpenDashboard={() => navigateTo('dashboard')}
            onNavigate={navigateTo}
            latest={initialData}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar
        currentView={currentView}
        onNavigate={navigateTo}
      />

      <div className="flex-1">
        {renderCurrentView()}
      </div>

      <Footer onNavigate={navigateTo} />
    </div>
  );
}
