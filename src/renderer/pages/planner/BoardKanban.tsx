import React, { useState, useMemo } from 'react'
import { todayISO, daysFromNowISO } from '../../lib/dates'
import type { BxCard } from './useCards'
import type { BxBoard, BoardColumn } from './useBoards'
import { COLUMN_COLORS } from './useBoards'
import { uid } from '../../lib/uid'

export interface AddCardPayload {
  title: string
  priority?: 'high' | 'normal' | 'low'
  due_date?: string | null
  labels?: string[] | null
  description?: string | null
}

interface Props {
  board: BxBoard
  cards: BxCard[]
  onCardClick: (card: BxCard) => void
  onAddCard: (columnId: string, payload: AddCardPayload) => void
  onMoveCard: (cardId: string, toColumn: string, beforeCardId: string | null) => void
  onUpdateColumns: (columns: BoardColumn[]) => void
  onOpenArchive: () => void
}

const COLOR_MAP: Record<string, { border: string; dot: string; text: string; ring: string }> = {
  slate:   { border: 'border-slate-600/40',   dot: 'bg-slate-500',   text: 'text-bx-text',   ring: 'ring-slate-500' },
  blue:    { border: 'border-blue-500/40',    dot: 'bg-blue-500',    text: 'text-blue-300',    ring: 'ring-blue-500' },
  amber:   { border: 'border-amber-500/40',   dot: 'bg-amber-500',   text: 'text-amber-300',   ring: 'ring-amber-500' },
  emerald: { border: 'border-emerald-500/40', dot: 'bg-emerald-500', text: 'text-emerald-300', ring: 'ring-emerald-500' },
  purple:  { border: 'border-purple-500/40',  dot: 'bg-purple-500',  text: 'text-purple-300',  ring: 'ring-purple-500' },
  red:     { border: 'border-red-500/40',     dot: 'bg-red-500',     text: 'text-red-300',     ring: 'ring-red-500' },
  pink:    { border: 'border-pink-500/40',    dot: 'bg-pink-500',    text: 'text-pink-300',    ring: 'ring-pink-500' },
  cyan:    { border: 'border-cyan-500/40',    dot: 'bg-cyan-500',    text: 'text-cyan-300',    ring: 'ring-cyan-500' },
};
const c = (color: string) => COLOR_MAP[color] ?? COLOR_MAP.slate;

