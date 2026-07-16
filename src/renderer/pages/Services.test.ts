import { describe, expect, it } from 'vitest'
import { serviceItemKey } from './Services'

describe('serviceItemKey', () => {
  it('keeps cards unique when official services share the same URL', () => {
    const first = serviceItemKey('tax', 0, 'Реестр плательщиков НДС', 'https://my.soliq.uz')
    const second = serviceItemKey('tax', 1, 'Реестр плательщиков НДС', 'https://my.soliq.uz')

    expect(first).not.toBe(second)
  })
})
