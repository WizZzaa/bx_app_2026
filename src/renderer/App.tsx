import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
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
import Templates from './pages/Templates';
import Ai from './pages/Ai';
import Support from './pages/Support';
import Hr from './pages/Hr';
import Finance from './pages/Finance';
import Services from './pages/Services';
import News from './pages/News';
import Settings from './pages/Settings'
import EcpManager from './pages/EcpManager'
import Counterparties from './pages/Counterparties'
import Placeholder from './pages/Placeholder'
import TrayView from './pages/TrayView'
import Documents from './pages/Documents'
import { CompanyProvider } from './lib/CompanyContext';
import { PlanProvider } from './lib/plan';
import { loadEcpKeys } from './lib/ecpStorage';

// Слушает запросы навигации из трей-виджета (main → 'tray:navigate') и
// переходит на нужный раздел в главном окне.
function TrayNavigateListener(): React.ReactElement | null {
  const navigate = useNavigate()
  useEffect(() => {
    const un = window.bx?.tray?.onNavigate?.((route) => { if (route) navigate(route) })
    return () => un?.()
  }, [navigate])
  return null
}

export default function App() {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setPaletteOpen(o => !o);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const checkEcpExpiry = async () => {
      try {
        const keys = await loadEcpKeys()
        const urgentKeys = keys.filter((k) => {
          const now = new Date()
          now.setHours(0, 0, 0, 0)
          const target = new Date(k.expiresAt)
          const diffDays = Math.round((target.getTime() - now.getTime()) / 86400000)
          return diffDays >= 0 && diffDays <= 14
        })

        if (urgentKeys.length > 0) {
          const lastNotify = localStorage.getItem('bx_last_ecp_notify_date')
          const today = new Date().toDateString()
          
          if (lastNotify !== today && window.bx?.notification?.show) {
            const names = urgentKeys.map((k) => k.name).join(', ')
            await window.bx.notification.show(
              'Истекает срок действия ЭЦП',
              `Внимание! Ключи (${names}) истекают в течение 14 дней. Пожалуйста, обновите их.`
            )
            localStorage.setItem('bx_last_ecp_notify_date', today)
          }
        }
      } catch (err) {
        console.error('Ошибка проверки сроков ЭЦП:', err)
      }
    }

    const timer = setTimeout(checkEcpExpiry, 3000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const theme = localStorage.getItem('bx_theme') || 'dark';
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, []);

  const isTray = window.location.hash.includes('tray') || window.location.pathname.includes('tray')

  if (isTray) {
    return (
      <CompanyProvider>
        <PlanProvider>
          <div className="w-screen h-screen overflow-hidden bg-bx-bg text-bx-text">
            <Routes>
              <Route path="*" element={<TrayView />} />
            </Routes>
          </div>
        </PlanProvider>
      </CompanyProvider>
    )
  }

  return (
    <CompanyProvider>
      <PlanProvider>
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-bx-bg text-bx-text relative">
          
          {/* Background Glow Spheres for Depth */}
          <div className="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none z-0" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[150px] pointer-events-none z-0" />

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
                  <Route path="/calc" element={<Calc />} />
                  <Route path="/ecp" element={<EcpManager />} />
                  <Route path="/ai" element={<Ai />} />
                  <Route path="/support" element={<Support />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/counterparties" element={<Counterparties />} />
                </Routes>
              </main>
            </div>
            <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
          </div>
        </div>
      </PlanProvider>
    </CompanyProvider>
  )
}