const PRIORITY_BAR: Record<string, string> = { high: 'border-l-red-500', normal: 'border-l-amber-500', low: 'border-l-emerald-500' };

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
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragColId, setDragColId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<{ col: string; before: string | null } | null>(null)
  const [colDropIdx, setColDropIdx] = useState<number | null>(null)
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [editCol, setEditCol] = useState<string | null>(null)
  const [colName, setColName] = useState('')
  const [menuCol, setMenuCol] = useState<string | null>(null)

  // ─── New card form state ───
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState<'high' | 'normal' | 'low'>('normal')
  const [newDueDate, setNewDueDate] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newLabels, setNewLabels] = useState<string[]>([])
  const [showMoreFields, setShowMoreFields] = useState(false)

  // ─── filters ───
  const [search, setSearch] = useState('');
  const [prioF, setPrioF] = useState('');
  const [labelF, setLabelF] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [dateF, setDateF] = useState(''); // '', today, tomorrow, week, month, none

  const columns = board.columns;

  const allLabels = useMemo(() => {
    const s = new Set<string>();
    cards.forEach(c => c.labels?.forEach(l => s.add(l)));
    return [...s].sort();
  }, [cards]);

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    const today = todayISO();
    return cards.filter(card => {
      if (q && !(card.title.toLowerCase().includes(q) || (card.description ?? '').toLowerCase().includes(q))) return false;
      if (prioF && card.priority !== prioF) return false;
      if (labelF && !(card.labels ?? []).includes(labelF)) return false;
      if (overdueOnly && !isOverdue(card)) return false;
      if (dateF) {
        const day = card.due_date ? card.due_date.slice(0, 10) : null;
        if (dateF === 'none') { if (day) return false; }
        else if (!day) return false;
        else if (dateF === 'today'    && day !== today) return false;
        else if (dateF === 'tomorrow' && day !== daysFromNowISO(1)) return false;
        else if (dateF === 'week'     && !(day >= today && day <= daysFromNowISO(7))) return false;
        else if (dateF === 'month'    && !(day >= today && day <= daysFromNowISO(30))) return false;
      }
      return true;
    });
  }, [cards, search, prioF, labelF, overdueOnly, dateF]);

  const filterActive = Boolean(search || prioF || labelF || overdueOnly || dateF);

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

  const ADD_LABELS = ['НДС','НДФЛ','Отчёт','Оплата','Срочно','Клиент','ВЭД','ЗП','Банк','Личное']

  // ─── add card ───
  const resetNewCardForm = () => {
    setNewTitle('')
    setNewPriority('normal')
    setNewDueDate('')
    setNewDescription('')
    setNewLabels([])
    setShowMoreFields(false)
    setAddingTo(null)
  }

  const submitNewCard = (col: string) => {
    if (!newTitle.trim()) return
    onAddCard(col, {
      title: newTitle.trim(),
      priority: newPriority,
      due_date: newDueDate || null,
      labels: newLabels.length > 0 ? newLabels : null,
      description: newDescription.trim() || null,
    })
    resetNewCardForm()
  }

  const toggleNewLabel = (l: string) => {
    setNewLabels(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l])
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

  const selCls = 'bg-bx-bg text-bx-text text-[11px] px-2 py-1 rounded-lg border border-bx-border-2 focus:outline-none focus:border-blue-500/50';

  return (
    <div className="flex flex-col h-full" onClick={() => setMenuCol(null)}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3 flex-shrink-0 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Поиск карточек..."
          className="bg-bx-bg text-bx-text text-xs px-3 py-1.5 rounded-lg border border-bx-border-2 focus:outline-none focus:border-blue-500/50 w-52" />
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
        <select value={dateF} onChange={e => setDateF(e.target.value)} className={selCls}>
          <option value="">📅 Срок: любой</option>
          <option value="today">Сегодня</option>
          <option value="tomorrow">Завтра</option>
          <option value="week">Ближайшие 7 дней</option>
          <option value="month">Ближайшие 30 дней</option>
          <option value="none">Без срока</option>
        </select>
        <button onClick={() => setOverdueOnly(v => !v)}
          className={`text-[11px] px-2.5 py-1 rounded-lg transition-colors ${overdueOnly ? 'bg-red-500/20 text-red-400' : 'bg-bx-bg border border-bx-border-2 text-bx-muted hover:text-bx-text'}`}>
          ⚠ Просроченные
        </button>
        {filterActive && (
          <button onClick={() => { setSearch(''); setPrioF(''); setLabelF(''); setOverdueOnly(false); setDateF(''); }}
            className="text-[11px] text-bx-muted hover:text-bx-muted">сбросить</button>
        )}
        <button onClick={onOpenArchive} className="ml-auto text-[11px] text-bx-muted hover:text-bx-text px-2 py-1">🗄️ Архив</button>
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
              className={`flex flex-col flex-shrink-0 w-[270px] rounded-xl border bg-bx-surface-2/60 dark:bg-bx-surface/50 transition-colors ${isColDropActive ? 'border-blue-500/60 bg-blue-500/5' : isColReorderTarget ? 'border-cyan-500/60' : cc.border} ${dragColId === col.id ? 'opacity-40' : ''}`}
              onDragOver={e => onColumnDragOver(e, col, index)}
              onDrop={e => onColumnDrop(e, col, index)}
            >
              {/* Column header (draggable for reorder) */}
              <div
                draggable={editCol !== col.id}
                onDragStart={e => onColHeaderDragStart(e, col.id)}
                onDragEnd={onDragEnd}
                className="flex items-center justify-between px-3 py-2.5 border-b border-bx-border relative cursor-grab active:cursor-grabbing">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cc.dot}`} />
                  {editCol === col.id ? (
                    <input autoFocus value={colName} onChange={e => setColName(e.target.value)}
                      onBlur={() => renameColumn(col.id)}
                      onKeyDown={e => { if (e.key === 'Enter') renameColumn(col.id); if (e.key === 'Escape') setEditCol(null); }}
                      className="bg-bx-bg text-bx-text text-xs px-1.5 py-0.5 rounded border border-blue-500/50 focus:outline-none flex-1 min-w-0" />
                  ) : (
                    <span onDoubleClick={() => { setEditCol(col.id); setColName(col.title); }}
                      className={`text-xs font-semibold truncate ${cc.text}`}>{col.title}</span>
                  )}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${overLimit ? 'bg-red-500/20 text-red-400' : 'bg-bx-surface-2 text-bx-muted'}`}>
                    {filterActive ? `${colCards.length}/${totalInCol}` : totalInCol}{col.wip != null ? ` · ${col.wip}` : ''}
                  </span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setMenuCol(menuCol === col.id ? null : col.id); }}
                  className="text-bx-muted hover:text-bx-text px-1 leading-none flex-shrink-0">⋯</button>

                {menuCol === col.id && (
                  <div onClick={e => e.stopPropagation()}
                    className="absolute right-2 top-9 z-20 bg-bx-surface-2 border border-bx-border-2 rounded-lg shadow-xl py-1 w-44 text-xs">
                    <button onClick={() => { setEditCol(col.id); setColName(col.title); setMenuCol(null); }} className="w-full text-left px-3 py-1.5 text-bx-text hover:bg-bx-surface-2">✏️ Переименовать</button>
                    <div className="px-3 py-1.5">
                      <p className="text-[10px] text-bx-muted mb-1">Цвет</p>
                      <div className="flex flex-wrap gap-1">
                        {COLUMN_COLORS.map(col2 => (
                          <button key={col2} onClick={() => setColumnColor(col.id, col2)}
                            className={`w-4 h-4 rounded-full ${c(col2).dot} ${col.color === col2 ? 'ring-2 ring-offset-1 ring-offset-bx-surface-2 ' + c(col2).ring : ''}`} />
                        ))}
                      </div>
                    </div>
                    <div className="px-3 py-1.5 flex items-center gap-2">
                      <span className="text-[10px] text-bx-muted">WIP-лимит</span>
                      <input type="number" min={0} defaultValue={col.wip ?? ''} placeholder="нет"
                        onBlur={e => { const v = e.target.value ? parseInt(e.target.value) : null; onUpdateColumns(columns.map(x => x.id === col.id ? { ...x, wip: v } : x)); }}
                        className="w-12 bg-bx-bg text-bx-text text-[10px] px-1.5 py-0.5 rounded border border-bx-border-2 focus:outline-none" />
                    </div>
                    <div className="border-t border-bx-border-2 my-1" />
                    <button onClick={() => moveColumn(col.id, -1)} className="w-full text-left px-3 py-1.5 text-bx-muted hover:bg-bx-surface-2">← Влево</button>
                    <button onClick={() => moveColumn(col.id, 1)} className="w-full text-left px-3 py-1.5 text-bx-muted hover:bg-bx-surface-2">Вправо →</button>
                    <div className="border-t border-bx-border-2 my-1" />
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
                        className={`group bg-bx-surface rounded-lg border border-l-[3px] p-2.5 cursor-pointer hover:border-blue-500/40 hover:shadow-md transition-all select-none ${
                          dragId === card.id ? 'opacity-30' : ''
                        } ${dateInfo?.overdue ? 'border-red-500/40' : 'border-bx-border'} ${PRIORITY_BAR[card.priority]}`}
                      >
                        {card.cover_color && (
                          <div className="h-1.5 rounded-full mb-1.5" style={{ backgroundColor: card.cover_color }} />
                        )}
                        {card.labels && card.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            {card.labels.map(l => (
                              <span key={l} className="text-[9px] bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded">{l}</span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-start gap-1.5">
                          <p className="text-xs text-bx-text leading-snug flex-1">{card.title}</p>
                          {card.event_id && <span title="связано с календарём" className="text-[10px] flex-shrink-0 opacity-60">🔗</span>}
                        </div>
                        {checkTotal > 0 && (
                          <div className="mt-2 flex items-center gap-1.5">
                            <div className="flex-1 h-1 rounded-full bg-bx-surface-2 overflow-hidden">
                              <div className={`h-full rounded-full transition-all ${checkDone === checkTotal ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                style={{ width: `${(checkDone / checkTotal) * 100}%` }} />
                            </div>
                            <span className={`text-[10px] ${checkDone === checkTotal ? 'text-emerald-400' : 'text-bx-muted'}`}>{checkDone}/{checkTotal}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {dateInfo && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${dateInfo.overdue ? 'bg-red-500/15 text-red-500 dark:text-red-400' : 'bg-bx-surface-2 text-bx-muted'}`}>
                              {dateInfo.overdue ? '⚠ ' : '📅 '}{dateInfo.text}
                            </span>
                          )}
                          {card.description && <span className="text-[10px] text-bx-muted" title="есть описание">📝</span>}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
                {dropTarget?.col === col.id && dropTarget.before === null && dragId && (
                  <div className="h-0.5 bg-blue-500 rounded-full mx-1" />
                )}
                {colCards.length === 0 && !addingTo && (
                  <div className="flex items-center justify-center h-12 text-bx-muted text-[11px]">
                    {filterActive && totalInCol > 0 ? 'нет совпадений' : 'пусто'}
                  </div>
                )}
              </div>

              {/* Add card */}
              <div className="p-2 border-t border-bx-border">
                {addingTo === col.id ? (
                  <div className="bg-bx-bg rounded-xl border border-blue-500/40 p-3 space-y-2.5 shadow-lg">
                    {/* Название */}
                    <div>
                      <label className="text-[9px] font-bold text-bx-muted uppercase tracking-wider block mb-1">Название задачи</label>
                      <textarea
                        autoFocus
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submitNewCard(col.id) }
                          if (e.key === 'Escape') resetNewCardForm()
                        }}
                        rows={2}
                        placeholder="Что нужно сделать..."
                        className="w-full bg-bx-surface text-bx-text text-xs px-2.5 py-2 rounded-lg border border-bx-border-2 focus:outline-none focus:border-blue-500/50 resize-none placeholder:text-bx-muted/50 leading-relaxed"
                      />
                    </div>

                    {/* Быстрые поля: приоритет + дата — всегда видны */}
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[9px] font-bold text-bx-muted uppercase tracking-wider block mb-1">Приоритет</label>
                        <select
                          value={newPriority}
                          onChange={e => setNewPriority(e.target.value as 'high' | 'normal' | 'low')}
                          className="w-full bg-bx-surface text-bx-text text-[11px] px-2 py-1.5 rounded-lg border border-bx-border-2 focus:outline-none focus:border-blue-500/50 cursor-pointer"
                        >
                          <option value="high">🔴 Высокий</option>
                          <option value="normal">🟡 Средний</option>
                          <option value="low">🟢 Низкий</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="text-[9px] font-bold text-bx-muted uppercase tracking-wider block mb-1">Срок</label>
                        <input
                          type="date"
                          value={newDueDate}
                          onChange={e => setNewDueDate(e.target.value)}
                          className="w-full bg-bx-surface text-bx-text text-[11px] px-2 py-1.5 rounded-lg border border-bx-border-2 focus:outline-none focus:border-blue-500/50"
                        />
                      </div>
                    </div>

                    {/* Раскрываемые поля */}
                    {!showMoreFields ? (
                      <button
                        onClick={() => setShowMoreFields(true)}
                        className="w-full text-[10px] text-blue-400 hover:text-blue-300 font-semibold py-1 transition-colors flex items-center justify-center gap-1"
                      >
                        <span className="text-xs">＋</span> Описание и метки
                      </button>
                    ) : (
                      <div className="space-y-2.5 pt-0.5">
                        {/* Описание */}
                        <div>
                          <label className="text-[9px] font-bold text-bx-muted uppercase tracking-wider block mb-1">Описание</label>
                          <textarea
                            value={newDescription}
                            onChange={e => setNewDescription(e.target.value)}
                            rows={2}
                            placeholder="Детали задачи..."
                            className="w-full bg-bx-surface text-bx-text text-xs px-2.5 py-2 rounded-lg border border-bx-border-2 focus:outline-none focus:border-blue-500/50 resize-none placeholder:text-bx-muted/50"
                          />
                        </div>
                        {/* Метки */}
                        <div>
                          <label className="text-[9px] font-bold text-bx-muted uppercase tracking-wider block mb-1">Метки</label>
                          <div className="flex flex-wrap gap-1">
                            {ADD_LABELS.map(l => (
                              <button
                                key={l}
                                onClick={() => toggleNewLabel(l)}
                                className={`px-1.5 py-0.5 text-[10px] rounded transition-colors ${
                                  newLabels.includes(l)
                                    ? 'bg-blue-500/15 dark:bg-blue-600/30 text-blue-600 dark:text-blue-300 border border-blue-500/40'
                                    : 'bg-bx-surface-2 text-bx-muted hover:text-bx-text border border-transparent'
                                }`}
                              >
                                {l}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Кнопки действий */}
                    <div className="flex items-center justify-between pt-1 border-t border-bx-border/40">
                      <span className="text-[9px] text-bx-muted/60">Ctrl+Enter — создать</span>
                      <div className="flex gap-2">
                        <button
                          onClick={resetNewCardForm}
                          className="px-2.5 py-1.5 text-bx-muted hover:text-bx-text text-[11px] rounded-lg hover:bg-bx-surface-2 transition-colors"
                        >
                          Отмена
                        </button>
                        <button
                          onClick={() => submitNewCard(col.id)}
                          disabled={!newTitle.trim()}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-bold rounded-lg transition-colors shadow-sm"
                        >
                          ＋ Добавить
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { resetNewCardForm(); setAddingTo(col.id) }}
                    className="w-full text-left text-xs text-bx-muted hover:text-blue-400 px-2.5 py-2 rounded-xl hover:bg-blue-500/5 border border-transparent hover:border-blue-500/20 transition-all flex items-center gap-1.5 group"
                  >
                    <span className="w-5 h-5 rounded-lg bg-bx-surface-2 group-hover:bg-blue-500/15 grid place-items-center text-[11px] transition-colors">＋</span>
                    Добавить карточку
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Add column */}
        <div className="flex-shrink-0 w-[270px]">
          <button onClick={addColumn}
            className="w-full text-sm text-bx-muted hover:text-bx-text border border-dashed border-bx-border-2 hover:border-blue-500/40 rounded-xl py-3 transition-colors">
            + Добавить колонку
          </button>
        </div>
      </div>
    </div>
  );
}
