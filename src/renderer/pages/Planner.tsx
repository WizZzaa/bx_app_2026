import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEvents } from './planner/useEvents';
import { seedTaxDeadlines, syncTaxDeadlines } from './planner/taxSeeder';
import { useCompanyMembers } from './planner/useCompanyMembers';
import CalendarView from './planner/CalendarView';
import DailyTasksModal from './planner/DailyTasksModal';
import FocusView from './planner/FocusView';
import EventModal from './planner/EventModal';
import SystemTaskBoard from './planner/SystemTaskBoard';
import { useCompany } from '../lib/CompanyContext';
import { useToast } from '../lib/ui/ToastContext';
import { supabase } from '../lib/db/supabase';
import { requestNotificationPermission, startReminderLoop, stopReminderLoop } from '../lib/notifications';
import type { BxEvent, NewEvent, EventStatus } from './planner/useEvents';
import { todayISO, nextRecurrenceISO } from '../lib/dates';
import type { TaxDeadline } from '../data/taxCalendar';

type View = 'focus' | 'calendar' | 'board';

export const DEFAULT_PLANNER_VIEW: View = 'calendar';

const TYPE_FILTERS = [
  { id: '',             label: 'Все' },
  { id: 'task',         label: '✅ Задачи' },
  { id: 'tax_deadline', label: '📋 Дедлайны' },
  { id: 'reminder',     label: '🔔 Напомин.' },
  { id: 'event',        label: '📅 События' },
];

