import { describe, expect, it } from 'vitest'
import type { BankDirectoryEntry, BankExchangeRate } from '../../shared/types'
import { applyBankDirectory } from './bankDirectory'

const rates: BankExchangeRate[] = [
  { bankId: 'bank-b', bankName: 'Old B', sourceUrl: 'https://old-b.test', updatedAt: null, code: 'USD', buy: 10, sell: 12, centralBank: null },
  { bankId: 'bank-a', bankName: 'Old A', sourceUrl: 'https://old-a.test', updatedAt: null, code: 'USD', buy: 11, sell: 13, centralBank: null },
]

const directory: BankDirectoryEntry[] = [
  { bankId: 'bank-a', name: 'Bank A', sourceUrl: 'https://a.test', logoUrl: 'https://cdn.test/a.png', isActive: true, integrationStatus: 'connected', sortOrder: 10 },
  { bankId: 'bank-b', name: 'Bank B', sourceUrl: 'https://b.test', logoUrl: null, isActive: false, integrationStatus: 'connected', sortOrder: 20 },
]

describe('applyBankDirectory', () => {
  it('applies admin metadata and hides inactive banks', () => {
    expect(applyBankDirectory(rates, directory)).toEqual([
      expect.objectContaining({ bankId: 'bank-a', bankName: 'Bank A', sourceUrl: 'https://a.test', logoUrl: 'https://cdn.test/a.png' }),
    ])
  })
})
