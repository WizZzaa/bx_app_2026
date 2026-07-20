import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const source = (relativePath: string) =>
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8')

const migration = source(
  '../../../../supabase/migrations/20260719195115_verified_knowledge_editorial_workflow.sql',
)
const indexer = source('../../../../supabase/functions/law-indexer/index.ts')
const cmsPanel = source('../../../../web/src/pages/admin/panels/CmsPanel.tsx')
const reviewMonitor = source(
  '../../../../supabase/migrations/20260719200149_knowledge_review_due_monitor.sql',
)
const aiConsultant = source('../../../../supabase/functions/ai-consultant/index.ts')
const aiClient = source('../../renderer/lib/ai/useAi.ts')

describe('verified knowledge editorial workflow', () => {
  it('retains existing material and replaces browser writes with audited RPCs', () => {
    expect(migration).not.toMatch(/\bdrop\s+table\b/i)
    expect(migration).not.toMatch(/\btruncate\s+public\.bx_knowledge_articles\b/i)
    expect(migration).not.toMatch(/\bdelete\s+from\s+public\.bx_knowledge_articles\b/i)
    expect(migration).toContain('create or replace function public.bx_save_knowledge_article')
    expect(migration).toContain('create or replace function public.bx_transition_knowledge_article')
    expect(cmsPanel).toContain("supabase.rpc('bx_save_knowledge_article'")
    expect(cmsPanel).not.toContain(".from('bx_knowledge_articles')\n            .delete()")
  })

  it('requires independent review and an audited publication reason', () => {
    expect(migration).toContain('AUTHOR_CANNOT_REVIEW_OWN_ARTICLE')
    expect(migration).toContain('INDEPENDENT_REVIEW_REQUIRED')
    expect(migration).toContain('PUBLICATION_REASON_REQUIRED')
    expect(migration).toContain("workflow_status in ('draft', 'in_review', 'published', 'archived')")
    expect(cmsPanel).not.toContain('Опубликовать сразу в Базу Знаний')
  })

  it('keeps law indexing closed behind preview, hash confirmation and service role', () => {
    expect(indexer).toContain("body.action === 'preview' || body.action === 'confirm'")
    expect(indexer).toContain("mode: 'dry-run'")
    expect(indexer).toContain('expectedHash !== contentHash')
    expect(indexer).toContain("const EMBEDDING_MODEL = 'gemini-embedding-2'")
    expect(indexer).toContain('values.length !== EMBEDDING_DIMENSIONS')
    expect(migration).toContain('create or replace function public.bx_commit_law_embedding')
    expect(migration).toContain('from public, anon, authenticated')
    expect(migration).toContain('to service_role')
  })

  it('accepts only verified published Lex.uz material into the vector corpus', () => {
    expect(indexer).toContain("article.workflow_status !== 'published'")
    expect(indexer).toContain("article.source_status !== 'verified'")
    expect(indexer).toContain('new Date(article.next_review_at).getTime() <= Date.now()')
    expect(indexer).toContain("/^https:\\/\\/(www\\.)?lex\\.uz\\//")
    expect(migration).toContain('VERIFIED_PUBLISHED_ARTICLE_REQUIRED')
    expect(migration).toContain('LEX_UZ_SOURCE_REQUIRED')
    expect(migration).toContain('ARTICLE_CHANGED_AFTER_PREVIEW')
  })

  it('requires a future review and creates durable 30/7/1-day reminders', () => {
    expect(migration).toContain('add column if not exists next_review_at timestamptz')
    expect(migration).toContain('OFFICIAL_SOURCE_AND_FUTURE_REVIEW_REQUIRED')
    expect(reviewMonitor).toContain('threshold_days in (0, 1, 7, 30)')
    expect(reviewMonitor).toContain("'0 4 * * *'")
    expect(reviewMonitor).toContain("set source_status = 'stale'")
    expect(reviewMonitor).not.toContain("set workflow_status = 'published'")
    expect(reviewMonitor).toContain('article.next_review_at > now()')
  })

  it('does not trust client-supplied legal articles or hard-coded tax values', () => {
    expect(aiClient).not.toContain("import { retrieveArticles }")
    expect(aiClient).not.toContain('МРОТ = 1 271 000')
    expect(aiClient).not.toContain('Налог для самозанятых составляет 1%')
    expect(aiClient).toContain('JSON.stringify({ messages: payloadMessages, localContext, stream: true })')
    expect(aiConsultant).not.toContain('formattedContext')
    expect(aiConsultant).toContain("typeof payload.localContext === 'string'")
    expect(aiConsultant).toContain('localContext.length > 20_000')
    expect(aiConsultant).toContain('ЛОКАЛЬНЫЕ ДАННЫЕ ПРЕДПРИЯТИЯ (JSON-СТРОКА, НЕ НОРМАТИВНЫЙ ИСТОЧНИК)')
  })
})
