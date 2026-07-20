export const TARIFF_MATRIX_VERSION = '2026-07-19.1' as const

export type TariffCode = 'free' | 'trial' | 'standard' | 'premium'
export type LimitWindow = 'account_lifetime' | 'day' | 'billing_cycle'

export interface MeteredLimit {
  amount: number
  window: LimitWindow
}

export interface TariffDefinition {
  code: TariffCode
  priceUzs: { month: number | null; year: number | null }
  companies: number
  additionalMembers: number
  devicesPerUser: number
  ai: MeteredLimit
  translations: MeteredLimit
  storageBytes: number
  maxFileBytes: number
  customTemplates: number | null
  trackedCertificates: number | null
  counterparties: number | null
  oneCBackupBases: number
  support: 'none' | 'standard_chat' | 'premium_priority'
  remoteSupportMinutes: MeteredLimit
}

const MB = 1024 * 1024
const GB = 1024 * MB

// null means unlimited. Commercial consumers must read this versioned matrix;
// client-side checks remain presentation only and never grant an entitlement.
export const TARIFF_MATRIX: Readonly<Record<TariffCode, TariffDefinition>> = {
  free: {
    code: 'free',
    priceUzs: { month: 0, year: 0 },
    companies: 0,
    additionalMembers: 0,
    devicesPerUser: 1,
    ai: { amount: 3, window: 'account_lifetime' },
    translations: { amount: 3, window: 'day' },
    storageBytes: 0,
    maxFileBytes: 0,
    customTemplates: 0,
    trackedCertificates: 0,
    counterparties: 0,
    oneCBackupBases: 0,
    support: 'none',
    remoteSupportMinutes: { amount: 0, window: 'billing_cycle' },
  },
  trial: {
    code: 'trial',
    priceUzs: { month: null, year: null },
    companies: 1,
    additionalMembers: 0,
    devicesPerUser: 1,
    ai: { amount: 15, window: 'account_lifetime' },
    translations: { amount: 10, window: 'account_lifetime' },
    storageBytes: 100 * MB,
    maxFileBytes: 10 * MB,
    customTemplates: 0,
    trackedCertificates: 0,
    counterparties: 10,
    oneCBackupBases: 0,
    support: 'none',
    remoteSupportMinutes: { amount: 0, window: 'billing_cycle' },
  },
  standard: {
    code: 'standard',
    priceUzs: { month: 200_000, year: 2_000_000 },
    companies: 1,
    additionalMembers: 0,
    devicesPerUser: 2,
    ai: { amount: 30, window: 'billing_cycle' },
    translations: { amount: 30, window: 'billing_cycle' },
    storageBytes: 300 * MB,
    maxFileBytes: 25 * MB,
    customTemplates: 5,
    trackedCertificates: 5,
    counterparties: null,
    oneCBackupBases: 1,
    support: 'standard_chat',
    remoteSupportMinutes: { amount: 0, window: 'billing_cycle' },
  },
  premium: {
    code: 'premium',
    priceUzs: { month: 500_000, year: 5_000_000 },
    companies: 5,
    additionalMembers: 2,
    devicesPerUser: 2,
    ai: { amount: 80, window: 'billing_cycle' },
    translations: { amount: 80, window: 'billing_cycle' },
    storageBytes: GB,
    maxFileBytes: 50 * MB,
    customTemplates: null,
    trackedCertificates: null,
    counterparties: null,
    oneCBackupBases: 5,
    support: 'premium_priority',
    remoteSupportMinutes: { amount: 120, window: 'billing_cycle' },
  },
} as const

export const ADD_ONS = {
  ai20: { priceUzs: 60_000, amount: 20, resource: 'ai' },
  translations20: { priceUzs: 60_000, amount: 20, resource: 'translations' },
  combo20: { priceUzs: 100_000, ai: 20, translations: 20 },
  storage1Gb: { priceUzs: 60_000, bytes: GB, renewal: 'manual_monthly' },
} as const
