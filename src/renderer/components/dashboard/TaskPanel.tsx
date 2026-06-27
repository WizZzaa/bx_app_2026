import React, { useState } from 'react';
import { tasksRepo, TaskRow } from '../../lib/db/tasksRepo';
import { useCompany } from '../../lib/CompanyContext';

const statusMeta: Record<TaskRow['status'], { label: string; color: string; icon: string }> = {
  todo: { label: 'К выполнению', color: 'text-slate-400', icon: '○' },
  in_progress: { label: 'В работе', color: 'text-amber-400', icon: '◐' },
  done: { label: 'Готово', color: 'text-green-400', icon: '●' },
};

interface Props {
  tasks: TaskRow[];
  onChange: () => void;
}

export default function TaskPanel({ tasks, onChange }: Props) {
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const { active } = useCompany();

  async function add() {
    const t = title.trim();
    if (!t || busy) return;
    setBusy(true);
    try {
      await tasksRepo.add({ title: t, status: 'todo', priority: 'normal', due_date: null, company_id: active?.id ?? null, source: 'manual' });
      setTitle('');
      onChange();
    } finally { setBusy(false); }
  }

  function fmtDate(d: string | null) {
    if (!d) return null;
    const [, m, day] = d.split('-');
    return `${day}.${m}`;
  }

  return (
    <div className="rounded-xl border border-[#1e2535] bg-[#141820] p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-slate-300">📋 Задачи и напоминания</h2>
        <span className="text-[11px] text-slate-500">{tasks.filter(t => t.status !== 'done').length} активных</span>
      </div>

      <div className="flex gap-2 mb-3">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder={active ? `Задача для «${active.name}»…` : 'Новая задача…'}
          className="flex-1 bg-[#0f1117] text-slate-200 placeholder-slate-600 text-sm px-3 py-1.5 rounded-lg border border-[#1e2535] focus:outline-none focus:border-blue-500/50"
        />
        <button onClick={add} disabled={busy} className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm">+</button>
      </div>

      {tasks.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-6">Задач нет. Добавьте вручную или из календаря.</p>
      ) : (
        <div className="space-y-1.5 max-h-72 overflow-y-auto">
          {tasks.map(t => {
            const sm = statusMeta[t.status];
            return (
              <div key={t.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#0f1117] group">
                <button onClick={async () => { await tasksRepo.cycleStatus(t.id, t.status); onChange(); }} className={`${sm.color} text-sm`} title={sm.label}>
                  {sm.icon}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm truncate ${t.status === 'done' ? 'text-slate-600 line-through' : 'text-slate-200'}`}>{t.title}</div>
                  <div className="flex items-center gap-2">
                    {t.source === 'tax' && <span className="text-[10px] text-amber-400/80">налог. календарь</span>}
                    {t.due_date && <span className="text-[10px] text-slate-500">до {fmtDate(t.due_date)}</span>}
                  </div>
                </div>
                <button
                  onClick={async () => { await tasksRepo.remove(t.id); onChange(); }}
                  className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
