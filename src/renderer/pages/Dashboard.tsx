import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WeatherWidget from '../components/widgets/WeatherWidget';
import NotificationsWidget from '../components/widgets/NotificationsWidget';
import HoroscopeWidget from '../components/widgets/HoroscopeWidget';
import CurrencyWidget from '../components/widgets/CurrencyWidget';
import { useCompany } from '../lib/CompanyContext';
import { useEvents } from './planner/useEvents';
import { useTransactions } from './finance/useTransactions';
import Icon from '../lib/ui/Icon';
import SmartCalendar from '../components/dashboard/SmartCalendar';
import { todayISO } from '../lib/dates';

const ECP_KEY = 'bx_ecp_keys';
function getExpiringEcpCount(): number {
  try {
    const keys: { expiresAt: string }[] = JSON.parse(localStorage.getItem(ECP_KEY) || '[]');
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
  const today = new Date().toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const todayStr = todayISO();
  const { active, companies } = useCompany();
  const { events, loading } = useEvents(active?.id ?? null);
  const { transactions } = useTransactions(active?.id ?? null);
  const ecpExpiring = getExpiringEcpCount();

  const [showWidgetConfig, setShowWidgetConfig] = useState(false)
  const [widgetVisibility, setWidgetVisibility] = useState({
    weather: true,
    currency: true,
    notifications: true,
    horoscope: false // развлечения — по желанию, включается в «Настроить виджеты»
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

  // Только ручные задачи/напоминания считаются "просроченными"
  const todayEvents   = events.filter(e => (e.due_date || e.date) === todayStr && e.status !== 'done');
  const overdueEvents = events.filter(e =>
    e.due_date && e.due_date < todayStr && e.status !== 'done' &&
    (e.type === 'task' || e.type === 'reminder')
  );
  const upcomingTax = events
    .filter(e => e.type === 'tax_deadline' && e.status !== 'done' && (e.due_date || e.date) >= todayStr)
    .sort((a,b) => (a.due_date||a.date).localeCompare(b.due_date||b.date))
    .slice(0, 3);

  // Метки текущего месяца для умного календаря
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
    { label: 'На сегодня',  value: String(todayEvents.length),   color: 'text-blue-400',   bg: 'bg-blue-500/10',   to: '/planner' },
    { label: 'Просрочено',  value: String(overdueEvents.length),  color: overdueEvents.length > 0 ? 'text-red-400' : 'text-slate-400', bg: overdueEvents.length > 0 ? 'bg-red-500/10' : 'bg-bx-surface', to: '/planner' },
    { label: 'Компаний',    value: String(companies.length),      color: 'text-emerald-400', bg: 'bg-emerald-500/10', to: '/settings' },
    { label: 'ЭЦП истекает',value: ecpExpiring > 0 ? String(ecpExpiring) : '—', color: ecpExpiring > 0 ? 'text-amber-400' : 'text-slate-500', bg: ecpExpiring > 0 ? 'bg-amber-500/10' : 'bg-bx-surface', to: '/ecp' },
  ];

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-bx-text">{greeting()}!</h1>
          <p className="text-sm text-slate-500 capitalize mt-0.5">{today}</p>
        </div>
        <button
          onClick={() => setShowWidgetConfig(o => !o)}
          className="px-3 py-1.5 bg-bx-surface hover:bg-bx-surface-2 border border-bx-border text-slate-300 text-xs rounded-lg transition-colors flex items-center gap-1.5 font-medium"
        >
          ⚙ Настроить виджеты
        </button>
      </div>

      {showWidgetConfig && (
        <div className="bg-bx-surface border border-bx-border rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-300 mb-2">Настройка видимости виджетов</p>
          <div className="flex flex-wrap gap-4 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={widgetVisibility.weather}
                onChange={e => saveWidgetVisibility({ ...widgetVisibility, weather: e.target.checked })}
                className="rounded accent-blue-600 w-3.5 h-3.5"
              />
              Погода
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={widgetVisibility.currency}
                onChange={e => saveWidgetVisibility({ ...widgetVisibility, currency: e.target.checked })}
                className="rounded accent-blue-600 w-3.5 h-3.5"
              />
              Курсы валют
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={widgetVisibility.notifications}
                onChange={e => saveWidgetVisibility({ ...widgetVisibility, notifications: e.target.checked })}
                className="rounded accent-blue-600 w-3.5 h-3.5"
              />
              Уведомления
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={widgetVisibility.horoscope}
                onChange={e => saveWidgetVisibility({ ...widgetVisibility, horoscope: e.target.checked })}
                className="rounded accent-blue-600 w-3.5 h-3.5"
              />
              Гороскоп
            </label>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map(s => (
          <button key={s.label} onClick={() => navigate(s.to)}
            className={`rounded-xl border border-bx-border ${s.bg} p-4 text-left hover:border-bx-accent/30 transition-colors`}>
            <div className={`text-2xl font-bold ${s.color}`}>{loading ? '…' : s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {widgetVisibility.weather && <WeatherWidget />}
        {widgetVisibility.currency && <CurrencyWidget />}
        {widgetVisibility.notifications && <NotificationsWidget />}
        {widgetVisibility.horoscope && <HoroscopeWidget />}
      </div>

      {/* Контроль оплат */}
      <div className="bg-bx-surface border border-bx-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-bx-text">💰 Контроль оплат</h2>
          <button onClick={() => navigate('/finance')} className="text-xs text-blue-400 hover:text-blue-300">Открыть →</button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <FinCell label={`Нам должны · ${fin.receivableN}`} value={fmtMoney(fin.receivable)} color="text-emerald-400" currency="UZS" />
          <FinCell label={`Мы должны · ${fin.payableN}`} value={fmtMoney(fin.payable)} color="text-red-400" currency="UZS" />
        </div>
        {fin.receivableN === 0 && fin.payableN === 0 && (
          <p className="text-[11px] text-slate-600 mt-2">Открытых оплат нет — все счета закрыты ✓</p>
        )}
      </div>

      {/* Planner mini-panel: умный календарь · сегодня · дедлайны */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SmartCalendar marks={calendarMarks} onOpen={() => navigate('/planner')} />
        {/* Сегодня + просрочено */}
        <div className="bg-bx-surface border border-bx-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-bx-text">📋 На сегодня</h2>
            <button onClick={() => navigate('/planner')} className="text-xs text-blue-400 hover:text-blue-300">Все задачи →</button>
          </div>
          {overdueEvents.length > 0 && (
            <div className="mb-2 p-2 bg-red-500/10 rounded-lg">
              <p className="text-[11px] text-red-400 font-medium mb-1">⚠ Просрочено: {overdueEvents.length}</p>
              {overdueEvents.slice(0,2).map(e => (
                <p key={e.id} className="text-xs text-red-300/80 truncate">{e.title}</p>
              ))}
            </div>
          )}
          <div className="space-y-1.5">
            {todayEvents.length === 0 && !loading && (
              <p className="text-xs text-slate-600 text-center py-3">Задач на сегодня нет</p>
            )}
            {todayEvents.slice(0,5).map(e => (
              <div key={e.id} className="flex items-center gap-2 py-1.5 border-b border-bx-border/50 last:border-0">
                <span className="text-base flex-shrink-0">
                  {e.type === 'tax_deadline' ? '📋' : e.type === 'reminder' ? '🔔' : '✅'}
                </span>
                <p className="text-xs text-bx-text truncate flex-1">{e.title}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                  e.priority === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-bx-surface-2 text-slate-600'
                }`}>{e.priority === 'high' ? 'Срочно' : e.type === 'tax_deadline' ? 'Налог' : 'Задача'}</span>
              </div>
            ))}
            {todayEvents.length > 5 && (
              <button onClick={() => navigate('/planner')} className="text-xs text-slate-600 hover:text-slate-400">
                +{todayEvents.length - 5} ещё...
              </button>
            )}
          </div>
        </div>

        {/* Ближайшие налоговые дедлайны */}
        <div className="bg-bx-surface border border-bx-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-bx-text">📅 Ближайшие дедлайны</h2>
            <button onClick={() => navigate('/planner')} className="text-xs text-blue-400 hover:text-blue-300">Открыть →</button>
          </div>
          {upcomingTax.length === 0 && !loading && (
            <div className="text-center py-4">
              <p className="text-xs text-slate-600 mb-2">Нет загруженных дедлайнов</p>
              <button onClick={() => navigate('/planner')} className="text-xs text-blue-400 hover:text-blue-300">
                Открыть Планировщик →
              </button>
            </div>
          )}
          <div className="space-y-2">
            {upcomingTax.map(e => {
              const d = e.due_date || e.date;
              const daysLeft = Math.ceil((new Date(d).getTime() - new Date(todayStr).getTime()) / 86400000);
              return (
                <div key={e.id} className="flex items-center gap-3 py-2 border-b border-[#1e2535]/50 last:border-0">
                  <div className={`w-10 h-10 rounded-lg flex-shrink-0 flex flex-col items-center justify-center text-center
                    ${daysLeft <= 3 ? 'bg-red-500/15' : daysLeft <= 7 ? 'bg-amber-500/15' : 'bg-blue-500/10'}`}>
                    <span className={`text-[11px] font-bold ${daysLeft <= 3 ? 'text-red-400' : daysLeft <= 7 ? 'text-amber-400' : 'text-blue-400'}`}>
                      {fmtDate(d).split(' ')[0]}
                    </span>
                    <span className={`text-[9px] ${daysLeft <= 3 ? 'text-red-400/60' : 'text-slate-600'}`}>
                      {fmtDate(d).split(' ')[1]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-bx-text truncate">{e.title}</p>
                    <p className="text-[10px] text-slate-600">{daysLeft === 0 ? 'сегодня' : `через ${daysLeft} д.`}</p>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0
                    ${e.kind === 'payment' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/15 text-blue-400'}`}>
                    {e.kind === 'payment' ? 'оплата' : 'отчёт'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-medium text-slate-400 mb-3">Быстрые действия</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: 'planner',   label: 'Добавить задачу',     to: '/planner' },
            { icon: 'finance',   label: 'Добавить операцию',   to: '/finance' },
            { icon: 'hr',        label: 'Сотрудники и ЗП',     to: '/hr' },
            { icon: 'calc',      label: 'Калькулятор НДС',     to: '/calc' },
            { icon: 'ai',        label: 'Спросить AI',         to: '/ai' },
            { icon: 'templates', label: 'Шаблоны документов',  to: '/templates' },
          ].map(a => (
            <button key={a.label} onClick={() => navigate(a.to)}
              className="flex items-center gap-3 bg-bx-surface border border-bx-border hover:border-bx-accent/30 hover:bg-bx-surface-2 rounded-xl px-4 py-3 text-sm text-slate-300 transition-all text-left">
              <span className="w-9 h-9 rounded-lg bg-blue-600/15 text-blue-400 flex items-center justify-center flex-shrink-0"><Icon name={a.icon} className="w-[18px] h-[18px]" /></span>
              <span>{a.label}</span>
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
    <div className="bg-bx-bg rounded-lg px-3 py-2">
      <p className="text-[10px] text-slate-500">{label}{hint && <span className="text-slate-700"> · {hint}</span>}</p>
      <p className={`text-base font-semibold ${color} mt-0.5 leading-tight`}>{value}<span className="text-[9px] text-slate-700 font-normal">{sym}</span></p>
    </div>
  )
}
