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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-white/10 rounded-2xl w-[520px] max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-sans"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-white/5 bg-slate-950/40">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center font-extrabold text-white text-sm shadow-md">BX</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-extrabold text-white leading-tight">BX — Помощник Бухгалтера</div>
            <div className="text-[11px] text-slate-400 mt-1">Версия {APP_VERSION} · Для бухгалтеров Узбекистана</div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none transition-colors">×</button>
        </div>

        {/* Changelog */}
        <div className="px-6 py-5 overflow-y-auto space-y-4 bg-slate-900/50">
          <div className="text-[9.5px] font-black text-slate-500 uppercase tracking-widest mb-3">История версий</div>
          <div className="space-y-5">
            {CHANGELOG.map(entry => (
              <div key={entry.version} className="relative pl-5 border-l border-white/5 ml-1">
                <span className="absolute -left-1 top-1.5 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-xs font-black text-white">v{entry.version}</span>
                  <span className="text-[11px] text-blue-400 font-bold">{entry.title}</span>
                  <span className="text-[9px] text-slate-500 ml-auto font-mono">{entry.date}</span>
                </div>
                <ul className="mt-2 space-y-1.5">
                  {entry.changes.map((c, i) => (
                    <li key={i} className="text-[11px] text-slate-300 flex gap-2 items-start leading-relaxed">
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
        <div className="px-6 py-3.5 border-t border-white/5 bg-slate-950/40 text-[10px] text-slate-500 flex justify-between items-center">
          <span>© 2026 BX Software.</span>
          <span className="font-semibold text-slate-600">Все расчёты носят справочный характер</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
