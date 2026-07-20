import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const news = readFileSync(resolve(process.cwd(), 'src/renderer/pages/News.tsx'), 'utf8')

describe('News feed information architecture', () => {
  it('keeps canonical economic indicators in Reference instead of duplicating them in News', () => {
    expect(news).not.toContain('aria-label="Ключевые показатели"')
    expect(news).not.toContain('<Indicator')
    expect(news).not.toContain("from('bx_ref_indicators')")
    expect(news).not.toContain("from('bx_ref_indicator_values')")
    expect(news).not.toContain("from('bx_ref_taxes')")
  })

  it('keeps the news route focused on discovery, verification and action', () => {
    expect(news).toContain('aria-label="Поиск и фильтры новостей"')
    expect(news).toContain('Официальные новостные источники')
    expect(news).toContain('Прочитать → сверить → назначить')
    expect(news).toContain("navigate('/ai'")
    expect(news).toContain("navigate('/planner'")
  })
})
