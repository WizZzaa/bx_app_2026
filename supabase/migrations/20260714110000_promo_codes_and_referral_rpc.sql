-- Промокоды и серверная логика рефералов.
--
-- Идемпотентно и аддитивно. Применять после
-- 20260714100000_monetization_matrix_trial_referrals.sql.
-- Обмен кодов идёт через SECURITY DEFINER RPC — клиент не читает таблицу
-- промокодов напрямую (защита от перебора) и не может подделать начисление.

-- =========================================================================
-- 1. Промокоды и журнал их погашений.
-- =========================================================================
create table if not exists public.bx_promo_codes (
  code             text primary key,
  plan             text not null default 'premium' check (plan in ('standard', 'premium')),
  days             integer not null default 30 check (days > 0),
  max_uses         integer,                       -- null = без ограничения
  used_count       integer not null default 0,
  active           boolean not null default true,
  expires_at       timestamptz,                   -- null = бессрочный
  note             text,
  created_at       timestamptz not null default now()
);

comment on table public.bx_promo_codes is
  'Промокоды: выдают план plan на days дней. Управляются в админке. Обмен — через RPC bx_redeem_promo.';

create table if not exists public.bx_promo_redemptions (
  id           uuid primary key default gen_random_uuid(),
  code         text not null references public.bx_promo_codes(code) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  redeemed_at  timestamptz not null default now(),
  unique (code, user_id)
);

alter table public.bx_promo_codes enable row level security;
alter table public.bx_promo_redemptions enable row level security;

-- Промокоды: читать/менять — только админ (обычный клиент ходит через RPC).
drop policy if exists bx_promo_codes_admin on public.bx_promo_codes;
create policy bx_promo_codes_admin on public.bx_promo_codes
  for all using (
    exists (select 1 from public.bx_profiles p
            where p.user_id = auth.uid() and (p.role = 'admin' or p.role like 'admin\_%'))
  ) with check (
    exists (select 1 from public.bx_profiles p
            where p.user_id = auth.uid() and (p.role = 'admin' or p.role like 'admin\_%'))
  );

-- Свои погашения пользователь видит.
drop policy if exists bx_promo_redemptions_read_own on public.bx_promo_redemptions;
create policy bx_promo_redemptions_read_own on public.bx_promo_redemptions
  for select using (auth.uid() = user_id);

-- =========================================================================
-- 2. Бэкофилл реферальных кодов для профилей, созданных до миграции.
-- =========================================================================
update public.bx_profiles
  set referral_code = public.bx_gen_referral_code()
  where referral_code is null;

-- =========================================================================
-- 3. RPC: погашение промокода. Выдаёт план на N дней (продлевает текущий срок).
--    Возвращает jsonb { ok, message, plan, days }.
-- =========================================================================
create or replace function public.bx_redeem_promo(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_code  public.bx_promo_codes%rowtype;
  v_norm  text := upper(trim(p_code));
  v_base  timestamptz;
  v_new   timestamptz;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'message', 'Требуется вход в аккаунт.');
  end if;

  select * into v_code from public.bx_promo_codes where code = v_norm;
  if not found or not v_code.active then
    return jsonb_build_object('ok', false, 'message', 'Промокод не найден или отключён.');
  end if;
  if v_code.expires_at is not null and v_code.expires_at < now() then
    return jsonb_build_object('ok', false, 'message', 'Срок действия промокода истёк.');
  end if;
  if v_code.max_uses is not null and v_code.used_count >= v_code.max_uses then
    return jsonb_build_object('ok', false, 'message', 'Лимит активаций промокода исчерпан.');
  end if;
  if exists (select 1 from public.bx_promo_redemptions where code = v_norm and user_id = v_uid) then
    return jsonb_build_object('ok', false, 'message', 'Вы уже активировали этот промокод.');
  end if;

  -- Продлеваем от большей из дат: текущий срок или сейчас.
  select greatest(coalesce(plan_expires_at, now()), now()) into v_base
    from public.bx_profiles where user_id = v_uid;
  v_new := v_base + make_interval(days => v_code.days);

  update public.bx_profiles
    set plan = v_code.plan, plan_expires_at = v_new, is_trial = false
    where user_id = v_uid;

  insert into public.bx_promo_redemptions (code, user_id) values (v_norm, v_uid);
  update public.bx_promo_codes set used_count = used_count + 1 where code = v_norm;

  return jsonb_build_object('ok', true, 'plan', v_code.plan, 'days', v_code.days,
    'message', format('Активирован тариф %s на %s дн.', v_code.plan, v_code.days));
end;
$$;

-- =========================================================================
-- 4. RPC: привязка реферала по коду приглашения.
--    Возвращает jsonb { ok, message }.
-- =========================================================================
create or replace function public.bx_apply_referral(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid       uuid := auth.uid();
  v_norm      text := upper(trim(p_code));
  v_ref_uid   uuid;
  v_current   uuid;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'message', 'Требуется вход.');
  end if;

  select referred_by into v_current from public.bx_profiles where user_id = v_uid;
  if v_current is not null then
    return jsonb_build_object('ok', false, 'message', 'Реферал уже привязан.');
  end if;

  select user_id into v_ref_uid from public.bx_profiles where referral_code = v_norm;
  if v_ref_uid is null then
    return jsonb_build_object('ok', false, 'message', 'Код приглашения не найден.');
  end if;
  if v_ref_uid = v_uid then
    return jsonb_build_object('ok', false, 'message', 'Нельзя пригласить самого себя.');
  end if;

  update public.bx_profiles set referred_by = v_ref_uid where user_id = v_uid;
  insert into public.bx_referrals (referrer_id, referred_id)
    values (v_ref_uid, v_uid)
    on conflict (referred_id) do nothing;

  return jsonb_build_object('ok', true, 'message', 'Приглашение засчитано.');
end;
$$;

-- =========================================================================
-- 5. Пример промокода (можно удалить/поменять в админке).
-- =========================================================================
insert into public.bx_promo_codes (code, plan, days, note)
  values ('WELCOME30', 'premium', 30, 'Приветственный: Premium на 30 дней')
  on conflict (code) do nothing;
