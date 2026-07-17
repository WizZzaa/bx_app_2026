-- Автоматическое подтверждение, контроль молчания и SLA для обращений BX.

create extension if not exists pg_cron with schema extensions;

alter table public.bx_tickets
  add column if not exists auto_acknowledged_at timestamptz,
  add column if not exists last_user_message_at timestamptz,
  add column if not exists first_staff_reply_at timestamptz,
  add column if not exists silence_notified_at timestamptz,
  add column if not exists sla_escalated_at timestamptz,
  add column if not exists sla_due_at timestamptz;

create table if not exists public.bx_ticket_events (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.bx_tickets(id) on delete cascade,
  event_type text not null check (event_type in ('created', 'auto_acknowledged', 'staff_replied', 'silence_notice', 'sla_escalated', 'closed')),
  actor_id uuid references auth.users(id) on delete set null,
  details text,
  created_at timestamptz not null default now()
);

create index if not exists bx_ticket_events_ticket_created_idx on public.bx_ticket_events(ticket_id, created_at desc);
alter table public.bx_ticket_events enable row level security;
revoke all on public.bx_ticket_events from anon, authenticated;
grant select on public.bx_ticket_events to authenticated;

drop policy if exists "ticket owners read automation events" on public.bx_ticket_events;
create policy "ticket owners read automation events"
on public.bx_ticket_events for select to authenticated
using (
  exists (
    select 1 from public.bx_tickets t
    where t.id = ticket_id
      and (t.user_id = (select auth.uid()) or public.is_bx_admin())
  )
);

create or replace function public.bx_ticket_message_automation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ticket public.bx_tickets%rowtype;
begin
  select * into v_ticket from public.bx_tickets where id = new.ticket_id for update;
  if not found then return new; end if;

  if new.author = 'user' then
    update public.bx_tickets
    set status = 'open', last_user_message_at = new.created_at,
        sla_due_at = new.created_at + interval '24 hours', updated_at = now()
    where id = new.ticket_id;

    if v_ticket.auto_acknowledged_at is null then
      insert into public.bx_ticket_messages (ticket_id, user_id, author, body)
      values (new.ticket_id, v_ticket.user_id, 'auto', 'Обращение получено. Мы зафиксировали его в очереди поддержки и сообщим здесь, когда специалист возьмёт вопрос в работу.');
      update public.bx_tickets set auto_acknowledged_at = now() where id = new.ticket_id;
      insert into public.bx_ticket_events (ticket_id, event_type, actor_id, details)
      values (new.ticket_id, 'auto_acknowledged', null, 'Пользователь получил подтверждение обращения');
    end if;
  elsif new.author = 'staff' then
    update public.bx_tickets
    set status = 'answered', first_staff_reply_at = coalesce(first_staff_reply_at, new.created_at), updated_at = now()
    where id = new.ticket_id;
    insert into public.bx_ticket_events (ticket_id, event_type, actor_id, details)
    values (new.ticket_id, 'staff_replied', new.user_id, 'Специалист ответил на обращение');
  end if;
  return new;
end;
$$;

revoke all on function public.bx_ticket_message_automation() from public, anon, authenticated;
drop trigger if exists bx_ticket_message_automation on public.bx_ticket_messages;
create trigger bx_ticket_message_automation
after insert on public.bx_ticket_messages
for each row execute function public.bx_ticket_message_automation();

create or replace function public.bx_process_support_sla()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare r record;
begin
  for r in
    select id, user_id
    from public.bx_tickets
    where status = 'open' and first_staff_reply_at is null
      and silence_notified_at is null
      and last_user_message_at <= now() - interval '4 hours'
  loop
    insert into public.bx_ticket_messages (ticket_id, user_id, author, body)
    values (r.id, r.user_id, 'auto', 'Обращение остаётся в очереди. Мы не потеряли его: контроль ожидания уже включён, а при превышении срока оно будет эскалировано.');
    update public.bx_tickets set silence_notified_at = now(), updated_at = now() where id = r.id;
    insert into public.bx_ticket_events (ticket_id, event_type, details) values (r.id, 'silence_notice', 'Автоматическое уведомление о ожидании специалиста');
  end loop;

  for r in
    select id, user_id
    from public.bx_tickets
    where status = 'open' and first_staff_reply_at is null
      and sla_escalated_at is null
      and sla_due_at <= now()
  loop
    insert into public.bx_ticket_messages (ticket_id, user_id, author, body)
    values (r.id, r.user_id, 'auto', 'Срок первичного ответа превышен. Обращение эскалировано руководителю поддержки и останется в приоритетной очереди до ответа специалиста.');
    update public.bx_tickets set sla_escalated_at = now(), updated_at = now() where id = r.id;
    insert into public.bx_ticket_events (ticket_id, event_type, details) values (r.id, 'sla_escalated', 'Первичный SLA превышен; обращение эскалировано');
  end loop;
end;
$$;

revoke all on function public.bx_process_support_sla() from public, anon, authenticated;

do $$
begin
  perform cron.unschedule(jobid) from cron.job where jobname = 'bx-support-sla-hourly';
  perform cron.schedule('bx-support-sla-hourly', '5 * * * *', 'select public.bx_process_support_sla();');
end $$;
