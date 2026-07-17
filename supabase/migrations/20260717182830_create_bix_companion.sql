-- Бикс: личный прогресс питомца. Все игровые значения хранятся на сервере,
-- чтобы ежедневные монеты зависели от тарифа и не подменялись локальным кэшем.

create table if not exists public.bx_bix_companions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  coins integer not null default 30 check (coins >= 0),
  food smallint not null default 72 check (food between 0 and 100),
  mood smallint not null default 86 check (mood between 0 and 100),
  energy smallint not null default 91 check (energy between 0 and 100),
  last_daily_claim date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bx_bix_companions enable row level security;

grant select on public.bx_bix_companions to authenticated;

drop policy if exists bx_bix_companions_read_own on public.bx_bix_companions;
create policy bx_bix_companions_read_own on public.bx_bix_companions
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Создание/начисление — через RPC. Клиенту не выдаётся прямое UPDATE,
-- поэтому нельзя вручную увеличить баланс или показатели питомца.
create or replace function public.bx_claim_bix_daily_coins()
returns public.bx_bix_companions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_plan text := 'free';
  v_reward integer := 0;
  v_row public.bx_bix_companions;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  insert into public.bx_bix_companions (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  select case
    when p.plan_expires_at is not null and p.plan_expires_at < now() then 'free'
    when p.plan in ('standard', 'premium') then p.plan
    else 'free'
  end into v_plan
  from public.bx_profiles p
  where p.user_id = v_user_id;

  v_reward := case v_plan when 'standard' then 5 when 'premium' then 15 else 0 end;

  update public.bx_bix_companions
  set coins = coins + v_reward,
      last_daily_claim = current_date,
      updated_at = now()
  where user_id = v_user_id
    and (last_daily_claim is null or last_daily_claim < current_date)
  returning * into v_row;

  if v_row.user_id is null then
    select * into v_row from public.bx_bix_companions where user_id = v_user_id;
  end if;
  return v_row;
end;
$$;

create or replace function public.bx_use_bix_care(p_item text)
returns public.bx_bix_companions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_row public.bx_bix_companions;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if p_item not in ('food', 'toy') then
    raise exception 'Unknown Bix care item';
  end if;

  insert into public.bx_bix_companions (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  update public.bx_bix_companions
  set coins = coins - 2,
      food = case when p_item = 'food' then least(100, food + 35) else food end,
      mood = case when p_item = 'toy' then least(100, mood + 25) else mood end,
      updated_at = now()
  where user_id = v_user_id
    and coins >= 2
  returning * into v_row;

  if v_row.user_id is null then
    raise exception 'Not enough Bix coins';
  end if;
  return v_row;
end;
$$;

revoke all on function public.bx_claim_bix_daily_coins() from public;
revoke all on function public.bx_use_bix_care(text) from public;
grant execute on function public.bx_claim_bix_daily_coins() to authenticated;
grant execute on function public.bx_use_bix_care(text) to authenticated;
