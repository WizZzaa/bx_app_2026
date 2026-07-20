import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { WorkbenchTutorial } from './WorkbenchChrome'

afterEach(cleanup)

describe('WorkbenchTutorial', () => {
  it('explains the utility workflow in four task-first steps', () => {
    render(<WorkbenchTutorial kind="utility" enabled onToggle={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'Как выбрать и безопасно применить утилиту' })).toBeTruthy()
    expect(screen.getAllByText(/ШАГ/)).toHaveLength(4)
    expect(screen.getByText('Проверьте предупреждение')).toBeTruthy()
  })

  it('keeps the tutorial switch available when the steps are hidden', () => {
    const onToggle = vi.fn()
    render(<WorkbenchTutorial kind="calculator" enabled={false} onToggle={onToggle} />)

    const toggle = screen.getByRole('switch', { name: 'Показывать обучение: калькуляторы' })
    expect(toggle.getAttribute('aria-checked')).toBe('false')
    expect(screen.queryByText('Проверьте ставку')).toBeNull()
    fireEvent.click(toggle)
    expect(onToggle).toHaveBeenCalledTimes(1)
  })
})
