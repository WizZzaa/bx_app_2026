import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const dashboard = readFileSync(resolve(process.cwd(), 'src/renderer/pages/Dashboard.tsx'), 'utf8')

describe('canonical dashboard', () => {
  it('does not load retired decorative widgets or the full calendar', () => {
    expect(dashboard).not.toContain('WeatherWidget')
    expect(dashboard).not.toContain('HoroscopeWidget')
    expect(dashboard).not.toContain('NotificationsWidget')
    expect(dashboard).not.toContain('SmartCalendar')
  })

  it('keeps the required compact working sections', () => {
    expect(dashboard).toContain('Что нужно решить?')
    expect(dashboard).toContain('Важное изменение')
    expect(dashboard).toContain('Избранные сервисы')
    expect(dashboard).toContain('Последние проверенные материалы')
    expect(dashboard).toContain("getRates(['USD', 'EUR'])")
  })
})
