-- Команда компании и безопасное назначение задач.
-- Платформенные администраторы BX намеренно не получают доступ к данным компаний.

create table public.bx_organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.bx_companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  invited_email text not null,
  role text not null default 'assistant'
    check (role in ('owner', 'accountant', 'assistant', 'viewer')),
  status text not null default 'pending'
    check (status in ('pending', 'active')),
  invited_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (invited_email = lower(btrim(invited_email))),
  check ((status = 'pending' and user_id is null) or (status = 'active' and user_id is not null))
);

create unique index bx_organization_members_org_email_key
  on public.bx_organization_members (organization_id, lower(invited_email));

create unique index bx_organization_members_org_user_key
  on public.bx_organization_members (organization_id, user_id)
  where user_id is not null;

create index bx_organization_members_user_idx
  on public.bx_organization_members (user_id, status);

alter table public.bx_organization_members enable row level security;

create or replace function public.bx_company_role(p_company_id uuid)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when exists (
      select 1 from public.bx_companies c
      where c.id = p_company_id and c.user_id = (select auth.uid())
    ) then 'owner'
    else (
      select m.role
      from public.bx_organization_members m
      where m.organization_id = p_company_id
        and m.user_id = (select auth.uid())
        and m.status = 'active'
      limit 1
    )
  end
$$;

