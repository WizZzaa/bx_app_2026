-- Distinct full visual sets. They occupy the outfit slot, so accessories such
-- as glasses and halo can still be worn alongside the selected set.
insert into public.bx_bix_catalog (sku, title, category, price, plan_required, visual_key)
values
  ('outfit_business', 'Деловой Бикс', 'outfit', 45, 'standard', 'business'),
  ('outfit_analyst', 'Бикс-аналитик', 'outfit', 60, 'standard', 'analyst'),
  ('outfit_night', 'Ночной Бикс', 'outfit', 90, 'premium', 'night')
on conflict (sku) do update set
  title = excluded.title,
  category = excluded.category,
  price = excluded.price,
  plan_required = excluded.plan_required,
  visual_key = excluded.visual_key,
  active = true;
