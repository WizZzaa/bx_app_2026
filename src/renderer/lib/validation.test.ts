import { describe, it, expect } from 'vitest'
import { validateInn, validatePinfl, validateBankAccount, getBankNameByMfo } from './validation'

describe('validateInn', () => {
  it('принимает 9 цифр, первая не ноль', () => {
    expect(validateInn('123456789')).toBe(true)
    expect(validateInn(' 200000001 ')).toBe(true)
  })
  it('отклоняет ведущий ноль, неверную длину и не-цифры', () => {
    expect(validateInn('012345678')).toBe(false)
    expect(validateInn('12345678')).toBe(false)
    expect(validateInn('1234567890')).toBe(false)
    expect(validateInn('12345678a')).toBe(false)
  })
})

describe('validatePinfl', () => {
  it('ровно 14 цифр', () => {
    expect(validatePinfl('12345678901234')).toBe(true)
    expect(validatePinfl('1234567890123')).toBe(false)
  })
})

describe('validateBankAccount', () => {
  it('ровно 20 цифр', () => {
    expect(validateBankAccount('12345678901234567890')).toBe(true)
    expect(validateBankAccount('1234567890123456789')).toBe(false)
  })
})

describe('getBankNameByMfo', () => {
  it('находит банк по МФО и возвращает пусто для неизвестного', () => {
    expect(getBankNameByMfo('00014')).toBe('Национальный банк ВЭД РУз (НБУ)')
    expect(getBankNameByMfo('99999')).toBe('')
  })
})
