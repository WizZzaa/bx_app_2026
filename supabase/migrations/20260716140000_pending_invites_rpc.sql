-- Безопасно показываем название компании в личном входящем приглашении,
-- не открывая всю строку bx_companies до принятия доступа.
create or replace function public.get_bx_pending_organization_invites()
returns table (
  id uuid,
  invited_email text,
  role text,
  status text,
  organization_id uuid,
  company_name text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select m.id, m.invited_email, m.role, m.status, m.organization_id, c.name
  from public.bx_organization_members m
  join public.bx_companies c on c.id = m.organization_id
  where m.status = 'pending'
    and lower(m.invited_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
$$;

revoke all on function public.get_bx_pending_organization_invites() from public;
grant execute on function public.get_bx_pending_organization_invites() to authenticated;

