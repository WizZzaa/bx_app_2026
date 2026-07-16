import React, { useMemo } from 'react';
import type { Company } from '../../lib/db/types';
import { daysFromNowISO, todayISO } from '../../lib/dates';
import Icon from '../../lib/ui/Icon';
import type { BxEvent, EventStatus } from './useEvents';
import type { CompanyMember } from './useCompanyMembers';
import PlannerEventSummary from './PlannerEventSummary';

export const FOCUS_DAYS = 14;

interface CompanyGroup {
  companyId: string | null;
  events: BxEvent[];
}

export interface FocusDateGroup {
  date: string;
  companies: CompanyGroup[];
}

export function buildFocusGroups(
  events: BxEvent[],
  horizonEnd = daysFromNowISO(FOCUS_DAYS - 1),
): FocusDateGroup[] {
  const byDate = new Map<string, Map<string, BxEvent[]>>();

  for (const event of events) {
    if (event.status === 'done') continue;
    const date = event.due_date || event.date;
    if (date > horizonEnd) continue;
    const companyKey = event.company_id ?? '__personal__';
    let byCompany = byDate.get(date);
    if (!byCompany) {
      byCompany = new Map();
      byDate.set(date, byCompany);
    }
    const companyEvents = byCompany.get(companyKey) ?? [];
    companyEvents.push(event);
    byCompany.set(companyKey, companyEvents);
  }

  return [...byDate.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, byCompany]) => ({
      date,
      companies: [...byCompany.entries()].map(([companyKey, companyEvents]) => ({
        companyId: companyKey === '__personal__' ? null : companyKey,
        events: companyEvents.sort((left, right) => {
          const priorityOrder = { high: 0, normal: 1, low: 2 } as const;
          return priorityOrder[left.priority] - priorityOrder[right.priority]
            || left.title.localeCompare(right.title, 'ru');
        }),
      })),
    }));
}

interface Props {
  events: BxEvent[];
  companies: Company[];
  loading?: boolean;
  members?: CompanyMember[];
  onEventClick: (event: BxEvent) => void;
  onStatusChange: (id: string, status: EventStatus) => void;
}

const STATUS_LABELS: Record<EventStatus, string> = {
  todo: 'Запланировано',
  in_progress: 'В работе',
  review: 'Ждёт подтверждения',
  done: 'Готово',
};

