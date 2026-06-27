import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import CommandPalette from './components/CommandPalette';
import Dashboard from './pages/Dashboard';
import Tools from './pages/Tools';
import Reference from './pages/Reference';
import Calc from './pages/Calc';
import Planner from './pages/Planner';
import Knowledge from './pages/Knowledge';
import Templates from './pages/Templates';
import Ai from './pages/Ai';
import Hr from './pages/Hr';
import Finance from './pages/Finance';
import Services from './pages/Services';
import News from './pages/News';
import InnCheck from './pages/InnCheck'
import Settings from './pages/Settings'
import EcpManager from './pages/EcpManager'
import Counterparties from './pages/Counterparties'
import Placeholder from './pages/Placeholder'
import Home from './pages/Home'
import { CompanyProvider } from './lib/CompanyContext';

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
        const keysStr = localStorage.getItem('bx_ecp_keys') || '[]'
        const keys = JSON.parse(keysStr)
        const urgentKeys = keys.filter((k: any) => {
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
            const names = urgentKeys.map((k: any) => k.name).join(', ')
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

  return (
    <CompanyProvider>
    <div className="flex h-screen w-screen overflow-hidden bg-[#0f1117]">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar onOpenSearch={() => setPaletteOpen(true)} />
        <main className="flex flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/reference" element={<Reference />} />
            <Route path="/services" element={<Services />} />
            <Route path="/news" element={<News />} />
            <Route path="/knowledge" element={<Knowledge />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/hr" element={<Hr />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/planner" element={<Planner />} />
            <Route path="/calc" element={<Calc />} />
            <Route path="/ecp" element={<EcpManager />} />
            <Route path="/check-inn" element={<InnCheck />} />
            <Route path="/ai" element={<Ai />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/counterparties" element={<Counterparties />} />
          </Routes>
        </main>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
    </CompanyProvider>
  );
}
