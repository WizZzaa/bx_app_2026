import { useState } from 'react';
import {
  COMPANY_ROLE_GUIDE,
  COMPANY_ROLE_LABELS,
  type CompanyRole,
} from '../lib/companyTeam';
import Icon from '../lib/ui/Icon';

const ROLE_TONES: Record<CompanyRole, string> = {
  owner: 'border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300',
  accountant: 'border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300',
  assistant: 'border-cyan-500/25 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
  viewer: 'border-bx-border bg-bx-surface-2 text-bx-muted',
};

export function CompanyRoleGuide() {
  const [expandedRole, setExpandedRole] = useState<CompanyRole | null>('owner');

  function toggleRole(role: CompanyRole) {
    setExpandedRole(current => current === role ? null : role);
  }

  return (
    <aside
      aria-labelledby="company-role-guide-title"
      className="rounded-[20px] border border-bx-border bg-bx-surface p-4 shadow-sm xl:sticky xl:top-5 xl:self-start"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-300">
          <Icon name="shield" className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-600 dark:text-blue-300">
            Подсказка по доступу
          </p>
          <h2 id="company-role-guide-title" className="mt-1 text-sm font-black text-bx-text">
            Кто что может делать
          </h2>
          <p className="mt-1 text-[11px] leading-relaxed text-bx-muted">
            Роль действует только внутри этой компании и не даёт доступ к другим организациям.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {COMPANY_ROLE_GUIDE.map(item => {
          const isExpanded = expandedRole === item.role;
          const panelId = `company-role-${item.role}`;
          return (
            <section key={item.role} className="overflow-hidden rounded-2xl border border-bx-border bg-bx-bg">
              <button
                type="button"
                aria-expanded={isExpanded}
                aria-controls={panelId}
                onClick={() => toggleRole(item.role)}
                className="flex min-h-14 w-full items-center gap-3 px-3 py-2.5 text-left outline-none transition-colors hover:bg-bx-surface-2 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
              >
                <span className={`rounded-lg border px-2 py-1 text-[9px] font-black ${ROLE_TONES[item.role]}`}>
                  {COMPANY_ROLE_LABELS[item.role]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-black text-bx-text">{item.shortLabel}</span>
                  <span className="mt-0.5 block text-[10px] leading-snug text-bx-muted">
                    {item.summary}
                  </span>
                </span>
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-bx-border text-bx-muted transition-transform ${isExpanded ? 'rotate-90 bg-blue-500/10 text-blue-600 dark:text-blue-300' : 'bg-bx-surface'}`}>
                  <Icon name="arrowR" className="h-3.5 w-3.5" />
                </span>
              </button>

              {isExpanded && (
                <div id={panelId} className="border-t border-bx-border px-3 pb-3 pt-3">
                  <p className="text-[9px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Можно</p>
                  <ul className="mt-2 space-y-2">
                    {item.can.map(permission => (
                      <li key={permission} className="flex gap-2 text-[10px] leading-relaxed text-bx-text">
                        <Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span>{permission}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-[9px] font-black uppercase tracking-wider text-red-700 dark:text-red-300">Нельзя</p>
                  <ul className="mt-2 space-y-2">
                    {item.cannot.map(restriction => (
                      <li key={restriction} className="flex gap-2 text-[10px] leading-relaxed text-bx-muted">
                        <Icon name="crossSmall" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600 dark:text-red-400" />
                        <span>{restriction}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3">
        <div className="flex gap-2">
          <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
          <div>
            <h3 className="text-[10px] font-black text-bx-text">Как выбрать без ошибки</h3>
            <p className="mt-1 text-[10px] leading-relaxed text-bx-muted">
              Управляет компанией — <strong className="text-bx-text">Владелец</strong>. Ведёт работу — <strong className="text-bx-text">Бухгалтер</strong> или <strong className="text-bx-text">Помощник</strong>. Только проверяет — <strong className="text-bx-text">Наблюдатель</strong>.
            </p>
          </div>
        </div>
      </div>

      <p className="mt-3 text-[9px] leading-relaxed text-bx-muted">
        Новый участник видит задачи и сроки только с даты, когда принял приглашение. Права начинают действовать после принятия.
      </p>
    </aside>
  );
}
