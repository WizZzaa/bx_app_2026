import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { getNewsItem } from '../data/newsItems'
import { buildAiPrompt, buildTaskNote } from './NewsDetail'

const view = readFileSync(resolve(process.cwd(), 'src/renderer/pages/NewsDetail.tsx'), 'utf8')
const css = readFileSync(resolve(process.cwd(), 'src/renderer/pages/NewsDetail.css'), 'utf8')

describe('news detail handoff', () => {
  it('finds an internal article by its stable route id', () => {
    expect(getNewsItem('1')?.title).toBe('Изменения по НДС на 2026 год')
    expect(getNewsItem('missing')).toBeUndefined()
  })

  it('keeps source and practical actions when handing the article to AI or planner', () => {
    const item = getNewsItem('4')
    expect(item).toBeDefined()
    if (!item) throw new Error('Fixture news item is missing')
    const prompt = buildAiPrompt(item)
    const note = buildTaskNote(item)

    expect(prompt).toContain(item.title)
    expect(prompt).toContain(item.source)
    expect(prompt).toContain(item.impact)
    expect(note).toContain('Что проверить')
    expect(note).toContain(item.actions[0])
    expect(note).toContain(item.url)
  })

  it('uses the wide workspace canvas while limiting only readable paragraphs', () => {
    expect(view).toContain('bx-page-container bx-news-detail__container')
    expect(view).not.toContain('bx-reading-container')
    expect(css).toContain('grid-template-columns: minmax(0, 1fr) minmax(19rem, 23rem)')
    expect(css).toContain('max-width: 72ch')
    expect(css).toContain('.bx-news-detail__rail { position: sticky')
  })

  it('keeps responsive, focus and reduced-motion contracts explicit', () => {
    expect(css).toContain('@media (max-width: 63.999rem)')
    expect(css).toContain('@media (max-width: 47.999rem)')
    expect(css).toContain('env(safe-area-inset-bottom)')
    expect(css).toContain('outline: var(--bx-focus-width) solid var(--bx-focus)')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(view).not.toMatch(/violet-/)
  })
})
