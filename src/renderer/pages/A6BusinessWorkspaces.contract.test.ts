import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

describe('A6 organizations, finance and currency Apple-style contracts', () => {
  it('keeps the existing organization and company persistence contracts', () => {
    const counterparties = read('src/renderer/lib/db/useCounterparties.ts')
    const companyContext = read('src/renderer/lib/CompanyContext.tsx')
    const companyDetails = read('src/renderer/lib/organizationInsights.ts')

    expect(counterparties).toContain('db.counterparties')
    expect(counterparties).toContain("where('company_id')")
    expect(companyContext).toContain("const ACTIVE_KEY = 'bx_active_company'")
    expect(companyContext).toContain('companiesRepo.saveProfile')
    expect(companyContext).toContain('syncTaxDeadlines')
    expect(companyDetails).toContain('`bx_company_details_${companyId}`')
  })

  it('keeps finance offline-first while presenting create and import as accessible sheets', () => {
    const transactions = read('src/renderer/pages/finance/useTransactions.ts')
    const transactionSheet = read('src/renderer/pages/finance/TxModal.tsx')
    const importSheet = read('src/renderer/pages/finance/ImportModal.tsx')

    expect(transactions).toContain('db.transactions')
    expect(transactions).toContain("supabase.from('bx_transactions')")
    expect(transactions).toContain("addToSyncQueue('transactions'")
    expect(transactionSheet).toContain('<Sheet')
    expect(transactionSheet).toContain('className="bx-a6-sheet bx-a6-transaction-sheet"')
    expect(transactionSheet).toContain('useCounterparties(companyId)')
    expect(importSheet).toContain('<Sheet')
    expect(importSheet).toContain('className="bx-a6-sheet bx-a6-import-sheet"')
    expect(importSheet).toContain('guessedCategory')
  })

  it('preserves currency settings, sources, history and XLSX export', () => {
    const currency = read('src/renderer/pages/Currency.tsx')
    const bankDirectory = read('src/renderer/lib/bankDirectory.ts')

    expect(currency).toContain("localStorage.getItem('bx_currency_extra_codes')")
    expect(currency).toContain('widgetsApi.getRateOnDate')
    expect(currency).toContain('widgetsApi.getRatesOnDate')
    expect(currency).toContain('XLSX.writeFile')
    expect(currency).toContain('bx-a6-currency__banks')
    expect(bankDirectory).toContain(".from('bx_bank_directory')")
  })

  it('includes responsive and accessibility modes for all A6 surfaces', () => {
    const css = read('src/renderer/styles/a6-business-workspaces.css')

    expect(css).toContain('@media (max-width: 56rem)')
    expect(css).toContain('@media (max-width: 40rem)')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).toContain('@media (prefers-reduced-transparency: reduce)')
    expect(css).toContain('@media (prefers-contrast: more)')
    expect(css).toContain('@media (forced-colors: active)')
  })
})
