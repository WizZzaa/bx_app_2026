import React, { useState, useEffect, useCallback } from 'react';
import type { BxCard } from './useCards';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[#141820] border border-[#2a3447] rounded-2xl w-[520px] max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2535]">
          <div>
            <h2 className="text-base font-semibold text-white">🗄️ Архив</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Доска «{boardName}»</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-lg leading-none">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-slate-600 text-sm">
              <span className="w-4 h-4 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin mr-2" /> Загрузка...
            </div>
          ) : items.length === 0 ? (
            <p className="text-center text-slate-600 text-sm py-10">Архив пуст</p>
          ) : (
            <div className="space-y-2">
              {items.map(card => (
                <div key={card.id} className="bg-[#0f1117] border border-[#1e2535] rounded-lg px-3 py-2.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-300 truncate">{card.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {card.labels?.slice(0,3).map(l => <span key={l} className="text-[9px] bg-blue-500/15 text-blue-300 px-1.5 py-0.5 rounded">{l}</span>)}
                      {card.due_date && <span className="text-[10px] text-slate-600">📅 {card.due_date}</span>}
                    </div>
                  </div>
                  <button onClick={() => restore(card.id)} className="text-[11px] px-2.5 py-1 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 rounded-lg flex-shrink-0">↩ Вернуть</button>
                  <button onClick={() => del(card.id)} className="text-[11px] text-slate-600 hover:text-red-400 flex-shrink-0">удалить</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
