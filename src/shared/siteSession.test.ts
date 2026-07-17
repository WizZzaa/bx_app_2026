import { describe, expect, it } from 'vitest'
import { normalizeSiteUrl } from './siteSession'

describe('normalizeSiteUrl', () => {
  it('adds https and preserves the requested page', () => {
    expect(normalizeSiteUrl('my.soliq.uz/cabinet?tab=1')).toEqual({
      url: 'https://my.soliq.uz/cabinet?tab=1',
      origin: 'https://my.soliq.uz',
      hostname: 'my.soliq.uz',
    })
  })

  it('accepts http addresses', () => {
    expect(normalizeSiteUrl('http://localhost:8080/test').origin).toBe('http://localhost:8080')
  })

  it.each(['', 'javascript:alert(1)', 'file:///tmp/test', 'https://user:secret@example.com'])('%s is rejected', value => {
    expect(() => normalizeSiteUrl(value)).toThrow()
  })
})
