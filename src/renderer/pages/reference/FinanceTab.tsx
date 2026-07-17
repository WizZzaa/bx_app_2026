import React, { useState, useEffect } from 'react';
import { paymentCodes } from '../../data/reference/finance';
import type { Indicator, TaxRate } from '../../data/reference/types';
import { loadIndicators, loadTaxes } from '../../lib/db/referenceRepo';
import Icon from '../../lib/ui/Icon';

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
    <div className="rounded-[18px] border border-bx-border bg-bx-bg p-4.5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.12em] text-bx-muted">{ind.shortName}</div>
          <div className="mt-1 text-2xl font-black tracking-tight text-bx-text tabular-nums">
            {fmtSum(current.value)} <span className="text-sm font-normal text-bx-muted">{ind.unit}</span>
          </div>
          <div className="text-[11px] text-bx-muted mt-1">с {fmtDate(current.from)}</div>
        </div>
        {ind.meta.verified ? (
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[9px] font-black text-emerald-700 dark:text-emerald-300"
            title={`Сверено ${ind.meta.updatedAt}${ind.meta.source ? ` · ${ind.meta.source}` : ''}`}>
            <Icon name="check" className="h-3 w-3" />сверено {ind.meta.updatedAt?.slice(5).split('-').reverse().join('.')}
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-[9px] font-black text-amber-700 dark:text-amber-300" title="Значение требует сверки с официальным источником">
            <Icon name="alert" className="h-3 w-3" />не проверено
          </span>
        )}
      </div>
      {ind.hint && <p className="text-[11px] text-bx-muted mt-2 leading-snug">{ind.hint}</p>}

      <button onClick={() => setOpen(o => !o)} className="mt-2 min-h-8 rounded-lg px-2 text-[11px] font-bold text-blue-600 transition-colors hover:bg-blue-500/10 dark:text-blue-300">
        {open ? 'Скрыть историю' : 'История значений →'}
      </button>
      {open && (
        <div className="mt-2 space-y-1 border-t border-bx-border pt-2">
          {ind.history.map((h, i) => (
            <div key={i} className="flex items-center justify-between gap-2 text-[11px]" title={h.basis}>
              <span className="text-bx-muted flex-shrink-0">с {fmtDate(h.from)}</span>
              {(h.verified ?? !(h.basis?.includes('требует проверки') ?? true))
                ? <Icon name="check" className="h-3 w-3 text-emerald-500" />
                : <Icon name="alert" className="h-3 w-3 text-amber-500" />}
              <span className="text-bx-text font-mono ml-auto">{fmtSum(h.value)} {ind.unit}</span>
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
        <div className="text-[11px] text-bx-muted flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${source === 'cloud' ? 'bg-green-400' : 'bg-amber-400'}`} />
          {source === 'cloud' ? 'Данные из облака (Supabase)' : 'Локальные данные (нет связи с облаком)'}
        </div>
      )}

      {/* Показатели */}
      <section>
        <h2 className="mb-3 text-sm font-black text-bx-text">Ключевые показатели</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {indicators.map(ind => <IndicatorCard key={ind.key} ind={ind} />)}
        </div>
      </section>

      {/* Ставки налогов */}
      <section>
        <h2 className="mb-3 text-sm font-black text-bx-text">Ставки налогов</h2>
        <div className="rounded-xl border border-bx-border bg-bx-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-bx-muted border-b border-bx-border">
                <th className="px-4 py-2.5 font-medium">Налог</th>
                <th className="px-4 py-2.5 font-medium">Ставка</th>
                <th className="px-4 py-2.5 font-medium">Объект</th>
                <th className="px-4 py-2.5 font-medium">Режим</th>
              </tr>
            </thead>
            <tbody>
              {taxes.map((t, i) => (
                <tr key={i} className="border-b border-bx-border last:border-0 hover:bg-bx-surface-2">
                  <td className="px-4 py-2.5 text-bx-text">{t.name}</td>
                  <td className="px-4 py-2.5 text-blue-400 font-medium font-mono">{t.rate}</td>
                  <td className="px-4 py-2.5 text-bx-muted text-xs">{t.base}{t.note ? ` · ${t.note}` : ''}</td>
                  <td className="px-4 py-2.5 text-bx-muted text-xs">{t.regime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Коды платежей */}
      <section>
        <h2 className="mb-3 text-sm font-black text-bx-text">Коды платежей (КБК)</h2>
        <div className="rounded-xl border border-bx-border bg-bx-surface p-4">
          <p className="mb-3 flex items-start gap-2 rounded-xl bg-amber-500/[0.07] px-3 py-2.5 text-xs text-amber-800 dark:text-amber-300">
            <Icon name="alert" className="mt-0.5 h-4 w-4 flex-shrink-0" />Раздел требует наполнения реальными кодами бюджетной классификации и казначейскими счетами.
          </p>
          <div className="space-y-1.5">
            {paymentCodes.map((p, i) => (
              <div key={i} className="flex items-center gap-3 text-sm px-3 py-2 rounded-lg bg-bx-bg">
                <span className="text-bx-muted font-mono text-xs">{p.code}</span>
                <span className="text-bx-text">{p.name}</span>
                <span className="text-bx-muted text-xs ml-auto">{p.category}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
