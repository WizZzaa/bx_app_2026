import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { BxCard } from './useCards';
import Icon from '../../lib/ui/Icon';
import './PlannerA2.css';

interface Props {
  boardName: string;
  loadArchived: () => Promise<BxCard[]>;
  onRestore: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}

export default function ArchivePanel({ boardName, loadArchived, onRestore, onDelete, onClose }: Props) {
  const [items, setItems]     = useState<BxCard[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setItems(await loadArchived());
    setLoading(false);
  }, [loadArchived]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function restore(id: string) { await onRestore(id); setItems(prev => prev.filter(c => c.id !== id)); }
  async function del(id: string)     { await onDelete(id);  setItems(prev => prev.filter(c => c.id !== id)); }

  return createPortal(
    <div className="bx-sheet-scrim fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="archive-panel-title" className="bx-sheet flex max-h-[80vh] w-full max-w-[34rem] flex-col overflow-hidden">
        <header className="bx-sheet__header flex items-start justify-between gap-4 px-6 py-5">
          <div>
            <p className="bx-planner-eyebrow text-[11px] font-black">Завершённая работа</p>
            <h2 id="archive-panel-title" className="mt-1 text-xl font-black text-bx-text">Архив</h2>
            <p className="mt-1 text-xs text-bx-muted">Доска «{boardName}»</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Закрыть" className="bx-sheet__close"><Icon name="crossSmall" /></button>
        </header>

        <div className="bx-sheet__body flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-bx-muted text-sm">
              <span className="w-4 h-4 border-2 border-bx-border-2 border-t-blue-500 rounded-full animate-spin mr-2" /> Загрузка...
            </div>
          ) : items.length === 0 ? (
            <p className="text-center text-bx-muted text-sm py-10">Архив пуст</p>
          ) : (
            <div className="space-y-2">
              {items.map(card => (
                <div key={card.id} className="bg-bx-bg border border-bx-border rounded-lg px-3 py-2.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-bx-text truncate">{card.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {card.labels?.slice(0,3).map(l => <span key={l} className="text-[9px] bg-blue-500/15 text-blue-300 px-1.5 py-0.5 rounded">{l}</span>)}
                      {card.due_date && <span className="text-[10px] text-bx-muted">📅 {card.due_date}</span>}
                    </div>
                  </div>
                  <button onClick={() => restore(card.id)} className="text-[11px] px-2.5 py-1 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 rounded-lg flex-shrink-0">↩ Вернуть</button>
                  <button onClick={() => del(card.id)} className="text-[11px] text-bx-muted hover:text-red-400 flex-shrink-0">удалить</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>,
    document.body,
  );
}
