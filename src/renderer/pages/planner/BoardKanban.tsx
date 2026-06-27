import React, { useState, useMemo } from 'react';
import type { BxCard } from './useCards';
import type { BxBoard, BoardColumn } from './useBoards';
import { COLUMN_COLORS } from './useBoards';
import { uid } from '../../lib/uid';

interface Props {
  board: BxBoard;
  cards: BxCard[];
  onCardClick: (card: BxCard) => void;
  onAddCard: (columnId: string, title: string) => void;
  onMoveCard: (cardId: string, toColumn: string, beforeCardId: string | null) => void;
  onUpdateColumns: (columns: BoardColumn[]) => void;
  onOpenArchive: () => void;
}

const COLOR_MAP: Record<string, { border: string; dot: string; text: string; ring: string }> = {
  slate:   { border: 'border-slate-600/40',   dot: 'bg-slate-500',   text: 'text-slate-300',   ring: 'ring-slate-500' },
  blue:    { border: 'border-blue-500/40',    dot: 'bg-blue-500',    text: 'text-blue-300',    ring: 'ring-blue-500' },
  amber:   { border: 'border-amber-500/40',   dot: 'bg-amber-500',   text: 'text-amber-300',   ring: 'ring-amber-500' },
  emerald: { border: 'border-emerald-500/40', dot: 'bg-emerald-500', text: 'text-emerald-300', ring: 'ring-emerald-500' },
  purple:  { border: 'border-purple-500/40',  dot: 'bg-purple-500',  text: 'text-purple-300',  ring: 'ring-purple-500' },
  red:     { border: 'border-red-500/40',     dot: 'bg-red-500',     text: 'text-red-300',     ring: 'ring-red-500' },
  pink:    { border: 'border-pink-500/40',    dot: 'bg-pink-500',    text: 'text-pink-300',    ring: 'ring-pink-500' },
  cyan:    { border: 'border-cyan-500/40',    dot: 'bg-cyan-500',    text: 'text-cyan-300',    ring: 'ring-cyan-500' },
};
const c = (color: string) => COLOR_MAP[color] ?? COLOR_MAP.slate;

const PRIORITY_DOT: Record<string, string> = { high: 'bg-red-500', normal: 'bg-yellow-500', low: 'bg-green-500' };

function fmtDate(d: string | null): { text: string; overdue: boolean } | null {
  if (!d) return null;
  const dt = new Date(d);
  const today = new Date(); today.setHours(0,0,0,0);
  const diffD = Math.ceil((dt.getTime() - today.getTime()) / 86400000);
  if (diffD < 0)  return { text: `просрочено ${Math.abs(diffD)} д.`, overdue: true };
  if (diffD === 0) return { text: 'сегодня', overdue: false };
  if (diffD === 1) return { text: 'завтра', overdue: false };
  return { text: dt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }), overdue: false };
}

function isOverdue(card: BxCard): boolean {
  if (!card.due_date) return false;
  const today = new Date(); today.setHours(0,0,0,0);
  return new Date(card.due_date) < today;
}

