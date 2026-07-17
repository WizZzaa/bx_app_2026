import { describe, expect, it } from 'vitest'
import { buildUpdateFeedUrl, calculateDownloadPercent, isNewerVersion } from './updatePolicy'

describe('desktop update policy', () => {
  it('builds the update.electronjs.org feed for the installed build', () => {
    expect(buildUpdateFeedUrl('2.29.0', 'win32', 'x64')).toBe(
      'https://update.electronjs.org/WizZzaa/bx_app_2026/win32-x64/2.29.0',
    )
  })

  it('compares release versions without treating equal or older releases as updates', () => {
    expect(isNewerVersion('v2.29.1', '2.29.0')).toBe(true)
    expect(isNewerVersion('2.30.0', '2.29.9')).toBe(true)
    expect(isNewerVersion('2.29.0', '2.29.0')).toBe(false)
    expect(isNewerVersion('2.28.9', '2.29.0')).toBe(false)
  })

  it('reports honest download progress and keeps an unknown total indeterminate', () => {
    expect(calculateDownloadPercent(50, 100)).toBe(50)
    expect(calculateDownloadPercent(150, 100)).toBe(100)
    expect(calculateDownloadPercent(10, 0)).toBeNull()
  })
})
