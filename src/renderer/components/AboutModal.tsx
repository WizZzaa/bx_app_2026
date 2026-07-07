import React from 'react';
import { APP_VERSION, CHANGELOG } from '../../shared/version';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AboutModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-bx-surface border border-bx-border rounded-2xl w-[520px] max-h-[80vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-bx-border">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white">BX</div>
          <div className="flex-1">
            <div className="text-base font-semibold text-bx-text">BX — Помощник Бухгалтера</div>
            <div className="text-xs text-bx-muted">Версия {APP_VERSION} · для бухгалтеров Узбекистана</div>
          </div>
          <button onClick={onClose} className="text-bx-muted hover:text-bx-text text-xl leading-none">×</button>
        </div>

        {/* Changelog */}
        <div className="px-6 py-4 overflow-y-auto">
          <div className="text-xs font-medium text-bx-muted uppercase tracking-wide mb-3">История версий</div>
          <div className="space-y-4">
            {CHANGELOG.map(entry => (
              <div key={entry.version} className="relative pl-5">
                <span className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-blue-500" />
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-bx-text">v{entry.version}</span>
                  <span className="text-xs text-blue-400">{entry.title}</span>
                  <span className="text-[10px] text-bx-muted ml-auto">{entry.date}</span>
                </div>
                <ul className="mt-1.5 space-y-1">
                  {entry.changes.map((c, i) => (
                    <li key={i} className="text-xs text-bx-muted flex gap-2">
                      <span className="text-bx-muted">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-bx-border text-[11px] text-bx-muted">
          © 2026 BX. Все расчёты носят справочный характер.
        </div>
      </div>
    </div>
  );
}
