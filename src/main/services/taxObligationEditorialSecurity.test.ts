import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { isOfficialTaxSourceUrl, taxDeadlines } from '../../renderer/data/taxCalendar'
import {
  taxDeadlineSourceCandidates,
  taxDeadlineSourceDocuments,
} from '../../renderer/data/taxCalendarSources'

const source = (relativePath: string) =>
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8')

const migration = source(
  '../../../../supabase/migrations/20260719201951_canonical_tax_obligation_editorial_registry.sql',
)
const panel = source(
  '../../../../web/src/pages/admin/panels/TaxObligationEditorialPanel.tsx',
)

describe('tax obligation editorial registry', () => {
  it('seeds every canonical identifier without overwriting existing editorial rows', () => {
    const seedBlock = migration.match(/insert into public\.bx_tax_obligation_rules[\s\S]+?on conflict \(id\) do nothing;/i)?.[0] ?? ''
    const ids = [...seedBlock.matchAll(/^\s+\('([^']+)',/gm)].map(match => match[1])

    expect(ids).toHaveLength(35)
    expect(new Set(ids)).toEqual(new Set(taxDeadlines.map(deadline => deadline.id)))
    expect(seedBlock).toContain('on conflict (id) do nothing')
  })

  it('never mutates user events, companies or completed history', () => {
    expect(migration).not.toMatch(/\b(update|delete|truncate)\s+(table\s+)?public\.bx_events\b/i)
    expect(migration).not.toMatch(/\b(update|delete|truncate)\s+(table\s+)?public\.bx_companies\b/i)
    expect(migration).not.toMatch(/\bdrop\s+table\b/i)
  })

  it('keeps the exposed reference tables behind RLS and audited RPCs', () => {
    expect(migration).toContain('alter table public.bx_tax_obligation_rules enable row level security')
    expect(migration).toContain('alter table public.bx_tax_obligation_review_alerts enable row level security')
    expect(migration).toContain('revoke all on public.bx_tax_obligation_rules from public, anon, authenticated')
    expect(migration).toContain('create or replace function public.bx_save_tax_obligation_rule')
    expect(migration).toContain('create or replace function public.bx_transition_tax_obligation_rule')
    expect(migration).toContain('perform public.bx_assert_admin_session()')
    expect(migration).toContain("'tax_obligation_rule'")
  })

  it('requires an official host, independent review and an audited reason', () => {
    expect(migration).toContain("official_source_url ~* '^https://")
    expect(migration).toContain('AUTHOR_CANNOT_REVIEW_OWN_RULE')
    expect(migration).toContain('INDEPENDENT_REVIEW_REQUIRED')
    expect(migration).toContain('PUBLICATION_REASON_REQUIRED')
    expect(migration).toContain('OFFICIAL_SOURCE_AND_FUTURE_REVIEW_REQUIRED')
  })

  it('maps all rules to five official source candidates without approving them', () => {
    const deadlineIds = taxDeadlines.map(deadline => deadline.id)
    const candidateIds = Object.keys(taxDeadlineSourceCandidates)

    expect(candidateIds).toHaveLength(35)
    expect(new Set(candidateIds)).toEqual(new Set(deadlineIds))
    expect(Object.keys(taxDeadlineSourceDocuments)).toHaveLength(5)
    expect(new Set(candidateIds.map(id => taxDeadlineSourceCandidates[id].url)).size).toBe(5)
    expect(candidateIds.every(id => isOfficialTaxSourceUrl(taxDeadlineSourceCandidates[id].url))).toBe(true)
    expect(candidateIds.every(id => taxDeadlineSourceCandidates[id].collectedAt === '2026-07-20')).toBe(true)
    expect(taxDeadlines.every(deadline => !deadline.sourceUrl && deadline.editorialStatus !== 'approved')).toBe(true)
  })

  it('expires stale rules and never auto-publishes them', () => {
    const monitor = migration.match(/create or replace function public\.bx_refresh_tax_obligation_review_queue\(\)[\s\S]+?revoke all on function public\.bx_refresh_tax_obligation_review_queue\(\)/i)?.[0] ?? ''
    expect(migration).toContain('threshold_days in (0, 1, 7, 30)')
    expect(monitor).toContain("set source_status = 'stale'")
    expect(monitor).not.toContain("set workflow_status = 'published'")
    expect(migration).toContain("'15 4 * * *'")
  })

  it('uses RPC-only admin writes and remains read-only before migration deployment', () => {
    expect(panel).toContain("supabase.rpc('bx_save_tax_obligation_rule'")
    expect(panel).toContain("supabase.rpc('bx_transition_tax_obligation_rule'")
    expect(panel).not.toMatch(/\.from\('bx_tax_obligation_rules'\)[\s\S]{0,120}\.(insert|update|delete)\(/)
    expect(panel).toContain('Серверный реестр пока не применён')
    expect(panel).toContain('Подставить в черновик')
    expect(panel).toContain('source_checked_at: null, next_review_at: null')
    expect(panel).toContain('Кандидат не считается проверенным источником')
  })
})
