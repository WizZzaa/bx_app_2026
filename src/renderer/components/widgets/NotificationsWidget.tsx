import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadEcpKeys } from '../../lib/ecpStorage';
import { buildNotices, type NoticeLevel, type EcpKeyLite } from '../../lib/notices';

// Виджет оповещений — реальные данные из Планировщика (кэш bx_events)
// и менеджера ЭЦП (bx_ecp_keys). Клик ведёт в соответствующий раздел.
// Логика построения — в lib/notices (общая с трей-агентом).

const styleByLevel: Record<NoticeLevel, { dot: string; chip: string; label: string }> = {
  critical: { dot: 'bg-red-400', chip: 'bg-red-500/10 text-red-400', label: 'Важно' },
  warning: { dot: 'bg-amber-400', chip: 'bg-amber-500/10 text-amber-400', label: 'Срок' },
  info: { dot: 'bg-blue-400', chip: 'bg-blue-500/10 text-blue-400', label: 'Инфо' },
};

export default function NotificationsWidget() {
  const navigate = useNavigate();
  const [ecpKeys, setEcpKeys] = useState<EcpKeyLite[]>([]);
  useEffect(() => { loadEcpKeys().then(setEcpKeys); }, []);
  const notices = useMemo(() => buildNotices(ecpKeys), [ecpKeys]);

  return (
    <div className="rounded-xl border border-bx-border bg-bx-surface p-4 h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-bx-text">🔔 Оповещения</h2>
        <span className="text-[11px] text-bx-muted">{notices.length ? notices.length : 'нет новых'}</span>
      </div>

      {notices.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-2xl mb-1">✓</p>
          <p className="text-sm text-bx-muted">Всё спокойно</p>
          <p className="text-[11px] text-bx-muted mt-0.5">Ни просрочек, ни горящих сроков</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notices.map(n => {
            const s = styleByLevel[n.level];
            return (
              <button key={n.id} onClick={() => navigate(n.to)}
                className="w-full flex items-start gap-2.5 px-3 py-2 rounded-lg bg-bx-bg hover:bg-bx-surface-2 border border-transparent hover:border-blue-500/30 text-left transition-colors">
                <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${s.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-bx-text leading-snug truncate">{n.text}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${s.chip}`}>{s.label}</span>
                    <span className="text-[10px] text-bx-muted">{n.time}</span>
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
