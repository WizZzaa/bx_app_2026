import type { BxCounterparty } from './db/localDb'

export interface CompanyDetailsSnapshot {
  oked: string
  okpo: string
  account: string
  mfo: string
  bank: string
  director: string
  phone: string
  address: string
  notes: string
}

export const EMPTY_COMPANY_DETAILS: CompanyDetailsSnapshot = {
  oked: '', okpo: '', account: '', mfo: '', bank: '', director: '', phone: '', address: '', notes: '',
}

const COMPANY_REQUIRED: Array<keyof CompanyDetailsSnapshot> = ['account', 'mfo', 'bank', 'director', 'phone', 'address']

export function companyDetailsCompletion(details: CompanyDetailsSnapshot): { percent: number; missing: string[] } {
  const labels: Record<keyof CompanyDetailsSnapshot, string> = {
    oked: 'ОКЭД', okpo: 'ОКПО', account: 'расчётный счёт', mfo: 'МФО', bank: 'банк', director: 'директор', phone: 'телефон', address: 'адрес', notes: 'заметки',
  }
  const missing = COMPANY_REQUIRED.filter(key => !details[key].trim()).map(key => labels[key])
  return { percent: Math.round((COMPANY_REQUIRED.length - missing.length) / COMPANY_REQUIRED.length * 100), missing }
}

export function counterpartyHealth(counterparty: Pick<BxCounterparty, 'inn' | 'bank_account' | 'mfo' | 'phone' | 'address'>): { percent: number; missing: string[]; tone: 'good' | 'attention' | 'risk' } {
  const checks = [
    ['ИНН', counterparty.inn?.trim().length === 9],
    ['расчётный счёт', counterparty.bank_account?.trim().length === 20],
    ['МФО', counterparty.mfo?.trim().length === 5],
    ['телефон', Boolean(counterparty.phone?.trim())],
    ['адрес', Boolean(counterparty.address?.trim())],
  ] as const
  const missing = checks.filter(([, valid]) => !valid).map(([label]) => label)
  const percent = Math.round((checks.length - missing.length) / checks.length * 100)
  return { percent, missing, tone: percent >= 80 ? 'good' : percent >= 50 ? 'attention' : 'risk' }
}

export function loadCompanyDetails(companyId: string): CompanyDetailsSnapshot {
  try {
    const raw = localStorage.getItem(`bx_company_details_${companyId}`)
    return raw ? { ...EMPTY_COMPANY_DETAILS, ...JSON.parse(raw) as Partial<CompanyDetailsSnapshot> } : { ...EMPTY_COMPANY_DETAILS }
  } catch {
    return { ...EMPTY_COMPANY_DETAILS }
  }
}

export function saveCompanyDetails(companyId: string, details: CompanyDetailsSnapshot): void {
  localStorage.setItem(`bx_company_details_${companyId}`, JSON.stringify(details))
}
