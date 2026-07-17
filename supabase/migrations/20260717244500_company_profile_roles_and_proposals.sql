create table if not exists public.bx_company_profile_proposals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.bx_companies(id) on delete cascade,
  proposer_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  proposed_state jsonb not null,
  note text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  check (jsonb_typeof(proposed_state) = 'object')
);

create index if not exists bx_company_profile_proposals_company_idx
  on public.bx_company_profile_proposals(company_id, status, created_at desc);

alter table public.bx_company_profile_proposals enable row level security;
drop policy if exists "company team reads profile proposals" on public.bx_company_profile_proposals;
create policy "company team reads profile proposals"
on public.bx_company_profile_proposals for select to authenticated
using (public.bx_has_company_access(company_id));

grant select on public.bx_company_profile_proposals to authenticated;
revoke insert, update, delete on public.bx_company_profile_proposals from anon, authenticated;

create or replace function public.bx_apply_company_profile(p_company_id uuid, p_profile jsonb)
returns public.bx_companies
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_role text;
  v_company public.bx_companies;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  v_role := public.bx_company_role(p_company_id);
  if v_role is null or v_role not in ('owner', 'accountant') then
    raise exception 'profile update requires owner or accountant role';
  end if;
  if jsonb_typeof(p_profile) <> 'object'
    or nullif(btrim(p_profile ->> 'name'), '') is null
    or nullif(p_profile ->> 'legal_form', '') is null
    or nullif(p_profile ->> 'bx_start_date', '') is null then
    raise exception 'invalid company profile';
  end if;

  update public.bx_companies
  set name = btrim(p_profile ->> 'name'),
      inn = nullif(btrim(p_profile ->> 'inn'), ''),
      regime = nullif(btrim(p_profile ->> 'regime'), ''),
      legal_form = p_profile ->> 'legal_form',
      profile_details = coalesce(p_profile -> 'profile_details', '{}'::jsonb),
      registration_date = nullif(p_profile ->> 'registration_date', '')::date,
      bx_start_date = (p_profile ->> 'bx_start_date')::date,
      is_vat_payer = coalesce((p_profile ->> 'is_vat_payer')::boolean, false),
      work_weekdays = array(
        select value::smallint from jsonb_array_elements_text(coalesce(p_profile -> 'work_weekdays', '[]'::jsonb))
      ),
      notification_channels = array(
        select value from jsonb_array_elements_text(coalesce(p_profile -> 'notification_channels', '["in_app"]'::jsonb))
      ),
      preferred_language = coalesce(nullif(p_profile ->> 'preferred_language', ''), 'ru'),
      enabled_obligation_rules = array(
        select value from jsonb_array_elements_text(coalesce(p_profile -> 'enabled_obligation_rules', '[]'::jsonb))
      ),
      profile_status = 'confirmed',
      profile_confirmed_at = now(),
      profile_version = profile_version + 1
  where id = p_company_id
  returning * into v_company;

  if not found then raise exception 'company not found'; end if;
  return v_company;
end
$$;

create or replace function public.bx_propose_company_profile(
  p_company_id uuid,
  p_profile jsonb,
  p_note text default null
)
returns public.bx_company_profile_proposals
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_proposal public.bx_company_profile_proposals;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if public.bx_company_role(p_company_id) is distinct from 'assistant' then
    raise exception 'only an assistant can propose profile changes';
  end if;
  if jsonb_typeof(p_profile) <> 'object' then raise exception 'invalid company profile'; end if;

  insert into public.bx_company_profile_proposals(company_id, proposer_id, proposed_state, note)
  values (p_company_id, auth.uid(), p_profile, nullif(btrim(p_note), ''))
  returning * into v_proposal;

  return v_proposal;
end
$$;

create or replace function public.bx_decide_company_profile_proposal(
  p_proposal_id uuid,
  p_accept boolean
)
returns public.bx_company_profile_proposals
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_proposal public.bx_company_profile_proposals;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;

  select * into v_proposal
  from public.bx_company_profile_proposals
  where id = p_proposal_id and status = 'pending'
  for update;

  if not found then raise exception 'pending proposal not found'; end if;
  if public.bx_company_role(v_proposal.company_id) is null
    or public.bx_company_role(v_proposal.company_id) not in ('owner', 'accountant') then
    raise exception 'proposal decision requires owner or accountant role';
  end if;

  if p_accept then
    perform public.bx_apply_company_profile(v_proposal.company_id, v_proposal.proposed_state);
  end if;

  update public.bx_company_profile_proposals
  set status = case when p_accept then 'accepted' else 'rejected' end,
      decided_by = auth.uid(),
      decided_at = now()
  where id = p_proposal_id
  returning * into v_proposal;

  insert into public.bx_company_profile_activity(company_id, actor_id, action, before_state, after_state)
  values (
    v_proposal.company_id,
    auth.uid(),
    case when p_accept then 'proposal_accepted' else 'proposal_rejected' end,
    jsonb_build_object('proposal_id', v_proposal.id),
    jsonb_build_object('status', v_proposal.status)
  );

  return v_proposal;
end
$$;

revoke all on function public.bx_apply_company_profile(uuid, jsonb) from public, anon;
revoke all on function public.bx_propose_company_profile(uuid, jsonb, text) from public, anon;
revoke all on function public.bx_decide_company_profile_proposal(uuid, boolean) from public, anon;
grant execute on function public.bx_apply_company_profile(uuid, jsonb) to authenticated;
grant execute on function public.bx_propose_company_profile(uuid, jsonb, text) to authenticated;
grant execute on function public.bx_decide_company_profile_proposal(uuid, boolean) to authenticated;
