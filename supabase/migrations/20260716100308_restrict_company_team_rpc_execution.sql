-- Функции команды доступны только авторизованным пользователям BX.
-- Supabase выдаёт anon прямой EXECUTE по умолчанию, поэтому отзываем его явно.

revoke execute on function public.accept_bx_organization_invite(uuid) from anon;
revoke execute on function public.reject_bx_organization_invite(uuid) from anon;
revoke execute on function public.get_bx_pending_organization_invites() from anon;
revoke execute on function public.bx_company_role(uuid) from anon;
revoke execute on function public.bx_has_company_access(uuid) from anon;
revoke execute on function public.bx_can_manage_company(uuid) from anon;
revoke execute on function public.bx_can_coordinate_company(uuid) from anon;
revoke execute on function public.bx_is_valid_assignee(uuid, uuid) from anon;

grant execute on function public.accept_bx_organization_invite(uuid) to authenticated;
grant execute on function public.reject_bx_organization_invite(uuid) to authenticated;
grant execute on function public.get_bx_pending_organization_invites() to authenticated;
grant execute on function public.bx_company_role(uuid) to authenticated;
grant execute on function public.bx_has_company_access(uuid) to authenticated;
grant execute on function public.bx_can_manage_company(uuid) to authenticated;
grant execute on function public.bx_can_coordinate_company(uuid) to authenticated;
grant execute on function public.bx_is_valid_assignee(uuid, uuid) to authenticated;
