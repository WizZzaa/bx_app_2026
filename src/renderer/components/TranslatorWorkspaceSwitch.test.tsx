import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TranslatorWorkspaceSwitch } from './TranslatorWorkspaceSwitch'

afterEach(cleanup)

describe('TranslatorWorkspaceSwitch', () => {
  it('shows a compact simple workspace and exposes both modes', () => {
    const onChange = vi.fn()
    render(<TranslatorWorkspaceSwitch value="simple" onChange={onChange} />)

    expect(screen.getByRole('heading', { name: 'Быстрый перевод без лишних панелей' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Простой' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Профессиональный' }).getAttribute('aria-pressed')).toBe('false')

    fireEvent.click(screen.getByRole('button', { name: 'Профессиональный' }))
    expect(onChange).toHaveBeenCalledWith('professional')
  })

  it('explains what becomes visible in professional mode', () => {
    render(<TranslatorWorkspaceSwitch value="professional" onChange={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'Полный профессиональный рабочий стол' })).toBeTruthy()
    expect(screen.getByText(/Обучение, режимы, глоссарий/)).toBeTruthy()
  })
})
