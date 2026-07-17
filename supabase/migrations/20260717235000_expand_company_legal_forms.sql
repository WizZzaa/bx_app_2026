-- Расширенный профиль организационно-правовой формы.
-- Данные остаются в bx_companies и наследуют уже действующий RLS компании.

alter table public.bx_companies
  add column if not exists profile_details jsonb not null default '{}'::jsonb;

alter table public.bx_companies
  drop constraint if exists bx_companies_legal_form_check;

alter table public.bx_companies
  add constraint bx_companies_legal_form_check
  check (
    legal_form is null or legal_form in (
      'ooo', 'ip', 'joint_venture', 'family_enterprise', 'farm',
      'private_enterprise', 'jsc', 'self_employed', 'other'
    )
  );

alter table public.bx_companies
  add constraint bx_companies_profile_details_object_check
  check (jsonb_typeof(profile_details) = 'object');

create or replace function public.set_bx_company_profile_metadata()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if new.profile_status = 'confirmed' then
    if tg_op = 'INSERT' then
      new.profile_confirmed_at = coalesce(new.profile_confirmed_at, now());
      new.profile_version = greatest(coalesce(new.profile_version, 1), 1);
    elsif row(
      new.name, new.inn, new.regime, new.legal_form, new.profile_details,
      new.registration_date, new.bx_start_date, new.is_vat_payer,
      new.work_weekdays, new.notification_channels, new.preferred_language,
      new.enabled_obligation_rules, new.profile_status
    ) is distinct from row(
      old.name, old.inn, old.regime, old.legal_form, old.profile_details,
      old.registration_date, old.bx_start_date, old.is_vat_payer,
      old.work_weekdays, old.notification_channels, old.preferred_language,
      old.enabled_obligation_rules, old.profile_status
    ) then
      new.profile_confirmed_at = now();
      new.profile_version = old.profile_version + 1;
    end if;
  else
    new.profile_confirmed_at = null;
  end if;
  return new;
end
$$;

comment on column public.bx_companies.profile_details is
  'Необязательные реквизиты, зависящие от организационно-правовой формы компании';
