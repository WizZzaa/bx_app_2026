import React, { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { WorkbenchActions, WorkbenchGuide, WorkbenchModeSwitch } from './WorkbenchChrome'

describe('WorkbenchChrome', () => {
  it('switches between compact and guided views', () => {
    function Example() {
      const [view, setView] = useState<'compact' | 'guided'>('compact')
      return <WorkbenchModeSwitch kind="utility" view={view} onViewChange={setView} />
    }

    render(<Example />)
    const compact = screen.getByRole('button', { name: 'Компактно' })
    const guided = screen.getByRole('button', { name: 'С подсказками' })

    expect(compact.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(guided)
    expect(guided.getAttribute('aria-pressed')).toBe('true')
  })

  it('exposes productive module actions and concise instructions', () => {
    const onReset = vi.fn()
    const onToggleGuide = vi.fn()

    render(
      <>
        <WorkbenchActions
          isFavorite={false}
          onToggleFavorite={vi.fn()}
          onReset={onReset}
          showGuide={false}
          onToggleGuide={onToggleGuide}
        />
        <WorkbenchGuide kind="calculator" />
      </>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Сбросить' }))
    fireEvent.click(screen.getByRole('button', { name: 'Как работать' }))

    expect(onReset).toHaveBeenCalledOnce()
    expect(onToggleGuide).toHaveBeenCalledOnce()
    expect(screen.getByText('Введите исходные данные')).toBeTruthy()
    expect(screen.getByText('Заберите расчёт')).toBeTruthy()
  })
})
