import React, { useEffect, useState, useMemo } from 'react';
import { loadAccounts, loadNsbu, AccountRow, NsbuRow } from '../../lib/db/referenceRepo';

export default function AccountingTab() {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [nsbu, setNsbu] = useState<NsbuRow[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    let alive = true;
    loadAccounts().then(a => alive && setAccounts(a));
    loadNsbu().then(n => alive && setNsbu(n));
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return accounts;
    return accounts.filter(a => a.code.includes(s) || a.name.toLowerCase().includes(s) || a.account_class.toLowerCase().includes(s));
  }, [accounts, q]);

  // группировка по разделам
  const grouped = useMemo(() => {
    const m = new Map<string, AccountRow[]>();
    for (const a of filtered) {
      const arr = m.get(a.account_class) ?? [];
      arr.push(a);
      m.set(a.account_class, arr);
    }
    return [...m.entries()];
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* План счетов */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-bx-muted">План счетов (НСБУ №21)</h2>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Поиск по счёту…"
            className="bg-bx-bg text-bx-text placeholder-slate-600 text-xs px-3 py-1.5 rounded-lg border border-bx-border w-48 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <div className="space-y-4">
          {grouped.map(([cls, rows]) => (
            <div key={cls} className="rounded-xl border border-bx-border bg-bx-surface overflow-hidden">
              <div className="px-4 py-2 bg-bx-bg text-xs font-medium text-bx-muted">{cls}</div>
              {rows.map(a => (
                <div key={a.code} className="flex items-center gap-3 px-4 py-2 text-sm border-t border-bx-border hover:bg-bx-surface-2">
                  <span className="text-blue-400 font-mono w-12">{a.code}</span>
                  <span className="text-bx-text flex-1">{a.name}</span>
                  <span className="text-[11px] text-bx-muted">{a.type}</span>
                </div>
              ))}
            </div>
          ))}
          {grouped.length === 0 && <p className="text-sm text-bx-muted text-center py-6">Ничего не найдено</p>}
        </div>
      </section>

      {/* НСБУ */}
      <section>
        <h2 className="text-sm font-medium text-bx-muted mb-3">Национальные стандарты бухучёта (НСБУ)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {nsbu.map(n => (
            <div key={n.number} className="flex items-start gap-3 px-4 py-2.5 rounded-lg bg-bx-surface border border-bx-border">
              <span className="text-xs font-mono text-blue-400 mt-0.5">№{n.number}</span>
              <span className="text-sm text-bx-text">{n.title}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Амортизация */}
      <section>
        <h2 className="text-sm font-medium text-bx-muted mb-3">Нормы амортизации (предельные годовые)</h2>
        <div className="rounded-xl border border-bx-border bg-bx-surface overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {[
                ['Здания', 'до 3%'],
                ['Сооружения и передаточные устройства', 'до 5%'],
                ['Машины и оборудование', 'до 15%'],
                ['Компьютеры и оргтехника', 'до 20%'],
                ['Транспортные средства', 'до 20%'],
                ['Прочие основные средства', 'до 15%'],
              ].map(([name, rate]) => (
                <tr key={name} className="border-b border-bx-border last:border-0 hover:bg-bx-surface-2">
                  <td className="px-4 py-2.5 text-bx-text">{name}</td>
                  <td className="px-4 py-2.5 text-blue-400 font-mono text-right">{rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 text-[11px] text-amber-400 bg-amber-500/5">⚠ Нормы требуют сверки со ст. НК РУз.</div>
        </div>
      </section>
    </div>
  );
}
