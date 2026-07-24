import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { BxCard, BxComment, ChecklistItem } from './useCards';
import type { BoardColumn } from './useBoards';
import { uid } from '../../lib/uid';
import { supabase } from '../../lib/db/supabase';
import Icon from '../../lib/ui/Icon';
import { useConfirmationDialog } from '../../components/ui/useConfirmationDialog';
import { usePromptDialog } from '../../components/ui/usePromptDialog';
import './PlannerA2.css';

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

const BUILT_IN_CHECKLIST_TEMPLATES: Record<string, { name: string; items: string[] }> = {
  month_closing: {
    name: 'Закрытие месяца',
    items: [
      'Выписка банка и разнос платежей',
      'Сверка с контрагентами (акты сверки)',
      'Начисление заработной платы и взносов',
      'Проверка и закрытие счетов (20, 23, 25, 26, 44)',
      'Расчет курсовых разниц',
      'Закрытие финансовых результатов (99 счет)',
      'Проверка Didox (входящие/исходящие ЭСФ)'
    ]
  },
  employee_hiring: {
    name: 'Прием сотрудника',
    items: [
      'Получить паспорт, ПИНФЛ, ИНН и трудовую книжку',
      'Подписать трудовой договор',
      'Оформить приказ о приеме на работу',
      'Внести запись в ЕНСТ (my.mehnat.uz)',
      'Оформить личную карточку Т-2',
      'Добавить сотрудника в расчетную ведомость'
    ]
  },
  vat_reporting: {
    name: 'Отчетность по НДС',
    items: [
      'Собрать и проверить все входящие ЭСФ в Didox',
      'Сформировать реестр покупок и продаж',
      'Проверить соответствие книги покупок/продаж данным 1С',
      'Рассчитать сумму НДС к уплате',
      'Заполнить и отправить расчет НДС в ГНК (soliq.uz)',
      'Сформировать платежное поручение на уплату НДС'
    ]
  }
};

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function CardModal({ card, columns, onUpdate, onArchive, onDelete, onDuplicate, onClose, loadComments, addComment, removeComment }: Props) {
  const { confirm, confirmationDialog } = useConfirmationDialog();
  const { prompt, promptDialog } = usePromptDialog();
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

  const [customTemplates, setCustomTemplates] = useState<{ id: string; name: string; items: string[] }[]>([]);

  // Load custom checklist templates
  useEffect(() => {
    try {
      const data = localStorage.getItem('bx_checklist_templates');
      if (data) setCustomTemplates(JSON.parse(data));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleApplyTemplate = async (val: string) => {
    let itemsToApply: string[] = [];
    if (val in BUILT_IN_CHECKLIST_TEMPLATES) {
      itemsToApply = BUILT_IN_CHECKLIST_TEMPLATES[val].items;
    } else {
      const found = customTemplates.find(t => t.id === val);
      if (found) itemsToApply = found.items;
    }

    if (!itemsToApply.length) return;

    const replace = checklist.length > 0 && await confirm({
      title: 'Как добавить шаблон чек-листа?',
      description: 'Можно заменить текущие пункты или сохранить их и добавить новые ниже.',
      confirmLabel: 'Заменить текущие',
      cancelLabel: 'Добавить к текущим',
    });

    const newItems = itemsToApply.map(text => ({
      id: uid(),
      text,
      done: false
    }));

    if (replace) {
      setChecklist(newItems);
    } else {
      setChecklist(prev => [...prev, ...newItems]);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!checklist.length) return;
    const name = await prompt({
      title: 'Сохранить чек-лист как шаблон',
      description: 'Шаблон останется на этом устройстве и будет доступен в списке чек-листов.',
      label: 'Название шаблона',
      placeholder: 'Например, закрытие недели',
      submitLabel: 'Сохранить шаблон',
      maxLength: 80,
    });
    if (!name || !name.trim()) return;

    const newTpl = {
      id: uid(),
      name: name.trim(),
      items: checklist.map(item => item.text)
    };

    const updated = [...customTemplates, newTpl];
    setCustomTemplates(updated);
    localStorage.setItem('bx_checklist_templates', JSON.stringify(updated));
  };

  // Linked event settings
  const [recurrence, setRecurrence] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly' | null>(null);
  const [remind, setRemind] = useState(false);
  const [remindDays, setRemindDays] = useState(0);
  const [remindTime, setRemindTime] = useState('09:00');

  // Load linked event details
  useEffect(() => {
    if (!card.event_id) return;
    supabase
      .from('bx_events')
      .select('*')
      .eq('id', card.event_id)
      .single()
      .then(({ data }) => {
        if (!data) return;
        setRecurrence(data.recurrence || null);
        if (data.reminder_at && data.due_date) {
          const due = new Date(data.due_date + 'T00:00:00');
          const rem = new Date(data.reminder_at);
          const diffMs = due.getTime() - rem.getTime();
          const diffDays = Math.round(diffMs / 86400000);
          const hours = String(rem.getHours()).padStart(2, '0');
          const minutes = String(rem.getMinutes()).padStart(2, '0');
          setRemind(true);
          setRemindDays(diffDays >= 0 && diffDays <= 7 ? diffDays : 0);
          setRemindTime(`${hours}:${minutes}`);
        }
      });
  }, [card.event_id]);

  // load comments
  useEffect(() => { loadComments(card.id).then(setComments); }, [card.id, loadComments]);

  // Escape to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && !e.defaultPrevented) save(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  async function save() {
    let finalEventId = card.event_id;
    const needEvent = recurrence !== null || remind;

    if (needEvent) {
      const reminderAt = (() => {
        if (!remind || !dueDate) return null;
        const due = new Date(dueDate + 'T00:00:00');
        due.setDate(due.getDate() - remindDays);
        const yyyy = due.getFullYear();
        const mm = String(due.getMonth() + 1).padStart(2, '0');
        const dd = String(due.getDate()).padStart(2, '0');
        return new Date(`${yyyy}-${mm}-${dd}T${remindTime}:00`).toISOString();
      })();

      const eventPayload = {
        title: title.trim() || card.title,
        date: dueDate || new Date().toISOString().split('T')[0],
        due_date: dueDate || null,
        status: (columnId === columns[columns.length - 1]?.id) ? 'done' : 'todo',
        priority: priority,
        note: description.trim() || null,
        recurrence,
        reminder_at: reminderAt,
        type: 'task',
        source: 'manual',
        company_id: card.board_id ? (await supabase.from('bx_boards').select('company_id').eq('id', card.board_id).single()).data?.company_id || null : null
      };

      if (finalEventId) {
        await supabase.from('bx_events').update(eventPayload).eq('id', finalEventId);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: newEv } = await supabase.from('bx_events').insert({
            ...eventPayload,
            user_id: user.id
          }).select().single();
          if (newEv) finalEventId = newEv.id;
        }
      }
    } else if (finalEventId) {
      await supabase.from('bx_events').delete().eq('id', finalEventId);
      finalEventId = null;
    }

    onUpdate(card.id, {
      title: title.trim() || card.title,
      description: description.trim() || null,
      priority,
      labels: labels.length ? labels : null,
      due_date: dueDate || null,
      column_id: columnId,
      checklist,
      event_id: finalEventId,
    });

    const bc = new BroadcastChannel('bx-events-sync');
    bc.postMessage('reload');
    bc.close();

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

  const inputCls = 'bx-sheet-input w-full text-sm';

  return (
    <>
    {createPortal(
    <div className="bx-sheet-scrim fixed inset-0 z-[120] flex items-end justify-center overflow-y-auto sm:items-center sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) save(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="card-modal-title" className="bx-sheet bx-card-sheet my-auto w-full max-w-3xl overflow-hidden">
        {/* Header */}
        <header className="bx-sheet__header flex items-start justify-between gap-3 px-6 py-5">
          <label htmlFor="card-modal-title" className="sr-only">Название карточки</label>
          <textarea
            id="card-modal-title"
            ref={titleRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            rows={1}
            className="flex-1 resize-none bg-transparent text-xl font-black leading-snug text-bx-text focus:outline-none"
            placeholder="Название карточки"
          />
          <button type="button" onClick={save} aria-label="Сохранить и закрыть" className="bx-sheet__close"><Icon name="crossSmall" /></button>
        </header>

        <div className="bx-sheet__body bx-card-sheet__body grid gap-6 px-6 py-5">
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
              <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-bx-muted">☑️ Чек-лист</label>
                  <select
                    value=""
                    onChange={e => void handleApplyTemplate(e.target.value)}
                    className="bg-bx-surface-2 text-bx-muted hover:text-bx-text text-[10px] rounded border border-bx-border-2 px-1.5 py-0.5 focus:outline-none cursor-pointer"
                  >
                    <option value="" disabled>✨ Шаблоны...</option>
                    <optgroup label="Встроенные">
                      <option value="month_closing">Закрытие месяца</option>
                      <option value="employee_hiring">Прием сотрудника</option>
                      <option value="vat_reporting">Отчетность по НДС</option>
                    </optgroup>
                    {customTemplates.length > 0 && (
                      <optgroup label="Мои шаблоны">
                        {customTemplates.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  {checklist.length > 0 && (
                    <button
                      onClick={() => void handleSaveAsTemplate()}
                      className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                      title="Сохранить текущий чек-лист как шаблон"
                    >
                      💾 Сохранить как шаблон
                    </button>
                  )}
                  {checklist.length > 0 && <span className="text-[10px] text-bx-muted">{doneCount}/{checklist.length}</span>}
                </div>
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
              <label className="text-[10px] font-medium text-bx-muted block mb-1">Повторение</label>
              <select value={recurrence ?? 'none'}
                onChange={e => setRecurrence(e.target.value === 'none' ? null : e.target.value as NonNullable<typeof recurrence>)}
                className={`${inputCls} text-xs py-1.5`}>
                <option value="none">Не повторять</option>
                <option value="weekly">Еженедельно</option>
                <option value="monthly">Ежемесячно</option>
                <option value="quarterly">Ежеквартально</option>
                <option value="yearly">Ежегодно</option>
              </select>
            </div>

            {dueDate && (
              <div className="space-y-1.5 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={remind} onChange={e => setRemind(e.target.checked)}
                    className="w-3 h-3 rounded accent-blue-500" />
                  <span className="text-[10px] font-medium text-bx-muted">Напоминание</span>
                </label>
                {remind && (
                  <div className="space-y-1 pl-4.5 text-[10px] text-bx-muted">
                    <div className="flex items-center gap-1">
                      <span>За</span>
                      <select
                        value={remindDays}
                        onChange={e => setRemindDays(Number(e.target.value))}
                        className="bg-bx-bg text-bx-text text-[10px] rounded border border-bx-border-2 px-1 py-0.5 focus:outline-none w-full cursor-pointer"
                      >
                        <option value={0}>0 дней</option>
                        <option value={1}>1 день</option>
                        <option value={2}>2 дня</option>
                        <option value={3}>3 дня</option>
                        <option value={5}>5 дней</option>
                        <option value={7}>7 дней</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>в</span>
                      <input
                        type="time"
                        value={remindTime}
                        onChange={e => setRemindTime(e.target.value)}
                        className="bg-bx-bg text-bx-text text-[10px] rounded border border-bx-border-2 px-1 py-0.5 focus:outline-none w-full text-center"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

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
        <footer className="bx-sheet__footer flex items-center justify-end gap-2 px-6 py-4">
          <button type="button" onClick={onClose} className="min-h-11 rounded-xl px-4 text-sm font-bold text-bx-muted hover:text-bx-text">Закрыть</button>
          <button type="button" onClick={save} className="bx-planner-primary min-h-11 rounded-xl px-5 text-sm font-black">Сохранить</button>
        </footer>
      </section>
    </div>,
    document.body,
    )}
    {confirmationDialog}
    {promptDialog}
    </>
  );
}
