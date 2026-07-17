import React from 'react';
import ReactDOM from 'react-dom';
import { APP_VERSION, CHANGELOG } from '../../shared/version';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AboutModal({ open, onClose }: Props) {
  if (!open) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-bx-surface border border-bx-border rounded-2xl w-[520px] max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-sans text-bx-text"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-bx-border bg-bx-surface-2/30">
          <img src="./icon.png" alt="Иконка BX" className="h-11 w-11 rounded-xl shadow-md" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-extrabold text-bx-text leading-tight">BX — Помощник Бухгалтера</div>
            <div className="text-[11px] text-bx-muted mt-1">Версия {APP_VERSION} · Для бухгалтеров Узбекистана</div>
          </div>
          <button onClick={onClose} className="text-bx-muted hover:text-bx-text text-2xl leading-none transition-colors cursor-pointer">×</button>
        </div>

        {/* Changelog */}
        <div className="px-6 py-5 overflow-y-auto space-y-4 bg-bx-surface/50 custom-scrollbar">
          <div className="text-[9.5px] font-black text-bx-muted uppercase tracking-widest mb-3">История версий</div>
          <div className="space-y-5">
            {CHANGELOG.map(entry => (
              <div key={entry.version} className="relative pl-5 border-l border-bx-border/80 ml-1">
                <span className="absolute -left-1 top-1.5 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-xs font-black text-bx-text">v{entry.version}</span>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-bold">{entry.title}</span>
                  <span className="text-[9px] text-bx-muted ml-auto font-mono">{entry.date}</span>
                </div>
                <ul className="mt-2 space-y-1.5">
                  {entry.changes.map((c, i) => (
                    <li key={i} className="text-[11px] text-bx-text/80 flex gap-2 items-start leading-relaxed">
                      <span className="text-blue-500">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-bx-border bg-bx-surface-2/30 text-[10px] text-bx-muted flex justify-between items-center">
          <span>© 2026 BX Software.</span>
          <span className="font-semibold text-bx-muted/80">Все расчёты носят справочный характер</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
