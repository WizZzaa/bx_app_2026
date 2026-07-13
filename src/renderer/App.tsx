import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Titlebar from './components/layout/Titlebar';
import Topbar from './components/layout/Topbar';
import CommandPalette from './components/CommandPalette';
import Dashboard from './pages/Dashboard';
import Tools from './pages/Tools';
import Library from './pages/library/Library';
import ReferenceView from './pages/library/ReferenceView';
import Calc from './pages/Calc';
import Planner from './pages/Planner';
import CalendarPage from './pages/CalendarPage';
import Templates from './pages/Templates';
import Ai from './pages/Ai';
import Support from './pages/Support';
import Hr from './pages/Hr';
import Finance from './pages/Finance';
import Services from './pages/Services';
import News from './pages/News';
import Settings from './pages/Settings';
import Counterparties from './pages/Counterparties';
import Placeholder from './pages/Placeholder';
import TrayView from './pages/TrayView';
import Documents from './pages/Documents';
import { CompanyProvider } from './lib/CompanyContext';
import { PlanProvider } from './lib/plan';

// Обработчик события из трея для Electron
function TrayNavigateListener() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleTrayNav = (_: any, path: string) => {
      // Имитируем переход
      window.location.hash = path;
    };
    (window as any).bx?.ipc?.on?.('tray-navigate', handleTrayNav);
    return () => {
      (window as any).bx?.ipc?.off?.('tray-navigate', handleTrayNav);
    };
  }, []);
  return null;
}

// Редирект со старой ссылки ЭЦП
function EcpRedirect() {
  useEffect(() => {
    localStorage.setItem('bx_tools_last', 'ecp');
    // Оповестим другие вкладки/компоненты
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'bx_tools_last',
      newValue: 'ecp'
    }));
  }, []);
  return <Navigate to="/tools" replace />;
}

export default function App() {
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Инициализация темы при первом рендере
  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Если это режим компактного окна (Трей-вид)
  const isCompact = window.location.search.includes('compact=true') || window.location.hash.includes('/tray');

  if (isCompact) {
    return (
      <CompanyProvider>
        <PlanProvider>
          <div className="flex flex-col h-screen w-screen bg-bx-bg text-bx-text overflow-hidden font-sans">
            <Routes>
              <Route path="/tray" element={<TrayView />} />
              <Route path="*" element={<Navigate to="/tray" replace />} />
            </Routes>
          </div>
        </PlanProvider>
      </CompanyProvider>
    );
  }

  return (
    <CompanyProvider>
      <PlanProvider>
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-bx-bg text-bx-text relative">
          
          {/* Background Glow Spheres for Depth */}
          <div className="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none z-0 hidden dark:block" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[150px] pointer-events-none z-0 hidden dark:block" />

          <Titlebar />
          <div className="flex flex-1 min-h-0 overflow-hidden relative z-10">
            <TrayNavigateListener />
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <Topbar onOpenSearch={() => setPaletteOpen(true)} />
              <main className="flex flex-1 overflow-hidden">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/tools" element={<Tools />} />
                  <Route path="/reference" element={<ReferenceView />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/news" element={<News />} />
                  <Route path="/knowledge" element={<Library />} />
                  <Route path="/templates" element={<Templates />} />
                  <Route path="/documents" element={<Documents />} />
                  <Route path="/hr" element={<Hr />} />
                  <Route path="/finance" element={<Finance />} />
                  <Route path="/planner" element={<Planner />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/calc" element={<Calc />} />
                  <Route path="/ecp" element={<EcpRedirect />} />
                  <Route path="/ai" element={<Ai />} />
                  <Route path="/support" element={<Support />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/counterparties" element={<Counterparties />} />
                  <Route path="/placeholder" element={<Placeholder icon="🚧" title="Страница в разработке" description="Этот раздел временно недоступен или находится на стадии проектирования." />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          </div>

          <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
        </div>
      </PlanProvider>
    </CompanyProvider>
  );
}
