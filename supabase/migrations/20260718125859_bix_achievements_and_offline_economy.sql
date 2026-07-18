-- Idempotent Bix economy operations and achievements derived from real server data.
-- Public RPCs are intentionally SECURITY DEFINER: authenticated users may mutate
-- only their own companion, operation id and a small allow-list of operation kinds.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.bx_bix_achievement_catalog (
  code text primary key,
  title text not null,
  description text not null,
  metric text not null check (metric in (
    'tasks_created', 'tasks_completed', 'ai_questions',
    'collection_items', 'care_actions', 'daily_claims'
  )),
  target integer not null check (target > 0),
  reward_coins integer not null check (reward_coins >= 0),
  sort_order integer not null default 0,
  active boolean not null default true
);

alter table public.bx_bix_achievement_catalog enable row level security;
revoke all on public.bx_bix_achievement_catalog from anon, authenticated;
grant select on public.bx_bix_achievement_catalog to authenticated;

drop policy if exists bx_bix_achievement_catalog_read_active on public.bx_bix_achievement_catalog;
create policy bx_bix_achievement_catalog_read_active
on public.bx_bix_achievement_catalog for select to authenticated
using (active = true);

insert into public.bx_bix_achievement_catalog
  (code, title, description, metric, target, reward_coins, sort_order)
values
  ('first_task', 'Первое дело', 'Создать первую задачу в BX.', 'tasks_created', 1, 5, 10),
  ('task_keeper', 'Хранитель сроков', 'Создать 10 задач.', 'tasks_created', 10, 20, 20),
  ('first_finish', 'Дело сделано', 'Завершить первую задачу.', 'tasks_completed', 1, 5, 30),
  ('finisher_10', 'Спокойный финишер', 'Завершить 10 задач.', 'tasks_completed', 10, 25, 40),
  ('first_ai', 'Спросить Бикса', 'Задать первый вопрос AI-консультанту.', 'ai_questions', 1, 5, 50),
  ('ai_regular', 'Любознательный бухгалтер', 'Задать 10 вопросов AI-консультанту.', 'ai_questions', 10, 20, 60),
  ('collector_3', 'Начало коллекции', 'Собрать 3 вещи в Сундуке.', 'collection_items', 3, 15, 70),
  ('caretaker_5', 'Заботливый хозяин', 'Покормить Бикса или поиграть с ним 5 раз.', 'care_actions', 5, 15, 80),
  ('daily_7', 'Неделя вместе', 'Получить ежедневный подарок 7 раз.', 'daily_claims', 7, 25, 90)
on conflict (code) do update set
  title = excluded.title,
  description = excluded.description,
  metric = excluded.metric,
  target = excluded.target,
  reward_coins = excluded.reward_coins,
  sort_order = excluded.sort_order,
  active = true;

alter table public.bx_bix_achievements
  add column if not exists reward_coins integer not null default 0 check (reward_coins >= 0);

revoke insert, update, delete on public.bx_bix_achievements from anon, authenticated;
grant select on public.bx_bix_achievements to authenticated;

create table if not exists public.bx_bix_economy_operations (
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid not null,
  operation_type text not null check (operation_type in ('daily_claim', 'care_food', 'care_toy')),
  outcome jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (user_id, operation_id)
);

create index if not exists bx_bix_economy_operations_user_created_idx
  on public.bx_bix_economy_operations (user_id, created_at desc);

alter table public.bx_bix_economy_operations enable row level security;
revoke all on public.bx_bix_economy_operations from anon, authenticated;
grant select on public.bx_bix_economy_operations to authenticated;

drop policy if exists bx_bix_economy_operations_read_own on public.bx_bix_economy_operations;
create policy bx_bix_economy_operations_read_own
on public.bx_bix_economy_operations for select to authenticated
using ((select auth.uid()) = user_id);

