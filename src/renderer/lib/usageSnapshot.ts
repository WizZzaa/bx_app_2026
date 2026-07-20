export type UsageWindow = 'account_lifetime' | 'day' | 'billing_cycle'

export interface MeteredUsage {
  limit: number
  addOn: number
  reserved: number
  consumed: number
  remaining: number
  window: UsageWindow
  startsAt: string | null
  endsAt: string | null
}

export interface StorageUsage {
  limit: number
  used: number
  remaining: number
  window: 'account_lifetime'
}

export interface UsageSnapshot {
  tariffCode: string
  tariffVersion: string
  generatedAt: string
  resources: {
    ai: MeteredUsage
    translations: MeteredUsage
    remoteSupportMinutes: MeteredUsage
    storageBytes: StorageUsage
  }
}

const finiteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0
const usageWindow = (value: unknown): value is UsageWindow => value === 'account_lifetime' || value === 'day' || value === 'billing_cycle'

function isMeteredUsage(value: unknown): value is MeteredUsage {
  if (!value || typeof value !== 'object') return false
  const resource = value as Record<string, unknown>
  return finiteNumber(resource.limit)
    && finiteNumber(resource.addOn)
    && finiteNumber(resource.reserved)
    && finiteNumber(resource.consumed)
    && finiteNumber(resource.remaining)
    && usageWindow(resource.window)
    && (resource.startsAt === null || typeof resource.startsAt === 'string')
    && (resource.endsAt === null || typeof resource.endsAt === 'string')
}

function isStorageUsage(value: unknown): value is StorageUsage {
  if (!value || typeof value !== 'object') return false
  const resource = value as Record<string, unknown>
  return finiteNumber(resource.limit)
    && finiteNumber(resource.used)
    && finiteNumber(resource.remaining)
    && resource.window === 'account_lifetime'
}

export function parseUsageSnapshot(value: unknown): UsageSnapshot | null {
  if (!value || typeof value !== 'object') return null
  const snapshot = value as Record<string, unknown>
  if (!snapshot.resources || typeof snapshot.resources !== 'object') return null
  const resources = snapshot.resources as Record<string, unknown>
  if (typeof snapshot.tariffCode !== 'string'
    || typeof snapshot.tariffVersion !== 'string'
    || typeof snapshot.generatedAt !== 'string'
    || !isMeteredUsage(resources.ai)
    || !isMeteredUsage(resources.translations)
    || !isMeteredUsage(resources.remoteSupportMinutes)
    || !isStorageUsage(resources.storageBytes)) return null
  return snapshot as unknown as UsageSnapshot
}

export function formatStorageBytes(value: number): string {
  if (value >= 1024 * 1024 * 1024) return `${(value / (1024 * 1024 * 1024)).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} ГБ`
  return `${(value / (1024 * 1024)).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} МБ`
}

export function usageWindowLabel(window: UsageWindow): string {
  if (window === 'day') return 'до конца дня'
  if (window === 'billing_cycle') return 'до конца расчётного цикла'
  return 'на всё время аккаунта'
}
