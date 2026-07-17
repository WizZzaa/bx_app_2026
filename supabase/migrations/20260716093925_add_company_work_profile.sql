-- Подтверждаемый рабочий профиль компании для планировщика BX.
-- Профиль хранится в той же строке, что и компания, и наследует существующий RLS:
-- читать компанию может команда, изменять профиль может только владелец.

alter table public.bx_companies
  add column if not exists legal_form text,
  add column if not exists registration_date date,
  add column if not exists bx_start_date date,
  add column if not exists is_vat_payer boolean not null default false,
  add column if not exists work_weekdays smallint[] not null default array[1, 2, 3, 4, 5]::smallint[],
  add column if not exists notification_channels text[] not null default array['in_app']::text[],
  add column if not exists preferred_language text not null default 'ru',
  add column if not exists enabled_obligation_rules text[] not null default array[]::text[],
  add column if not exists profile_status text not null default 'draft',
  add column if not exists profile_confirmed_at timestamptz,
  add column if not exists profile_version integer not null default 1;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'bx_companies_profile_status_check'
      and conrelid = 'public.bx_companies'::regclass
  ) then
    alter table public.bx_companies
      add constraint bx_companies_profile_status_check
      check (profile_status in ('draft', 'confirmed'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'bx_companies_legal_form_check'
      and conrelid = 'public.bx_companies'::regclass
  ) then
    alter table public.bx_companies
      add constraint bx_companies_legal_form_check
      check (legal_form is null or legal_form in ('ooo', 'ip', 'self_employed', 'other'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'bx_companies_work_weekdays_check'
      and conrelid = 'public.bx_companies'::regclass
  ) then
    alter table public.bx_companies
      add constraint bx_companies_work_weekdays_check
      check (
        cardinality(work_weekdays) > 0
        and work_weekdays <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'bx_companies_notification_channels_check'
      and conrelid = 'public.bx_companies'::regclass
  ) then
    alter table public.bx_companies
      add constraint bx_companies_notification_channels_check
      check (
        cardinality(notification_channels) > 0
        and notification_channels <@ array['in_app', 'desktop']::text[]
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'bx_companies_preferred_language_check'
      and conrelid = 'public.bx_companies'::regclass
  ) then
    alter table public.bx_companies
      add constraint bx_companies_preferred_language_check
      check (preferred_language in ('ru', 'uz'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'bx_companies_profile_dates_check'
      and conrelid = 'public.bx_companies'::regclass
  ) then
    alter table public.bx_companies
      add constraint bx_companies_profile_dates_check
      check (
        registration_date is null
        or bx_start_date is null
        or bx_start_date >= registration_date
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'bx_companies_profile_version_check'
      and conrelid = 'public.bx_companies'::regclass
  ) then
    alter table public.bx_companies
      add constraint bx_companies_profile_version_check
      check (profile_version > 0);
  end if;
end
$$;

comment on column public.bx_companies.bx_start_date is
  'Первый день, с которого BX формирует обязательства компании';
comment on column public.bx_companies.enabled_obligation_rules is
  'Подтверждённые владельцем идентификаторы правил налогового календаря';
comment on column public.bx_companies.profile_status is
  'Черновик не запускает автоматическое формирование обязательств';

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
      new.name,
      new.inn,
      new.regime,
      new.legal_form,
      new.registration_date,
      new.bx_start_date,
      new.is_vat_payer,
      new.work_weekdays,
      new.notification_channels,
      new.preferred_language,
      new.enabled_obligation_rules,
      new.profile_status
    ) is distinct from row(
      old.name,
      old.inn,
      old.regime,
      old.legal_form,
      old.registration_date,
      old.bx_start_date,
      old.is_vat_payer,
      old.work_weekdays,
      old.notification_channels,
      old.preferred_language,
      old.enabled_obligation_rules,
      old.profile_status
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

drop trigger if exists bx_companies_profile_metadata on public.bx_companies;
create trigger bx_companies_profile_metadata
before insert or update on public.bx_companies
for each row execute function public.set_bx_company_profile_metadata();
