-- Приватные данные BX не должны даже публиковаться в API до входа.
revoke all on public.bx_companies from anon;
revoke all on public.bx_events from anon;
revoke all on public.bx_organization_members from anon;

