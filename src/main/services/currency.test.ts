import { describe, expect, it } from 'vitest'
import { parseAloqabankRates, parseIpakYuliRates, parseTrustbankRates } from './currency'

describe('official bank exchange-rate parsers', () => {
  it('reads cash-desk rates from the Ipak Yuli page payload', () => {
    const html = 'В кассе — видимый текст. "В кассе","CurrencyTable","list","rates",[17],"USD","$",{"buy":24,"sell":25,"cb":26},1204000,1214000,1209335,1784236201,0,"В банкомате"'
    expect(parseIpakYuliRates(html)).toEqual([
      expect.objectContaining({ bankId: 'ipak-yuli', code: 'USD', buy: 12040, sell: 12140, centralBank: 12093.35 }),
    ])
  })

  it('reads bank cash rates from Aloqabank embedded JSON', () => {
    const html = 'var arCurrencyRates = {"BANK":{"BUY":{"USD":"12030","UZS":1},"SALE":{"USD":"12120","UZS":1}}}; Данные от 15.07.2026 11:00:00<'
    expect(parseAloqabankRates(html)).toEqual([
      expect.objectContaining({ bankId: 'aloqabank', code: 'USD', buy: 12030, sell: 12120 }),
    ])
  })

  it('reads the first official cash table from Trustbank markup', () => {
    const html = `покупка/продажа - Данные от 17.07.2026 11:00<
      <table class="rate__currency_table"><tr><td>icon__USD</td>
      <td class="rate__currency_value"><span>12060</span></td>
      <td class="rate__currency_value"><span>12145</span></td>
      <td class="rate__currency_value"><span>12093.35</span></td></tr></table>`
    expect(parseTrustbankRates(html)).toEqual([
      expect.objectContaining({ bankId: 'trustbank', code: 'USD', buy: 12060, sell: 12145, centralBank: 12093.35 }),
    ])
  })
})
