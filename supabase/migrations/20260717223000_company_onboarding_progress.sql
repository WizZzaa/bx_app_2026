-- Серверный прогресс первого онбординга компании.
-- Пользователь управляет только своим состоянием через узкий RPC; профиль,
-- тариф и роли не становятся доступны ему для произвольного изменения.

alter table public.bx_profiles
  add column if not exists company_onboarding_state text not null default 'not_started'
    check (company_onboarding_state in ('not_started', 'deferred', 'completed')),
  add column if not exists company_onboarding_remind_at timestamptz,
  add column if not exists company_onboarding_completed_at timestamptz,
  add column if not exists company_onboarding_first_company_id uuid references public.bx_companies(id) on delete set null;

create or replace function public.bx_set_company_onboarding_state(
  p_state text,
  p_company_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if p_state not in ('not_started', 'deferred', 'completed') then
    raise exception 'invalid onboarding state';
  end if;

  if p_state = 'completed' and (
    p_company_id is null
    or not exists (
      select 1
      from public.bx_companies c
      where c.id = p_company_id
        and c.user_id = auth.uid()
    )
  ) then
    raise exception 'first company must belong to the current user';
  end if;

  insert into public.bx_profiles (
    user_id,
    company_onboarding_state,
    company_onboarding_remind_at,
    company_onboarding_completed_at,
    company_onboarding_first_company_id
  ) values (
    auth.uid(),
    p_state,
    case when p_state = 'deferred' then now() + interval '1 day' else null end,
    case when p_state = 'completed' then now() else null end,
    case when p_state = 'completed' then p_company_id else null end
  )
  on conflict (user_id) do update
  set company_onboarding_state = excluded.company_onboarding_state,
      company_onboarding_remind_at = excluded.company_onboarding_remind_at,
      company_onboarding_completed_at = excluded.company_onboarding_completed_at,
      company_onboarding_first_company_id = excluded.company_onboarding_first_company_id,
      updated_at = now();
end;
$$;

revoke all on function public.bx_set_company_onboarding_state(text, uuid) from public, anon;
grant execute on function public.bx_set_company_onboarding_state(text, uuid) to authenticated;
