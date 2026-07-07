import React, { useState, useEffect } from 'react';
import { BOARD_ICONS, COLUMN_COLORS, type BxBoard } from './useBoards';

interface Props {
  board?: BxBoard | null;          // null = создание
  onSave: (name: string, icon: string, color: string) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const DOT: Record<string, string> = {
  slate: 'bg-slate-500', blue: 'bg-blue-500', amber: 'bg-amber-500', emerald: 'bg-emerald-500',
  purple: 'bg-purple-500', red: 'bg-red-500', pink: 'bg-pink-500', cyan: 'bg-cyan-500',
};

export default function BoardModal({ board, onSave, onDelete, onClose }: Props) {
  const [name,  setName]  = useState(board?.name  ?? '');
  const [icon,  setIcon]  = useState(board?.icon  ?? '📋');
  const [color, setColor] = useState(board?.color ?? 'blue');
  const [confirmDel, setConfirmDel] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-bx-surface border border-bx-border-2 rounded-2xl w-[420px] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-bx-border">
          <h2 className="text-base font-semibold text-bx-text">{board ? 'Настройки доски' : 'Новая доска'}</h2>
          <button onClick={onClose} className="text-bx-muted hover:text-bx-text text-lg leading-none">✕</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs text-bx-muted block mb-1.5">Название</label>
            <input autoFocus value={name} onChange={e => setName(e.target.value)}
              placeholder="Напр.: Клиент ООО «Восход»"
              onKeyDown={e => { if (e.key === 'Enter' && name.trim()) onSave(name.trim(), icon, color); }}
              className="w-full bg-bx-bg text-bx-text px-3 py-2.5 rounded-lg border border-bx-border-2 focus:outline-none focus:border-blue-500/50 text-sm" />
          </div>

          <div>
            <label className="text-xs text-bx-muted block mb-1.5">Иконка</label>
            <div className="flex flex-wrap gap-1.5">
              {BOARD_ICONS.map(i => (
                <button key={i} onClick={() => setIcon(i)}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-colors ${icon === i ? 'bg-blue-600/30 ring-1 ring-blue-500/50' : 'bg-bx-surface-2 hover:bg-bx-surface-2'}`}>
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-bx-muted block mb-1.5">Цвет</label>
            <div className="flex gap-2">
              {COLUMN_COLORS.map(col => (
                <button key={col} onClick={() => setColor(col)}
                  className={`w-7 h-7 rounded-full ${DOT[col]} ${color === col ? 'ring-2 ring-offset-2 ring-offset-bx-surface ring-white/40' : ''}`} />
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-bx-border">
          <div>
            {board && onDelete && !board.is_default && (
              confirmDel ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-400">Удалить доску со всеми карточками?</span>
                  <button onClick={onDelete} className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded-lg">Да</button>
                  <button onClick={() => setConfirmDel(false)} className="text-xs text-bx-muted">нет</button>
                </div>
              ) : (
                <button onClick={() => setConfirmDel(true)} className="text-xs text-bx-muted hover:text-red-400">Удалить доску</button>
              )
            )}
            {board?.is_default && <span className="text-[11px] text-bx-muted">Доску по умолчанию нельзя удалить</span>}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-bx-muted hover:text-bx-text">Отмена</button>
            <button onClick={() => name.trim() && onSave(name.trim(), icon, color)} disabled={!name.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg">
              {board ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
