import React, { useState, useEffect, useRef } from 'react';
import type { BxCard, BxComment, ChecklistItem } from './useCards';
import type { BoardColumn } from './useBoards';
import { uid } from '../../lib/uid';

interface Props {
  card: BxCard;
  columns: BoardColumn[];
  onUpdate: (id: string, patch: Partial<BxCard>) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (card: BxCard) => void;
  onClose: () => void;
  loadComments: (cardId: string) => Promise<BxComment[]>;
  addComment: (cardId: string, body: string) => Promise<BxComment | null>;
  removeComment: (id: string) => Promise<void>;
}

const PRIORITY_OPTS: { id: BxCard['priority']; label: string }[] = [
  { id: 'high',   label: '🔴 Высокий' },
  { id: 'normal', label: '🟡 Средний' },
  { id: 'low',    label: '🟢 Низкий' },
];

const LABEL_PALETTE = ['НДС','НДФЛ','Отчёт','Оплата','Срочно','Клиент','ВЭД','ЗП','Банк','Личное'];

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function CardModal({ card, columns, onUpdate, onArchive, onDelete, onDuplicate, onClose, loadComments, addComment, removeComment }: Props) {
  const [title,       setTitle]       = useState(card.title);
  const [description, setDescription] = useState(card.description ?? '');
  const [priority,    setPriority]    = useState(card.priority);
  const [labels,      setLabels]      = useState<string[]>(card.labels ?? []);
  const [dueDate,     setDueDate]     = useState(card.due_date ?? '');
  const [columnId,    setColumnId]    = useState(card.column_id);
  const [checklist,   setChecklist]   = useState<ChecklistItem[]>(card.checklist ?? []);
  const [newCheck,    setNewCheck]    = useState('');

  const [comments,    setComments]    = useState<BxComment[]>([]);
  const [newComment,  setNewComment]  = useState('');
  const [confirmDel,  setConfirmDel]  = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  // load comments
  useEffect(() => { loadComments(card.id).then(setComments); }, [card.id, loadComments]);

  // Escape to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') save(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function save() {
    onUpdate(card.id, {
      title: title.trim() || card.title,
      description: description.trim() || null,
      priority,
      labels: labels.length ? labels : null,
      due_date: dueDate || null,
      column_id: columnId,
      checklist,
    });
    onClose();
  }

  // ─── checklist ───
  function addCheck() {
    if (!newCheck.trim()) return;
    setChecklist(prev => [...prev, { id: uid(), text: newCheck.trim(), done: false }]);
    setNewCheck('');
  }
  function toggleCheck(id: string) {
    setChecklist(prev => prev.map(c => c.id === id ? { ...c, done: !c.done } : c));
  }
  function removeCheck(id: string) {
    setChecklist(prev => prev.filter(c => c.id !== id));
  }
  const doneCount = checklist.filter(c => c.done).length;
  const progress = checklist.length ? Math.round(doneCount / checklist.length * 100) : 0;

  // ─── labels ───
  function toggleLabel(l: string) {
    setLabels(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]);
  }

  // ─── comments ───
  async function postComment() {
    if (!newComment.trim()) return;
    const c = await addComment(card.id, newComment.trim());
    if (c) { setComments(prev => [...prev, c]); setNewComment(''); }
  }
  async function delComment(id: string) {
    await removeComment(id);
    setComments(prev => prev.filter(c => c.id !== id));
  }

  const inputCls = 'w-full bg-bx-bg text-bx-text px-3 py-2 rounded-lg border border-bx-border-2 focus:outline-none focus:border-blue-500/50 text-sm';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8"
      onClick={e => { if (e.target === e.currentTarget) save(); }}>
      <div className="bg-bx-surface border border-bx-border-2 rounded-2xl w-[640px] max-w-[92vw] shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-bx-border gap-3">
          <textarea
            ref={titleRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            rows={1}
            className="flex-1 bg-transparent text-bx-text text-lg font-semibold resize-none focus:outline-none leading-snug"
            placeholder="Название карточки"
          />
          <button onClick={save} className="text-bx-muted hover:text-bx-text text-lg leading-none flex-shrink-0 mt-1">✕</button>
        </div>

        <div className="px-6 py-5 grid grid-cols-[1fr_180px] gap-5">
          {/* ── Левая колонка ── */}
          <div className="space-y-5 min-w-0">
            {/* Описание */}
            <div>
              <label className="text-xs font-medium text-bx-muted block mb-1.5">📝 Описание</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                placeholder="Добавьте детали..." className={`${inputCls} resize-none`} />
            </div>

            {/* Чек-лист */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-bx-muted">☑️ Чек-лист</label>
                {checklist.length > 0 && <span className="text-[10px] text-bx-muted">{doneCount}/{checklist.length}</span>}
              </div>
              {checklist.length > 0 && (
                <div className="h-1.5 bg-bx-bg rounded-full mb-2 overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
                </div>
              )}
              <div className="space-y-1">
                {checklist.map(item => (
                  <div key={item.id} className="flex items-center gap-2 group">
                    <input type="checkbox" checked={item.done} onChange={() => toggleCheck(item.id)}
                      className="w-3.5 h-3.5 rounded accent-emerald-500 flex-shrink-0" />
                    <span className={`text-xs flex-1 ${item.done ? 'line-through text-bx-muted' : 'text-bx-text'}`}>{item.text}</span>
                    <button onClick={() => removeCheck(item.id)} className="text-bx-muted hover:text-red-400 opacity-0 group-hover:opacity-100 text-xs">✕</button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <input value={newCheck} onChange={e => setNewCheck(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addCheck(); }}
                  placeholder="Добавить пункт..." className={`${inputCls} text-xs py-1.5`} />
                <button onClick={addCheck} className="px-3 bg-bx-surface-2 text-bx-muted hover:text-bx-text rounded-lg text-xs flex-shrink-0">+</button>
              </div>
            </div>

            {/* Комментарии */}
            <div>
              <label className="text-xs font-medium text-bx-muted block mb-2">💬 Комментарии {comments.length > 0 && <span className="text-bx-muted">({comments.length})</span>}</label>
              <div className="space-y-2 mb-2">
                {comments.map(c => (
                  <div key={c.id} className="bg-bx-bg rounded-lg px-3 py-2 group">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] text-bx-muted">{fmtDateTime(c.created_at)}</span>
                      <button onClick={() => delComment(c.id)} className="text-bx-muted hover:text-red-400 opacity-0 group-hover:opacity-100 text-[10px]">удалить</button>
                    </div>
                    <p className="text-xs text-bx-text whitespace-pre-wrap break-words">{c.body}</p>
                  </div>
                ))}
                {comments.length === 0 && <p className="text-[11px] text-bx-muted">Пока нет комментариев</p>}
              </div>
              <div className="flex gap-2">
                <textarea value={newComment} onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) postComment(); }}
                  rows={2} placeholder="Написать комментарий... (Ctrl+Enter)" className={`${inputCls} text-xs resize-none`} />
              </div>
              <button onClick={postComment} disabled={!newComment.trim()}
                className="mt-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs rounded-lg">Отправить</button>
            </div>
          </div>

          {/* ── Правая колонка (свойства) ── */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-medium text-bx-muted block mb-1">Колонка</label>
              <select value={columnId} onChange={e => setColumnId(e.target.value)} className={`${inputCls} text-xs py-1.5`}>
                {columns.map(col => <option key={col.id} value={col.id}>{col.title}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-medium text-bx-muted block mb-1">Приоритет</label>
              <select value={priority} onChange={e => setPriority(e.target.value as BxCard['priority'])} className={`${inputCls} text-xs py-1.5`}>
                {PRIORITY_OPTS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-medium text-bx-muted block mb-1">Срок</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={`${inputCls} text-xs py-1.5`} />
            </div>

            <div>
              <label className="text-[10px] font-medium text-bx-muted block mb-1.5">Метки</label>
              <div className="flex flex-wrap gap-1">
                {LABEL_PALETTE.map(l => (
                  <button key={l} onClick={() => toggleLabel(l)}
                    className={`px-1.5 py-0.5 text-[10px] rounded transition-colors ${labels.includes(l) ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' : 'bg-bx-surface-2 text-bx-muted hover:text-bx-muted'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-bx-border space-y-1.5">
              <button onClick={() => { onDuplicate(card); onClose(); }} className="w-full text-left text-xs text-bx-muted hover:text-blue-400 py-1 transition-colors">📑 Дублировать</button>
              <button onClick={() => onArchive(card.id)} className="w-full text-left text-xs text-bx-muted hover:text-amber-400 py-1 transition-colors">🗄️ В архив</button>
              {confirmDel ? (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-red-400">Удалить?</span>
                  <button onClick={() => onDelete(card.id)} className="text-[11px] px-2 py-0.5 bg-red-500/20 text-red-400 rounded">Да</button>
                  <button onClick={() => setConfirmDel(false)} className="text-[11px] text-bx-muted">нет</button>
                </div>
              ) : (
                <button onClick={() => setConfirmDel(true)} className="w-full text-left text-xs text-bx-muted hover:text-red-400 py-1 transition-colors">🗑️ Удалить</button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-bx-border">
          <button onClick={onClose} className="px-4 py-2 text-sm text-bx-muted hover:text-bx-text">Закрыть</button>
          <button onClick={save} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">Сохранить</button>
        </div>
      </div>
    </div>
  );
}
