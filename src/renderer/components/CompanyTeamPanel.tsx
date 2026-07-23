import { useState, type FormEvent } from 'react';
import { useCompany } from '../lib/CompanyContext';
import {
  COMPANY_ROLE_DESCRIPTIONS,
  COMPANY_ROLE_LABELS,
  getCompanyTeamErrorMessage,
  type CompanyRole,
  type CompanyTeamMember,
  type IncomingCompanyInvite,
} from '../lib/companyTeam';
import { useCompanyTeam } from '../lib/useCompanyTeam';
import { useToast } from '../lib/ui/ToastContext';

interface Props {
  title?: string;
  description?: string;
}

const INVITABLE_ROLES: CompanyRole[] = ['assistant', 'accountant', 'viewer', 'owner'];

export function CompanyTeamPanel({
  title = 'Команда компании',
  description = 'Приглашайте пользователей BX и назначайте им задачи в планировщике',
}: Props) {
  const { active, reload: reloadCompanies } = useCompany();
  const toast = useToast();
  const team = useCompanyTeam(active?.id);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<CompanyRole>('assistant');
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  async function runAction(key: string, action: () => Promise<void>, successMessage: string) {
    setBusyAction(key);
    try {
      await action();
      toast.success(successMessage);
    } catch (actionError) {
      toast.error(getCompanyTeamErrorMessage(actionError));
    } finally {
      setBusyAction(null);
    }
  }

  async function handleInvite(event: FormEvent) {
    event.preventDefault();
    await runAction('invite', async () => {
      await team.invite(inviteEmail, inviteRole);
      setInviteEmail('');
    }, 'Приглашение появится у пользователя после входа в BX');
  }

  async function handleAccept(invite: IncomingCompanyInvite) {
    await runAction(`accept-${invite.id}`, async () => {
      await team.acceptInvite(invite.id);
      localStorage.setItem('bx_active_company', invite.organization_id);
      await reloadCompanies();
    }, `Доступ к компании «${invite.company_name}» подключён`);
  }

  async function handleRemove(member: CompanyTeamMember) {
    await runAction(`remove-${member.id}`, async () => {
      await team.removeMember(member.id);
      setConfirmRemoveId(null);
    }, member.status === 'pending' ? 'Приглашение отменено' : 'Доступ участника удалён');
  }

  const isBusy = busyAction !== null;

  return (
    <div className="bx-a6-company-team space-y-4">
      <div>
        <h2 className="text-base font-bold text-bx-text">{title}</h2>
        <p className="text-xs text-bx-muted mt-1">{description}</p>
      </div>

      {team.incomingInvites.length > 0 && (
        <section className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-500/20 rounded-2xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Входящие приглашения</h3>
          <div className="space-y-2">
            {team.incomingInvites.map(invite => (
              <div key={invite.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-bx-surface/70 border border-bx-border/40 rounded-xl p-3">
                <div>
                  <p className="text-xs text-bx-text font-bold">{invite.company_name}</p>
                  <p className="text-[10px] text-bx-muted mt-0.5">Роль: {COMPANY_ROLE_LABELS[invite.role]}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => void handleAccept(invite)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-[10px] font-bold transition-colors"
                  >
                    {busyAction === `accept-${invite.id}` ? 'Подключаем…' : 'Принять'}
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => void runAction(
                      `reject-${invite.id}`,
                      () => team.rejectInvite(invite.id),
                      'Приглашение отклонено',
                    )}
                    className="px-3 py-1.5 bg-bx-surface-2 hover:bg-bx-border-2 disabled:opacity-40 text-bx-text rounded-lg text-[10px] font-bold transition-colors"
                  >
                    Отклонить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!active ? (
        <div className="bg-bx-surface border border-bx-border rounded-xl p-6 text-center text-bx-muted text-xs">
          Выберите или создайте компанию, чтобы увидеть её команду.
        </div>
      ) : (
        <>
          {team.canManage ? (
            <form onSubmit={handleInvite} className="bg-bx-surface border border-bx-border rounded-2xl p-4 space-y-3">
              <div>
                <h3 className="text-xs font-bold text-bx-text uppercase tracking-wider">Пригласить участника BX</h3>
                <p className="text-[10px] text-bx-muted mt-1">Укажите email его учётной записи. BX не раскрывает, зарегистрирован ли этот адрес.</p>
              </div>
              <div className="flex flex-col lg:flex-row gap-2.5">
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={inviteEmail}
                  onChange={event => setInviteEmail(event.target.value)}
                  placeholder="name@example.com"
                  className="flex-1 bg-bx-bg text-bx-text text-xs px-3 py-2.5 rounded-xl border border-bx-border focus:outline-none placeholder:text-bx-muted focus:border-blue-500/50"
                />
                <select
                  value={inviteRole}
                  onChange={event => setInviteRole(event.target.value as CompanyRole)}
                  className="bg-bx-bg text-bx-text text-xs px-3 py-2.5 rounded-xl border border-bx-border focus:outline-none"
                  aria-label="Роль участника"
                >
                  {INVITABLE_ROLES.map(role => (
                    <option key={role} value={role}>
                      {role === 'owner' ? 'Совладелец' : COMPANY_ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={isBusy || !inviteEmail.trim()}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all"
                >
                  {busyAction === 'invite' ? 'Добавляем…' : 'Пригласить'}
                </button>
              </div>
              <p className="text-[10px] text-bx-muted">{COMPANY_ROLE_DESCRIPTIONS[inviteRole]}</p>
            </form>
          ) : !team.loading && !team.error ? (
            <div className="bg-bx-surface border border-bx-border rounded-xl px-4 py-3 text-xs text-bx-muted">
              Состав команды меняют только владельцы компании. Ваш доступ остаётся ограничен выданной ролью.
            </div>
          ) : null}

          <section className="bg-bx-surface border border-bx-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-bx-border flex justify-between items-center gap-3">
              <div>
                <h3 className="text-xs font-bold text-bx-text uppercase tracking-wider">{active.name}</h3>
                <p className="text-[10px] text-bx-muted mt-0.5">После принятия приглашения участник появится в выборе исполнителя задач.</p>
              </div>
              {team.loading && <span className="text-[10px] text-bx-muted">Обновляем…</span>}
            </div>

            {team.error && <p className="px-4 py-3 text-xs text-red-400">Не удалось загрузить команду: {team.error}</p>}
            {!team.loading && !team.error && team.members.length === 0 && (
              <p className="px-4 py-6 text-center text-bx-muted text-xs">Участников пока нет.</p>
            )}

            <div className="divide-y divide-bx-border">
              {team.members.map(member => {
                const isPrimaryOwner = member.user_id === active.user_id;
                const isCurrentUser = member.user_id === team.currentUserId;
                const canRemove = team.canManage && !isPrimaryOwner && !isCurrentUser;
                return (
                  <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 shrink-0 rounded-full bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold text-xs">
                        {member.invited_email.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-bx-text font-bold truncate">
                          {member.invited_email}{isCurrentUser ? ' · Вы' : ''}
                        </p>
                        <p className="text-[10px] text-bx-muted mt-0.5">
                          {isPrimaryOwner ? 'Основной владелец' : COMPANY_ROLE_LABELS[member.role]}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <span className={`text-[9px] uppercase font-bold px-2 py-1 rounded-full ${
                        member.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {member.status === 'active' ? 'Активен' : 'Ожидает ответа'}
                      </span>
                      {canRemove && confirmRemoveId !== member.id && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => setConfirmRemoveId(member.id)}
                          className="text-[10px] text-bx-muted hover:text-red-400 px-2 py-1 rounded-lg transition-colors"
                        >
                          {member.status === 'pending' ? 'Отменить' : 'Удалить доступ'}
                        </button>
                      )}
                      {canRemove && confirmRemoveId === member.id && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handleRemove(member)}
                            className="text-[10px] text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 px-2 py-1 rounded-lg"
                          >
                            Подтвердить
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => setConfirmRemoveId(null)}
                            className="text-[10px] text-bx-muted px-2 py-1 rounded-lg"
                          >
                            Отмена
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
