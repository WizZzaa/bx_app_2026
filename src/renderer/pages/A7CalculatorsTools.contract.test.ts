import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

describe('A7 calculators and utilities Apple-style contracts', () => {
  it('keeps calculator formulas, regulatory sources and existing history keys intact', () => {
    const calc = read('src/renderer/pages/Calc.tsx')
    const result = read('src/renderer/pages/calc/CalcResult.tsx')
    const payroll = read('src/renderer/pages/hr/payroll.ts')
    const regulatory = read('src/renderer/lib/calculatorRegulatory.tsx')
    const gate = read('src/renderer/components/calculators/RegulatoryRateGate.tsx')

    expect(calc).toContain("const LAST_CALC_KEY = 'bx_calc_last'")
    expect(result).toContain("const HISTORY_KEY = 'bx_calc_history_v1'")
    expect(result).toContain('const HISTORY_MAX = 15')
    expect(payroll).toContain('export function calcPayroll')
    expect(regulatory).toContain("supabase.rpc('bx_get_current_calculator_regulatory_values'")
    expect(gate).toContain("const SESSION_PREFIX = 'bx_calc_rate_ack_v1'")
    expect(gate).toContain('Результат, PDF и запись в историю не формируются')
  })

  it('separates category-first calculations from the utilities catalog', () => {
    const calc = read('src/renderer/pages/Calc.tsx')
    const tools = read('src/renderer/pages/Tools.tsx')
    const chrome = read('src/renderer/components/workspace/WorkbenchChrome.tsx')
    const app = read('src/renderer/App.tsx')

    expect(calc).toContain('ariaLabel="Категории калькуляторов"')
    expect(calc).toContain('bx-a7-workbench--calc')
    expect(tools).toContain("const LAST_TOOL_KEY = 'bx_tools_last'")
    expect(tools).toContain('ariaLabel="Категории утилит"')
    expect(tools).toContain('bx-a7-workbench--tools')
    expect(tools).toContain("React.lazy(() => import('./tools/PdfCompress'))")
    expect(tools).toContain("React.lazy(() => import('./tools/PdfConvert'))")
    expect(tools).toContain("React.lazy(() => import('./tools/OcrTool'))")
    expect(calc).toContain("import '../styles/a7-calculators-tools.css'")
    expect(tools).toContain("import '../styles/a7-calculators-tools.css'")
    expect(app).not.toContain("import './styles/a7-calculators-tools.css'")
    expect(chrome).toContain('Сначала выберите категорию, затем нужный расчёт.')
    expect(chrome).toContain('Системные и документные инструменты отдельно от расчётов.')
    expect(chrome).toContain('<BxMotion key={resetKey} preset="fade"')
  })

  it('preserves utility-specific local data contracts', () => {
    const notes = read('src/renderer/pages/tools/QuickNotes.tsx')
    const network = read('src/renderer/pages/tools/NetworkChecker.tsx')
    const numberToWords = read('src/renderer/pages/tools/NumberToWords.tsx')
    const siteReset = read('src/renderer/pages/tools/SiteSessionReset.tsx')

    expect(notes).toContain('localStorage.getItem(STORAGE_KEY)')
    expect(notes).toContain('localStorage.setItem(STORAGE_KEY')
    expect(network).toContain('localStorage.getItem(LOCAL_STORAGE_KEY)')
    expect(network).toContain('localStorage.setItem(LOCAL_STORAGE_KEY')
    expect(numberToWords).toContain("'bx_n2w_history'")
    expect(siteReset).toContain('localStorage.getItem(LAST_SITE_KEY)')
  })

  it('provides responsive and accessible Apple material fallbacks', () => {
    const css = read('src/renderer/styles/a7-calculators-tools.css')

    expect(css).toContain('@media (max-width: 1023px)')
    expect(css).toContain('@media (max-width: 720px)')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).toContain('@media (prefers-reduced-transparency: reduce)')
    expect(css).toContain('@media (prefers-contrast: more)')
    expect(css).toContain('@media (forced-colors: active)')
    expect(css).toContain('min-height: 2.75rem')
  })
})
