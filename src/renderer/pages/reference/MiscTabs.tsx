import React from 'react';
import { regions, vedItems, statItems, dutyItems, penaltyItems, travelNorms } from '../../data/reference/misc';
import Icon from '../../lib/ui/Icon';
import DataTable from '../../components/ui/DataTable';
import ListPanel, { ListPanelItem } from '../../components/ui/ListPanel';

function VerifyNote() {
  return <div className="flex items-center gap-2 rounded-xl border border-amber-500/15 bg-amber-500/[0.07] px-3 py-2.5 text-[11px] text-amber-800 dark:text-amber-300"><Icon name="alert" className="h-4 w-4 flex-shrink-0" />Раздел требует наполнения и сверки с официальными источниками.</div>;
}

export function GovTab() {
  return (
    <div className="space-y-4">
      <VerifyNote />
      <h2 className="text-sm font-black text-bx-text">Налоговые и статистические органы по регионам</h2>
      <DataTable label="Налоговые и статистические органы по регионам">
          <thead>
            <tr className="text-left text-xs text-bx-muted border-b border-bx-border">
              <th className="px-4 py-2.5 font-medium">Регион</th>
              <th className="px-4 py-2.5 font-medium">ГНК (телефон)</th>
              <th className="px-4 py-2.5 font-medium">Статистика</th>
            </tr>
          </thead>
          <tbody>
            {regions.map(r => (
              <tr key={r.name} className="border-b border-bx-border last:border-0 hover:bg-bx-surface-2">
                <td className="px-4 py-2.5 text-bx-text">{r.name}</td>
                <td className="px-4 py-2.5 text-bx-muted text-xs">{r.gnkPhone ?? '— требует заполнения'}</td>
                <td className="px-4 py-2.5 text-bx-muted text-xs">{r.statPhone ?? '—'}</td>
              </tr>
            ))}
          </tbody>
      </DataTable>
    </div>
  );
}

function SimpleList({ rows }: { rows: { left: string; right: string; note?: string }[] }) {
  return (
    <ListPanel label="Справочные значения">
      {rows.map((r, i) => (
        <ListPanelItem key={i} className="flex items-center gap-3 text-sm hover:bg-bx-surface-2">
          <span className="text-bx-text flex-1">{r.left}{r.note && <span className="text-bx-muted text-xs"> · {r.note}</span>}</span>
          <span className="text-blue-400 text-xs font-mono">{r.right}</span>
        </ListPanelItem>
      ))}
    </ListPanel>
  );
}

export function VedTab() {
  return (
    <div className="space-y-5">
      <VerifyNote />
      <section>
        <h2 className="mb-3 text-sm font-black text-bx-text">ВЭД</h2>
        <SimpleList rows={vedItems.map(v => ({ left: v.name, right: v.value, note: v.note }))} />
      </section>
      <section>
        <h2 className="mb-3 text-sm font-black text-bx-text">Командировочные (суточные)</h2>
        <SimpleList rows={travelNorms.map(t => ({ left: t.name + (t.verified ? '  ✓' : ''), right: t.value, note: t.note }))} />
      </section>
      <section>
        <h2 className="mb-3 text-sm font-black text-bx-text">Статистика</h2>
        <SimpleList rows={statItems.map(s => ({ left: s.name, right: '', note: s.note }))} />
      </section>
      <section>
        <h2 className="mb-3 text-sm font-black text-bx-text">Госпошлина</h2>
        <SimpleList rows={dutyItems.map(d => ({ left: d.name, right: d.value }))} />
      </section>
    </div>
  );
}

export function LawTab() {
  return (
    <div className="space-y-4">
      <VerifyNote />
      <h2 className="text-sm font-black text-bx-text">Штрафы и санкции</h2>
      <DataTable label="Штрафы и санкции">
          <thead>
            <tr className="text-left text-xs text-bx-muted border-b border-bx-border">
              <th className="px-4 py-2.5 font-medium">Нарушение</th>
              <th className="px-4 py-2.5 font-medium">Санкция</th>
              <th className="px-4 py-2.5 font-medium">Основание</th>
            </tr>
          </thead>
          <tbody>
            {penaltyItems.map((p, i) => (
              <tr key={i} className="border-b border-bx-border last:border-0 hover:bg-bx-surface-2">
                <td className="px-4 py-2.5 text-bx-text">{p.name}</td>
                <td className="px-4 py-2.5 text-bx-muted text-xs">{p.value}</td>
                <td className="px-4 py-2.5 text-bx-muted text-xs">{p.basis}</td>
              </tr>
            ))}
          </tbody>
      </DataTable>
    </div>
  );
}