export default function Planner() {
  const location = useLocation();
  const navigate = useNavigate();
  const { active, companies, setActive } = useCompany();
  const toast = useToast();
  const { events, loading, error: eventsError, reload, add, update, remove } = useEvents();

  const [view,      setView]      = useState<View>(DEFAULT_PLANNER_VIEW);

  // events modal (calendar/list)
  const [modalOpen, setModalOpen] = useState(false);
  const [editing,   setEditing]   = useState<BxEvent | null>(null);
  const [defDate,   setDefDate]   = useState('');
  const [defaultEvent, setDefaultEvent] = useState<Partial<NewEvent> | null>(null);
  const [typeF,     setTypeF]     = useState('');

  const memberCompanyId = editing?.company_id ?? active?.id ?? null;
  const { members, loading: membersLoading } = useCompanyMembers(memberCompanyId);

  const [seedMsg, setSeedMsg] = useState('');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Одноразово убираем локальные кэши удалённой проектной подсистемы.
  useEffect(() => {
    localStorage.removeItem('bx_boards_cache_v1');
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (key?.startsWith('bx_cards_cache_')) localStorage.removeItem(key);
    }
  }, []);

  async function handleDeleteEventDirect(id: string) {
    const removed = await remove(id);
    if (removed) toast.info('Событие удалено');
    else toast.error('Не удалось удалить событие');
  }

  // Уведомления
  useEffect(() => {
    requestNotificationPermission().then(granted => { if (granted) startReminderLoop(() => events); });
    return () => stopReminderLoop();
  }, [events]);

  const [syncing, setSyncing] = useState(false);

  async function handleForceSync() {
    if (!active?.id) {
      toast.info('Сначала выберите компанию');
      return;
    }
    if (active.profile_status !== 'confirmed' || !active.bx_start_date) {
      toast.info('Сначала откройте настройки компании и подтвердите её профиль');
      return;
    }
    setSyncing(true);
    toast.info('Проверяем горизонт на 60 дней...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const result = await syncTaxDeadlines(user.id, active.id);
      await reload();
      if (result.added > 0 || result.removed > 0) {
        toast.success(`Обязательства обновлены: +${result.added}, −${result.removed}`);
      } else {
        toast.success('Горизонт уже актуален');
      }
    } catch (e) {
      console.error(e);
      toast.error('Ошибка синхронизации');
    } finally {
      setSyncing(false);
    }
  }

  // Seed tax deadlines
  useEffect(() => {
    async function doSeed() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const activeCompanies = companies.filter(company =>
          company.is_active
          && company.profile_status === 'confirmed'
          && Boolean(company.bx_start_date)
          && (company.enabled_obligation_rules?.length ?? 0) > 0,
        );
        const counts = await Promise.all(activeCompanies.map(company => seedTaxDeadlines(user.id, company.id)));
        const count = counts.reduce((total, value) => total + value, 0);
        if (count > 0) {
          await reload();
          setSeedMsg(`Добавлено ${count} обязательств на 60 дней`);
          setTimeout(() => setSeedMsg(''), 4000);
        }
      } catch (seedError) {
        console.error('[Planner] automatic obligations sync failed:', seedError);
      }
    }
    doSeed();
  }, [companies, reload]);

  const today = todayISO();
  const filtered = typeF ? events.filter(e => e.type === typeF) : events;
  const todayCount = events.filter(e => (e.due_date || e.date) === today && e.status !== 'done').length;
  const overdueCount = events.filter(e => e.due_date && e.due_date < today && e.status !== 'done' && (e.type === 'task' || e.type === 'reminder')).length;

  useEffect(() => {
    const routeState = location.state as { newTask?: { title?: string; note?: string; date?: string } } | null;
    if (!routeState?.newTask) return;
    setEditing(null);
    setDefDate(routeState.newTask.date || today);
    setDefaultEvent({
      type: 'task',
      title: routeState.newTask.title?.trim() || 'Новая задача',
      note: routeState.newTask.note?.trim() || null,
      status: 'todo',
      priority: 'normal',
    });
    setModalOpen(true);
    navigate('/planner', { replace: true, state: null });
  }, [location.state, navigate, today]);

  // ── events handlers ──
  function openNewEvent(date?: string, preset?: Partial<NewEvent>) {
    setEditing(null);
    setDefDate(date || today);
    setDefaultEvent(preset ?? null);
    setModalOpen(true);
  }
  function openEditEvent(ev: BxEvent) {
    setEditing(ev);
    setDefaultEvent(null);
    setModalOpen(true);
  }

  useEffect(() => {
    function openRequestedEvent(eventId: string | null) {
      if (!eventId) return;
      const requested = events.find(event => event.id === eventId);
      if (!requested) return;
      const requestedCompany = companies.find(company => company.id === requested.company_id);
      if (requestedCompany) setActive(requestedCompany);
      setEditing(requested);
      setDefaultEvent(null);
      setModalOpen(true);
      localStorage.removeItem('bx_planner_open_event_id');
    }

    function handleOpenRequest(event: Event) {
      const detail = (event as CustomEvent<{ eventId?: string }>).detail;
      openRequestedEvent(detail?.eventId ?? null);
    }

    openRequestedEvent(localStorage.getItem('bx_planner_open_event_id'));
    window.addEventListener('bx:open-planner-event', handleOpenRequest);
    return () => window.removeEventListener('bx:open-planner-event', handleOpenRequest);
  }, [companies, events, setActive]);

  function handleAddTaxDeadline(date: string, deadline: TaxDeadline) {
    if (!active?.id) {
      toast.info('Выберите компанию в верхней панели, затем добавьте срок в задачи');
      return;
    }
    const sourceKey = `tax:${deadline.id}:${date}`;
    const existing = events.find(event => event.company_id === active?.id && event.source_key === sourceKey);
    if (existing) {
      openEditEvent(existing);
      return;
    }
    openNewEvent(date, {
      company_id: active?.id ?? null,
      type: 'tax_deadline',
      title: deadline.title,
      date,
      due_date: date,
      status: 'todo',
      priority: deadline.kind === 'payment' || deadline.kind === 'both' ? 'high' : 'normal',
      tags: [deadline.taxType],
      tax_type: deadline.taxType,
      kind: deadline.kind,
      regime: deadline.regime,
      note: [deadline.note, deadline.law].filter(Boolean).join('\n') || null,
      source: 'seeded',
      source_key: sourceKey,
      reminder_at: null,
      recurrence: null,
      assignee_id: null,
    });
  }

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
    const companyId = editing?.company_id ?? active?.id ?? null;
    if (!companyId) {
      toast.info('Сначала выберите компанию');
      return;
    }
    const companyEvent = { ...data, company_id: companyId };
    if (editing) {
      const saved = await update(editing.id, companyEvent);
      if (!saved) {
        toast.error('Не удалось сохранить изменения');
        return;
      }
      if (companyEvent.status === 'done' && editing.status !== 'done') await spawnNextOccurrence(companyEvent);
    } else {
      const created = await add(companyEvent);
      if (!created) {
        toast.error('Не удалось добавить событие');
        return;
      }
    }
    toast.success(editing ? 'Событие обновлено' : 'Событие добавлено');
    setTypeF('');
    setModalOpen(false); setEditing(null); setDefaultEvent(null);
  }
  async function handleDeleteEvent() {
    if (!editing) return;
    const removed = await remove(editing.id);
    if (!removed) {
      toast.error('Не удалось удалить событие');
      return;
    }
    toast.info('Событие удалено');
    setModalOpen(false); setEditing(null); setDefaultEvent(null);
  }

  async function handleStatusChange(id: string, status: EventStatus) {
    const ev = events.find(e => e.id === id);
    const saved = await update(id, { status });
    if (!saved) {
      toast.error('Не удалось изменить статус');
      return;
    }
    if (ev && status === 'done' && ev.status !== 'done' && ev.recurrence) {
      const base: NewEvent = {
        company_id: ev.company_id,
        type: ev.type,
        title: ev.title,
        date: ev.date,
        due_date: ev.due_date,
        status: ev.status,
        priority: ev.priority,
        tags: ev.tags,
        tax_type: ev.tax_type,
        kind: ev.kind,
        regime: ev.regime,
        note: ev.note,
        source: ev.source,
        source_key: null,
        reminder_at: ev.reminder_at,
        recurrence: ev.recurrence ?? null,
        assignee_id: ev.assignee_id,
      };
      await spawnNextOccurrence(base);
    }
  }

  // Перенос срока перетаскиванием в календаре
  async function handleEventDrop(id: string, newDate: string) {
    const ev = events.find(e => e.id === id);
    if (!ev) return;
    // Переносим то поле, по которому событие показано в календаре
    const saved = ev.due_date
      ? await update(id, { due_date: newDate })
      : await update(id, { date: newDate });
    if (!saved) {
      toast.error('Не удалось перенести срок');
      return;
    }
    toast.success(`Перенесено на ${new Date(newDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`);
  }

  const systemEvents = active
    ? filtered.filter(event => event.company_id === active.id)
    : filtered;

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative bg-bx-bg">
      {/* Top bar */}
      <div className="flex-shrink-0 border-b border-bx-border px-6 py-4 bg-bx-surface shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-extrabold text-bx-text uppercase tracking-wider">Планировщик</h1>
            <div className="flex items-center gap-1.5 flex-wrap">
              {todayCount > 0 && <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-bold px-2.5 py-0.5 rounded-full">Сегодня: {todayCount}</span>}
              {overdueCount > 0 && <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 font-bold px-2.5 py-0.5 rounded-full">Просрочено: {overdueCount}</span>}
            </div>
            {seedMsg && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">{seedMsg}</span>}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleForceSync}
              disabled={syncing}
              className="px-3.5 py-2 bg-bx-surface hover:bg-bx-surface-2 text-bx-text hover:text-blue-500 text-xs font-bold rounded-xl transition-all border border-bx-border hover:border-blue-500/20 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <span>{syncing ? '⌛' : '🔄'}</span> Продлить горизонт
            </button>

            {/* Segmented Control */}
            <div className="flex bg-bx-surface-2 border border-bx-border rounded-xl p-0.5">
              {([['focus','Фокус'],['calendar','Календарь'],['board','Доска']] as const).map(([v,l]) => (
                <button 
                  key={v} 
                  onClick={() => setView(v as View)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-all font-semibold cursor-pointer ${
                    view === v 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-bx-muted hover:text-bx-text'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            <button onClick={() => openNewEvent()}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer">
              {view === 'board' ? '+ Задача' : '+ Добавить'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
          {TYPE_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setTypeF(f.id)}
              className={`px-3 py-1 text-[11px] rounded-lg transition-all font-semibold ${
                typeF === f.id
                  ? 'bg-blue-600/10 border border-blue-500/20 text-blue-400'
                  : 'text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-900/5 dark:hover:bg-white/[0.02] hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
          {loading && <span className="text-[10px] text-slate-500 ml-auto italic animate-pulse">обновление...</span>}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden p-4">
        {eventsError && (
          <div className="mb-3 px-3 py-2 text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl">
            Не удалось обновить события: {eventsError}
          </div>
        )}
        {view === 'board' && (
          <SystemTaskBoard
            events={systemEvents}
            members={members}
            loading={loading}
            onEventClick={openEditEvent}
            onStatusChange={handleStatusChange}
            onAdd={status => openNewEvent(undefined, { status })}
          />
        )}
        {view === 'focus' && (
          <FocusView
            events={filtered}
            companies={companies}
            loading={loading}
            onEventClick={openEditEvent}
            onStatusChange={handleStatusChange}
            members={members}
          />
        )}
        {view === 'calendar' && (
          <CalendarView
            events={filtered}
            onDayClick={(date) => setSelectedDay(date)}
            onAddEvent={openNewEvent}
            onEventClick={openEditEvent}
            onEventStatusChange={handleStatusChange}
            onEventDrop={handleEventDrop}
            onAddDeadline={handleAddTaxDeadline}
            members={members}
            companyId={active?.id ?? null}
            companyRegime={active?.regime ?? null}
          />
        )}
      </div>

      {/* Modals */}
      {modalOpen && (
        <EventModal event={editing} defaultDate={defDate} defaultType="task" defaultEvent={defaultEvent}
          members={members} membersLoading={membersLoading}
          onSave={handleSaveEvent} onDelete={editing ? handleDeleteEvent : undefined}
          onClose={() => { setModalOpen(false); setEditing(null); setDefaultEvent(null); }} />
      )}
      {selectedDay && (
        <DailyTasksModal
          date={selectedDay}
          events={events.filter(e => (e.due_date || e.date) === selectedDay)}
          cards={[]}
          boards={[]}
          onEventClick={openEditEvent}
          onCardClick={() => undefined}
          onEventStatusChange={handleStatusChange}
          onCardStatusChange={() => undefined}
          onDeleteEvent={handleDeleteEventDirect}
          onDeleteCard={async () => undefined}
          onAddClick={openNewEvent}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}
