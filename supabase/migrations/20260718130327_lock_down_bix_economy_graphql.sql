-- Bix collection data is returned through authenticated RPCs only.
-- Keeping the backing tables out of PostgREST/GraphQL prevents accidental
-- direct reads while SECURITY DEFINER endpoints enforce auth.uid() themselves.

revoke all on table public.bx_bix_achievement_catalog from anon, authenticated;
revoke all on table public.bx_bix_achievements from anon, authenticated;
revoke all on table public.bx_bix_economy_operations from anon, authenticated;
