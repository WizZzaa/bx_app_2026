import React from 'react';

// Карточка запланированного инструмента (выбран пользователем, ещё не реализован).
export default function ToolStub({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-dashed border-bx-border-2 bg-bx-surface/50 p-4">
      <div className="flex items-start gap-3">
        <span className="text-xl">{icon}</span>
        <div className="flex-1">
          <div className="text-sm font-medium text-bx-text">{title}</div>
          <div className="text-xs text-bx-muted mt-0.5">{desc}</div>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">скоро</span>
      </div>
    </div>
  );
}
