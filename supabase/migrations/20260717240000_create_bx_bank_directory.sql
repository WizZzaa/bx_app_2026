-- Управляемый справочник банков для сравнения валютных курсов.
create table if not exists public.bx_bank_directory (
  bank_id text primary key,
  name text not null,
  source_url text not null,
  logo_url text,
  is_active boolean not null default true,
  integration_status text not null default 'planned'
    check (integration_status in ('planned', 'connected', 'paused', 'error')),
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bx_bank_directory enable row level security;

drop policy if exists "bank directory readable by authenticated users" on public.bx_bank_directory;
create policy "bank directory readable by authenticated users"
on public.bx_bank_directory for select to authenticated
using (true);

drop policy if exists "bank directory managed by bx admins" on public.bx_bank_directory;
create policy "bank directory managed by bx admins"
on public.bx_bank_directory for all to authenticated
using (public.is_bx_admin())
with check (public.is_bx_admin());

grant select on public.bx_bank_directory to authenticated;
grant insert, update, delete on public.bx_bank_directory to authenticated;

insert into public.bx_bank_directory (bank_id, name, source_url, integration_status, sort_order)
values
  ('ipak-yuli', 'Ipak Yuli Bank', 'https://ru.ipakyulibank.uz/physical/obmen-valyut', 'connected', 10),
  ('aloqabank', 'Aloqabank', 'https://aloqabank.uz/ru/', 'connected', 20),
  ('trustbank', 'Trustbank', 'https://trustbank.uz/ru/', 'connected', 30)
on conflict (bank_id) do update set
  name = excluded.name,
  source_url = excluded.source_url,
  integration_status = excluded.integration_status,
  sort_order = excluded.sort_order,
  updated_at = now();
