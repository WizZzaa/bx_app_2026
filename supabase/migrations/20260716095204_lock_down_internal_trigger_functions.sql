-- Trigger-функции не являются публичными RPC и вызываются только PostgreSQL.
revoke all on function public.notify_bx_event_assignee() from public, anon, authenticated;
revoke all on function public.validate_bx_event_team_fields() from public, anon, authenticated;
revoke all on function public.set_bx_company_profile_metadata() from public, anon, authenticated;