create or replace function public.bx_has_company_access(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.bx_company_role(p_company_id) is not null
$$;

create or replace function public.bx_can_manage_company(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.bx_company_role(p_company_id) = 'owner'
$$;

create or replace function public.bx_can_coordinate_company(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.bx_company_role(p_company_id) in ('owner', 'accountant', 'assistant')
$$;

create or replace function public.bx_is_valid_assignee(p_company_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.bx_companies c
    where c.id = p_company_id and c.user_id = p_user_id
  ) or exists (
    select 1 from public.bx_organization_members m
    where m.organization_id = p_company_id
      and m.user_id = p_user_id
      and m.status = 'active'
  )
$$;

revoke all on function public.bx_company_role(uuid) from public;
revoke all on function public.bx_has_company_access(uuid) from public;
revoke all on function public.bx_can_manage_company(uuid) from public;
revoke all on function public.bx_can_coordinate_company(uuid) from public;
revoke all on function public.bx_is_valid_assignee(uuid, uuid) from public;
grant execute on function public.bx_company_role(uuid) to authenticated;
grant execute on function public.bx_has_company_access(uuid) to authenticated;
grant execute on function public.bx_can_manage_company(uuid) to authenticated;
grant execute on function public.bx_can_coordinate_company(uuid) to authenticated;
grant execute on function public.bx_is_valid_assignee(uuid, uuid) to authenticated;

create policy "company members select roster"
on public.bx_organization_members for select to authenticated
using (
  public.bx_has_company_access(organization_id)
  or (
    status = 'pending'
    and lower(invited_email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  )
);

create policy "company owners invite members"
on public.bx_organization_members for insert to authenticated
with check (
  public.bx_can_manage_company(organization_id)
  and invited_by = (select auth.uid())
  and status = 'pending'
  and user_id is null
);

create policy "company owners remove members"
on public.bx_organization_members for delete to authenticated
using (
  (
    public.bx_can_manage_company(organization_id)
    and not exists (
      select 1 from public.bx_companies c
      where c.id = organization_id
        and c.user_id = bx_organization_members.user_id
    )
  )
  or (
    status = 'pending'
    and lower(invited_email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  )
  or (
    status = 'active'
    and user_id = (select auth.uid())
    and role <> 'owner'
  )
);

create or replace function public.accept_bx_organization_invite(p_invite_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if auth.uid() is null or v_email = '' then
    raise exception 'authentication required';
  end if;

  update public.bx_organization_members
  set user_id = auth.uid(), status = 'active', updated_at = now()
  where id = p_invite_id
    and status = 'pending'
    and lower(invited_email) = v_email;

  return found;
end
$$;

create or replace function public.reject_bx_organization_invite(p_invite_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if auth.uid() is null or v_email = '' then
    raise exception 'authentication required';
  end if;

  delete from public.bx_organization_members
  where id = p_invite_id
    and status = 'pending'
    and lower(invited_email) = v_email;

  return found;
end
$$;

revoke all on function public.accept_bx_organization_invite(uuid) from public;
revoke all on function public.reject_bx_organization_invite(uuid) from public;
grant execute on function public.accept_bx_organization_invite(uuid) to authenticated;
grant execute on function public.reject_bx_organization_invite(uuid) to authenticated;

-- Владелец всегда присутствует в списке команды.
insert into public.bx_organization_members (
  organization_id, user_id, invited_email, role, status, invited_by
)
select c.id, c.user_id, lower(u.email), 'owner', 'active', c.user_id
from public.bx_companies c
join auth.users u on u.id = c.user_id
where u.email is not null
on conflict do nothing;

create or replace function public.add_bx_company_owner_to_team()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text;
begin
  select lower(email) into v_email from auth.users where id = new.user_id;
  if v_email is not null then
    insert into public.bx_organization_members (
      organization_id, user_id, invited_email, role, status, invited_by
    ) values (new.id, new.user_id, v_email, 'owner', 'active', new.user_id)
    on conflict do nothing;
  end if;
  return new;
end
$$;

create trigger bx_company_add_owner_to_team
after insert on public.bx_companies
for each row execute function public.add_bx_company_owner_to_team();

drop policy if exists bx_companies_all on public.bx_companies;

create policy "company team can view company"
on public.bx_companies for select to authenticated
using (public.bx_has_company_access(id));

create policy "users create own companies"
on public.bx_companies for insert to authenticated
with check (user_id = (select auth.uid()));

create policy "company owners update company"
on public.bx_companies for update to authenticated
using (public.bx_can_manage_company(id))
with check (public.bx_can_manage_company(id));

create policy "primary owner deletes company"
on public.bx_companies for delete to authenticated
using (user_id = (select auth.uid()));

alter table public.bx_events
  add column assignee_id uuid references auth.users(id) on delete set null;

create index bx_events_assignee_idx
  on public.bx_events (assignee_id, status, due_date);

create or replace function public.validate_bx_event_team_fields()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'UPDATE' then
    if new.user_id is distinct from old.user_id then
      raise exception 'event creator cannot be changed';
    end if;
    if new.company_id is distinct from old.company_id then
      raise exception 'event company cannot be changed';
    end if;
  end if;

  if new.assignee_id is not null then
    if new.company_id is null
      or not public.bx_is_valid_assignee(new.company_id, new.assignee_id) then
      raise exception 'assignee must be an active company member';
    end if;
  end if;
  return new;
end
$$;

create trigger bx_events_validate_team_fields
before insert or update on public.bx_events
for each row execute function public.validate_bx_event_team_fields();

drop policy if exists "users delete own events" on public.bx_events;
drop policy if exists "users insert own events" on public.bx_events;
drop policy if exists "users see own events" on public.bx_events;
drop policy if exists "users update own events" on public.bx_events;

create policy "company team sees events"
on public.bx_events for select to authenticated
using (
  user_id = (select auth.uid())
  or assignee_id = (select auth.uid())
  or (company_id is not null and public.bx_has_company_access(company_id))
);

create policy "company team creates events"
on public.bx_events for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (company_id is null or public.bx_has_company_access(company_id))
);

create policy "event collaborators update events"
on public.bx_events for update to authenticated
using (
  user_id = (select auth.uid())
  or assignee_id = (select auth.uid())
  or (company_id is not null and public.bx_can_coordinate_company(company_id))
)
with check (
  company_id is null
  or public.bx_has_company_access(company_id)
);

create policy "event creators or owners delete events"
on public.bx_events for delete to authenticated
using (
  user_id = (select auth.uid())
  or (company_id is not null and public.bx_can_manage_company(company_id))
);

grant select, insert, update, delete on public.bx_organization_members to authenticated;
