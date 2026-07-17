-- Устаревшее представление auth.users не используется приложением.
-- Убираем его из Data API вместо сохранения security-definer view для authenticated.
revoke all on table public.admin_users_view from anon, authenticated;