create or replace function private.bx_grant_bix_achievement(p_user_id uuid, p_code text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reward integer;
begin
  insert into public.bx_bix_companions (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  insert into public.bx_bix_achievements (user_id, code, reward_coins)
  select p_user_id, c.code, c.reward_coins
  from public.bx_bix_achievement_catalog c
  where c.code = p_code and c.active
  on conflict (user_id, code) do nothing
  returning reward_coins into v_reward;

  if v_reward is null then return false; end if;

  update public.bx_bix_companions
  set coins = coins + v_reward, updated_at = now()
  where user_id = p_user_id;
  return true;
end;
$$;

revoke all on function private.bx_grant_bix_achievement(uuid, text) from public, anon, authenticated;

create or replace function private.bx_reconcile_bix_achievements(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tasks integer;
  v_completed integer;
  v_ai integer;
  v_items integer;
  v_care integer;
  v_daily integer;
begin
  select count(*)::integer into v_tasks
  from public.bx_events where user_id = p_user_id and type = 'task';

  select count(*)::integer into v_completed
  from public.bx_events where user_id = p_user_id and type = 'task' and status = 'done';

  select count(*)::integer into v_ai
  from public.bx_ai_messages where user_id = p_user_id and role = 'user';

  select count(*)::integer into v_items
  from public.bx_bix_inventory where user_id = p_user_id;

  select count(*)::integer into v_care
  from public.bx_bix_economy_operations
  where user_id = p_user_id
    and operation_type in ('care_food', 'care_toy')
    and outcome ->> 'ok' = 'true';

  select count(*)::integer into v_daily
  from public.bx_bix_economy_operations
  where user_id = p_user_id
    and operation_type = 'daily_claim'
    and outcome ->> 'claimed' = 'true';

  if v_tasks >= 1 then perform private.bx_grant_bix_achievement(p_user_id, 'first_task'); end if;
  if v_tasks >= 10 then perform private.bx_grant_bix_achievement(p_user_id, 'task_keeper'); end if;
  if v_completed >= 1 then perform private.bx_grant_bix_achievement(p_user_id, 'first_finish'); end if;
  if v_completed >= 10 then perform private.bx_grant_bix_achievement(p_user_id, 'finisher_10'); end if;
  if v_ai >= 1 then perform private.bx_grant_bix_achievement(p_user_id, 'first_ai'); end if;
  if v_ai >= 10 then perform private.bx_grant_bix_achievement(p_user_id, 'ai_regular'); end if;
  if v_items >= 3 then perform private.bx_grant_bix_achievement(p_user_id, 'collector_3'); end if;
  if v_care >= 5 then perform private.bx_grant_bix_achievement(p_user_id, 'caretaker_5'); end if;
  if v_daily >= 7 then perform private.bx_grant_bix_achievement(p_user_id, 'daily_7'); end if;
end;
$$;

revoke all on function private.bx_reconcile_bix_achievements(uuid) from public, anon, authenticated;

create or replace function public.bx_apply_bix_operation(p_operation_id uuid, p_operation_type text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_plan text := 'free';
  v_reward integer := 0;
  v_result jsonb;
  v_state public.bx_bix_companions;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_operation_id is null then raise exception 'Operation id is required'; end if;
  if p_operation_type not in ('daily_claim', 'care_food', 'care_toy') then
    raise exception 'Unknown Bix economy operation';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_id::text || ':' || p_operation_id::text, 0)
  );

  select outcome into v_result
  from public.bx_bix_economy_operations
  where user_id = v_user_id and operation_id = p_operation_id;

  if found then
    select * into v_state from public.bx_bix_companions where user_id = v_user_id;
    return v_result || jsonb_build_object('state', to_jsonb(v_state), 'duplicate', true);
  end if;

  insert into public.bx_bix_companions (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  if p_operation_type = 'daily_claim' then
    select coalesce((
      select case
        when p.plan_expires_at is not null and p.plan_expires_at < now() then 'free'
        when p.plan in ('standard', 'premium') then p.plan
        else 'free'
      end
      from public.bx_profiles p where p.user_id = v_user_id
    ), 'free') into v_plan;
    v_reward := case v_plan when 'standard' then 5 when 'premium' then 15 else 0 end;

    update public.bx_bix_companions
    set coins = coins + v_reward, last_daily_claim = current_date, updated_at = now()
    where user_id = v_user_id
      and (last_daily_claim is null or last_daily_claim < current_date)
    returning * into v_state;

    if found then
      v_result := jsonb_build_object('ok', true, 'claimed', true, 'reward', v_reward);
    else
      select * into v_state from public.bx_bix_companions where user_id = v_user_id;
      v_result := jsonb_build_object('ok', true, 'claimed', false, 'reward', 0);
    end if;
  else
    update public.bx_bix_companions
    set coins = coins - 2,
        food = case when p_operation_type = 'care_food' then least(100, food + 35) else food end,
        mood = case when p_operation_type = 'care_toy' then least(100, mood + 25) else mood end,
        updated_at = now()
    where user_id = v_user_id and coins >= 2
    returning * into v_state;

    if found then
      v_result := jsonb_build_object('ok', true, 'kind', p_operation_type, 'cost', 2);
    else
      select * into v_state from public.bx_bix_companions where user_id = v_user_id;
      v_result := jsonb_build_object('ok', false, 'kind', p_operation_type, 'error', 'not_enough_coins');
    end if;
  end if;

  insert into public.bx_bix_economy_operations (user_id, operation_id, operation_type, outcome)
  values (v_user_id, p_operation_id, p_operation_type, v_result);

  perform private.bx_reconcile_bix_achievements(v_user_id);
  select * into v_state from public.bx_bix_companions where user_id = v_user_id;
  v_result := v_result || jsonb_build_object('state', to_jsonb(v_state), 'duplicate', false);

  update public.bx_bix_economy_operations
  set outcome = v_result - 'state'
  where user_id = v_user_id and operation_id = p_operation_id;
  return v_result;
end;
$$;

revoke all on function public.bx_apply_bix_operation(uuid, text) from public, anon;
grant execute on function public.bx_apply_bix_operation(uuid, text) to authenticated;

create or replace function public.bx_get_bix_collection()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_tasks integer;
  v_completed integer;
  v_ai integer;
  v_items integer;
  v_care integer;
  v_daily integer;
  v_companion public.bx_bix_companions;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  perform private.bx_reconcile_bix_achievements(v_user_id);
  select * into v_companion from public.bx_bix_companions where user_id = v_user_id;
  select count(*)::integer into v_tasks from public.bx_events where user_id = v_user_id and type = 'task';
  select count(*)::integer into v_completed from public.bx_events where user_id = v_user_id and type = 'task' and status = 'done';
  select count(*)::integer into v_ai from public.bx_ai_messages where user_id = v_user_id and role = 'user';
  select count(*)::integer into v_items from public.bx_bix_inventory where user_id = v_user_id;
  select count(*)::integer into v_care from public.bx_bix_economy_operations
    where user_id = v_user_id and operation_type in ('care_food', 'care_toy') and outcome ->> 'ok' = 'true';
  select count(*)::integer into v_daily from public.bx_bix_economy_operations
    where user_id = v_user_id and operation_type = 'daily_claim' and outcome ->> 'claimed' = 'true';

  return jsonb_build_object(
    'companion', to_jsonb(v_companion),
    'catalog', coalesce((
      select jsonb_agg(jsonb_build_object(
        'sku', c.sku, 'title', c.title, 'category', c.category, 'price', c.price,
        'plan_required', c.plan_required, 'visual_key', c.visual_key
      ) order by c.price, c.sku)
      from public.bx_bix_catalog c where c.active
    ), '[]'::jsonb),
    'inventory', coalesce((
      select jsonb_agg(jsonb_build_object('sku', i.sku, 'equipped', i.equipped) order by i.acquired_at)
      from public.bx_bix_inventory i where i.user_id = v_user_id
    ), '[]'::jsonb),
    'achievements', coalesce((
      select jsonb_agg(a.code order by a.unlocked_at)
      from public.bx_bix_achievements a where a.user_id = v_user_id
    ), '[]'::jsonb),
    'achievementCatalog', coalesce((
      select jsonb_agg(jsonb_build_object(
        'code', c.code, 'title', c.title, 'description', c.description,
        'metric', c.metric, 'target', c.target, 'rewardCoins', c.reward_coins
      ) order by c.sort_order, c.code)
      from public.bx_bix_achievement_catalog c where c.active
    ), '[]'::jsonb),
    'achievementProgress', coalesce((
      select jsonb_agg(jsonb_build_object(
        'code', c.code,
        'value', case c.metric
          when 'tasks_created' then v_tasks
          when 'tasks_completed' then v_completed
          when 'ai_questions' then v_ai
          when 'collection_items' then v_items
          when 'care_actions' then v_care
          when 'daily_claims' then v_daily
          else 0 end,
        'target', c.target
      ) order by c.sort_order, c.code)
      from public.bx_bix_achievement_catalog c where c.active
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.bx_get_bix_collection() from public, anon;
grant execute on function public.bx_get_bix_collection() to authenticated;
