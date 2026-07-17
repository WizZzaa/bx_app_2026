-- Коллекция Бикса. Каталог меняется только миграциями/админским контуром,
-- а операции с монетами проходят исключительно через RPC.

create table if not exists public.bx_bix_catalog (
  sku text primary key,
  title text not null,
  category text not null check (category in ('outfit', 'face', 'accessory')),
  price integer not null check (price >= 0),
  plan_required text not null default 'free' check (plan_required in ('free', 'standard', 'premium')),
  visual_key text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.bx_bix_inventory (
  user_id uuid not null references auth.users(id) on delete cascade,
  sku text not null references public.bx_bix_catalog(sku) on delete restrict,
  equipped boolean not null default false,
  acquired_at timestamptz not null default now(),
  primary key (user_id, sku)
);

create table if not exists public.bx_bix_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, code)
);

alter table public.bx_bix_catalog enable row level security;
alter table public.bx_bix_inventory enable row level security;
alter table public.bx_bix_achievements enable row level security;

grant select on public.bx_bix_catalog, public.bx_bix_inventory, public.bx_bix_achievements to authenticated;

drop policy if exists bx_bix_catalog_read_active on public.bx_bix_catalog;
create policy bx_bix_catalog_read_active on public.bx_bix_catalog
  for select to authenticated using (active = true);

drop policy if exists bx_bix_inventory_read_own on public.bx_bix_inventory;
create policy bx_bix_inventory_read_own on public.bx_bix_inventory
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists bx_bix_achievements_read_own on public.bx_bix_achievements;
create policy bx_bix_achievements_read_own on public.bx_bix_achievements
  for select to authenticated using ((select auth.uid()) = user_id);

insert into public.bx_bix_catalog (sku, title, category, price, plan_required, visual_key)
values
  ('hoodie_lime', 'Лаймовый капюшон', 'outfit', 0, 'free', 'hoodie'),
  ('glasses_lime', 'Лаймовые очки', 'face', 20, 'free', 'glasses'),
  ('bowtie_lime', 'Лаймовый галстук-бабочка', 'accessory', 35, 'standard', 'bowtie'),
  ('halo_lime', 'Неоновый нимб', 'accessory', 80, 'premium', 'halo')
on conflict (sku) do update set
  title = excluded.title,
  category = excluded.category,
  price = excluded.price,
  plan_required = excluded.plan_required,
  visual_key = excluded.visual_key,
  active = true;

create or replace function public.bx_get_bix_collection()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  return jsonb_build_object(
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
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.bx_buy_bix_item(p_sku text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_price integer;
  v_required text;
  v_category text;
  v_plan text := 'free';
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select c.price, c.plan_required, c.category into v_price, v_required, v_category
  from public.bx_bix_catalog c where c.sku = p_sku and c.active;
  if not found then raise exception 'Unknown Bix item'; end if;

  select case
    when p.plan_expires_at is not null and p.plan_expires_at < now() then 'free'
    when p.plan in ('standard', 'premium') then p.plan
    else 'free'
  end into v_plan from public.bx_profiles p where p.user_id = v_user_id;

  if (v_required = 'standard' and v_plan = 'free')
     or (v_required = 'premium' and v_plan <> 'premium') then
    raise exception 'This Bix item is not available for the current plan';
  end if;

  insert into public.bx_bix_companions (user_id) values (v_user_id)
  on conflict (user_id) do nothing;

  if exists (select 1 from public.bx_bix_inventory where user_id = v_user_id and sku = p_sku) then
    raise exception 'Bix item already owned';
  end if;

  update public.bx_bix_companions set coins = coins - v_price, updated_at = now()
  where user_id = v_user_id and coins >= v_price;
  if not found then raise exception 'Not enough Bix coins'; end if;

  update public.bx_bix_inventory i set equipped = false
  from public.bx_bix_catalog c
  where i.user_id = v_user_id and i.sku = c.sku and c.category = v_category;
  insert into public.bx_bix_inventory (user_id, sku, equipped) values (v_user_id, p_sku, true);
  return public.bx_get_bix_collection();
end;
$$;

create or replace function public.bx_equip_bix_item(p_sku text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_category text;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  select c.category into v_category
  from public.bx_bix_inventory i join public.bx_bix_catalog c on c.sku = i.sku
  where i.user_id = v_user_id and i.sku = p_sku;
  if not found then raise exception 'Bix item not owned'; end if;
  update public.bx_bix_inventory i set equipped = false
  from public.bx_bix_catalog c
  where i.user_id = v_user_id and i.sku = c.sku and c.category = v_category;
  update public.bx_bix_inventory set equipped = true where user_id = v_user_id and sku = p_sku;
  return public.bx_get_bix_collection();
end;
$$;

revoke all on function public.bx_get_bix_collection() from public;
revoke all on function public.bx_buy_bix_item(text) from public;
revoke all on function public.bx_equip_bix_item(text) from public;
revoke all on function public.bx_get_bix_collection() from anon;
revoke all on function public.bx_buy_bix_item(text) from anon;
revoke all on function public.bx_equip_bix_item(text) from anon;
grant execute on function public.bx_get_bix_collection() to authenticated;
grant execute on function public.bx_buy_bix_item(text) to authenticated;
grant execute on function public.bx_equip_bix_item(text) to authenticated;
