import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Sidebar from './Sidebar'

vi.mock('../../lib/plan', () => ({ usePlan: () => ({ isAdmin: false }) }))

afterEach(cleanup)

describe('Sidebar', () => {
  beforeEach(() => {
    localStorage.clear()
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1440 })
  })

  it('collapses into a navigation rail and persists the choice', () => {
    render(<MemoryRouter initialEntries={['/dashboard']}><Sidebar /></MemoryRouter>)

    const sidebar = screen.getByTestId('app-sidebar')
    expect(sidebar.getAttribute('data-collapsed')).toBe('false')
    expect(screen.getByText('Календарь')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Свернуть боковую панель' }))

    expect(sidebar.getAttribute('data-collapsed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Развернуть боковую панель' })).toBeTruthy()
    expect(screen.getByTestId('sidebar-header').className).toContain('flex-col')
    expect(screen.getByRole('button', { name: 'Развернуть боковую панель' }).className).toContain('h-11')
    expect(localStorage.getItem('bx_sidebar_collapsed')).toBe('true')
    expect(screen.getByRole('link', { name: 'Календарь' })).toBeTruthy()
  })

  it('protects the working area on compact web and desktop windows', () => {
    localStorage.setItem('bx_sidebar_collapsed', 'false')
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280 })

    render(<MemoryRouter initialEntries={['/dashboard']}><Sidebar /></MemoryRouter>)

    expect(screen.getByTestId('app-sidebar').getAttribute('data-collapsed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Развернуть боковую панель' })).toBeTruthy()
  })

  it('uses the canonical seven-section information architecture', () => {
    render(<MemoryRouter initialEntries={['/dashboard']}><Sidebar /></MemoryRouter>)
    const links = screen.getAllByRole('link').map(link => link.getAttribute('aria-label')).filter(Boolean)
    expect(links).toEqual(['Главная', 'AI-консультант', 'База знаний', 'Справочники', 'Переводчик', 'Календарь', 'Все сервисы'])
  })

  it('shows the document translator as a standalone destination', () => {
    render(<MemoryRouter initialEntries={['/translator']}><Sidebar /></MemoryRouter>)
    expect(screen.getByRole('link', { name: 'Переводчик' }).getAttribute('href')).toBe('/translator')
  })

  it('does not expose the retired HR section', () => {
    render(<MemoryRouter initialEntries={['/dashboard']}><Sidebar /></MemoryRouter>)
    expect(screen.queryByRole('link', { name: 'Сотрудники' })).toBeNull()
  })

  it('uses the canonical name for the home workspace', () => {
    render(<MemoryRouter initialEntries={['/dashboard']}><Sidebar /></MemoryRouter>)
    expect(screen.getByRole('link', { name: 'Главная' })).toBeTruthy()
    expect(screen.queryByText('Дашборд')).toBeNull()
  })

  it('uses one semantic accent color for the brand and active navigation', () => {
    render(<MemoryRouter initialEntries={['/dashboard']}><Sidebar /></MemoryRouter>)

    expect(screen.getByTestId('bx-brand-mark').className).toContain('bg-blue-600')
    expect(screen.getByTestId('bx-brand-mark').className).not.toContain('from-blue-600')
    expect(screen.getByRole('link', { name: 'Главная' }).className).toContain('text-bx-on-accent')
  })
})
