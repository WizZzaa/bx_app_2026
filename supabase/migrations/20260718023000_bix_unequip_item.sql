-- Allow an authenticated user to remove an owned Bix item without deleting it.
-- Ownership is checked inside the SECURITY DEFINER function before the update.
create or replace function public.bx_unequip_bix_item(p_sku text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.bx_bix_inventory i
    where i.user_id = v_user_id
      and i.sku = p_sku
      and i.equipped = true
  ) then
    raise exception 'Bix item is not equipped';
  end if;

  update public.bx_bix_inventory
  set equipped = false
  where user_id = v_user_id
    and sku = p_sku;

  return public.bx_get_bix_collection();
end;
$$;

revoke all on function public.bx_unequip_bix_item(text) from public;
revoke all on function public.bx_unequip_bix_item(text) from anon;
grant execute on function public.bx_unequip_bix_item(text) to authenticated;
