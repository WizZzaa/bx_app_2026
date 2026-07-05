import React, { useState, useRef, useEffect } from 'react';
import { useCompany } from '../../lib/CompanyContext';
import { usePlan } from '../../lib/plan';
import PaywallModal from '../PaywallModal';

export default function CompanySwitcher() {
  const { companies, active, setActive, addCompany } = useCompany();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [inn, setInn] = useState('');
  const [busy, setBusy] = useState(false);
  const { isPro, limits } = usePlan();
  const [paywall, setPaywall] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setAdding(false); }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function create() {
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      await addCompany({ name: name.trim(), inn: inn.trim() || undefined });
      setName(''); setInn(''); setAdding(false);
    } finally { setBusy(false); }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 bg-bx-surface-2 hover:bg-bx-border-2 text-slate-300 text-sm px-3 py-1.5 rounded-lg border border-bx-border-2 transition-colors max-w-[220px]"
      >
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: active?.color || '#4ade80' }} />
        <span className="truncate">{active ? active.name : 'Все компании'}</span>
        <span className="text-slate-500">▾</span>
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
            <button
              key={c.id}
              onClick={() => { setActive(c); setOpen(false); }}
              className={`w-full flex items-center gap-2 text-left px-4 py-2.5 text-sm hover:bg-bx-surface-2 ${active?.id === c.id ? 'text-blue-400' : 'text-bx-text'}`}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color || '#4ade80' }} />
              <span className="flex-1 truncate">{c.name}</span>
              {c.inn && <span className="text-[10px] text-slate-600">{c.inn}</span>}
            </button>
          ))}

          <div className="border-t border-bx-border" />
          {adding ? (
            <div className="p-3 space-y-2">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Название" className="w-full bg-bx-bg text-bx-text text-sm px-2.5 py-1.5 rounded border border-bx-border focus:outline-none focus:border-blue-500/50" />
              <input value={inn} onChange={e => setInn(e.target.value)} placeholder="ИНН (необязательно)" className="w-full bg-bx-bg text-bx-text text-sm px-2.5 py-1.5 rounded border border-bx-border focus:outline-none focus:border-blue-500/50" />
              <div className="flex gap-2">
                <button onClick={create} disabled={busy} className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs py-1.5 rounded">Добавить</button>
                <button onClick={() => setAdding(false)} className="px-3 text-slate-500 hover:text-slate-300 text-xs">Отмена</button>
              </div>
            </div>
          ) : (
            <button onClick={() => {
              if (!isPro && companies.length >= limits.companies) { setPaywall(true); setOpen(false); return; }
              setAdding(true);
            }} className="w-full text-left px-4 py-2.5 text-sm text-blue-400 hover:bg-bx-surface-2">
              + Добавить компанию
            </button>
          )}
        </div>
      )}
      {paywall && <PaywallModal feature="Мультикомпания — ведение нескольких фирм" onClose={() => setPaywall(false)} />}
    </div>
  );
}
