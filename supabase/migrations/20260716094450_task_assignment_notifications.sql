-- Персональные уведомления о назначении задач активным участникам компании.
-- Содержимое закрыто RLS: платформенные администраторы не получают доступ автоматически.

create table public.bx_task_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  company_id uuid not null references public.bx_companies(id) on delete cascade,
  event_id uuid not null references public.bx_events(id) on delete cascade,
  notification_type text not null
    check (notification_type in ('assignment', 'reassignment')),
  event_title text not null,
  company_name text not null,
  due_date date,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index bx_task_notifications_recipient_created_idx
  on public.bx_task_notifications (recipient_id, created_at desc);

create index bx_task_notifications_recipient_unread_idx
  on public.bx_task_notifications (recipient_id, created_at desc)
  where read_at is null;

alter table public.bx_task_notifications enable row level security;

create policy "task notification recipient reads"
on public.bx_task_notifications for select to authenticated
using (
  recipient_id = (select auth.uid())
  and public.bx_has_company_access(company_id)
);

create policy "task notification recipient marks read"
on public.bx_task_notifications for update to authenticated
using (
  recipient_id = (select auth.uid())
  and public.bx_has_company_access(company_id)
)
with check (
  recipient_id = (select auth.uid())
  and public.bx_has_company_access(company_id)
);

revoke all on table public.bx_task_notifications from anon, authenticated;
grant select on table public.bx_task_notifications to authenticated;
grant update (read_at) on table public.bx_task_notifications to authenticated;

-- Исполнитель может менять статус своей задачи, но не передавать её дальше,
-- если у него нет роли координатора и он не является создателем.
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
    if new.assignee_id is distinct from old.assignee_id
      and old.user_id <> (select auth.uid())
      and not public.bx_can_coordinate_company(old.company_id) then
      raise exception 'only event creator or company coordinator can change assignee';
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

revoke all on function public.validate_bx_event_team_fields() from public;

create or replace function public.notify_bx_event_assignee()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_id uuid := coalesce(auth.uid(), new.user_id);
  v_company_name text;
  v_notification_type text;
begin
  if new.assignee_id is null or new.company_id is null then
    return new;
  end if;

  if tg_op = 'UPDATE' and new.assignee_id is not distinct from old.assignee_id then
    return new;
  end if;

  -- Назначение самому себе не создаёт лишнее уведомление.
  if new.assignee_id = v_actor_id then
    return new;
  end if;

  select c.name
  into v_company_name
  from public.bx_companies c
  where c.id = new.company_id;

  if v_company_name is null then
    return new;
  end if;

  v_notification_type := case when tg_op = 'INSERT' then 'assignment' else 'reassignment' end;

  insert into public.bx_task_notifications (
    recipient_id,
    actor_id,
    company_id,
    event_id,
    notification_type,
    event_title,
    company_name,
    due_date
  ) values (
    new.assignee_id,
    v_actor_id,
    new.company_id,
    new.id,
    v_notification_type,
    new.title,
    v_company_name,
    coalesce(new.due_date, new.date)
  );

  return new;
end
$$;

revoke all on function public.notify_bx_event_assignee() from public;

create trigger bx_events_notify_assignee
after insert or update of assignee_id on public.bx_events
for each row execute function public.notify_bx_event_assignee();

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'bx_task_notifications'
  ) then
    execute 'alter publication supabase_realtime add table public.bx_task_notifications';
  end if;
end
$$;
