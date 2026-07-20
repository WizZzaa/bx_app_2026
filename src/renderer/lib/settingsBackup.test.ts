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

  it('migrates the graphite and lime theme from a backup', () => {
    const backup = parseSettingsBackup(JSON.stringify({ version: '2.30.0', timestamp: 'now', theme: 'lime' }))
    expect(backup.theme).toBe('high-contrast')
  })

  it('accepts the light lavender theme in a backup', () => {
    const backup = parseSettingsBackup(JSON.stringify({ version: '2.30.0', timestamp: 'now', theme: 'lavender-light' }))
    expect(backup.theme).toBe('light')
  })

  it('migrates retired compact interface scales in a backup', () => {
    const backup = parseSettingsBackup(JSON.stringify({ version: '2.30.0', timestamp: 'now', fontScale: '75' }))
    expect(backup.fontScale).toBe('100')
    const large = parseSettingsBackup(JSON.stringify({ version: '2.30.0', timestamp: 'now', fontScale: '130' }))
    expect(large.fontScale).toBe('125')
  })

  it('accepts both canonical density modes', () => {
    expect(parseSettingsBackup(JSON.stringify({ version: '2.39.0', timestamp: 'now', density: 'compact' })).density).toBe('compact')
    expect(parseSettingsBackup(JSON.stringify({ version: '2.39.0', timestamp: 'now', density: 'comfortable' })).density).toBe('comfortable')
  })

  it('migrates the retired light lime theme in an older backup', () => {
    const backup = parseSettingsBackup(JSON.stringify({ version: '2.30.0', timestamp: 'now', theme: 'lime-light' }))
    expect(backup.theme).toBe('light')
  })

  it('accepts the four canonical themes in a backup', () => {
    for (const theme of ['system', 'light', 'dark', 'high-contrast']) {
      const backup = parseSettingsBackup(JSON.stringify({ version: '2.32.0', timestamp: 'now', theme }))
      expect(backup.theme).toBe(theme)
    }
  })
})
