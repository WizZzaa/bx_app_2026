import React from 'react';

// Виджет оповещений. Позже будет получать данные с сервера (критические
// изменения законодательства) и из локальных событий (дедлайны, ЭЦП).

type Level = 'critical' | 'warning' | 'info';

interface Notice {
  id: number;
  level: Level;
  text: string;
  time: string;
}

const demo: Notice[] = [
  { id: 1, level: 'critical', text: 'Изменена ставка рефинансирования ЦБ РУз', time: 'сегодня' },
  { id: 2, level: 'warning', text: 'До сдачи НДС осталось 3 дня', time: 'завтра' },
  { id: 3, level: 'info', text: 'Опубликованы новые разъяснения ГНК', time: '2 дня назад' },
];

const styleByLevel: Record<Level, { dot: string; chip: string; label: string }> = {
  critical: { dot: 'bg-red-400', chip: 'bg-red-500/10 text-red-400', label: 'Важно' },
  warning: { dot: 'bg-amber-400', chip: 'bg-amber-500/10 text-amber-400', label: 'Срок' },
  info: { dot: 'bg-blue-400', chip: 'bg-blue-500/10 text-blue-400', label: 'Инфо' },
};

export default function NotificationsWidget() {
  return (
    <div className="rounded-xl border border-[#1e2535] bg-[#141820] p-4 h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-slate-300">🔔 Оповещения</h2>
        <span className="text-[11px] text-slate-500">{demo.length} новых</span>
      </div>

      <div className="space-y-2">
        {demo.map(n => {
          const s = styleByLevel[n.level];
          return (
            <div key={n.id} className="flex items-start gap-2.5 px-3 py-2 rounded-lg bg-[#0f1117]">
              <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${s.dot}`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-300 leading-snug">{n.text}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${s.chip}`}>{s.label}</span>
                  <span className="text-[10px] text-slate-500">{n.time}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