function dateLabel(date: string, today: string): string {
  if (date < today) return new Date(`${date}T12:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  if (date === today) return 'Сегодня';
  return new Date(`${date}T12:00:00`).toLocaleDateString('ru-RU', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

export default function FocusView({ events, companies, members = [], loading, onEventClick, onStatusChange }: Props) {
  const today = todayISO();
  const groups = useMemo(() => buildFocusGroups(events), [events]);
  const companyById = useMemo(() => new Map(companies.map(company => [company.id, company])), [companies]);
  const memberByUserId = useMemo(() => new Map(members.map(member => [member.user_id, member])), [members]);
  const focusEvents = useMemo(
    () => groups.flatMap(group => group.companies.flatMap(company => company.events)),
    [groups],
  );
  const stats = useMemo(() => ({
    overdue: focusEvents.filter(event => (event.due_date || event.date) < today).length,
    today: focusEvents.filter(event => (event.due_date || event.date) === today).length,
    inProgress: focusEvents.filter(event => event.status === 'in_progress').length,
    total: focusEvents.length,
  }), [focusEvents, today]);

  if (loading) {
    return (
      <div className="mx-auto h-full max-w-6xl animate-pulse space-y-4 overflow-hidden">
        <div className="h-28 rounded-3xl border border-bx-border bg-bx-surface" />
        <div className="h-52 rounded-3xl border border-bx-border bg-bx-surface" />
        <span className="sr-only">Обновляем фокус…</span>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pr-1">
      <div className="mx-auto max-w-6xl space-y-5 pb-8">
        <header className="overflow-hidden rounded-3xl border border-bx-border bg-bx-surface shadow-sm">
          <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10">
                  <Icon name="zap" className="h-4 w-4" />
                </span>
                <h2 className="text-base font-extrabold tracking-tight text-bx-text">Фокус на 14 дней</h2>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-bx-muted">Сначала просроченное и срочное, затем ближайшие обязательства.</p>
            </div>
            <span className="self-start rounded-full border border-bx-border bg-bx-surface-2 px-3 py-1 text-[11px] font-bold text-bx-muted sm:self-auto">
              {stats.total} {stats.total === 1 ? 'дело' : 'дел'}
            </span>
          </div>
          <div className="grid grid-cols-2 border-t border-bx-border sm:grid-cols-4">
            {[
              { label: 'Просрочено', value: stats.overdue, tone: stats.overdue ? 'text-red-600 dark:text-red-400' : 'text-bx-text' },
              { label: 'Сегодня', value: stats.today, tone: stats.today ? 'text-amber-600 dark:text-amber-400' : 'text-bx-text' },
              { label: 'В работе', value: stats.inProgress, tone: stats.inProgress ? 'text-blue-600 dark:text-blue-400' : 'text-bx-text' },
              { label: 'Всего в фокусе', value: stats.total, tone: 'text-bx-text' },
            ].map((item, index) => (
              <div key={item.label} className={`px-5 py-3 ${index > 0 ? 'border-l border-bx-border' : ''} ${index === 2 ? 'border-t border-bx-border sm:border-t-0' : ''} ${index === 3 ? 'border-t border-bx-border sm:border-t-0' : ''}`}>
                <div className={`text-lg font-black tabular-nums ${item.tone}`}>{item.value}</div>
                <div className="mt-0.5 text-[10px] font-semibold text-bx-muted">{item.label}</div>
              </div>
            ))}
          </div>
        </header>

        {groups.length === 0 && (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-bx-border bg-bx-surface px-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Icon name="check" className="h-6 w-6" />
            </span>
            <p className="mt-4 text-sm font-bold text-bx-text">На ближайшие 14 дней всё спокойно</p>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-bx-muted">Просроченных и активных обязательств нет. Новые задачи сразу появятся здесь по сроку.</p>
          </div>
        )}

        {groups.map(group => (
          <section key={group.date} aria-labelledby={`focus-date-${group.date}`}>
            <div className="sticky top-0 z-10 -mx-1 bg-bx-bg/90 px-1 py-2 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${group.date < today ? 'bg-red-500' : group.date === today ? 'bg-amber-500' : 'bg-blue-500'}`} />
                <h3 id={`focus-date-${group.date}`} className={`text-[11px] font-extrabold uppercase tracking-[0.12em] ${group.date < today ? 'text-red-600 dark:text-red-400' : group.date === today ? 'text-amber-600 dark:text-amber-400' : 'text-bx-muted'}`}>
                  {group.date < today && 'Просрочено · '}{dateLabel(group.date, today)}
                </h3>
                <span className="rounded-full bg-bx-surface-2 px-2 py-0.5 text-[10px] font-bold text-bx-muted">
                  {group.companies.reduce((sum, item) => sum + item.events.length, 0)}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {group.companies.map(companyGroup => {
                const company = companyGroup.companyId ? companyById.get(companyGroup.companyId) : null;
                return (
                  <div key={companyGroup.companyId ?? 'personal'} className="overflow-hidden rounded-2xl border border-bx-border bg-bx-surface shadow-sm">
                    <div className="flex items-center gap-2 border-b border-bx-border bg-bx-surface-2/45 px-4 py-2.5">
                      <span className="h-2.5 w-2.5 rounded-full ring-4 ring-bx-bg" style={{ backgroundColor: company?.color || '#64748b' }} />
                      <span className="text-xs font-bold text-bx-text">{company?.name ?? 'Личное / без компании'}</span>
                      <span className="ml-auto rounded-full border border-bx-border bg-bx-surface px-2 py-0.5 text-[10px] font-bold text-bx-muted">{companyGroup.events.length}</span>
                    </div>
                    <div className="divide-y divide-bx-border/60">
                      {companyGroup.events.map(event => (
                        <div key={event.id} className="flex flex-col gap-3 px-4 py-3 transition-colors hover:bg-bx-surface-2/50 sm:flex-row sm:items-center">
                          <button
                            onClick={() => onEventClick(event)}
                            className="min-w-0 flex-1 cursor-pointer rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                            aria-label={`Открыть: ${event.title}`}
                          >
                            <PlannerEventSummary
                              event={event}
                              assigneeLabel={event.assignee_id ? memberByUserId.get(event.assignee_id)?.invited_email : null}
                            />
                          </button>
                          <select
                            aria-label={`Статус задачи: ${event.title}`}
                            value={event.status}
                            onChange={change => onStatusChange(event.id, change.target.value as EventStatus)}
                            className="h-10 w-full rounded-xl border border-bx-border bg-bx-bg px-3 text-[11px] font-semibold text-bx-text outline-none transition-colors focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15 sm:w-48"
                          >
                            {(Object.keys(STATUS_LABELS) as EventStatus[]).map(status => (
                              <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
