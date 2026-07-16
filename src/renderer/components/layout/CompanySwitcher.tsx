import React, { useState, useRef, useEffect } from 'react';
import { useCompany } from '../../lib/CompanyContext';
import { usePlan } from '../../lib/plan';
import PaywallModal from '../PaywallModal';

export default function CompanySwitcher() {
  const { companies, active, setActive, startCompanyCreation, startCompanyEdit } = useCompany();
  const [open, setOpen] = useState(false);
  const { isPro, limits } = usePlan();
  const [paywall, setPaywall] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 bg-bx-surface-2 hover:bg-bx-border-2 text-bx-text text-sm px-3 py-1.5 rounded-lg border border-bx-border-2 transition-colors max-w-[220px]"
      >
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: active?.color || '#4ade80' }} />
        <span className="truncate">{active ? active.name : 'Все компании'}</span>
        <span className="text-bx-muted">▾</span>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1.5 w-64 bg-bx-surface border border-bx-border-2 rounded-lg shadow-2xl z-50 overflow-hidden">
          <button
            onClick={() => { setActive(null); setOpen(false); }}
            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-bx-surface-2 ${!active ? 'text-blue-400' : 'text-bx-text'}`}
          >
            Все компании
          </button>
          <div className="border-t border-bx-border" />
          {companies.map(c => (
            <div
              key={c.id}
              className={`w-full flex items-center text-sm hover:bg-bx-surface-2 ${active?.id === c.id ? 'text-blue-400' : 'text-bx-text'}`}
            >
              <button
                onClick={() => { setActive(c); setOpen(false); }}
                className="min-w-0 flex-1 flex items-center gap-2 text-left pl-4 py-2.5"
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color || '#4ade80' }} />
                <span className="flex-1 truncate">{c.name}</span>
                {c.inn && <span className="text-[10px] text-bx-muted">{c.inn}</span>}
              </button>
              <button
                type="button"
                aria-label={`Настроить профиль ${c.name}`}
                title="Настроить профиль"
                onClick={() => { startCompanyEdit(c); setOpen(false); }}
                className="self-stretch text-bx-muted hover:text-blue-500 px-3"
              >
                ⚙
              </button>
            </div>
          ))}

          <div className="border-t border-bx-border" />
          <button onClick={() => {
            if (!isPro && companies.length >= limits.companies) { setPaywall(true); setOpen(false); return; }
            setOpen(false);
            startCompanyCreation();
          }} className="w-full text-left px-4 py-2.5 text-sm text-blue-400 hover:bg-bx-surface-2">
            + Добавить компанию
          </button>
        </div>
      )}
      {paywall && <PaywallModal feature="Мультикомпания — ведение нескольких фирм" onClose={() => setPaywall(false)} />}
    </div>
  );
}
