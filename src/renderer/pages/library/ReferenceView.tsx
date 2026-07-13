import React, { useState, useEffect } from 'react';
import FinanceTab from '../reference/FinanceTab';
import AccountingTab from '../reference/AccountingTab';
import { GovTab, VedTab, LawTab } from '../reference/MiscTabs';

import { usePlan } from '../../lib/plan';
import PaywallModal from '../../components/PaywallModal';

export type RefTabId = 'finance' | 'accounting' | 'gov' | 'ved' | 'law';

const tabs: { id: RefTabId; label: string; icon: string }[] = [
  { id: 'finance', label: 'Финансы и Налоги', icon: '💰' },
  { id: 'accounting', label: 'Учёт и Стандарты', icon: '📒' },
  { id: 'gov', label: 'Госорганы', icon: '🏛' },
  { id: 'ved', label: 'ВЭД, Труд, Статистика', icon: '🌍' },
  { id: 'law', label: 'Право и Ответственность', icon: '⚖️' },
];

export default function ReferenceView({ initialTab }: { initialTab?: RefTabId }) {
  const { plan } = usePlan();
  const [paywall, setPaywall] = useState(false);
  const [active, setActive] = useState<RefTabId>(initialTab ?? 'finance');
  useEffect(() => { if (initialTab) setActive(initialTab); }, [initialTab]);

  const handleTabClick = (tabId: RefTabId) => {
    if (plan === 'free') {
      setPaywall(true);
      return;
    }
    setActive(tabId);
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-bx-bg text-bx-text font-sans">
      
      {/* Левая панель: категории справочников */}
      <aside className="w-68 flex-shrink-0 border-r border-bx-border flex flex-col bg-bx-surface/10 backdrop-blur-md">
        <div className="px-4 pt-5 pb-3 flex-shrink-0">
          <h1 className="text-xs font-black text-bx-text uppercase tracking-wider">Справочники</h1>
          <p className="text-[10px] text-bx-muted mt-0.5 font-bold uppercase">Показатели и нормативы</p>
        </div>
        
        <div className="px-3 pb-2 flex-shrink-0 border-b border-bx-border/40 flex items-center justify-between">
          <span className="text-[10px] font-bold text-bx-muted uppercase tracking-wider">Разделы справочника</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1.5 custom-scrollbar">
          {tabs.map(t => {
            const isSel = active === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleTabClick(t.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2.5 rounded-xl text-left transition-all cursor-pointer border ${
                  isSel
                    ? 'bg-blue-600/10 border-blue-500/10 text-blue-500 font-extrabold shadow-sm shadow-blue-500/5'
                    : 'hover:bg-bx-surface/20 border-transparent text-bx-text'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-sm flex-shrink-0">{t.icon}</span>
                  <span className="text-xs truncate font-semibold">{t.label}</span>
                </div>
                <span className="text-[10px] text-bx-muted font-bold">→</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Правая панель: содержимое справочника */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
        {/* Баннер о сверке */}
        <div className="text-xs text-bx-muted bg-bx-surface border border-bx-border rounded-xl px-4 py-3 flex items-start gap-2.5 shadow-sm">
          <span className="text-emerald-500 font-bold">✓</span>
          <span>
            Ключевые показатели (БРВ, МРОТ, ставка ЦБ) сверены 03.07.2026 — отмечены зелёным бейджем.
            Записи с «⚠ не проверено» требуют сверки с{' '}
            <a className="underline text-blue-500 dark:text-blue-400 font-semibold" href="https://lex.uz" target="_blank" rel="noreferrer">lex.uz</a>,{' '}
            <a className="underline text-blue-500 dark:text-blue-400 font-semibold" href="https://soliq.uz" target="_blank" rel="noreferrer">soliq.uz</a>,{' '}
            <a className="underline text-blue-500 dark:text-blue-400 font-semibold" href="https://cbu.uz" target="_blank" rel="noreferrer">cbu.uz</a>.
          </span>
        </div>

        <div className="bg-bx-surface border border-bx-border rounded-2xl p-5 shadow-sm">
          {active === 'finance' && <FinanceTab />}
          {active === 'accounting' && <AccountingTab />}
          {active === 'gov' && <GovTab />}
          {active === 'ved' && <VedTab />}
          {active === 'law' && <LawTab />}
        </div>
      </div>

      {paywall && <PaywallModal feature="Справочные данные и показатели РУз" onClose={() => setPaywall(false)} />}
    </div>
  );
}
