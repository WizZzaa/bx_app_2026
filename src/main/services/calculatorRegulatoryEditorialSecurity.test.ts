import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { CALCULATOR_REGULATORY_VALUES } from '../../renderer/data/calculatorRegulatoryValues'

const source = (relativePath: string) =>
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8')

const migration = source(
  '../../../../supabase/migrations/20260719211805_calculator_regulatory_value_editorial_registry.sql',
)
const panel = source(
  '../../../../web/src/pages/admin/panels/CalculatorRegulatoryPanel.tsx',
)

describe('calculator regulatory value editorial registry', () => {
  it('seeds every canonical key without overwriting editorial data', () => {
    const seedBlock = migration.match(/insert into public\.bx_calculator_regulatory_values[\s\S]+?on conflict \(key\) do nothing;/i)?.[0] ?? ''
    const keys = [...seedBlock.matchAll(/^\s+\('([^']+)',/gm)].map(match => match[1])

    expect(keys).toHaveLength(18)
    expect(new Set(keys)).toEqual(new Set(CALCULATOR_REGULATORY_VALUES.map(value => value.key)))
    expect(seedBlock).toContain('on conflict (key) do nothing')
    expect(seedBlock).not.toMatch(/'published'|'verified'/)
  })

  it('is additive and never mutates user or calculation-history tables', () => {
    expect(migration).not.toMatch(/\b(update|delete|truncate)\s+(table\s+)?public\.bx_(profiles|companies|events|finance_transactions)\b/i)
    expect(migration).not.toMatch(/\bdrop\s+table\b/i)
  })

  it('keeps direct writes revoked and all editorial writes behind audited RPCs', () => {
    expect(migration).toContain('alter table public.bx_calculator_regulatory_values enable row level security')
    expect(migration).toContain('revoke all on public.bx_calculator_regulatory_values from public, anon, authenticated')
    expect(migration).toContain('grant select on public.bx_calculator_regulatory_values to authenticated')
    expect(migration).toContain('create or replace function public.bx_save_calculator_regulatory_value')
    expect(migration).toContain('create or replace function public.bx_transition_calculator_regulatory_value')
    expect(migration).toContain('perform public.bx_assert_admin_session()')
    expect(migration).toContain("'calculator_regulatory_value'")
  })

  it('requires an official source, fresh review and independent approval', () => {
    expect(migration).toContain("official_source_url ~* '^https://")
    expect(migration).toContain('AUTHOR_CANNOT_REVIEW_OWN_VALUE')
    expect(migration).toContain('INDEPENDENT_REVIEW_REQUIRED')
    expect(migration).toContain('PUBLICATION_REASON_REQUIRED')
    expect(migration).toContain('OFFICIAL_SOURCE_AND_FUTURE_REVIEW_REQUIRED')
  })

  it('provides a fail-closed current-value reader and never auto-publishes stale rows', () => {
    const reader = migration.match(/create or replace function public\.bx_get_current_calculator_regulatory_values[\s\S]+?revoke all on function public\.bx_get_current_calculator_regulatory_values/i)?.[0] ?? ''
    const refresh = migration.match(/create or replace function public\.bx_refresh_calculator_regulatory_values\(\)[\s\S]+?revoke all on function public\.bx_refresh_calculator_regulatory_values\(\)/i)?.[0] ?? ''

    expect(reader).toContain('security invoker')
    expect(reader).toContain("workflow_status = 'published'")
    expect(reader).toContain("source_status = 'verified'")
    expect(reader).toContain('next_review_at > now()')
    expect(refresh).toContain("set source_status = 'stale'")
    expect(refresh).not.toContain("set workflow_status = 'published'")
  })

  it('uses RPC-only admin writes and stays read-only before migration deployment', () => {
    expect(panel).toContain("supabase.rpc('bx_save_calculator_regulatory_value'")
    expect(panel).toContain("supabase.rpc('bx_transition_calculator_regulatory_value'")
    expect(panel).not.toMatch(/\.from\('bx_calculator_regulatory_values'\)[\s\S]{0,160}\.(insert|update|delete|upsert)\(/)
    expect(panel).toContain('Серверный реестр пока не применён')
    expect(panel).toContain('локальные версии в режиме просмотра')
    expect(panel).toContain('source_checked_at: null, next_review_at: null')
  })
})
