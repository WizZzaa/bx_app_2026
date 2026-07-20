import { describe, expect, it } from 'vitest'
import { answerPreview, extractAnswerSources } from './answerPresentation'

describe('AI answer presentation', () => {
  it('extracts unique http sources without changing the stored answer', () => {
    const content = 'См. [статью 241](https://lex.uz/241) и [тот же источник](https://lex.uz/241).'
    expect(extractAnswerSources(content)).toEqual([{ label: 'статью 241', url: 'https://lex.uz/241' }])
    expect(content).toContain('[статью 241]')
  })

  it('builds a compact plain-text preview for collapsed answers', () => {
    expect(answerPreview('## Итог\n**Срок** — завтра', 40)).toBe('Итог Срок — завтра')
    expect(answerPreview('Очень длинный ответ для проверки', 12)).toBe('Очень длинный…')
  })
})
