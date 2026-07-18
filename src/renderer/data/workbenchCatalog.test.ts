import { describe, expect, it } from 'vitest'
import { CALCULATOR_PROPOSALS, UTILITY_PROPOSALS, WORKBENCH_PROPOSALS, getWorkbenchProposal } from './workbenchCatalog'

describe('workbench proposals', () => {
  it('keeps ids unique and every concept explicitly unimplemented', () => {
    const ids = WORKBENCH_PROPOSALS.map(item => item.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(WORKBENCH_PROPOSALS.every(item => item.status === 'proposal')).toBe(true)
  })

  it('covers professional documents, agriculture and construction', () => {
    const sectors = new Set(WORKBENCH_PROPOSALS.map(item => item.sector))
    expect(sectors).toEqual(new Set(['Общее', 'Документы и право', 'Агро', 'Строительство']))
    expect(CALCULATOR_PROPOSALS.some(item => item.sector === 'Агро')).toBe(true)
    expect(CALCULATOR_PROPOSALS.some(item => item.sector === 'Строительство')).toBe(true)
    expect(UTILITY_PROPOSALS.some(item => item.sector === 'Документы и право')).toBe(true)
  })

  it('provides enough detail for a decision instead of a dead placeholder', () => {
    for (const item of WORKBENCH_PROPOSALS) {
      expect(item.inputs.length).toBeGreaterThanOrEqual(3)
      expect(item.outputs.length).toBeGreaterThanOrEqual(3)
      expect(item.summary.length).toBeGreaterThan(30)
      expect(getWorkbenchProposal(item.id)).toBe(item)
    }
  })

  it('contains at least sixteen utility concepts with a clear purpose', () => {
    expect(UTILITY_PROPOSALS.length).toBeGreaterThanOrEqual(16)
    expect(UTILITY_PROPOSALS.every(item => item.value.length > 45)).toBe(true)
  })
})
