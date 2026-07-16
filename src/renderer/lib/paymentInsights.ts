import type { BxTransaction } from './db/localDb'

export type PaymentView = 'all' | 'receivable' | 'payable' | 'overdue' | 'upcoming' | 'paid'

export function transactionUzs(transaction: BxTransaction): number {
  return transaction.amount * (transaction.exchange_rate || 1)
}

export function paymentDayDiff(date: string, today: string): number {
  const [year, month, day] = date.split('-').map(Number)
  const [todayYear, todayMonth, todayDay] = today.split('-').map(Number)
  return Math.round((Date.UTC(year, month - 1, day) - Date.UTC(todayYear, todayMonth - 1, todayDay)) / 86_400_000)
}

export function paymentTiming(transaction: BxTransaction, today: string): 'paid' | 'overdue' | 'today' | 'upcoming' | 'later' {
  if (transaction.status === 'paid') return 'paid'
  const days = paymentDayDiff(transaction.date, today)
  if (days < 0) return 'overdue'
  if (days === 0) return 'today'
  if (days <= 7) return 'upcoming'
  return 'later'
}

export function filterPayments(transactions: BxTransaction[], view: PaymentView, query: string, today: string): BxTransaction[] {
  const normalized = query.trim().toLowerCase()
  return transactions.filter(transaction => {
    if (normalized && ![transaction.counterparty, transaction.category, transaction.description, transaction.currency, String(transaction.amount)].some(value => (value ?? '').toLowerCase().includes(normalized))) return false
    if (view === 'receivable') return transaction.status === 'unpaid' && transaction.type === 'income'
    if (view === 'payable') return transaction.status === 'unpaid' && transaction.type === 'expense'
    if (view === 'overdue') return paymentTiming(transaction, today) === 'overdue'
    if (view === 'upcoming') return ['today', 'upcoming'].includes(paymentTiming(transaction, today))
    if (view === 'paid') return transaction.status === 'paid'
    return true
  }).sort((left, right) => {
    if (left.status !== right.status) return left.status === 'unpaid' ? -1 : 1
    return left.status === 'paid' ? right.date.localeCompare(left.date) : left.date.localeCompare(right.date)
  })
}

export function paymentSummary(transactions: BxTransaction[], today: string) {
  const unpaid = transactions.filter(transaction => transaction.status === 'unpaid')
  const receivable = unpaid.filter(transaction => transaction.type === 'income')
  const payable = unpaid.filter(transaction => transaction.type === 'expense')
  const overdue = unpaid.filter(transaction => paymentTiming(transaction, today) === 'overdue')
  const upcoming = unpaid.filter(transaction => ['today', 'upcoming'].includes(paymentTiming(transaction, today)))
  return {
    receivable: receivable.reduce((sum, transaction) => sum + transactionUzs(transaction), 0),
    payable: payable.reduce((sum, transaction) => sum + transactionUzs(transaction), 0),
    overdue: overdue.reduce((sum, transaction) => sum + transactionUzs(transaction), 0),
    overdueCount: overdue.length,
    upcomingCount: upcoming.length,
    paidCount: transactions.length - unpaid.length,
  }
}
