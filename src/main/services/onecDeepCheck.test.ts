import { describe, expect, it } from 'vitest'
import { buildDeepCheckArgs, validateDeepCheckSelection } from './onecDeepCheck'

describe('safe 1C Designer deep check', () => {
  it('builds a test-only command without credentials or repair options', () => {
    const args = buildDeepCheckArgs('C:\\Temp\\bx-onec-check', 'C:\\Temp\\check.log', 'C:\\Temp\\result.txt')

    expect(args).toEqual([
      'DESIGNER',
      '/F', 'C:\\Temp\\bx-onec-check',
      '/DisableStartupMessages',
      '/DisableStartupDialogs',
      '/IBCheckAndRepair',
      '-LogAndRefsIntegrity',
      '-TestOnly',
      '-TimeLimit:000:30',
      '/Out', 'C:\\Temp\\check.log',
      '/DumpResult', 'C:\\Temp\\result.txt',
    ])
    expect(args).not.toContain('/N')
    expect(args).not.toContain('/P')
    expect(args).not.toContain('-Reindex')
    expect(args).not.toContain('-RecalcTotals')
  })

  it('rejects the working database and unexpected executable', () => {
    expect(validateDeepCheckSelection('C:\\Bases\\1Cv8.1CD', 'C:\\1C\\1cv8.exe', 'C:\\Bases\\1Cv8.1CD')).toContain('Рабочую базу')
    expect(validateDeepCheckSelection('D:\\Backup\\copy.1CD', 'C:\\1C\\1cv8c.exe', 'C:\\Bases\\1Cv8.1CD')).toContain('1cv8.exe')
    expect(validateDeepCheckSelection('D:\\Backup\\copy.zip', 'C:\\1C\\1cv8.exe', 'C:\\Bases\\1Cv8.1CD')).toContain('.1CD')
  })
})
