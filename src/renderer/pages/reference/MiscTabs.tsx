import React from 'react';
import { regions, vedItems, statItems, dutyItems, penaltyItems, travelNorms } from '../../data/reference/misc';

function VerifyNote() {
  return <div className="text-[11px] text-amber-400 bg-amber-500/5 rounded-lg px-3 py-2">⚠ Раздел требует наполнения и сверки с официальными источниками.</div>;
}

export function GovTab() {
  return (
    <div className="space-y-4">
      <VerifyNote />
      <h2 className="text-sm font-medium text-slate-400">Налоговые и статистические органы по регионам</h2>
      <div className="rounded-xl border border-bx-border bg-bx-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-bx-border">
              <th className="px-4 py-2.5 font-medium">Регион</th>
              <th className="px-4 py-2.5 font-medium">ГНК (телефон)</th>
              <th className="px-4 py-2.5 font-medium">Статистика</th>
            </tr>
          </thead>
          <tbody>
            {regions.map(r => (
              <tr key={r.name} className="border-b border-bx-border last:border-0 hover:bg-bx-surface-2">
                <td className="px-4 py-2.5 text-slate-300">{r.name}</td>
                <td className="px-4 py-2.5 text-slate-600 text-xs">{r.gnkPhone ?? '— требует заполнения'}</td>
                <td className="px-4 py-2.5 text-slate-600 text-xs">{r.statPhone ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SimpleList({ rows }: { rows: { left: string; right: string; note?: string }[] }) {
  return (
    <div className="rounded-xl border border-bx-border bg-bx-surface overflow-hidden">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-2.5 text-sm border-b border-bx-border last:border-0 hover:bg-bx-surface-2">
          <span className="text-slate-300 flex-1">{r.left}{r.note && <span className="text-slate-600 text-xs"> · {r.note}</span>}</span>
          <span className="text-blue-400 text-xs font-mono">{r.right}</span>
        </div>
      ))}
    </div>
  );
}

export function VedTab() {
  return (
    <div className="space-y-5">
      <VerifyNote />
      <section>
        <h2 className="text-sm font-medium text-slate-400 mb-3">ВЭД</h2>
        <SimpleList rows={vedItems.map(v => ({ left: v.name, right: v.value, note: v.note }))} />
      </section>
      <section>
        <h2 className="text-sm font-medium text-slate-400 mb-3">Командировочные (суточные)</h2>
        <SimpleList rows={travelNorms.map(t => ({ left: t.name + (t.verified ? '  ✓' : ''), right: t.value, note: t.note }))} />
      </section>
      <section>
        <h2 className="text-sm font-medium text-slate-400 mb-3">Статистика</h2>
        <SimpleList rows={statItems.map(s => ({ left: s.name, right: '', note: s.note }))} />
      </section>
      <section>
        <h2 className="text-sm font-medium text-slate-400 mb-3">Госпошлина</h2>
        <SimpleList rows={dutyItems.map(d => ({ left: d.name, right: d.value }))} />
      </section>
    </div>
  );
}

export function LawTab() {
  return (
    <div className="space-y-4">
      <VerifyNote />
      <h2 className="text-sm font-medium text-slate-400">Штрафы и санкции</h2>
      <div className="rounded-xl border border-bx-border bg-bx-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-bx-border">
              <th className="px-4 py-2.5 font-medium">Нарушение</th>
              <th className="px-4 py-2.5 font-medium">Санкция</th>
              <th className="px-4 py-2.5 font-medium">Основание</th>
            </tr>
          </thead>
          <tbody>
            {penaltyItems.map((p, i) => (
              <tr key={i} className="border-b border-bx-border last:border-0 hover:bg-bx-surface-2">
                <td className="px-4 py-2.5 text-slate-300">{p.name}</td>
                <td className="px-4 py-2.5 text-slate-500 text-xs">{p.value}</td>
                <td className="px-4 py-2.5 text-slate-600 text-xs">{p.basis}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
