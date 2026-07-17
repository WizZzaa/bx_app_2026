revoke all on table public.bx_company_profile_activity from anon;
revoke all on table public.bx_company_profile_proposals from anon;

revoke execute on function public.bx_log_company_profile_change() from public, anon, authenticated;

-- Эти RPC намеренно являются API для вошедших пользователей. Каждый вызов
-- повторно проверяет auth.uid() и роль именно в указанной компании.
revoke execute on function public.bx_apply_company_profile(uuid, jsonb) from public, anon;
revoke execute on function public.bx_propose_company_profile(uuid, jsonb, text) from public, anon;
revoke execute on function public.bx_decide_company_profile_proposal(uuid, boolean) from public, anon;
grant execute on function public.bx_apply_company_profile(uuid, jsonb) to authenticated;
grant execute on function public.bx_propose_company_profile(uuid, jsonb, text) to authenticated;
grant execute on function public.bx_decide_company_profile_proposal(uuid, boolean) to authenticated;
