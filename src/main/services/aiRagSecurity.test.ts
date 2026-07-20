import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const source = (relativePath: string) =>
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8')
const path = (relativePath: string) =>
  fileURLToPath(new URL(relativePath, import.meta.url))

const migration = source(
  '../../../../supabase/migrations/20260719193940_canonical_verified_law_embeddings.sql',
)
const aiConsultant = source('../../../../supabase/functions/ai-consultant/index.ts')
const legacyMigration = path('../../../../supabase/migrations/20260708_create_law_embeddings.sql')

describe('verified law RAG security contract', () => {
  it('replaces the unapplied dimension-mismatched legacy migration', () => {
    expect(existsSync(legacyMigration)).toBe(false)
    expect(migration).toContain('embedding vector(1536) not null')
    expect(aiConsultant).toContain("const EMBEDDING_MODEL = 'gemini-embedding-2'")
    expect(aiConsultant).toContain('const EMBEDDING_DIMENSIONS = 1536')
    expect(aiConsultant).not.toContain('gemini-embedding-001')
  })

  it('requests an explicit embedding shape and rejects malformed responses', () => {
    expect(aiConsultant).toContain('embedContentConfig:')
    expect(aiConsultant).toContain('outputDimensionality: EMBEDDING_DIMENSIONS')
    expect(aiConsultant).toContain('values.length !== EMBEDDING_DIMENSIONS')
    expect(aiConsultant).toContain("task: search result | query: ${text}")
  })

  it('keeps the corpus private and searches only verified current-model rows', () => {
    expect(migration).toContain('alter table public.bx_law_embeddings enable row level security')
    expect(migration).toContain('revoke all on table public.bx_law_embeddings from public, anon, authenticated')
    expect(migration).toContain('security invoker')
    expect(migration).toContain("laws.source_status = 'verified'")
    expect(migration).toContain("laws.embedding_model = 'gemini-embedding-2'")
    expect(migration).toContain('to service_role')
  })

  it('fails closed when no official source is present', () => {
    expect(aiConsultant).toContain('не придумывайте ссылки, цитаты, даты проверки и номера статей')
    expect(aiConsultant).toContain('не называйте точные суммы/сроки/статьи как достоверные')
  })

  it('does not rewrite or delete existing corpus rows', () => {
    expect(migration).not.toMatch(/\btruncate\b/i)
    expect(migration).not.toMatch(/\bdrop\s+table\b/i)
    expect(migration).not.toMatch(/\bdelete\s+from\b/i)
    expect(migration).not.toMatch(/\bupdate\s+public\.bx_law_embeddings\b/i)
  })
})
