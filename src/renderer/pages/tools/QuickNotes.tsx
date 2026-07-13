import React, { useState, useEffect, useMemo } from 'react';
import { uid } from '../../lib/uid';
import { useBoards } from '../planner/useBoards';
import { supabase } from '../../lib/db/supabase';
import { emitPlannerReload } from '../planner/plannerBus';
import { useToast } from '../../lib/ui/ToastContext';
import Icon from '../../lib/ui/Icon';

const STORAGE_KEY = 'bx_quick_notes';

interface Note {
  id: string;
  text: string;
  createdAt: string;
  pinned?: boolean;
}

function loadNotes(): Note[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveNotes(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export default function QuickNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState('');
  
  // Доски из планировщика
  const { boards } = useBoards();
  const toast = useToast();

  // Модальные окна интеграции
  const [plannerModalId, setPlannerModalId] = useState<string | null>(null);
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [selectedColId, setSelectedColId] = useState<string>('');
  const [sendingPlanner, setSendingPlanner] = useState(false);

  const [calendarModalId, setCalendarModalId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [sendingCalendar, setSendingCalendar] = useState(false);

  useEffect(() => { 
    setNotes(loadNotes()); 
  }, []);

  // Установим доску по умолчанию при открытии модального окна
  useEffect(() => {
    if (boards.length > 0 && !selectedBoardId) {
      setSelectedBoardId(boards[0].id);
      if (boards[0].columns.length > 0) {
        setSelectedColId(boards[0].columns[0].id);
      }
    }
  }, [boards, plannerModalId, selectedBoardId]);

  // Обновим колонку по умолчанию при смене доски
  const handleBoardChange = (boardId: string) => {
    setSelectedBoardId(boardId);
    const b = boards.find(x => x.id === boardId);
    if (b && b.columns.length > 0) {
      setSelectedColId(b.columns[0].id);
    } else {
      setSelectedColId('');
    }
  };

  function persist(updated: Note[]) { 
    setNotes(updated); 
    saveNotes(updated); 
  }

  function addOrSave() {
    if (!text.trim()) return;
    if (editingId) {
      const updated = notes.map((n: Note) => n.id === editingId ? { ...n, text: text.trim() } : n);
      persist(updated);
      setEditingId(null);
      toast.success('Заметка сохранена');
    } else {
      const updated = [{ 
        id: uid(), 
        text: text.trim(), 
        createdAt: new Date().toLocaleString('ru-RU', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }),
        pinned: false
      }, ...notes];
      persist(updated);
      toast.success('Заметка добавлена');
    }
    setText('');
  }

  function startEdit(n: Note) {
    setEditingId(n.id);
    setText(n.text);
    // Прокрутим к форме ввода
    document.getElementById('quick-note-textarea')?.scrollIntoView({ behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setText('');
  }

  function togglePin(id: string) {
    const updated = notes.map((n: Note) => n.id === id ? { ...n, pinned: !n.pinned } : n);
    persist(updated);
  }

  function remove(id: string) { 
    if (confirm('Удалить эту заметку?')) {
      persist(notes.filter((n: Note) => n.id !== id)); 
      if (editingId === id) {
        setEditingId(null);
        setText('');
      }
    }
  }

  function copy(t: string) { 
    navigator.clipboard.writeText(t).then(() => {
      toast.success('Скопировано в буфер');
    }).catch(() => {
      toast.error('Не удалось скопировать');
    });
  }

  // Интеграция с Канбан-доской
  const handlePushToPlanner = async (noteText: string) => {
    if (!selectedBoardId || !selectedColId) {
      toast.error('Выберите доску и колонку');
      return;
    }
    setSendingPlanner(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Пользователь не авторизован');

      // Создаем карточку в Supabase
      const newCard = {
        id: uid(),
        user_id: user.id,
        board_id: selectedBoardId,
        column_id: selectedColId,
        title: noteText.split('\n')[0].slice(0, 100) || 'Задача из заметок',
        description: noteText,
        priority: 'normal',
        checklist: [],
        position: 999,
        archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase.from('bx_cards').insert(newCard);
      if (error) throw error;

      toast.success('Задача создана в планировщике');
      setPlannerModalId(null);
      emitPlannerReload(); // Обновим доски
    } catch (e: any) {
      toast.error(e?.message || 'Не удалось отправить в планировщик');
    } finally {
      setSendingPlanner(false);
    }
  };

  // Интеграция с Календарем
  const handlePushToCalendar = async (noteText: string) => {
    if (!selectedDate) {
      toast.error('Выберите дату');
      return;
    }
    setSendingCalendar(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Пользователь не авторизован');

      const newEvent = {
        id: uid(),
        user_id: user.id,
        company_id: null,
        type: 'task',
        title: noteText.split('\n')[0].slice(0, 100) || 'Задача из заметок',
        date: selectedDate,
        due_date: selectedDate,
        status: 'todo',
        priority: 'normal',
        note: noteText,
        source: 'manual',
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('bx_events').insert(newEvent);
      if (error) throw error;

      toast.success('Событие добавлено в календарь');
      setCalendarModalId(null);
      emitPlannerReload(); // Обновим календарь
    } catch (e: any) {
      toast.error(e?.message || 'Не удалось добавить в календарь');
    } finally {
      setSendingCalendar(false);
    }
  };

  // Сортировка: закрепленные всегда сверху
  const sortedNotes = useMemo(() => {
    return [...notes].sort((a: Note, b: Note) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  }, [notes]);

  // Фильтр по поиску
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return sortedNotes.filter((n: Note) => !q || n.text.toLowerCase().includes(q));
  }, [sortedNotes, search]);

  const visible = expanded ? filtered : filtered.slice(0, 3);

  return (
    <div className="rounded-2xl border border-bx-border bg-bx-surface p-5 space-y-4 shadow-sm relative">
      <div className="flex items-center gap-2.5">
        <span className="text-xl">📝</span>
        <div>
          <h3 className="text-xs font-black text-bx-text uppercase tracking-wider">Быстрые заметки</h3>
          <p className="text-[10px] text-bx-muted">Хранилище мыслей и реквизитов</p>
        </div>
        {notes.length > 0 && (
          <span className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full bg-bx-surface-2 text-bx-muted">
            {notes.length}
          </span>
        )}
      </div>

      {/* Поиск */}
      {notes.length > 3 && (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-bx-muted text-xs">🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по заметкам..."
            className="w-full bg-bx-surface-2 text-bx-text placeholder-bx-muted text-xs pl-8 pr-3 py-1.5 rounded-xl border border-bx-border focus:outline-none focus:border-blue-500/50 shadow-inner"
          />
        </div>
      )}

      {/* Форма ввода */}
      <div className="flex gap-2.5 items-end">
        <div className="flex-1 flex flex-col gap-1.5">
          <textarea
            id="quick-note-textarea"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addOrSave(); }}
            placeholder={editingId ? "Отредактируйте заметку..." : "Напишите что-нибудь важное... (Ctrl+Enter)"}
            rows={editingId ? 3 : 2}
            className="w-full bg-bx-surface-2 text-bx-text placeholder-bx-muted text-xs px-3.5 py-2.5 rounded-xl border border-bx-border-2 focus:outline-none focus:border-blue-500/40 resize-none shadow-inner"
          />
          {editingId && (
            <span className="text-[9px] text-blue-500 font-bold uppercase tracking-wider">Режим редактирования</span>
          )}
        </div>
        
        <div className="flex flex-col gap-2">
          {editingId && (
            <button
              onClick={cancelEdit}
              className="p-2.5 bg-bx-surface-2 border border-bx-border hover:bg-bx-border-2 text-bx-muted text-xs rounded-xl transition-all cursor-pointer font-bold"
              title="Отменить редактирование"
            >
              ✕
            </button>
          )}
          <button
            onClick={addOrSave}
            disabled={!text.trim()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs rounded-xl transition-all cursor-pointer font-extrabold shadow-md"
          >
            {editingId ? '✓' : '＋'}
          </button>
        </div>
      </div>

      {/* Список заметок */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
        {visible.map((n: Note) => (
          <div key={n.id} className="flex items-start gap-2.5 group relative hover:translate-x-0.5 transition-all duration-200">
            <div className={`flex-1 min-w-0 bg-bx-bg rounded-2xl px-4 py-3 border ${n.pinned ? 'border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/5' : 'border-bx-border'}`}>
              <p className="text-xs text-bx-text whitespace-pre-wrap break-words leading-relaxed">{n.text}</p>
              <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-bx-border/30">
                <span className="text-[9px] text-bx-muted font-bold">{n.createdAt}</span>
                {n.pinned && (
                  <span className="text-[9px] text-amber-500 font-bold uppercase flex items-center gap-0.5">📌 Закреплено</span>
                )}
              </div>
            </div>
            
            {/* Панель кнопок быстрых действий */}
            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => copy(n.text)} 
                title="Копировать текст"
                className="p-1.5 text-bx-muted hover:text-bx-text bg-bx-surface border border-bx-border hover:border-blue-500/30 rounded-lg transition-all text-xs cursor-pointer shadow-sm"
              >
                ⎘
              </button>
              <button 
                onClick={() => togglePin(n.id)} 
                title={n.pinned ? "Открепить" : "Закрепить"}
                className={`p-1.5 rounded-lg border transition-all text-xs cursor-pointer shadow-sm ${
                  n.pinned 
                    ? 'text-amber-500 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20' 
                    : 'text-bx-muted bg-bx-surface border-bx-border hover:text-bx-text hover:border-blue-500/30'
                }`}
              >
                📌
              </button>
              <button 
                onClick={() => startEdit(n)} 
                title="Редактировать"
                className="p-1.5 text-bx-muted hover:text-bx-text bg-bx-surface border border-bx-border hover:border-blue-500/30 rounded-lg transition-all text-xs cursor-pointer shadow-sm"
              >
                ✏️
              </button>
              <button 
                onClick={() => setPlannerModalId(n.id)} 
                title="Создать задачу в Канбан"
                className="p-1.5 text-bx-muted hover:text-blue-500 bg-bx-surface border border-bx-border hover:border-blue-500/30 rounded-lg transition-all text-xs cursor-pointer shadow-sm"
              >
                📋
              </button>
              <button 
                onClick={() => setCalendarModalId(n.id)} 
                title="Создать событие в календаре"
                className="p-1.5 text-bx-muted hover:text-indigo-500 bg-bx-surface border border-bx-border hover:border-blue-500/30 rounded-lg transition-all text-xs cursor-pointer shadow-sm"
              >
                📅
              </button>
              <button 
                onClick={() => remove(n.id)} 
                title="Удалить заметку"
                className="p-1.5 text-bx-muted hover:text-red-500 bg-bx-surface border border-bx-border hover:border-red-500/30 rounded-lg transition-all text-xs cursor-pointer shadow-sm"
              >
                ✕
              </button>
            </div>

            {/* Всплывающее меню: Отправить в Канбан */}
            {plannerModalId === n.id && (
              <div className="absolute right-10 top-0 z-[50] w-64 bg-bx-surface border border-bx-border rounded-2xl p-4.5 shadow-2xl flex flex-col gap-3 font-sans animate-in fade-in zoom-in-95 duration-100 text-bx-text">
                <div className="flex items-center justify-between border-b border-bx-border/50 pb-2">
                  <span className="text-xs font-black uppercase">Экспорт в Канбан</span>
                  <button onClick={() => setPlannerModalId(null)} className="text-bx-muted hover:text-bx-text text-sm">✕</button>
                </div>
                
                {boards.length === 0 ? (
                  <p className="text-[10px] text-bx-muted">У вас нет досок. Сначала создайте доску в Планировщике.</p>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-bx-muted uppercase tracking-wider">Выберите доску</label>
                      <select 
                        value={selectedBoardId} 
                        onChange={e => handleBoardChange(e.target.value)}
                        className="w-full bg-bx-surface-2 text-bx-text text-xs p-2 rounded-xl border border-bx-border focus:outline-none"
                      >
                        {boards.map(b => <option key={b.id} value={b.id}>{b.icon} {b.name}</option>)}
                      </select>
                    </div>

                    {selectedBoardId && (
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-bx-muted uppercase tracking-wider">Колонка назначения</label>
                        <select 
                          value={selectedColId} 
                          onChange={e => setSelectedColId(e.target.value)}
                          className="w-full bg-bx-surface-2 text-bx-text text-xs p-2 rounded-xl border border-bx-border focus:outline-none"
                        >
                          {boards.find(x => x.id === selectedBoardId)?.columns.map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <button
                      onClick={() => handlePushToPlanner(n.text)}
                      disabled={sendingPlanner}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl transition-all shadow-md mt-1 cursor-pointer"
                    >
                      {sendingPlanner ? 'Создаю...' : 'Создать задачу'}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Всплывающее меню: Отправить в Календарь */}
            {calendarModalId === n.id && (
              <div className="absolute right-10 top-0 z-[50] w-60 bg-bx-surface border border-bx-border rounded-2xl p-4.5 shadow-2xl flex flex-col gap-3 font-sans animate-in fade-in zoom-in-95 duration-100 text-bx-text">
                <div className="flex items-center justify-between border-b border-bx-border/50 pb-2">
                  <span className="text-xs font-black uppercase">Экспорт в календарь</span>
                  <button onClick={() => setCalendarModalId(null)} className="text-bx-muted hover:text-bx-text text-sm">✕</button>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-bx-muted uppercase tracking-wider">Выберите дату</label>
                  <input 
                    type="date" 
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="w-full bg-bx-surface-2 text-bx-text text-xs p-2 rounded-xl border border-bx-border focus:outline-none"
                  />
                </div>

                <button
                  onClick={() => handlePushToCalendar(n.text)}
                  disabled={sendingCalendar || !selectedDate}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl transition-all shadow-md mt-1 cursor-pointer"
                >
                  {sendingCalendar ? 'Создаю...' : 'Добавить событие'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {notes.length > 3 && (
        <button 
          onClick={() => setExpanded(e => !e)} 
          className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline transition-colors mt-2"
        >
          {expanded ? '▲ Скрыть' : `▼ Показать все заметки (${notes.length})`}
        </button>
      )}

      {filtered.length === 0 && notes.length > 0 && (
        <p className="text-xs text-bx-muted text-center py-4 italic">Заметок не найдено</p>
      )}
    </div>
  );
}
