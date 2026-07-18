-- Remove three rejected headwear options from the active shop without erasing
-- purchase history. Existing copies are unequipped and hidden by the active
-- catalog filter; this remains reversible if a design is reintroduced later.
update public.bx_bix_inventory
set equipped = false
where sku in ('hat_ushanka', 'hat_chef', 'hat_crown')
  and equipped = true;

update public.bx_bix_catalog
set active = false
where sku in ('hat_ushanka', 'hat_chef', 'hat_crown');
