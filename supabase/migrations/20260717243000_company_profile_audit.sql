create table if not exists public.bx_company_profile_activity (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.bx_companies(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  before_state jsonb not null default '{}'::jsonb,
  after_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.bx_company_profile_activity enable row level security;
drop policy if exists "company team reads profile activity" on public.bx_company_profile_activity;
create policy "company team reads profile activity" on public.bx_company_profile_activity
for select to authenticated using (public.bx_has_company_access(company_id));
grant select on public.bx_company_profile_activity to authenticated;

create or replace function public.bx_log_company_profile_change()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if row(new.legal_form, new.regime, new.profile_details, new.enabled_obligation_rules)
     is distinct from row(old.legal_form, old.regime, old.profile_details, old.enabled_obligation_rules) then
    insert into public.bx_company_profile_activity(company_id, actor_id, action, before_state, after_state)
    values (new.id, auth.uid(), 'profile_changed', jsonb_build_object('legal_form', old.legal_form, 'regime', old.regime, 'rules', old.enabled_obligation_rules), jsonb_build_object('legal_form', new.legal_form, 'regime', new.regime, 'rules', new.enabled_obligation_rules));
  end if;
  return new;
end $$;
revoke all on function public.bx_log_company_profile_change() from public;
drop trigger if exists bx_company_profile_audit on public.bx_companies;
create trigger bx_company_profile_audit after update on public.bx_companies for each row execute function public.bx_log_company_profile_change();
