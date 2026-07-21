import { describe, expect, it } from 'vitest'
import { buildTranslationPrompt, buildTranslationRequest, countWords, normalizeArchiveFileName, readTranslationFailure, translatedFileName } from './translator'

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

  it('builds the structured Edge Function request without surrounding whitespace', () => {
    expect(buildTranslationRequest({
      source: 'uz-latn',
      target: 'ru',
      mode: 'official',
      text: '  Salom  ',
      glossary: '  QQS = НДС  ',
      preserveStructure: true,
    })).toEqual({
      source: 'uz-latn',
      target: 'ru',
      mode: 'official',
      text: 'Salom',
      glossary: 'QQS = НДС',
      preserveStructure: true,
    })
  })

  it('reads the actionable response body from a non-2xx function error', async () => {
    const context = new Response(JSON.stringify({
      error: 'RATE_LIMIT',
      message: 'Сервис перегружен. Повторите через минуту.',
      retryable: true,
    }), { status: 429, headers: { 'Content-Type': 'application/json' } })

    await expect(readTranslationFailure({ context, message: 'Edge Function returned a non-2xx status code' })).resolves.toEqual({
      code: 'RATE_LIMIT',
      message: 'Сервис перегружен. Повторите через минуту.',
      retryable: true,
    })
  })

  it('turns a transport failure into a useful recovery message', async () => {
    await expect(readTranslationFailure(new Error('Failed to fetch'))).resolves.toMatchObject({
      retryable: true,
      message: expect.stringContaining('Проверьте интернет'),
    })
  })
})
