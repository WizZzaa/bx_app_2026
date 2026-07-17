-- Новый участник команды не получает историю сроков до даты принятия приглашения.
create or replace function public.bx_can_view_company_event(
  p_company_id uuid,
  p_event_date date
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.bx_company_role(p_company_id) = 'owner'
    or exists (
      select 1
      from public.bx_organization_members m
      where m.organization_id = p_company_id
        and m.user_id = (select auth.uid())
        and m.status = 'active'
        and p_event_date >= m.updated_at::date
    )
$$;

revoke all on function public.bx_can_view_company_event(uuid, date) from public;
grant execute on function public.bx_can_view_company_event(uuid, date) to authenticated;

drop policy if exists "company team sees events" on public.bx_events;
create policy "company team sees events"
on public.bx_events for select to authenticated
using (
  user_id = (select auth.uid())
  or (
    company_id is not null
    and public.bx_can_view_company_event(company_id, coalesce(due_date, date))
  )
);

drop policy if exists "event collaborators update events" on public.bx_events;
create policy "event collaborators update events"
on public.bx_events for update to authenticated
using (
  user_id = (select auth.uid())
  or (
    company_id is not null
    and public.bx_can_view_company_event(company_id, coalesce(due_date, date))
    and (
      assignee_id = (select auth.uid())
      or public.bx_can_coordinate_company(company_id)
    )
  )
)
with check (
  company_id is null
  or public.bx_can_view_company_event(company_id, coalesce(due_date, date))
);