export default function BoardKanban({ board, cards, onCardClick, onAddCard, onMoveCard, onUpdateColumns, onOpenArchive }: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragColId, setDragColId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ col: string; before: string | null } | null>(null);
  const [colDropIdx, setColDropIdx] = useState<number | null>(null);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [editCol, setEditCol] = useState<string | null>(null);
  const [colName, setColName] = useState('');
  const [menuCol, setMenuCol] = useState<string | null>(null);

  // ─── filters ───
  const [search, setSearch] = useState('');
  const [prioF, setPrioF] = useState('');
  const [labelF, setLabelF] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);

  const columns = board.columns;

  const allLabels = useMemo(() => {
    const s = new Set<string>();
    cards.forEach(c => c.labels?.forEach(l => s.add(l)));
    return [...s].sort();
  }, [cards]);

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cards.filter(card => {
      if (q && !(card.title.toLowerCase().includes(q) || (card.description ?? '').toLowerCase().includes(q))) return false;
      if (prioF && card.priority !== prioF) return false;
      if (labelF && !(card.labels ?? []).includes(labelF)) return false;
      if (overdueOnly && !isOverdue(card)) return false;
      return true;
    });
  }, [cards, search, prioF, labelF, overdueOnly]);

  const filterActive = Boolean(search || prioF || labelF || overdueOnly);

  // ─── card drag ───
  function onCardDragStart(e: React.DragEvent, id: string) {
    setDragId(id); setDragColId(null);
    e.dataTransfer.effectAllowed = 'move';
  }
  function onCardDragOver(e: React.DragEvent, col: string, cardId: string) {
    if (dragColId) return;
    e.preventDefault(); e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const before = e.clientY < rect.top + rect.height / 2;
    const colCards = filteredCards.filter(x => x.column_id === col).sort((a,b)=>a.position-b.position);
    const idx = colCards.findIndex(x => x.id === cardId);
    const beforeId = before ? cardId : (colCards[idx+1]?.id ?? null);
    setDropTarget({ col, before: beforeId });
  }

  // ─── column drag ───
  function onColHeaderDragStart(e: React.DragEvent, colId: string) {
    setDragColId(colId); setDragId(null);
    e.dataTransfer.effectAllowed = 'move';
  }
  function onColumnDragOver(e: React.DragEvent, col: BoardColumn, index: number) {
    e.preventDefault();
    if (dragColId) {
      setColDropIdx(index);
    } else if (dragId) {
      if (!dropTarget || dropTarget.col !== col.id) setDropTarget({ col: col.id, before: null });
    }
  }
  function onColumnDrop(e: React.DragEvent, col: BoardColumn, index: number) {
    e.preventDefault();
    if (dragColId) {
      const from = columns.findIndex(x => x.id === dragColId);
      if (from !== -1 && from !== index) {
        const next = [...columns];
        const [moved] = next.splice(from, 1);
        next.splice(index, 0, moved);
        onUpdateColumns(next);
      }
    } else if (dragId) {
      onMoveCard(dragId, dropTarget?.col ?? col.id, dropTarget?.before ?? null);
    }
    setDragId(null); setDragColId(null); setDropTarget(null); setColDropIdx(null);
  }
  function onDragEnd() { setDragId(null); setDragColId(null); setDropTarget(null); setColDropIdx(null); }

  // ─── add card ───
  function submitNewCard(col: string) {
    if (newTitle.trim()) onAddCard(col, newTitle.trim());
    setNewTitle(''); setAddingTo(null);
  }

  // ─── column ops ───
  function renameColumn(id: string) {
    if (colName.trim()) onUpdateColumns(columns.map(x => x.id === id ? { ...x, title: colName.trim() } : x));
    setEditCol(null); setColName('');
  }
  function setColumnColor(id: string, color: string) {
    onUpdateColumns(columns.map(x => x.id === id ? { ...x, color } : x));
    setMenuCol(null);
  }
  function deleteColumn(id: string) { onUpdateColumns(columns.filter(x => x.id !== id)); setMenuCol(null); }
  function moveColumn(id: string, dir: -1 | 1) {
    const idx = columns.findIndex(x => x.id === id);
    const swap = idx + dir;
    if (swap < 0 || swap >= columns.length) return;
    const next = [...columns];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    onUpdateColumns(next); setMenuCol(null);
  }
  function addColumn() {
    onUpdateColumns([...columns, { id: uid(), title: 'Новая колонка', color: 'slate', wip: null }]);
  }

  const selCls = 'bg-[#0f1117] text-slate-300 text-[11px] px-2 py-1 rounded-lg border border-[#2a3447] focus:outline-none focus:border-blue-500/50';

  return (
    <div className="flex flex-col h-full" onClick={() => setMenuCol(null)}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3 flex-shrink-0 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Поиск карточек..."
          className="bg-[#0f1117] text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-[#2a3447] focus:outline-none focus:border-blue-500/50 w-52" />
        <select value={prioF} onChange={e => setPrioF(e.target.value)} className={selCls}>
          <option value="">Приоритет: все</option>
          <option value="high">🔴 Высокий</option>
          <option value="normal">🟡 Средний</option>
          <option value="low">🟢 Низкий</option>
        </select>
        {allLabels.length > 0 && (
          <select value={labelF} onChange={e => setLabelF(e.target.value)} className={selCls}>
            <option value="">Метка: все</option>
            {allLabels.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        )}
        <button onClick={() => setOverdueOnly(v => !v)}
          className={`text-[11px] px-2.5 py-1 rounded-lg transition-colors ${overdueOnly ? 'bg-red-500/20 text-red-400' : 'bg-[#0f1117] border border-[#2a3447] text-slate-500 hover:text-slate-300'}`}>
          ⚠ Просроченные
        </button>
        {filterActive && (
          <button onClick={() => { setSearch(''); setPrioF(''); setLabelF(''); setOverdueOnly(false); }}
            className="text-[11px] text-slate-600 hover:text-slate-400">сбросить</button>
        )}
        <button onClick={onOpenArchive} className="ml-auto text-[11px] text-slate-500 hover:text-slate-300 px-2 py-1">🗄️ Архив</button>
      </div>

      {/* Columns */}
      <div className="flex gap-3 flex-1 overflow-x-auto pb-2">
        {columns.map((col, index) => {
          const colCards = filteredCards.filter(x => x.column_id === col.id).sort((a,b)=>a.position-b.position);
          const totalInCol = cards.filter(x => x.column_id === col.id).length;
          const cc = c(col.color);
          const overLimit = col.wip != null && totalInCol > col.wip;
          const isColDropActive = dragId && dropTarget?.col === col.id;
          const isColReorderTarget = dragColId && colDropIdx === index;

          return (
            <div key={col.id}
              className={`flex flex-col flex-shrink-0 w-[270px] rounded-xl border bg-[#141820]/50 transition-colors ${isColDropActive ? 'border-blue-500/60 bg-blue-500/5' : isColReorderTarget ? 'border-cyan-500/60' : cc.border} ${dragColId === col.id ? 'opacity-40' : ''}`}
              onDragOver={e => onColumnDragOver(e, col, index)}
              onDrop={e => onColumnDrop(e, col, index)}
            >
              {/* Column header (draggable for reorder) */}
              <div
                draggable={editCol !== col.id}
                onDragStart={e => onColHeaderDragStart(e, col.id)}
                onDragEnd={onDragEnd}
                className="flex items-center justify-between px-3 py-2.5 border-b border-[#1e2535] relative cursor-grab active:cursor-grabbing">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cc.dot}`} />
                  {editCol === col.id ? (
                    <input autoFocus value={colName} onChange={e => setColName(e.target.value)}
                      onBlur={() => renameColumn(col.id)}
                      onKeyDown={e => { if (e.key === 'Enter') renameColumn(col.id); if (e.key === 'Escape') setEditCol(null); }}
                      className="bg-[#0f1117] text-slate-200 text-xs px-1.5 py-0.5 rounded border border-blue-500/50 focus:outline-none flex-1 min-w-0" />
                  ) : (
                    <span onDoubleClick={() => { setEditCol(col.id); setColName(col.title); }}
                      className={`text-xs font-semibold truncate ${cc.text}`}>{col.title}</span>
                  )}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${overLimit ? 'bg-red-500/20 text-red-400' : 'bg-[#1e2535] text-slate-500'}`}>
                    {filterActive ? `${colCards.length}/${totalInCol}` : totalInCol}{col.wip != null ? ` · ${col.wip}` : ''}
                  </span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setMenuCol(menuCol === col.id ? null : col.id); }}
                  className="text-slate-600 hover:text-slate-300 px-1 leading-none flex-shrink-0">⋯</button>

                {menuCol === col.id && (
                  <div onClick={e => e.stopPropagation()}
                    className="absolute right-2 top-9 z-20 bg-[#1a1f2b] border border-[#2a3447] rounded-lg shadow-xl py-1 w-44 text-xs">
                    <button onClick={() => { setEditCol(col.id); setColName(col.title); setMenuCol(null); }} className="w-full text-left px-3 py-1.5 text-slate-300 hover:bg-[#252c3a]">✏️ Переименовать</button>
                    <div className="px-3 py-1.5">
                      <p className="text-[10px] text-slate-600 mb-1">Цвет</p>
                      <div className="flex flex-wrap gap-1">
                        {COLUMN_COLORS.map(col2 => (
                          <button key={col2} onClick={() => setColumnColor(col.id, col2)}
                            className={`w-4 h-4 rounded-full ${c(col2).dot} ${col.color === col2 ? 'ring-2 ring-offset-1 ring-offset-[#1a1f2b] ' + c(col2).ring : ''}`} />
                        ))}
                      </div>
                    </div>
                    <div className="px-3 py-1.5 flex items-center gap-2">
                      <span className="text-[10px] text-slate-600">WIP-лимит</span>
                      <input type="number" min={0} defaultValue={col.wip ?? ''} placeholder="нет"
                        onBlur={e => { const v = e.target.value ? parseInt(e.target.value) : null; onUpdateColumns(columns.map(x => x.id === col.id ? { ...x, wip: v } : x)); }}
                        className="w-12 bg-[#0f1117] text-slate-200 text-[10px] px-1.5 py-0.5 rounded border border-[#2a3447] focus:outline-none" />
                    </div>
                    <div className="border-t border-[#2a3447] my-1" />
                    <button onClick={() => moveColumn(col.id, -1)} className="w-full text-left px-3 py-1.5 text-slate-400 hover:bg-[#252c3a]">← Влево</button>
                    <button onClick={() => moveColumn(col.id, 1)} className="w-full text-left px-3 py-1.5 text-slate-400 hover:bg-[#252c3a]">Вправо →</button>
                    <div className="border-t border-[#2a3447] my-1" />
                    <button onClick={() => deleteColumn(col.id)} className="w-full text-left px-3 py-1.5 text-red-400 hover:bg-red-500/10">🗑️ Удалить колонку</button>
                  </div>
                )}
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[60px]">
                {colCards.map(card => {
                  const dateInfo = fmtDate(card.due_date);
                  const checkTotal = card.checklist?.length ?? 0;
                  const checkDone = card.checklist?.filter(ci => ci.done).length ?? 0;
                  const showDropLine = dropTarget?.col === col.id && dropTarget.before === card.id;
                  return (
                    <React.Fragment key={card.id}>
                      {showDropLine && <div className="h-0.5 bg-blue-500 rounded-full mx-1" />}
                      <div
                        draggable
                        onDragStart={e => onCardDragStart(e, card.id)}
                        onDragEnd={onDragEnd}
                        onDragOver={e => onCardDragOver(e, col.id, card.id)}
                        onClick={() => onCardClick(card)}
                        className={`bg-[#0f1117] rounded-lg border p-2.5 cursor-pointer hover:border-blue-500/40 transition-all select-none ${
                          dragId === card.id ? 'opacity-30' : ''
                        } ${dateInfo?.overdue ? 'border-red-500/40' : 'border-[#1e2535]'}`}
                      >
                        {card.labels && card.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            {card.labels.map(l => (
                              <span key={l} className="text-[9px] bg-blue-500/15 text-blue-300 px-1.5 py-0.5 rounded">{l}</span>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-slate-200 leading-snug">{card.title}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <div className={`w-2 h-2 rounded-full ${PRIORITY_DOT[card.priority]}`} title="приоритет" />
                          {dateInfo && (
                            <span className={`text-[10px] ${dateInfo.overdue ? 'text-red-400' : 'text-slate-500'}`}>
                              {dateInfo.overdue ? '⚠ ' : '📅 '}{dateInfo.text}
                            </span>
                          )}
                          {checkTotal > 0 && (
                            <span className={`text-[10px] ${checkDone === checkTotal ? 'text-emerald-400' : 'text-slate-500'}`}>☑ {checkDone}/{checkTotal}</span>
                          )}
                          {card.description && <span className="text-[10px] text-slate-600">📝</span>}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
                {dropTarget?.col === col.id && dropTarget.before === null && dragId && (
                  <div className="h-0.5 bg-blue-500 rounded-full mx-1" />
                )}
                {colCards.length === 0 && !addingTo && (
                  <div className="flex items-center justify-center h-12 text-slate-700 text-[11px]">
                    {filterActive && totalInCol > 0 ? 'нет совпадений' : 'пусто'}
                  </div>
                )}
              </div>

              {/* Add card */}
              <div className="p-2 border-t border-[#1e2535]">
                {addingTo === col.id ? (
                  <div>
                    <textarea autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitNewCard(col.id); } if (e.key === 'Escape') { setAddingTo(null); setNewTitle(''); } }}
                      rows={2} placeholder="Название карточки..."
                      className="w-full bg-[#0f1117] text-slate-200 text-xs px-2 py-1.5 rounded-lg border border-blue-500/50 focus:outline-none resize-none" />
                    <div className="flex gap-2 mt-1.5">
                      <button onClick={() => submitNewCard(col.id)} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg">Добавить</button>
                      <button onClick={() => { setAddingTo(null); setNewTitle(''); }} className="px-2 py-1 text-slate-500 hover:text-slate-300 text-xs">✕</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setAddingTo(col.id); setNewTitle(''); }}
                    className="w-full text-left text-xs text-slate-600 hover:text-slate-300 px-2 py-1.5 rounded-lg hover:bg-[#1e2535] transition-colors">+ Добавить карточку</button>
                )}
              </div>
            </div>
          );
        })}

        {/* Add column */}
        <div className="flex-shrink-0 w-[270px]">
          <button onClick={addColumn}
            className="w-full text-sm text-slate-600 hover:text-slate-300 border border-dashed border-[#2a3447] hover:border-blue-500/40 rounded-xl py-3 transition-colors">
            + Добавить колонку
          </button>
        </div>
      </div>
    </div>
  );
}
