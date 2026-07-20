import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import MobileNavigation from './MobileNavigation'

afterEach(cleanup)

describe('MobileNavigation', () => {
  it('shows the canonical five mobile destinations', () => {
    render(<MemoryRouter initialEntries={['/dashboard']}><MobileNavigation /></MemoryRouter>)
    const nav = screen.getByRole('navigation', { name: 'Мобильная навигация' })
    expect(nav.textContent).toContain('Главная')
    expect(nav.textContent).toContain('AI')
    expect(nav.textContent).toContain('База знаний')
    expect(nav.textContent).toContain('Переводчик')
    expect(nav.textContent).toContain('Ещё')
  })

  it('opens extra destinations and closes them with Escape', () => {
    render(<MemoryRouter><MobileNavigation /></MemoryRouter>)
    const more = screen.getByRole('button', { name: 'Ещё' })
    fireEvent.click(more)
    expect(screen.getByRole('menu', { name: 'Дополнительные разделы' })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: /Личный кабинет/ })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: /Настройки приложения/ })).toBeTruthy()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('menu')).toBeNull()
    expect(document.activeElement).toBe(more)
  })
})
