-- Журнал командной задачи и уведомления при существенных изменениях.
-- Доступ наследует правила видимости самой задачи, включая дату вступления сотрудника.

alter table public.bx_task_notifications
  drop constraint if exists bx_task_notifications_notification_type_check;

alter table public.bx_task_notifications
  add constraint bx_task_notifications_notification_type_check
  check (notification_type in (
    'assignment',
    'reassignment',
    'accepted',
    'status_changed',
    'due_date_changed'
  ));

alter table public.bx_task_notifications
  add column if not exists details text;

create table public.bx_event_activity (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.bx_events(id) on delete cascade,
  company_id uuid references public.bx_companies(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  activity_type text not null
    check (activity_type in (
      'created',
      'assigned',
      'reassigned',
      'accepted',
      'status_changed',
      'due_date_changed'
    )),
  from_value text,
  to_value text,
  created_at timestamptz not null default now()
);

create index bx_event_activity_event_created_idx
  on public.bx_event_activity (event_id, created_at desc);

create index bx_event_activity_company_created_idx
  on public.bx_event_activity (company_id, created_at desc)
  where company_id is not null;

alter table public.bx_event_activity enable row level security;

create policy "event collaborators read activity"
on public.bx_event_activity for select to authenticated
using (
  exists (
    select 1
    from public.bx_events e
    where e.id = event_id
      and (
        e.user_id = (select auth.uid())
        or (
          e.company_id is not null
          and public.bx_can_view_company_event(e.company_id, coalesce(e.due_date, e.date))
        )
      )
  )
);

revoke all on table public.bx_event_activity from anon, authenticated;
grant select on table public.bx_event_activity to authenticated;

create or replace function public.log_bx_event_activity_and_notify_changes()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_id uuid := coalesce(auth.uid(), new.user_id);
  v_activity_type text;
  v_company_name text;
  v_details text;
  v_recipient_id uuid;
begin
  if tg_op = 'INSERT' then
    insert into public.bx_event_activity (
      event_id, company_id, actor_id, activity_type, to_value, created_at
    ) values (
      new.id, new.company_id, v_actor_id, 'created', new.title, coalesce(new.created_at, now())
    );

    if new.assignee_id is not null then
      insert into public.bx_event_activity (
        event_id, company_id, actor_id, activity_type, to_value, created_at
      ) values (
        new.id, new.company_id, v_actor_id, 'assigned', new.assignee_id::text, coalesce(new.created_at, now())
      );
    end if;
    return new;
  end if;

  if new.assignee_id is distinct from old.assignee_id then
    insert into public.bx_event_activity (
      event_id, company_id, actor_id, activity_type, from_value, to_value
    ) values (
      new.id,
      new.company_id,
      v_actor_id,
      case when old.assignee_id is null then 'assigned' else 'reassigned' end,
      old.assignee_id::text,
      new.assignee_id::text
    );
  end if;

  if new.status is distinct from old.status then
    v_activity_type := case
      when new.assignee_id = v_actor_id
        and old.status = 'todo'
        and new.status = 'in_progress'
      then 'accepted'
      else 'status_changed'
    end;

    insert into public.bx_event_activity (
      event_id, company_id, actor_id, activity_type, from_value, to_value
    ) values (
      new.id, new.company_id, v_actor_id, v_activity_type, old.status, new.status
    );

    v_recipient_id := case
      when v_actor_id = new.assignee_id and new.user_id <> v_actor_id then new.user_id
      when new.assignee_id is not null and new.assignee_id <> v_actor_id then new.assignee_id
      else null
    end;

    if v_recipient_id is not null and new.company_id is not null then
      select c.name into v_company_name
      from public.bx_companies c
      where c.id = new.company_id;

      v_details := case new.status
        when 'todo' then 'К выполнению'
        when 'in_progress' then 'В работе'
        when 'review' then 'На проверке'
        when 'done' then 'Готово'
        else new.status
      end;

      insert into public.bx_task_notifications (
        recipient_id, actor_id, company_id, event_id, notification_type,
        event_title, company_name, due_date, details
      ) values (
        v_recipient_id, v_actor_id, new.company_id, new.id,
        case when v_activity_type = 'accepted' then 'accepted' else 'status_changed' end,
        new.title, v_company_name, coalesce(new.due_date, new.date), v_details
      );
    end if;
  end if;

  if new.due_date is distinct from old.due_date then
    insert into public.bx_event_activity (
      event_id, company_id, actor_id, activity_type, from_value, to_value
    ) values (
      new.id, new.company_id, v_actor_id, 'due_date_changed', old.due_date::text, new.due_date::text
    );

    if new.assignee_id is not null
      and new.assignee_id <> v_actor_id
      and new.company_id is not null then
      select c.name into v_company_name
      from public.bx_companies c
      where c.id = new.company_id;

      insert into public.bx_task_notifications (
        recipient_id, actor_id, company_id, event_id, notification_type,
        event_title, company_name, due_date, details
      ) values (
        new.assignee_id, v_actor_id, new.company_id, new.id, 'due_date_changed',
        new.title, v_company_name, coalesce(new.due_date, new.date),
        coalesce(new.due_date::text, 'Срок снят')
      );
    end if;
  end if;

  return new;
end
$$;

revoke all on function public.log_bx_event_activity_and_notify_changes() from public;

create trigger bx_events_log_activity_and_notify_changes
after insert or update of assignee_id, status, due_date on public.bx_events
for each row execute function public.log_bx_event_activity_and_notify_changes();

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'bx_event_activity'
  ) then
    execute 'alter publication supabase_realtime add table public.bx_event_activity';
  end if;
end
$$;
