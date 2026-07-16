-- Позволяет владельцу получить только что созданную компанию через
-- INSERT ... RETURNING, не ожидая повторного запроса членства команды.
-- Командный доступ по-прежнему проверяется через bx_has_company_access.

drop policy if exists "company team can view company" on public.bx_companies;

create policy "company team can view company"
on public.bx_companies for select to authenticated
using (
  user_id = (select auth.uid())
  or public.bx_has_company_access(id)
);
