-- Монетизация: серверная матрица функций (управляется галочками в админке),
-- 14-дневный триал Premium для новых регистраций и реферальная программа.
--
-- Все операции идемпотентны и аддитивны (IF NOT EXISTS / IF EXISTS), чтобы
-- миграцию можно было применять к боевой базе bxuz без разрушения данных.
-- Клиент (src/renderer/lib/plan.tsx) читает bx_plan_features и мягко деградирует
-- к хардкод-дефолтам, если таблицы нет. Безлимит в JSON хранится как -1.

-- =========================================================================
-- 1. Матрица функций по тарифам — источник правды для админ-галочек.
-- =========================================================================
create table if not exists public.bx_plan_features (
  plan       text primary key check (plan in ('free', 'standard', 'premium')),
  limits     jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.bx_plan_features is
  'Матрица лимитов/функций по тарифам. Редактируется в админке (галочки функция→тариф). limits: числа (-1 = безлимит) и булевы флаги.';

-- Сид дефолтами (совпадает с DEFAULT_PLAN_LIMITS в plan.tsx). ON CONFLICT DO
-- NOTHING — чтобы повторный прогон не затирал уже настроенные админом значения.
insert into public.bx_plan_features (plan, limits) values
  ('free', jsonb_build_object(
    'boards', 1, 'companies', 1, 'aiPerMonth', 5, 'aiSessionMax', 10,
    'innPerDay', 3, 'documentsMax', 3,
    'paymentsControl', false, 'anydeskSupport', false, 'signingControl', false,
    'backupsControl', false, 'textHumanizer', false, 'hrPayroll', false,
    'knowledgeBase', false, 'templatesCustom', false
  )),
  ('standard', jsonb_build_object(
    'boards', 5, 'companies', 3, 'aiPerMonth', 150, 'aiSessionMax', -1,
    'innPerDay', 30, 'documentsMax', 50,
    'paymentsControl', true, 'anydeskSupport', false, 'signingControl', true,
    'backupsControl', false, 'textHumanizer', true, 'hrPayroll', true,
    'knowledgeBase', true, 'templatesCustom', true
  )),
  ('premium', jsonb_build_object(
    'boards', -1, 'companies', -1, 'aiPerMonth', -1, 'aiSessionMax', -1,
    'innPerDay', -1, 'documentsMax', -1,
    'paymentsControl', true, 'anydeskSupport', true, 'signingControl', true,
    'backupsControl', true, 'textHumanizer', true, 'hrPayroll', true,
    'knowledgeBase', true, 'templatesCustom', true
  ))
on conflict (plan) do nothing;

alter table public.bx_plan_features enable row level security;

-- Читать матрицу может любой (нужно и для лендинга с ценами).
drop policy if exists bx_plan_features_read on public.bx_plan_features;
create policy bx_plan_features_read on public.bx_plan_features
  for select using (true);

-- Менять — только админ (роль admin или admin_*) из bx_profiles.
drop policy if exists bx_plan_features_admin_write on public.bx_plan_features;
create policy bx_plan_features_admin_write on public.bx_plan_features
  for all using (
    exists (
      select 1 from public.bx_profiles p
      where p.user_id = auth.uid()
        and (p.role = 'admin' or p.role like 'admin\_%')
    )
  ) with check (
    exists (
      select 1 from public.bx_profiles p
      where p.user_id = auth.uid()
        and (p.role = 'admin' or p.role like 'admin\_%')
    )
  );

-- =========================================================================
-- 2. Триал и реферальные поля в профиле.
-- =========================================================================
alter table public.bx_profiles
  add column if not exists is_trial     boolean not null default false,
  add column if not exists trial_used   boolean not null default false,
  add column if not exists referral_code text,
  add column if not exists referred_by  uuid references auth.users(id) on delete set null;

-- Уникальный реферальный код у каждого пользователя.
create unique index if not exists bx_profiles_referral_code_key
  on public.bx_profiles (referral_code) where referral_code is not null;

-- Генерация 8-символьного кода.
create or replace function public.bx_gen_referral_code()
returns text language sql volatile as $$
  select upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
$$;

-- =========================================================================
-- 3. Автогрант 14-дневного триала Premium новым профилям.
--    Срабатывает только на INSERT нового профиля, только если триал ещё не
--    использован и план не выше free — существующим платным не мешает.
-- =========================================================================
create or replace function public.bx_grant_trial_on_signup()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.referral_code is null then
    new.referral_code := public.bx_gen_referral_code();
  end if;
  if coalesce(new.trial_used, false) = false
     and (new.plan is null or new.plan = 'free') then
    new.plan            := 'premium';
    new.plan_expires_at := now() + interval '14 days';
    new.is_trial        := true;
    new.trial_used      := true;
  end if;
  return new;
end;
$$;

drop trigger if exists bx_grant_trial_on_signup_trg on public.bx_profiles;
create trigger bx_grant_trial_on_signup_trg
  before insert on public.bx_profiles
  for each row execute function public.bx_grant_trial_on_signup();

-- =========================================================================
-- 4. Журнал рефералов (для начисления наград «+1 месяц Standard» обоим).
-- =========================================================================
create table if not exists public.bx_referrals (
  id           uuid primary key default gen_random_uuid(),
  referrer_id  uuid not null references auth.users(id) on delete cascade,
  referred_id  uuid not null references auth.users(id) on delete cascade,
  rewarded     boolean not null default false,
  created_at   timestamptz not null default now(),
  unique (referred_id)
);

alter table public.bx_referrals enable row level security;

drop policy if exists bx_referrals_read_own on public.bx_referrals;
create policy bx_referrals_read_own on public.bx_referrals
  for select using (auth.uid() = referrer_id or auth.uid() = referred_id);

drop policy if exists bx_referrals_insert_own on public.bx_referrals;
create policy bx_referrals_insert_own on public.bx_referrals
  for insert with check (auth.uid() = referred_id);
