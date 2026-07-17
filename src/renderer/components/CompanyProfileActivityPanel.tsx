import { useCallback, useEffect, useMemo, useState } from 'react';
import { companiesRepo } from '../lib/db/companiesRepo';
import { supabase } from '../lib/db/supabase';
import type { Company, CompanyProfileActivity, CompanyProfileProposal, CompanyProfileRole } from '../lib/db/types';
import { useCompany } from '../lib/CompanyContext';
import { useToast } from '../lib/ui/ToastContext';
import { emitPlannerReload } from '../pages/planner/plannerBus';
import { syncTaxDeadlines } from '../pages/planner/taxSeeder';
import Icon from '../lib/ui/Icon';

const LEGAL_FORM_LABELS: Record<string, string> = {
  ooo: 'ООО', ip: 'ЯТТ / ИП', joint_venture: 'СП', family_enterprise: 'Семейное предприятие',
  farm: 'Фермерское хозяйство', private_enterprise: 'ЧП', jsc: 'АО', self_employed: 'Самозанятый', other: 'Другая форма',
};

function dateTime(value: string) {
  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function activityLabel(item: CompanyProfileActivity) {
  if (item.action === 'proposal_accepted') return 'Предложение помощника принято';
  if (item.action === 'proposal_rejected') return 'Предложение помощника отклонено';
  const beforeForm = String(item.before_state.legal_form ?? '');
  const afterForm = String(item.after_state.legal_form ?? '');
  const beforeRegime = String(item.before_state.regime ?? '');
  const afterRegime = String(item.after_state.regime ?? '');
  if (beforeForm !== afterForm) return `Форма: ${LEGAL_FORM_LABELS[beforeForm] ?? 'не указана'} → ${LEGAL_FORM_LABELS[afterForm] ?? afterForm}`;
  if (beforeRegime !== afterRegime) return `Режим: ${beforeRegime || 'не указан'} → ${afterRegime || 'не указан'}`;
  return 'Обновлены профиль и календарь обязательств';
}

export function CompanyProfileActivityPanel({ company }: { company: Company }) {
  const toast = useToast();
  const { reload: reloadCompanies } = useCompany();
  const [activity, setActivity] = useState<CompanyProfileActivity[]>([]);
  const [proposals, setProposals] = useState<CompanyProfileProposal[]>([]);
  const [role, setRole] = useState<CompanyProfileRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [timeline, currentRole] = await Promise.all([
        companiesRepo.profileTimeline(company.id),
        companiesRepo.role(company.id),
      ]);
      setActivity(timeline.activity);
      setProposals(timeline.proposals);
      setRole(currentRole);
    } catch (error) {
      console.error('[CompanyProfileActivityPanel] load failed:', error);
      toast.error('Не удалось загрузить журнал профиля');
    } finally {
      setLoading(false);
    }
  }, [company.id, toast]);

  useEffect(() => { void reload(); }, [reload]);

  const pending = useMemo(() => proposals.filter(item => item.status === 'pending'), [proposals]);
  const canDecide = role === 'owner' || role === 'accountant';

  async function decide(proposal: CompanyProfileProposal, accept: boolean) {
    setBusyId(proposal.id);
    try {
      await companiesRepo.decideProposal(proposal.id, accept);
      await reloadCompanies();
      if (accept) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) await syncTaxDeadlines(user.id, company.id);
        emitPlannerReload();
      }
      await reload();
      toast.success(accept ? 'Предложение применено к профилю' : 'Предложение отклонено');
    } catch (error) {
      console.error('[CompanyProfileActivityPanel] decision failed:', error);
      toast.error('Не удалось обработать предложение');
    } finally {
      setBusyId(null);
    }
  }

  return <section className="rounded-[20px] border border-bx-border bg-bx-surface p-5 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-base font-black text-bx-text">Изменения профиля</h2><p className="mt-1 text-[11px] text-bx-muted">Кто и когда менял форму, режим и календарь компании.</p></div>
      <span className="rounded-full border border-bx-border bg-bx-bg px-2.5 py-1 text-[9px] font-black uppercase text-bx-muted">{loading ? 'Обновляем' : `${activity.length} событий`}</span>
    </div>

    {pending.length > 0 && <div className="mt-4 space-y-2">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-amber-700 dark:text-amber-300">Ожидают решения · {pending.length}</p>
      {pending.map(proposal => <article key={proposal.id} className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.07] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black text-bx-text">Предложение помощника</p><p className="mt-1 text-[10px] text-bx-muted">{dateTime(proposal.created_at)} · {LEGAL_FORM_LABELS[proposal.proposed_state.legal_form] ?? proposal.proposed_state.legal_form} · {proposal.proposed_state.regime}</p></div>{canDecide && <div className="flex gap-2"><button type="button" disabled={busyId !== null} onClick={() => void decide(proposal, false)} className="min-h-9 rounded-xl border border-bx-border bg-bx-surface px-3 text-[10px] font-black text-bx-muted hover:text-bx-text disabled:opacity-50">Отклонить</button><button type="button" disabled={busyId !== null} onClick={() => void decide(proposal, true)} className="min-h-9 rounded-xl bg-emerald-600 px-3 text-[10px] font-black text-white hover:bg-emerald-500 disabled:opacity-50">{busyId === proposal.id ? 'Применяем…' : 'Принять'}</button></div>}</div>
      </article>)}
    </div>}

    <div className="mt-4 divide-y divide-bx-border">
      {!loading && activity.length === 0 && <div className="rounded-2xl border border-dashed border-bx-border bg-bx-bg px-4 py-6 text-center"><Icon name="clock" className="mx-auto h-5 w-5 text-bx-muted" /><p className="mt-2 text-xs font-bold text-bx-text">История начнётся после первого изменения</p><p className="mt-1 text-[10px] text-bx-muted">Создание компании уже сохранено отдельно; здесь фиксируются последующие правки.</p></div>}
      {activity.slice(0, 8).map(item => <div key={item.id} className="flex gap-3 py-3 first:pt-0"><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-300"><Icon name="clock" className="h-4 w-4" /></span><div className="min-w-0"><p className="text-[11px] font-bold text-bx-text">{activityLabel(item)}</p><p className="mt-1 text-[10px] text-bx-muted">{dateTime(item.created_at)}{item.actor_id ? ` · участник ${item.actor_id.slice(0, 6)}` : ' · системное изменение'}</p></div></div>)}
    </div>
  </section>;
}
