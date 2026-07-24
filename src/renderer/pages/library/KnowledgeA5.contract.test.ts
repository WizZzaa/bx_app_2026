import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const library = readFileSync(resolve(process.cwd(), 'src/renderer/pages/library/Library.tsx'), 'utf8')
const reader = readFileSync(resolve(process.cwd(), 'src/renderer/pages/library/ArticleReader.tsx'), 'utf8')
const knowledgeCss = readFileSync(resolve(process.cwd(), 'src/renderer/pages/library/KnowledgeA5.css'), 'utf8')
const reference = readFileSync(resolve(process.cwd(), 'src/renderer/pages/library/ReferenceView.tsx'), 'utf8')
const newsCss = readFileSync(resolve(process.cwd(), 'src/renderer/pages/NewsA5.css'), 'utf8')
const app = readFileSync(resolve(process.cwd(), 'src/renderer/App.tsx'), 'utf8')

describe('A5 knowledge, reference and news workspace contracts', () => {
  it('adds saved articles without replacing existing knowledge cache keys', () => {
    expect(library).toContain("const FAVORITES_KEY = 'bx_kb_favorites'")
    expect(library).toContain('label="Сохранённые"')
    expect(library).toContain('aria-pressed={favorite}')
    expect(library).not.toContain('bx_kb_cloud_cache')
    expect(library).not.toContain('bx_kb_category_cache')
  })

  it('uses a wide article workspace while limiting the readable body', () => {
    expect(reader).toContain('className="bx-knowledge-reader"')
    expect(reader).not.toContain('className="bx-reading-container')
    expect(knowledgeCss).toContain('grid-template-columns: minmax(0, 1fr) minmax(14rem, 17rem)')
    expect(knowledgeCss).toContain('max-width: 76ch')
    expect(app).toContain("shellRef.current?.scrollTo?.({ top: 0, behavior: 'auto' })")
  })

  it('keeps verification status attached to reference records instead of a fixed global date', () => {
    expect(reference).toContain("label: 'статус проверки'")
    expect(reference).not.toContain("value: '03.07.2026'")
    expect(reference).toContain('FinanceTab')
    expect(reference).toContain('AccountingTab')
  })

  it('keeps accessibility media modes explicit across redesigned A5 surfaces', () => {
    for (const css of [knowledgeCss, newsCss]) {
      expect(css).toContain('@media (prefers-reduced-motion: reduce)')
      expect(css).toContain('@media (prefers-reduced-transparency: reduce)')
      expect(css).toContain('@media (prefers-contrast: more)')
      expect(css).toContain('@media (forced-colors: active)')
    }
  })
})
