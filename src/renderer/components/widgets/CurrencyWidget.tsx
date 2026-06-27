import React, { useEffect, useState } from 'react';
import { widgetsApi } from '../../lib/widgetsApi';
import CurrencyHistory from './CurrencyHistory';
import type { CurrencyRate } from '../../../shared/types';

export default function CurrencyWidget() {
  const [rates, setRates] = useState<CurrencyRate[] | null>(null);
  const [error, setError] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const date = rates?.[0]?.date ?? new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'long' });

  useEffect(() => {
    let alive = true;
    widgetsApi.getRates()
      .then(d => { if (alive) setRates(d); })
      .catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, []);

  return (
    <>
      <div className="rounded-xl border border-[#1e2535] bg-[#141820] p-4 h-full">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-slate-300">💱 Курсы валют</h2>
          <span className="text-[11px] text-slate-500">ЦБ РУз · {date}</span>
        </div>

        {error ? (
          <div className="text-sm text-slate-500 text-center py-6">Нет данных о курсах</div>
        ) : !rates ? (
          <div className="text-sm text-slate-500 text-center py-6">Загрузка…</div>
        ) : (
          <div className="space-y-1.5">
            {rates.map(r => {
              const up = r.diff >= 0;
              return (
                <div key={r.code} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#0f1117]">
                  <span className="text-lg">{r.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-200 font-medium">{r.code}</div>
                    <div className="text-[10px] text-slate-500 truncate">{r.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-200 font-mono">
                      {r.value.toLocaleString('ru-RU', { minimumFractionDigits: 1 })}
                    </div>
                    <div className={`text-[10px] font-mono ${up ? 'text-green-400' : 'text-red-400'}`}>
                      {up ? '▲' : '▼'} {Math.abs(r.diff).toFixed(1)}
                    </div>
                  </div>
                </div>
              );
            })}
            <button
              onClick={() => setHistoryOpen(true)}
              className="w-full text-[11px] text-blue-400 hover:text-blue-300 transition-colors pt-1.5 flex items-center justify-center gap-1"
            >
              История курсов →
            </button>
          </div>
        )}
      </div>

      {historyOpen && <CurrencyHistory onClose={() => setHistoryOpen(false)} />}
    </>
  );
}
