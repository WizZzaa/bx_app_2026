import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { todayISO } from '../../lib/dates';
import { loadEcpKeys } from '../../lib/ecpStorage';

// Виджет оповещений — реальные данные из Планировщика (кэш bx_events)
// и менеджера ЭЦП (bx_ecp_keys). Клик ведёт в соответствующий раздел.

type Level = 'critical' | 'warning' | 'info';

interface Notice {
  id: string;
  level: Level;
  text: string;
  time: string;
  to: string; // маршрут по клику
}

const styleByLevel: Record<Level, { dot: string; chip: string; label: string }> = {
  critical: { dot: 'bg-red-400', chip: 'bg-red-500/10 text-red-400', label: 'Важно' },
  warning: { dot: 'bg-amber-400', chip: 'bg-amber-500/10 text-amber-400', label: 'Срок' },
  info: { dot: 'bg-blue-400', chip: 'bg-blue-500/10 text-blue-400', label: 'Инфо' },
};

interface CachedEvent { type: string; title: string; date: string; due_date?: string | null; status: string }
interface EcpKey { name: string; expiresAt: string }

function daysTo(dateISO: string, today: string): number {
  return Math.round((new Date(dateISO).getTime() - new Date(today).getTime()) / 86400000);
}

function buildNotices(keys: EcpKey[]): Notice[] {
  const today = todayISO();
  const notices: Notice[] = [];

  let events: CachedEvent[] = [];
  try { events = JSON.parse(localStorage.getItem('bx_events_cache_v1') || '[]'); } catch { /* пусто */ }
  const active = events.filter(e => e.status !== 'done');

  // Просроченные задачи и напоминания
  const overdue = active.filter(e => {
    const d = e.due_date || e.date;
    return d < today && (e.type === 'task' || e.type === 'reminder');
  });
  if (overdue.length) {
    notices.push({
      id: 'overdue', level: 'critical', to: '/planner',
      text: overdue.length === 1
        ? `Просрочено: ${overdue[0].title}`
        : `Просрочено задач: ${overdue.length} — «${overdue[0].title}»${overdue.length > 1 ? ' и другие' : ''}`,
      time: 'требует внимания',
    });
  }

  // Ближайшие налоговые дедлайны (7 дней)
  const deadlines = active
    .filter(e => e.type === 'tax_deadline')
    .map(e => ({ e, d: daysTo(e.due_date || e.date, today) }))
    .filter(x => x.d >= 0 && x.d <= 7)
    .sort((a, b) => a.d - b.d);
  for (const { e, d } of deadlines.slice(0, 2)) {
    notices.push({
      id: `dl-${e.title}-${d}`, level: d <= 2 ? 'critical' : 'warning', to: '/planner',
      text: e.title,
      time: d === 0 ? 'сегодня' : d === 1 ? 'завтра' : `через ${d} дн.`,
    });
  }

  // Задачи на сегодня
  const todayTasks = active.filter(e => (e.due_date || e.date) === today && e.type === 'task');
  if (todayTasks.length) {
    notices.push({
      id: 'today', level: 'info', to: '/planner',
      text: `Задач на сегодня: ${todayTasks.length}`,
      time: 'сегодня',
    });
  }

  // ЭЦП: истекающие ключи
  const expiring = keys
    .map(k => ({ k, d: daysTo(k.expiresAt.slice(0, 10), today) }))
    .filter(x => x.d >= 0 && x.d <= 30)
    .sort((a, b) => a.d - b.d);
  for (const { k, d } of expiring.slice(0, 2)) {
    notices.push({
      id: `ecp-${k.name}`, level: d <= 14 ? 'critical' : 'warning', to: '/ecp',
      text: `ЭЦП «${k.name}» истекает`,
      time: d === 0 ? 'сегодня' : `через ${d} дн.`,
    });
  }

  const order: Level[] = ['critical', 'warning', 'info'];
  return notices.sort((a, b) => order.indexOf(a.level) - order.indexOf(b.level)).slice(0, 5);
}

export default function NotificationsWidget() {
  const navigate = useNavigate();
  const [ecpKeys, setEcpKeys] = useState<EcpKey[]>([]);
  useEffect(() => { loadEcpKeys().then(setEcpKeys); }, []);
  const notices = useMemo(() => buildNotices(ecpKeys), [ecpKeys]);

  return (
    <div className="rounded-xl border border-[#1e2535] bg-[#141820] p-4 h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-slate-300">🔔 Оповещения</h2>
        <span className="text-[11px] text-slate-500">{notices.length ? notices.length : 'нет новых'}</span>
      </div>

      {notices.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-2xl mb-1">✓</p>
          <p className="text-sm text-slate-500">Всё спокойно</p>
          <p className="text-[11px] text-slate-600 mt-0.5">Ни просрочек, ни горящих сроков</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notices.map(n => {
            const s = styleByLevel[n.level];
            return (
              <button key={n.id} onClick={() => navigate(n.to)}
                className="w-full flex items-start gap-2.5 px-3 py-2 rounded-lg bg-[#0f1117] hover:bg-[#1a2030] border border-transparent hover:border-blue-500/30 text-left transition-colors">
                <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${s.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-300 leading-snug truncate">{n.text}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${s.chip}`}>{s.label}</span>
                    <span className="text-[10px] text-slate-500">{n.time}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
