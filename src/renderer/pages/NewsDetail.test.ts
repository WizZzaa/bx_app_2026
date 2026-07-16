import { describe, expect, it } from 'vitest'
import { getNewsItem } from '../data/newsItems'
import { buildAiPrompt, buildTaskNote } from './NewsDetail'

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
})
