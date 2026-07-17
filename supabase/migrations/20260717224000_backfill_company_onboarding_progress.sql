-- Действующие владельцы уже завершили первый шаг: не показываем им новый
-- обязательный экран после обновления приложения.

with first_company as (
  select distinct on (user_id) id, user_id
  from public.bx_companies
  order by user_id, created_at asc nulls last, id
)
update public.bx_profiles p
set company_onboarding_state = 'completed',
    company_onboarding_completed_at = coalesce(p.company_onboarding_completed_at, now()),
    company_onboarding_first_company_id = coalesce(p.company_onboarding_first_company_id, fc.id),
    company_onboarding_remind_at = null,
    updated_at = now()
from first_company fc
where fc.user_id = p.user_id
  and p.company_onboarding_state = 'not_started';
