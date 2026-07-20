import { describe, expect, it } from 'vitest'
import { formatStorageBytes, parseUsageSnapshot, usageWindowLabel } from './usageSnapshot'

const validSnapshot = {
  tariffCode: 'standard',
  tariffVersion: '2026-07-19.1',
  generatedAt: '2026-07-19T12:00:00Z',
  resources: {
    ai: { limit: 40, addOn: 5, reserved: 1, consumed: 10, remaining: 34, window: 'billing_cycle', startsAt: '2026-07-01T00:00:00Z', endsAt: '2026-08-01T00:00:00Z' },
    translations: { limit: 10, addOn: 0, reserved: 0, consumed: 3, remaining: 7, window: 'day', startsAt: '2026-07-19T00:00:00Z', endsAt: '2026-07-20T00:00:00Z' },
    remoteSupportMinutes: { limit: 0, addOn: 0, reserved: 0, consumed: 0, remaining: 0, window: 'billing_cycle', startsAt: '2026-07-01T00:00:00Z', endsAt: '2026-08-01T00:00:00Z' },
    storageBytes: { limit: 1073741824, used: 1048576, remaining: 1072693248, window: 'account_lifetime' },
  },
}

describe('usage snapshot', () => {
  it('accepts the authenticated RPC contract', () => {
    expect(parseUsageSnapshot(validSnapshot)?.resources.ai.remaining).toBe(34)
  })

  it('rejects incomplete and negative server data', () => {
    expect(parseUsageSnapshot({ ...validSnapshot, resources: {} })).toBeNull()
    expect(parseUsageSnapshot({ ...validSnapshot, resources: { ...validSnapshot.resources, ai: { ...validSnapshot.resources.ai, remaining: -1 } } })).toBeNull()
  })

  it('formats storage and window labels for the account cards', () => {
    expect(formatStorageBytes(1073741824)).toBe('1 ГБ')
    expect(usageWindowLabel('day')).toBe('до конца дня')
  })
})
