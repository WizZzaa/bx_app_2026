-- Replace invisible legacy accessories with visible headwear. Headwear shares
-- one category, therefore equipping a new hat automatically removes the old one.
alter table public.bx_bix_catalog
  drop constraint if exists bx_bix_catalog_category_check;

alter table public.bx_bix_catalog
  add constraint bx_bix_catalog_category_check
  check (category in ('outfit', 'face', 'accessory', 'headwear'));

update public.bx_bix_catalog
set active = false
where sku in ('hoodie_lime', 'glasses_lime', 'bowtie_lime', 'halo_lime');

insert into public.bx_bix_catalog (sku, title, category, price, plan_required, visual_key)
values
  ('hat_lime_cap', 'Лаймовая кепка BX', 'headwear', 10, 'free', 'hat_lime_cap'),
  ('hat_chef', 'Поварской колпак', 'headwear', 15, 'free', 'hat_chef'),
  ('hat_party', 'Праздничный колпак', 'headwear', 20, 'free', 'hat_party'),
  ('hat_sailor', 'Моряцкая шапочка', 'headwear', 30, 'standard', 'hat_sailor'),
  ('hat_fedora', 'Деловая федора', 'headwear', 35, 'standard', 'hat_fedora'),
  ('hat_top_hat', 'Лаймовый цилиндр', 'headwear', 40, 'standard', 'hat_top_hat'),
  ('hat_ushanka', 'Бухгалтерская ушанка', 'headwear', 45, 'standard', 'hat_ushanka'),
  ('hat_cowboy', 'Ковбой Бикс', 'headwear', 55, 'standard', 'hat_cowboy'),
  ('hat_wizard', 'Шляпа формул', 'headwear', 90, 'premium', 'hat_wizard'),
  ('hat_crown', 'Корона дедлайнов', 'headwear', 140, 'premium', 'hat_crown')
on conflict (sku) do update set
  title = excluded.title,
  category = excluded.category,
  price = excluded.price,
  plan_required = excluded.plan_required,
  visual_key = excluded.visual_key,
  active = true;
