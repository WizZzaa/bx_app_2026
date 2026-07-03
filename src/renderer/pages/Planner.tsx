import React, { useState, useEffect } from 'react';
import { useEvents } from './planner/useEvents';
import { useBoards, type BxBoard, type BoardColumn } from './planner/useBoards';
import { useCards, fetchDatedCards, fetchCardById, fetchAllCards, type BxCard, type DatedCard, type AllCard } from './planner/useCards';
import { seedTaxDeadlines } from './planner/taxSeeder';
import CalendarView from './planner/CalendarView';
import AllTasksView from './planner/AllTasksView';
import ListView from './planner/ListView';
import EventModal from './planner/EventModal';
import BoardKanban from './planner/BoardKanban';
import BoardModal from './planner/BoardModal';
import CardModal from './planner/CardModal';
import ArchivePanel from './planner/ArchivePanel';
import { useCompany } from '../lib/CompanyContext';
import { useToast } from '../lib/ui/ToastContext';
import { supabase } from '../lib/db/supabase';
import { requestNotificationPermission, startReminderLoop, stopReminderLoop } from '../lib/notifications';
import type { BxEvent, NewEvent, EventStatus } from './planner/useEvents';
import { todayISO, nextRecurrenceISO } from '../lib/dates';

type View = 'board' | 'all' | 'calendar' | 'list';

const TYPE_FILTERS = [
  { id: '',             label: 'Все' },
  { id: 'task',         label: '✅ Задачи' },
  { id: 'tax_deadline', label: '📋 Дедлайны' },
  { id: 'reminder',     label: '🔔 Напомин.' },
  { id: 'event',        label: '📅 События' },
];

