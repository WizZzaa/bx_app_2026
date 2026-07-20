import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const settings = readFileSync(resolve(process.cwd(), 'src/renderer/pages/Settings.tsx'), 'utf8')

describe('payment preview contract', () => {
  it('keeps payment methods visibly unavailable without producing a fake invoice', () => {
    expect(settings).toContain('Визуальный preview будущей онлайн-оплаты')
    expect(settings).toContain('Счёт пока недоступен')
    expect(settings).toContain('disabled aria-disabled="true"')
    expect(settings).not.toContain('handleGenerateInvoice')
    expect(settings).not.toContain('ООО «BX SOFTWARE»')
    expect(settings).not.toContain('create-payment')
  })
})
