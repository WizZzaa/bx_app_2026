import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WeatherWidget from '../components/widgets/WeatherWidget';
import NotificationsWidget from '../components/widgets/NotificationsWidget';
import HoroscopeWidget from '../components/widgets/HoroscopeWidget';
import CurrencyWidget from '../components/widgets/CurrencyWidget';
import WidgetBoundary from '../components/WidgetBoundary';
import { useCompany } from '../lib/CompanyContext';
import { useEvents } from './planner/useEvents';
import { useTransactions } from './finance/useTransactions';
import Icon from '../lib/ui/Icon';
import SmartCalendar from '../components/dashboard/SmartCalendar';
import { todayISO } from '../lib/dates';
import { loadEcpKeys } from '../lib/ecpStorage';
import { useToast } from '../lib/ui/ToastContext';
import { createCardFromEvent } from './planner/useCards';
import { supabase } from '../lib/db/supabase';

async function getExpiringEcpCount(): Promise<number> {
  try {
    const keys = await loadEcpKeys();
    const soon = new Date(); soon.setDate(soon.getDate() + 30);
    return keys.filter(k => new Date(k.expiresAt) <= soon).length;
  } catch { return 0; }
}

function greeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Доброе утро';
  if (h >= 12 && h < 18) return 'Добрый день';
  if (h >= 18 && h < 23) return 'Добрый вечер';
  return 'Доброй ночи';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const today = new Date().toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const todayStr = todayISO();
  const { active, companies } = useCompany();
  const { events, loading } = useEvents(active?.id ?? null);
  const { transactions } = useTransactions(active?.id ?? null);
  const [ecpExpiring, setEcpExpiring] = useState(0);
  useEffect(() => { getExpiringEcpCount().then(setEcpExpiring); }, []);

  const [addedEventIds, setAddedEventIds] = useState<Set<string>>(new Set());

  const loadAddedEventIds = async () => {
    try {
      const { data } = await supabase
        .from('bx_cards')
        .select('event_id')
        .not('event_id', 'is', null);
      if (data) {
        setAddedEventIds(new Set(data.map((c: any) => c.event_id).filter(Boolean)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadAddedEventIds();
  }, [events]);

  const handleAddToPlanner = async (event: any) => {
    const card = await createCardFromEvent(event, active?.id ?? null);
    if (card) {
      toast.success(`Задача «${event.title}» добавлена в планировщик!`);
      setAddedEventIds(prev => {
        const next = new Set(prev);
        next.add(event.id);
        return next;
      });
    } else {
      toast.error('Не удалось создать задачу. Убедитесь, что у вас создана хотя бы одна Kanban-доска.');
    }
  };

  const [showWidgetConfig, setShowWidgetConfig] = useState(false)
  const [widgetVisibility, setWidgetVisibility] = useState({
    weather: true,
    currency: true,
    notifications: true,
    horoscope: false
  })

  useEffect(() => {
    try {
      const stored = localStorage.getItem('bx_dashboard_widgets')
      if (stored) {
        setWidgetVisibility(JSON.parse(stored))
      }
    } catch (e) {
      console.warn('Failed to load widget visibility settings', e)
    }
  }, [])

  const saveWidgetVisibility = (updated: typeof widgetVisibility) => {
    setWidgetVisibility(updated)
    localStorage.setItem('bx_dashboard_widgets', JSON.stringify(updated))
  }

  // Контроль оплат: открытые долги (в сумах по курсу операции)
  const fin = (() => {
    let receivable = 0, payable = 0, receivableN = 0, payableN = 0;
    for (const t of transactions) {
      if (t.status !== 'unpaid') continue;
      const amt = t.amount * (t.exchange_rate || 1);
      if (t.type === 'income') { receivable += amt; receivableN++; }
      else { payable += amt; payableN++; }
    }
    return { receivable, payable, receivableN, payableN };
  })();
  const fmtMoney = (n: number) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.round(n));

  const todayEvents   = events.filter(e => (e.due_date || e.date) === todayStr && e.status !== 'done');
  const overdueEvents = events.filter(e =>
    e.due_date && e.due_date < todayStr && e.status !== 'done' &&
    (e.type === 'task' || e.type === 'reminder')
  );
  const upcomingTax = events
    .filter(e => e.type === 'tax_deadline' && e.status !== 'done' && (e.due_date || e.date) >= todayStr)
    .sort((a,b) => (a.due_date||a.date).localeCompare(b.due_date||b.date))
    .slice(0, 3);

  const calendarMarks = (() => {
    const monthPrefix = todayStr.slice(0, 7);
    const deadlines = new Set<number>();
    const tasks = new Set<number>();
    for (const e of events) {
      if (e.status === 'done') continue;
      const d = e.due_date || e.date;
      if (!d?.startsWith(monthPrefix)) continue;
      const day = Number(d.slice(8, 10));
      if (e.type === 'tax_deadline') deadlines.add(day); else tasks.add(day);
    }
    return { deadlines, tasks };
  })();

  const stats = [
    { label: 'На сегодня',  value: String(todayEvents.length),   color: 'text-blue-400',   bg: 'bg-blue-500/5 hover:bg-blue-500/10 border-blue-500/10',   to: '/planner' },
    { label: 'Просрочено',  value: String(overdueEvents.length),  color: overdueEvents.length > 0 ? 'text-red-400 font-bold' : 'text-slate-400', bg: overdueEvents.length > 0 ? 'bg-red-500/5 hover:bg-red-500/10 border-red-500/10' : 'bg-white/[0.02] border-white/5 hover:border-white/10', to: '/planner' },
    { label: 'Компаний',    value: String(companies.length),      color: 'text-emerald-400', bg: 'bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/10', to: '/settings' },
    { label: 'ЭЦП истекает',value: ecpExpiring > 0 ? String(ecpExpiring) : '—', color: ecpExpiring > 0 ? 'text-amber-400' : 'text-slate-400', bg: ecpExpiring > 0 ? 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/10' : 'bg-white/[0.02] border-white/5 hover:border-white/10', to: '/ecp' },
  ];

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10">
      
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="space-y-0.5">
          <h1 className="text-lg font-extrabold text-white tracking-wide">{greeting()}!</h1>
          <p className="text-[11px] text-slate-400 capitalize">{today}</p>
        </div>
        <button
          onClick={() => setShowWidgetConfig(o => !o)}
          className="px-3.5 py-2 bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 text-slate-300 text-xs rounded-xl transition-all flex items-center gap-2 font-semibold shadow-sm"
        >
          <span>⚙</span> Настроить виджеты
        </button>
      </div>

      {showWidgetConfig && (
        <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-4 space-y-3">
          <p className="text-xs font-bold text-white">Выбор активных виджетов на экране</p>
          <div className="flex flex-wrap gap-4 text-xs">
            <label className="flex items-center gap-2.5 cursor-pointer text-slate-300 hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={widgetVisibility.weather}
                onChange={e => saveWidgetVisibility({ ...widgetVisibility, weather: e.target.checked })}
                className="rounded accent-blue-600 w-3.5 h-3.5 bg-slate-950 border-white/10"
              />
              Погода
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer text-slate-300 hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={widgetVisibility.currency}
                onChange={e => saveWidgetVisibility({ ...widgetVisibility, currency: e.target.checked })}
                className="rounded accent-blue-600 w-3.5 h-3.5 bg-slate-950 border-white/10"
              />
              Курсы валют
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer text-slate-300 hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={widgetVisibility.notifications}
                onChange={e => saveWidgetVisibility({ ...widgetVisibility, notifications: e.target.checked })}
                className="rounded accent-blue-600 w-3.5 h-3.5 bg-slate-950 border-white/10"
              />
              Оповещения
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer text-slate-300 hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={widgetVisibility.horoscope}
                onChange={e => saveWidgetVisibility({ ...widgetVisibility, horoscope: e.target.checked })}
                className="rounded accent-blue-600 w-3.5 h-3.5 bg-slate-950 border-white/10"
              />
              Гороскоп
            </label>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <button
            key={s.label}
            onClick={() => navigate(s.to)}
            className={`rounded-2xl border p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] ${s.bg}`}
          >
            <div className={`text-xl font-black ${s.color}`}>{loading ? '…' : s.value}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {widgetVisibility.weather && <WidgetBoundary name="Погода"><WeatherWidget /></WidgetBoundary>}
        {widgetVisibility.currency && <WidgetBoundary name="Курсы валют"><CurrencyWidget /></WidgetBoundary>}
        {widgetVisibility.notifications && <WidgetBoundary name="Оповещения"><NotificationsWidget /></WidgetBoundary>}
        {widgetVisibility.horoscope && <WidgetBoundary name="Бухо-гороскоп"><HoroscopeWidget /></WidgetBoundary>}
      </div>

      {/* Контроль оплат */}
      <div className="bg-slate-900/10 backdrop-blur-md border border-white/5 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">💰 Контроль оплат</h2>
          <button onClick={() => navigate('/finance')} className="text-xs text-blue-400 hover:text-blue-300 font-semibold">Открыть →</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FinCell label={`Нам должны · ${fin.receivableN}`} value={fmtMoney(fin.receivable)} color="text-emerald-400" currency="UZS" />
          <FinCell label={`Мы должны · ${fin.payableN}`} value={fmtMoney(fin.payable)} color="text-red-400" currency="UZS" />
        </div>
        {fin.receivableN === 0 && fin.payableN === 0 && (
          <p className="text-[10px] text-slate-400 mt-3 font-medium">Открытых оплат нет — все счета закрыты ✓</p>
        )}
      </div>

      {/* Planner Section (Calendar / Tasks / Deadlines) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Умный календарь */}
        <div className="bg-slate-900/10 backdrop-blur-md border border-white/5 rounded-3xl p-5">
          <SmartCalendar marks={calendarMarks} onOpen={() => navigate('/planner')} />
        </div>

        {/* Задачи на сегодня */}
        <div className="bg-slate-900/10 backdrop-blur-md border border-white/5 rounded-3xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">📋 На сегодня</h2>
              <button onClick={() => navigate('/planner')} className="text-xs text-blue-400 hover:text-blue-300 font-semibold">Все задачи →</button>
            </div>
            
            {overdueEvents.length > 0 && (
              <div className="mb-3.5 p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                <p className="text-[10px] text-red-400 font-extrabold uppercase tracking-wider mb-1.5">⚠ Просрочено: {overdueEvents.length}</p>
                {overdueEvents.slice(0, 2).map(e => (
                  <p key={e.id} className="text-xs text-red-300/80 truncate leading-relaxed">· {e.title}</p>
                ))}
              </div>
            )}

            <div className="space-y-2">
              {todayEvents.length === 0 && !loading && (
                <p className="text-xs text-slate-500 text-center py-6 italic">Задач на сегодня нет</p>
              )}
              {todayEvents.slice(0, 5).map(e => (
                <div key={e.id} className="flex items-center gap-2.5 py-1.5 border-b border-white/5 last:border-0">
                  <span className="text-base flex-shrink-0">
                    {e.type === 'tax_deadline' ? '📋' : e.type === 'reminder' ? '🔔' : '✅'}
                  </span>
                  <p className="text-xs text-white truncate flex-1 leading-normal">{e.title}</p>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    e.priority === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {e.priority === 'high' ? 'СРОЧНО' : e.type === 'tax_deadline' ? 'НАЛОГ' : 'ЗАДАЧА'}
                  </span>
                </div>
              ))}
              {todayEvents.length > 5 && (
                <button onClick={() => navigate('/planner')} className="text-xs text-slate-500 hover:text-slate-300 mt-2 block font-medium">
                  +{todayEvents.length - 5} ещё...
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Налоговые дедлайны */}
        <div className="bg-slate-900/10 backdrop-blur-md border border-white/5 rounded-3xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">📅 Ближайшие дедлайны</h2>
            <button onClick={() => navigate('/planner')} className="text-xs text-blue-400 hover:text-blue-300 font-semibold">Открыть →</button>
          </div>
          
          {upcomingTax.length === 0 && !loading && (
            <div className="text-center py-6">
              <p className="text-xs text-slate-500 mb-3 italic">Нет загруженных дедлайнов</p>
              <button onClick={() => navigate('/planner')} className="text-xs text-blue-400 hover:text-blue-300 font-semibold">
                Загрузить в Планировщике →
              </button>
            </div>
          )}

          <div className="space-y-3">
            {upcomingTax.map(e => {
              const d = e.due_date || e.date;
              const daysLeft = Math.ceil((new Date(d).getTime() - new Date(todayStr).getTime()) / 86400000);
              return (
                <div key={e.id} className="flex items-center gap-3.5 py-1 border-b border-white/5 last:border-0">
                  <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex flex-col items-center justify-center text-center border
                    ${daysLeft <= 3 ? 'bg-red-500/5 border-red-500/10' : daysLeft <= 7 ? 'bg-amber-500/5 border-amber-500/10' : 'bg-blue-500/5 border-blue-500/10'}`}>
                    <span className={`text-[12px] font-black leading-tight ${daysLeft <= 3 ? 'text-red-400' : daysLeft <= 7 ? 'text-amber-400' : 'text-blue-400'}`}>
                      {fmtDate(d).split(' ')[0]}
                    </span>
                    <span className={`text-[8px] font-bold uppercase ${daysLeft <= 3 ? 'text-red-400/60' : 'text-slate-500'}`}>
                      {fmtDate(d).split(' ')[1]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate leading-tight">{e.title}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{daysLeft === 0 ? 'сегодня' : `через ${daysLeft} д.`}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full border
                      ${e.kind === 'payment' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                      {e.kind === 'payment' ? 'оплата' : 'отчёт'}
                    </span>
                    {addedEventIds.has(e.id) ? (
                      <span className="text-[9px] text-emerald-400 font-extrabold flex items-center gap-0.5 select-none">
                        ✓ готово
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAddToPlanner(e)}
                        className="text-[9px] text-blue-400 hover:text-blue-300 font-bold cursor-pointer px-2 py-0.5 rounded-lg bg-blue-500/5 hover:bg-blue-500/15 border border-blue-500/10 transition-colors"
                      >
                        + в план
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Быстрые действия */}
      <div className="space-y-4">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">Быстрые действия</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {[
            { icon: 'planner',   label: 'План работы',      to: '/planner' },
            { icon: 'finance',   label: 'Внести оплату',    to: '/finance' },
            { icon: 'hr',        label: 'Сотрудники',      to: '/hr' },
            { icon: 'calc',      label: 'Калькулятор',      to: '/calc' },
            { icon: 'ai',        label: 'Спросить AI',      to: '/ai' },
            { icon: 'templates', label: 'Шаблоны',          to: '/templates' },
          ].map(a => (
            <button
              key={a.label}
              onClick={() => navigate(a.to)}
              className="flex flex-col items-center justify-center gap-3 bg-slate-900/10 hover:bg-slate-900/40 border border-white/5 hover:border-white/10 rounded-2xl p-4 text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
            >
              <span className="w-10 h-10 rounded-xl bg-blue-500/5 text-blue-400 flex items-center justify-center flex-shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                <Icon name={a.icon} className="w-[18px] h-[18px]" />
              </span>
              <span className="text-xs font-bold text-white tracking-wide">{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FinCell({ label, value, color, currency, hint }: { label: string; value: string; color: string; currency: string; hint?: string }) {
  const symMap: Record<string, string> = { UZS: ' сум', USD: ' $', EUR: ' €', RUB: ' ₽' }
  const sym = symMap[currency] || ` ${currency}`
  return (
    <div className="bg-slate-950/40 border border-white/5 rounded-xl px-4 py-3 flex-1">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}{hint && <span className="text-slate-500"> · {hint}</span>}</p>
      <p className={`text-base font-black ${color} mt-1 leading-tight`}>{value}<span className="text-[10px] text-slate-500 font-medium">{sym}</span></p>
    </div>
  )
}
