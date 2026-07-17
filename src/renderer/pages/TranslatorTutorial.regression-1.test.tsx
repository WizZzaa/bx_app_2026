import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TranslatorTutorial } from '../components/TranslatorTutorial'

afterEach(cleanup)

// Regression: ISSUE-002 — дословный режим и обучение переводчика были недостаточно заметны
// Found by /qa on 2026-07-17
// Report: .gstack/qa-reports/qa-report-localhost-2026-07-17.md
describe('TranslatorTutorial', () => {
  it('explains the workflow and exposes the literal translation action', () => {
    const onToggle = vi.fn()
    const onChooseLiteral = vi.fn()
    render(<TranslatorTutorial enabled literalActive={false} onToggle={onToggle} onChooseLiteral={onChooseLiteral} />)

    expect(screen.getAllByRole('listitem')).toHaveLength(4)
    fireEvent.click(screen.getByRole('button', { name: 'Включить дословный перевод' }))
    expect(onChooseLiteral).toHaveBeenCalledOnce()

    fireEvent.click(screen.getByRole('switch', { name: 'Показывать обучение переводчика' }))
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('keeps only the top control visible when learning is disabled', () => {
    render(<TranslatorTutorial enabled={false} literalActive={false} onToggle={vi.fn()} onChooseLiteral={vi.fn()} />)

    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
    expect(screen.getByRole('switch', { name: 'Показывать обучение переводчика' }).getAttribute('aria-checked')).toBe('false')
  })
})
