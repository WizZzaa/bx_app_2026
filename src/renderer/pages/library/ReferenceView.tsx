import React, { useState, useEffect } from 'react';
import FinanceTab from '../reference/FinanceTab';
import AccountingTab from '../reference/AccountingTab';
import { GovTab, VedTab, LawTab } from '../reference/MiscTabs';

import { usePlan } from '../../lib/plan';
import PaywallModal from '../../components/PaywallModal';

// Зона «Справочные данные» объединённой Базы знаний — прежние 5 вкладок
// Справочников (v1.47). Сами табы не менялись.

export type RefTabId = 'finance' | 'accounting' | 'gov' | 'ved' | 'law';

const tabs: { id: RefTabId; label: string }[] = [
  { id: 'finance', label: '💰 Финансы и Налоги' },
  { id: 'accounting', label: '📒 Учёт и Стандарты' },
  { id: 'gov', label: '🏛 Госорганы' },
  { id: 'ved', label: '🌍 ВЭД, Труд, Статистика' },
  { id: 'law', label: '⚖️ Право и Ответственность' },
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
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      {/* Баннер о сверке */}
      <div className="text-xs text-bx-muted bg-bx-surface border border-bx-border rounded-lg px-4 py-2.5 flex items-start gap-2">
        <span className="text-emerald-400">✓</span>
        <span>
          Ключевые показатели (БРВ, МРОТ, ставка ЦБ) сверены 03.07.2026 — отмечены зелёным бейджем.
          Записи с «⚠ не проверено» требуют сверки с{' '}
          <a className="underline" href="https://lex.uz" target="_blank" rel="noreferrer">lex.uz</a>,{' '}
          <a className="underline" href="https://soliq.uz" target="_blank" rel="noreferrer">soliq.uz</a>,{' '}
          <a className="underline" href="https://cbu.uz" target="_blank" rel="noreferrer">cbu.uz</a>.
        </span>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => handleTabClick(t.id)}
            className={`px-3.5 py-1.5 rounded-lg text-sm transition-colors ${
              active === t.id
                ? 'bg-blue-600 text-white'
                : 'bg-bx-border text-bx-muted hover:text-bx-text hover:bg-bx-border-2'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {active === 'finance' && <FinanceTab />}
      {active === 'accounting' && <AccountingTab />}
      {active === 'gov' && <GovTab />}
      {active === 'ved' && <VedTab />}
      {active === 'law' && <LawTab />}
      {paywall && <PaywallModal feature="Справочные данные и показатели РУз" onClose={() => setPaywall(false)} />}
    </div>
  );
}
