import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CALCULATOR_REGULATORY_KEYS } from '../../renderer/data/calculatorRegulatoryValues'

const ROOT = resolve(__dirname, '../..')
const read = (path: string) => readFileSync(resolve(ROOT, path), 'utf8')

describe('calculator regulatory security boundary', () => {
  it('wraps calculator rendering in the fail-closed gate', () => {
    const source = read('renderer/pages/Calc.tsx')
    expect(source).toContain('<RegulatoryRateGate calculatorId={tab.id}>')
    expect(source).toContain('calculatorRequiresManualConfirmation')
  })

  it('keeps a canonical dependency map for every regulatory calculator', () => {
    expect(Object.keys(CALCULATOR_REGULATORY_KEYS).sort()).toEqual([
      'dividend', 'inps', 'ndfl', 'penalty', 'recycling', 'regime', 'salary', 'sick', 'taxcalc', 'vacation', 'vat',
    ])
  })

  it('does not persist manual legal acknowledgements beyond the browser session', () => {
    const source = read('renderer/components/calculators/RegulatoryRateGate.tsx')
    expect(source).toContain('sessionStorage.setItem')
    expect(source).not.toContain('localStorage.setItem')
  })

  it('feeds core tax math from the versioned catalog', () => {
    for (const path of [
      'renderer/pages/calc/VatCalc.tsx',
      'renderer/pages/calc/NdflCalc.tsx',
      'renderer/pages/calc/DividendCalc.tsx',
      'renderer/pages/calc/PenaltyCalc.tsx',
      'renderer/pages/calc/SalaryCalc.tsx',
      'renderer/pages/calc/InpsCalc.tsx',
      'renderer/pages/calc/VacationCalc.tsx',
      'renderer/pages/calc/SickLeaveCalc.tsx',
      'renderer/pages/calc/RecyclingCalc.tsx',
      'renderer/pages/calc/RegimeCompareCalc.tsx',
      'renderer/pages/tools/TaxCalculator.tsx',
    ]) {
      expect(read(path), path).toContain('useRegulatoryNumber')
    }
    expect(read('renderer/pages/hr/payroll.ts')).toContain('regulatoryNumber')
  })

  it('loads only current server values and demotes bundled values on failure', () => {
    const provider = read('renderer/lib/calculatorRegulatory.tsx')
    const catalog = read('renderer/data/calculatorRegulatoryValues.ts')

    expect(provider).toContain("supabase.rpc('bx_get_current_calculator_regulatory_values'")
    expect(provider).toContain("status: 'unavailable'")
    expect(provider).toContain('unpublishedCalculatorRegulatoryValues()')
    expect(catalog).toContain("editorialStatus: 'review'")
    expect(catalog).toContain('isOfficialRegulatoryUrl')
  })
})
