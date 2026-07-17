import { describe, expect, it } from 'vitest'
import { parseSettingsBackup, settingsBackupSummary } from './settingsBackup'

describe('settings backup', () => {
  it('validates and summarizes a BX backup before restoration', () => {
    const backup = parseSettingsBackup(JSON.stringify({
      version: '2.25.0', timestamp: '2026-07-16T10:00:00.000Z', theme: 'dark', fontScale: '120',
      templates: [{ id: 'one' }], counterparties: [{ id: 'two' }, { id: 'three' }],
    }))
    expect(settingsBackupSummary(backup)).toMatchObject({ version: '2.25.0', templates: 1, counterparties: 2 })
  })

  it('rejects malformed or unsupported values', () => {
    expect(() => parseSettingsBackup('{')).toThrow('корректным JSON')
    expect(() => parseSettingsBackup(JSON.stringify({ version: '1', timestamp: 'now', theme: 'neon' }))).toThrow('тем')
    expect(() => parseSettingsBackup(JSON.stringify({ version: '1', timestamp: 'now', templates: {} }))).toThrow('списком')
  })

  it('accepts the graphite and lime theme in a backup', () => {
    const backup = parseSettingsBackup(JSON.stringify({ version: '2.30.0', timestamp: 'now', theme: 'lime' }))
    expect(backup.theme).toBe('lime')
  })

  it('accepts the light lime theme in a backup', () => {
    const backup = parseSettingsBackup(JSON.stringify({ version: '2.30.0', timestamp: 'now', theme: 'lime-light' }))
    expect(backup.theme).toBe('lime-light')
  })
})
