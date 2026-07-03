import React, { useState, useEffect } from 'react';
import { paymentCodes } from '../../data/reference/finance';
import type { Indicator, TaxRate } from '../../data/reference/types';
import { loadIndicators, loadTaxes } from '../../lib/db/referenceRepo';

function fmtSum(n: number) {
  return n.toLocaleString('ru-RU');
}
function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function IndicatorCard({ ind }: { ind: Indicator }) {
  const [open, setOpen] = useState(false);
  const current = ind.history[0];
  return (
    <div className="rounded-xl border border-[#1e2535] bg-[#141820] p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-slate-500">{ind.shortName}</div>
          <div className="text-2xl font-bold text-white mt-0.5">
            {fmtSum(current.value)} <span className="text-sm font-normal text-slate-500">{ind.unit}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">с {fmtDate(current.from)}</div>
        </div>
        {ind.meta.verified ? (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400"
            title={`Сверено ${ind.meta.updatedAt}${ind.meta.source ? ` · ${ind.meta.source}` : ''}`}>
            ✓ сверено {ind.meta.updatedAt?.slice(5).split('-').reverse().join('.')}
          </span>
        ) : (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400" title="Значение требует сверки с официальным источником">
            ⚠ не проверено
          </span>
        )}
      </div>
      {ind.hint && <p className="text-[11px] text-slate-500 mt-2 leading-snug">{ind.hint}</p>}

      <button onClick={() => setOpen(o => !o)} className="text-[11px] text-blue-400 hover:text-blue-300 mt-2 transition-colors">
        {open ? 'Скрыть историю' : 'История значений →'}
      </button>
      {open && (
        <div className="mt-2 space-y-1 border-t border-[#1e2535] pt-2">
          {ind.history.map((h, i) => (
            <div key={i} className="flex items-center justify-between gap-2 text-[11px]" title={h.basis}>
              <span className="text-slate-400 flex-shrink-0">с {fmtDate(h.from)}</span>
              {h.basis?.includes('требует проверки')
                ? <span className="text-amber-500/60 text-[9px]">⚠</span>
                : <span className="text-emerald-500/60 text-[9px]">✓</span>}
              <span className="text-slate-300 font-mono ml-auto">{fmtSum(h.value)} {ind.unit}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FinanceTab() {
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [taxes, setTaxes] = useState<TaxRate[]>([]);
  const [source, setSource] = useState<'cloud' | 'local' | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([loadIndicators(), loadTaxes()]).then(([ind, tax]) => {
      if (!alive) return;
      setIndicators(ind.data);
      setTaxes(tax.data);
      setSource(ind.source);
    });
    return () => { alive = false; };
  }, []);

  return (
    <div className="space-y-6">
      {/* Источник данных */}
      {source && (
        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${source === 'cloud' ? 'bg-green-400' : 'bg-amber-400'}`} />
          {source === 'cloud' ? 'Данные из облака (Supabase)' : 'Локальные данные (нет связи с облаком)'}
        </div>
      )}

      {/* Показатели */}
      <section>
        <h2 className="text-sm font-medium text-slate-400 mb-3">Ключевые показатели</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {indicators.map(ind => <IndicatorCard key={ind.key} ind={ind} />)}
        </div>
      </section>

      {/* Ставки налогов */}
      <section>
        <h2 className="text-sm font-medium text-slate-400 mb-3">Ставки налогов</h2>
        <div className="rounded-xl border border-[#1e2535] bg-[#141820] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-[#1e2535]">
                <th className="px-4 py-2.5 font-medium">Налог</th>
                <th className="px-4 py-2.5 font-medium">Ставка</th>
                <th className="px-4 py-2.5 font-medium">Объект</th>
                <th className="px-4 py-2.5 font-medium">Режим</th>
              </tr>
            </thead>
            <tbody>
              {taxes.map((t, i) => (
                <tr key={i} className="border-b border-[#1e2535] last:border-0 hover:bg-[#1a2030]">
                  <td className="px-4 py-2.5 text-slate-200">{t.name}</td>
                  <td className="px-4 py-2.5 text-blue-400 font-medium font-mono">{t.rate}</td>
                  <td className="px-4 py-2.5 text-slate-400 text-xs">{t.base}{t.note ? ` · ${t.note}` : ''}</td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs">{t.regime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Коды платежей */}
      <section>
        <h2 className="text-sm font-medium text-slate-400 mb-3">Коды платежей (КБК)</h2>
        <div className="rounded-xl border border-[#1e2535] bg-[#141820] p-4">
          <p className="text-xs text-amber-400 mb-3">
            ⚠ Раздел требует наполнения реальными кодами бюджетной классификации и казначейскими счетами.
          </p>
          <div className="space-y-1.5">
            {paymentCodes.map((p, i) => (
              <div key={i} className="flex items-center gap-3 text-sm px-3 py-2 rounded-lg bg-[#0f1117]">
                <span className="text-slate-500 font-mono text-xs">{p.code}</span>
                <span className="text-slate-300">{p.name}</span>
                <span className="text-slate-600 text-xs ml-auto">{p.category}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
