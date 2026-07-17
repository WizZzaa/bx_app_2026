import type { BankDirectoryEntry, BankExchangeRate } from '../../shared/types'
import { supabase } from './db/supabase'

export const DEFAULT_BANK_DIRECTORY: BankDirectoryEntry[] = [
  { bankId: 'ipak-yuli', name: 'Ipak Yuli Bank', sourceUrl: 'https://ru.ipakyulibank.uz/physical/obmen-valyut', logoUrl: null, isActive: true, integrationStatus: 'connected', sortOrder: 10 },
  { bankId: 'aloqabank', name: 'Aloqabank', sourceUrl: 'https://aloqabank.uz/ru/', logoUrl: null, isActive: true, integrationStatus: 'connected', sortOrder: 20 },
  { bankId: 'trustbank', name: 'Trustbank', sourceUrl: 'https://trustbank.uz/ru/', logoUrl: null, isActive: true, integrationStatus: 'connected', sortOrder: 30 },
]

interface BankDirectoryRow {
  bank_id: string
  name: string
  source_url: string
  logo_url: string | null
  is_active: boolean
  integration_status: 'connected' | 'planned'
  sort_order: number
}

const fromRow = (row: BankDirectoryRow): BankDirectoryEntry => ({
  bankId: row.bank_id,
  name: row.name,
  sourceUrl: row.source_url,
  logoUrl: row.logo_url,
  isActive: row.is_active,
  integrationStatus: row.integration_status,
  sortOrder: row.sort_order,
})

export async function loadBankDirectory(): Promise<BankDirectoryEntry[]> {
  const { data, error } = await supabase
    .from('bx_bank_directory')
    .select('bank_id, name, source_url, logo_url, is_active, integration_status, sort_order')
    .order('sort_order', { ascending: true })

  if (error || !data?.length) return DEFAULT_BANK_DIRECTORY
  return (data as BankDirectoryRow[]).map(fromRow)
}

export function applyBankDirectory(rates: BankExchangeRate[], directory: BankDirectoryEntry[]): BankExchangeRate[] {
  const metadata = new Map(directory.map(bank => [bank.bankId, bank]))
  return rates
    .filter(rate => metadata.get(rate.bankId)?.isActive !== false)
    .map(rate => {
      const bank = metadata.get(rate.bankId)
      return bank ? { ...rate, bankName: bank.name, sourceUrl: bank.sourceUrl, logoUrl: bank.logoUrl } : rate
    })
    .sort((left, right) => (metadata.get(left.bankId)?.sortOrder ?? 999) - (metadata.get(right.bankId)?.sortOrder ?? 999))
}
