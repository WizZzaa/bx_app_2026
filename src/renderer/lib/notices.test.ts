import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ECP_EXPIRY_CHECKPOINTS } from './ecpProductBoundary'
import { daysFromNowISO } from './dates'
import { buildNotices } from './notices'

describe('certificate expiry notices', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 19, 12, 0, 0))
  })

  afterEach(() => vi.useRealTimers())

  it('covers every canonical 30/14/7/1 day checkpoint', () => {
    for (const days of ECP_EXPIRY_CHECKPOINTS) {
      const notices = buildNotices([{
        name: `Сертификат ${days}`,
        expiresAt: daysFromNowISO(days),
      }])

      expect(notices).toContainEqual(expect.objectContaining({
        text: `Сертификат ЭЦП «Сертификат ${days}» истекает`,
        time: days === 1 ? 'через 1 дн.' : `через ${days} дн.`,
      }))
    }
  })

  it('keeps an expired certificate visible as critical', () => {
    const notices = buildNotices([{ name: 'Просроченный', expiresAt: daysFromNowISO(-2) }])

    expect(notices).toContainEqual(expect.objectContaining({
      level: 'critical',
      text: 'Сертификат ЭЦП «Просроченный» просрочен',
      time: 'истёк 2 дн. назад',
    }))
  })
})
