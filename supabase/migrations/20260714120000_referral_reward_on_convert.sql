-- Автоначисление реферальной награды «+1 месяц обоим» при конверсии приглашённого.
--
-- Идемпотентно и аддитивно. Применять после
-- 20260714110000_promo_codes_and_referral_rpc.sql.
--
-- Логика: когда приглашённый пользователь переходит на ПЛАТНЫЙ тариф (standard/
-- premium, не триал), незанаграждённая реферальная связь закрывается — обоим
-- участникам продлевается доступ на 1 месяц (пригласившему, если он на free,
-- выдаётся Standard). Награда выдаётся один раз (bx_referrals.rewarded).

-- Отметка времени начисления награды.
alter table public.bx_referrals
  add column if not exists rewarded_at timestamptz;

create or replace function public.bx_reward_referral_on_convert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_ref public.bx_referrals%rowtype;
begin
  -- Защита от рекурсии: наши же UPDATE ниже не должны повторно запускать логику.
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  -- Реагируем только на переход в платный тариф (не триал) и реальную смену статуса.
  if new.plan in ('standard', 'premium')
     and coalesce(new.is_trial, false) = false
     and (old.plan is distinct from new.plan or old.is_trial is distinct from new.is_trial)
  then
    -- Ищем незакрытую связь, где текущий пользователь — приглашённый.
    select * into v_ref
      from public.bx_referrals
      where referred_id = new.user_id and rewarded = false
      limit 1;

    if found then
      -- Приглашённому: +1 месяц к текущему сроку (план не меняем — он уже платный).
      update public.bx_profiles
        set plan_expires_at = greatest(coalesce(plan_expires_at, now()), now()) + interval '1 month'
        where user_id = new.user_id;

      -- Пригласившему: +1 месяц; если он на free — поднимаем до Standard (не понижаем premium).
      update public.bx_profiles
        set plan = case when plan = 'free' then 'standard' else plan end,
            plan_expires_at = greatest(coalesce(plan_expires_at, now()), now()) + interval '1 month'
        where user_id = v_ref.referrer_id;

      update public.bx_referrals
        set rewarded = true, rewarded_at = now()
        where id = v_ref.id;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists bx_reward_referral_trg on public.bx_profiles;
create trigger bx_reward_referral_trg
  after update on public.bx_profiles
  for each row execute function public.bx_reward_referral_on_convert();
