import { describe, expect, it } from 'vitest'
import type { BxCounterparty, BxTransaction } from './db/localDb'
import { companyDetailsCompletion, counterpartyHealth, EMPTY_COMPANY_DETAILS } from './organizationInsights'
import { filterPayments, paymentDayDiff, paymentSummary, paymentTiming } from './paymentInsights'

const baseTx: BxTransaction = {
  id: 'tx', user_id: 'user', company_id: 'company', type: 'income', amount: 100, currency: 'UZS', exchange_rate: 1,
  date: '2026-07-10', category: 'Услуги', counterparty: 'Клиент', description: null, status: 'unpaid', created_at: '', updated_at: '',
}

describe('organization insights', () => {
  it('reports missing company requisites and counterparty health', () => {
    expect(companyDetailsCompletion(EMPTY_COMPANY_DETAILS).percent).toBe(0)
    const counterparty = { inn: '123456789', bank_account: null, mfo: null, phone: null, address: null } as BxCounterparty
    expect(counterpartyHealth(counterparty)).toMatchObject({ percent: 20, tone: 'risk' })
  })
})

describe('payment insights', () => {
  it('uses local ISO dates without timezone drift', () => {
    expect(paymentDayDiff('2026-07-10', '2026-07-16')).toBe(-6)
    expect(paymentTiming(baseTx, '2026-07-16')).toBe('overdue')
  })

  it('filters and summarizes obligations', () => {
    const payable = { ...baseTx, id: 'payable', type: 'expense' as const, amount: 40, date: '2026-07-20' }
    const paid = { ...baseTx, id: 'paid', status: 'paid' as const, amount: 25 }
    const rows = [baseTx, payable, paid]
    expect(filterPayments(rows, 'overdue', '', '2026-07-16')).toEqual([baseTx])
    expect(paymentSummary(rows, '2026-07-16')).toMatchObject({ receivable: 100, payable: 40, overdue: 100, overdueCount: 1, upcomingCount: 1, paidCount: 1 })
  })
})