export default function Planner() {
  const { active } = useCompany();
  const toast = useToast();
  const { events, loading, reload, add, update, remove, bulkRemove } = useEvents(active?.id ?? null);
  const { boards, loading: boardsLoading, error: boardsError, createBoard, updateBoard, deleteBoard } = useBoards(active?.id ?? null);

  const [view,      setView]      = useState<View>('board');
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);

  // events modal (calendar/list)
  const [modalOpen, setModalOpen] = useState(false);
  const [editing,   setEditing]   = useState<BxEvent | null>(null);
  const [defDate,   setDefDate]   = useState('');
  const [typeF,     setTypeF]     = useState('');

  // board modals
  const [boardModalOpen, setBoardModalOpen] = useState(false);
  const [editingBoard,   setEditingBoard]   = useState<BxBoard | null>(null);
  const [activeCard,     setActiveCard]     = useState<BxCard | null>(null);

  const [seedMsg, setSeedMsg] = useState('');

  // active board resolution
  useEffect(() => {
    if (boards.length && !boards.find(b => b.id === activeBoardId)) {
      setActiveBoardId(boards[0].id);
    }
  }, [boards, activeBoardId]);

  const activeBoard = boards.find(b => b.id === activeBoardId) ?? null;
  const { cards, addCard, updateCard, removeCard, archiveCard, moveCard, loadArchived, restoreCard, duplicateCard, loadComments, addComment, removeComment } = useCards(activeBoard?.id ?? null);

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [datedCards,  setDatedCards]  = useState<DatedCard[]>([]);
  const [allCards,    setAllCards]    = useState<AllCard[]>([]);

  // Карточки со сроком по всем доскам — для Календаря
  useEffect(() => {
    if (view === 'calendar') fetchDatedCards().then(setDatedCards);
    if (view === 'all') fetchAllCards().then(setAllCards);
  }, [view, cards]);

  async function openCardFromCalendar(id: string) {
    const card = await fetchCardById(id);
    if (!card) return;
    setActiveBoardId(card.board_id);
    setView('board');
    setActiveCard(card);
  }

  // Уведомления
  useEffect(() => {
    requestNotificationPermission().then(granted => { if (granted) startReminderLoop(() => events); });
    return () => stopReminderLoop();
  }, [events]);

  // Seed tax deadlines
  useEffect(() => {
    async function doSeed() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const year = new Date().getFullYear();
      const count = await seedTaxDeadlines(year, user.id, active?.id ?? null);
      if (count > 0) { reload(); setSeedMsg(`Загружено ${count} налоговых дедлайнов ${year}`); setTimeout(() => setSeedMsg(''), 4000); }
    }
    doSeed();
  }, [active?.id]);

  const today = todayISO();
  const filtered = typeF ? events.filter(e => e.type === typeF) : events;
  const todayCount = events.filter(e => (e.due_date || e.date) === today && e.status !== 'done').length;
  const overdueCount = events.filter(e => e.due_date && e.due_date < today && e.status !== 'done' && (e.type === 'task' || e.type === 'reminder')).length;

  // ── events handlers ──
  function openNewEvent(date?: string) { setEditing(null); setDefDate(date || today); setModalOpen(true); }
  function openEditEvent(ev: BxEvent) { setEditing(ev); setModalOpen(true); }

  // Повторяющиеся задачи: при завершении создаём следующее вхождение
  async function spawnNextOccurrence(base: NewEvent) {
    if (!base.recurrence) return;
    const nextDate = nextRecurrenceISO(base.date, base.recurrence);
    const created = await add({
      ...base,
      date: nextDate,
      due_date: base.due_date ? nextRecurrenceISO(base.due_date, base.recurrence) : null,
      status: 'todo',
    });
    if (created) toast.info(`Повтор создан на ${new Date(nextDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`);
  }

  async function handleSaveEvent(data: NewEvent) {
    if (editing) {
      await update(editing.id, data);
      if (data.status === 'done' && editing.status !== 'done') await spawnNextOccurrence(data);
    } else {
      await add(data);
    }
    toast.success(editing ? 'Событие обновлено' : 'Событие добавлено');
    setModalOpen(false); setEditing(null);
  }
  async function handleDeleteEvent() { if (editing) await remove(editing.id); toast.info('Событие удалено'); setModalOpen(false); setEditing(null); }

  async function handleStatusChange(id: string, status: EventStatus) {
    const ev = events.find(e => e.id === id);
    await update(id, { status });
    if (ev && status === 'done' && ev.status !== 'done' && ev.recurrence) {
      const { id: _id, user_id: _u, created_at: _c, ...base } = ev;
      await spawnNextOccurrence(base as NewEvent);
    }
  }

  // Перенос срока перетаскиванием в календаре
  async function handleEventDrop(id: string, newDate: string) {
    const ev = events.find(e => e.id === id);
    if (!ev) return;
    // Переносим то поле, по которому событие показано в календаре
    if (ev.due_date) await update(id, { due_date: newDate });
    else await update(id, { date: newDate });
    toast.success(`Перенесено на ${new Date(newDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`);
  }

  async function handleCardDrop(id: string, newDate: string) {
    const { error } = await supabase.from('bx_cards').update({ due_date: newDate }).eq('id', id);
    if (error) { toast.error('Не удалось перенести карточку'); return; }
    setDatedCards(await fetchDatedCards());
    toast.success(`Срок карточки: ${new Date(newDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`);
  }

  // ── board handlers ──
  async function handleSaveBoard(name: string, icon: string, color: string) {
    if (editingBoard) {
      await updateBoard(editingBoard.id, { name, icon, color });
    } else {
      const b = await createBoard(name, icon, color);
      if (b) setActiveBoardId(b.id);
    }
    toast.success(editingBoard ? 'Доска сохранена' : 'Доска создана');
    setBoardModalOpen(false); setEditingBoard(null);
  }
  async function handleDeleteBoard() {
    if (editingBoard) { await deleteBoard(editingBoard.id); setActiveBoardId(boards.find(b => b.id !== editingBoard.id)?.id ?? null); toast.info('Доска удалена'); }
    setBoardModalOpen(false); setEditingBoard(null);
  }
  function handleUpdateColumns(columns: BoardColumn[]) {
    if (activeBoard) updateBoard(activeBoard.id, { columns });
  }
  function handleAddCard(columnId: string, title: string) {
    if (activeBoard) addCard({ board_id: activeBoard.id, column_id: columnId, title });
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex-shrink-0 border-b border-[#1e2535] px-6 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <h1 className="text-base font-semibold text-white">Планировщик</h1>
            <div className="flex items-center gap-2">
              {todayCount > 0 && <span className="text-[11px] bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full">сегодня: {todayCount}</span>}
              {overdueCount > 0 && <span className="text-[11px] bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full">просрочено: {overdueCount}</span>}
            </div>
            {seedMsg && <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">{seedMsg}</span>}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-[#0f1117] border border-[#1e2535] rounded-lg p-0.5">
              {([['board','Доски'],['all','Все задачи'],['calendar','Календарь'],['list','Список']] as const).map(([v,l]) => (
                <button key={v} onClick={() => setView(v as View)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${view === v ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>{l}</button>
              ))}
            </div>
            {view === 'board' ? (
              <button onClick={() => { setEditingBoard(null); setBoardModalOpen(true); }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors">+ Доска</button>
            ) : (
              <button onClick={() => openNewEvent()}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors">+ Добавить</button>
            )}
          </div>
        </div>

        {/* Board switcher OR type filters */}
        {view === 'board' ? (
          <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
            {boards.map(b => (
              <button key={b.id} onClick={() => setActiveBoardId(b.id)}
                onDoubleClick={() => { setEditingBoard(b); setBoardModalOpen(true); }}
                className={`group px-2.5 py-1 text-xs rounded-lg transition-colors flex items-center gap-1.5 ${activeBoardId === b.id ? 'bg-[#1e2535] text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                <span>{b.icon}</span>{b.name}
                {activeBoardId === b.id && (
                  <span onClick={(e) => { e.stopPropagation(); setEditingBoard(b); setBoardModalOpen(true); }}
                    className="text-slate-600 hover:text-slate-300 ml-0.5">⚙</span>
                )}
              </button>
            ))}
            {boards.length === 0 && <span className="text-[11px] text-slate-600">Создаётся доска по умолчанию...</span>}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 mt-2.5">
            {TYPE_FILTERS.map(f => (
              <button key={f.id} onClick={() => setTypeF(f.id)}
                className={`px-2.5 py-0.5 text-[11px] rounded-md transition-colors ${typeF === f.id ? 'bg-blue-600/25 text-blue-400' : 'text-slate-600 hover:text-slate-400'}`}>{f.label}</button>
            ))}
            {loading && <span className="text-[10px] text-slate-700 ml-auto">обновление...</span>}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden p-4">
        {view === 'board' && activeBoard && (
          <BoardKanban
            board={activeBoard}
            cards={cards}
            onCardClick={setActiveCard}
            onAddCard={handleAddCard}
            onMoveCard={moveCard}
            onUpdateColumns={handleUpdateColumns}
            onOpenArchive={() => setArchiveOpen(true)}
          />
        )}
        {view === 'board' && !activeBoard && boardsLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-600 text-sm">
            <span className="w-5 h-5 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
            Загрузка досок...
          </div>
        )}
        {view === 'board' && !activeBoard && !boardsLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
            <p className="text-4xl">🗂️</p>
            <p className="text-sm text-slate-400">Пока нет ни одной доски</p>
            {boardsError && <p className="text-[11px] text-red-400/70 max-w-sm">{boardsError}</p>}
            <button onClick={() => { setEditingBoard(null); setBoardModalOpen(true); }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors">
              + Создать доску
            </button>
          </div>
        )}
        {view === 'all' && (
          <AllTasksView
            events={filtered}
            cards={allCards}
            boards={boards}
            onEventClick={openEditEvent}
            onCardClick={openCardFromCalendar}
            onEventStatusChange={handleStatusChange}
          />
        )}
        {view === 'calendar' && (
          <CalendarView events={filtered} cards={datedCards} onDayClick={openNewEvent} onEventClick={openEditEvent} onCardClick={openCardFromCalendar}
            onEventDrop={handleEventDrop} onCardDrop={handleCardDrop} />
        )}
        {view === 'list' && (
          <ListView events={filtered} onEdit={openEditEvent} onStatusChange={handleStatusChange} onDelete={bulkRemove} />
        )}
      </div>

      {/* Modals */}
      {modalOpen && (
        <EventModal event={editing} defaultDate={defDate} defaultType="task"
          onSave={handleSaveEvent} onDelete={editing ? handleDeleteEvent : undefined}
          onClose={() => { setModalOpen(false); setEditing(null); }} />
      )}
      {boardModalOpen && (
        <BoardModal board={editingBoard} onSave={handleSaveBoard}
          onDelete={editingBoard ? handleDeleteBoard : undefined}
          onClose={() => { setBoardModalOpen(false); setEditingBoard(null); }} />
      )}
      {activeCard && activeBoard && (
        <CardModal
          card={activeCard}
          columns={activeBoard.columns}
          onUpdate={updateCard}
          onArchive={(id) => { archiveCard(id); setActiveCard(null); toast.info('Карточка в архиве'); }}
          onDelete={(id) => { removeCard(id); setActiveCard(null); toast.info('Карточка удалена'); }}
          onDuplicate={(card) => duplicateCard(card)}
          onClose={() => setActiveCard(null)}
          loadComments={loadComments}
          addComment={addComment}
          removeComment={removeComment}
        />
      )}
      {archiveOpen && activeBoard && (
        <ArchivePanel
          boardName={activeBoard.name}
          loadArchived={loadArchived}
          onRestore={restoreCard}
          onDelete={removeCard}
          onClose={() => setArchiveOpen(false)}
        />
      )}
    </div>
  );
}
