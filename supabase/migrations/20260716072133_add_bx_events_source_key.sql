alter table public.bx_events
  add column if not exists source_key text;

comment on column public.bx_events.source_key is
  'Stable identity of a generated obligation, for example tax:<template_id>:<date>.';

alter table public.bx_events
  add constraint bx_events_source_identity_key
  unique (user_id, company_id, source_key);
