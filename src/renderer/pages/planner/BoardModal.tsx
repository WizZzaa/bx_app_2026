import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BOARD_ICONS, COLUMN_COLORS, type BxBoard } from './useBoards';
import Icon from '../../lib/ui/Icon';
import './PlannerA2.css';

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

  return createPortal(
    <div className="bx-sheet-scrim fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="board-modal-title" className="bx-sheet bx-board-sheet w-full max-w-[29rem] overflow-hidden">
        <header className="bx-sheet__header flex items-start justify-between gap-4 px-6 py-5">
          <div><p className="bx-planner-eyebrow text-[11px] font-black">Рабочее пространство</p><h2 id="board-modal-title" className="mt-1 text-xl font-black text-bx-text">{board ? 'Настройки доски' : 'Новая доска'}</h2><p className="mt-1 text-xs leading-relaxed text-bx-muted">Название, символ и мягкий цвет помогут быстро отличить контекст.</p></div>
          <button type="button" onClick={onClose} aria-label="Закрыть" className="bx-sheet__close"><Icon name="crossSmall" /></button>
        </header>

        <div className="bx-sheet__body space-y-5 px-6 py-5">
          <div>
            <label className="text-xs text-bx-muted block mb-1.5">Название</label>
            <input autoFocus value={name} onChange={e => setName(e.target.value)}
              placeholder="Напр.: Клиент ООО «Восход»"
              onKeyDown={e => { if (e.key === 'Enter' && name.trim()) onSave(name.trim(), icon, color); }}
              className="bx-sheet-input w-full" />
          </div>

          <div>
            <label className="text-xs text-bx-muted block mb-1.5">Иконка</label>
            <div className="flex flex-wrap gap-1.5">
              {BOARD_ICONS.map(i => (
                <button key={i} onClick={() => setIcon(i)}
                  aria-pressed={icon === i}
                  className={`bx-board-icon ${icon === i ? 'is-active' : ''}`}>
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
                  aria-label={`Цвет ${col}`}
                  aria-pressed={color === col}
                  className={`bx-board-color ${DOT[col]} ${color === col ? 'is-active' : ''}`} />
              ))}
            </div>
          </div>
        </div>

        <footer className="bx-sheet__footer flex flex-wrap items-center justify-between gap-3 px-6 py-4">
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
              className="bx-planner-primary min-h-11 rounded-xl px-5 text-sm font-black disabled:opacity-40">
              {board ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
