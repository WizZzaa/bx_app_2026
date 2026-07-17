import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DocumentViewModeSwitch } from './DocumentViewModeSwitch'

afterEach(cleanup)

describe('DocumentViewModeSwitch', () => {
  it('shows the short Documents header and switches to the detailed view', () => {
    const onChange = vi.fn()
    render(<DocumentViewModeSwitch current="documents" value="simple" onChange={onChange} actions={<button type="button">Загрузить</button>} />)

    expect(screen.getByRole('heading', { name: 'Документы без лишних блоков' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Простой' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Загрузить' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Подробный' }))
    expect(onChange).toHaveBeenCalledWith('detailed')
  })

  it('uses a compact mode bar above the detailed Templates page', () => {
    render(<DocumentViewModeSwitch current="templates" value="detailed" onChange={vi.fn()} />)

    expect(screen.getByText('Все пояснения и подсказки')).toBeTruthy()
    expect(screen.queryByRole('heading', { name: /Шаблоны без/ })).toBeNull()
  })
})
