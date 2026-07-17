import { describe, expect, it } from 'vitest'
import { buildTranslationPrompt, countWords, normalizeArchiveFileName, translatedFileName } from './translator'

describe('translator workspace helpers', () => {
  it('builds a strict professional prompt with glossary and structure rules', () => {
    const prompt = buildTranslationPrompt({ source: 'uz-latn', target: 'ru', mode: 'accounting', text: 'Hisob-faktura', glossary: 'QQS = НДС', preserveStructure: true })
    expect(prompt).toContain('Узбекский · латиница')
    expect(prompt).toContain('Бухгалтерский')
    expect(prompt).toContain('Сохрани абзацы')
    expect(prompt).toContain('QQS = НДС')
    expect(prompt).toContain('Hisob-faktura')
  })

  it('counts words and creates a safe translated filename', () => {
    expect(countWords('  один  два\nтри ')).toBe(3)
    expect(translatedFileName('Договор аренды.docx', 'uz-latn')).toBe('Договор аренды_uz-latn.txt')
    expect(normalizeArchiveFileName(' Перевод: договор ')).toBe('Перевод_ договор.txt')
    expect(normalizeArchiveFileName('готово.TXT')).toBe('готово.TXT')
  })
})
