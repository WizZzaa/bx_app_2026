-- Список пользователей доступен только после входа; сама view дополнительно
-- фильтрует строки по роли admin текущего пользователя.
revoke all on public.admin_users_view from anon;
revoke all on public.admin_users_view from authenticated;
grant select on public.admin_users_view to authenticated;

