import { describe, expect, it } from 'vitest'
import { TEMPLATES } from '../data/templates'
import { getFieldGroup, getMissingVars, getTemplateGuide, groupTemplateVars } from './templateGuidance'

describe('templateGuidance', () => {
  it('provides practical guidance for every built-in template', () => {
    for (const template of TEMPLATES) {
      const guide = getTemplateGuide(template)
      expect(guide.whenToUse.length).toBeGreaterThan(20)
      expect(guide.result.length).toBeGreaterThan(15)
      expect(guide.checks).toHaveLength(3)
    }
  })

  it('puts every variable into exactly one visible group', () => {
    for (const template of TEMPLATES) {
      const grouped = groupTemplateVars(template.vars).flatMap(group => group.vars)
      expect(grouped).toHaveLength(template.vars.length)
      expect(new Set(grouped.map(variable => variable.key)).size).toBe(template.vars.length)
    }
  })

  it('separates parties and reports missing values', () => {
    expect(getFieldGroup({ key: 'seller_name', label: 'Продавец', type: 'text' })).toBe('ourParty')
    expect(getFieldGroup({ key: 'buyer_name', label: 'Покупатель', type: 'text' })).toBe('counterparty')
    const template = TEMPLATES[0]
    expect(getMissingVars(template, {})).toHaveLength(template.vars.length)
  })
})
