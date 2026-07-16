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
    expect(screen.getByText('Планировщик')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Свернуть боковую панель' }))

    expect(sidebar.getAttribute('data-collapsed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Развернуть боковую панель' })).toBeTruthy()
    expect(screen.getByTestId('sidebar-header').className).toContain('flex-col')
    expect(screen.getByRole('button', { name: 'Развернуть боковую панель' }).className).toContain('h-11')
    expect(localStorage.getItem('bx_sidebar_collapsed')).toBe('true')
    expect(screen.getByRole('link', { name: 'Планировщик' })).toBeTruthy()
  })

  it('keeps Documents and Templates next to each other in navigation', () => {
    render(<MemoryRouter initialEntries={['/documents']}><Sidebar /></MemoryRouter>)

    const links = screen.getAllByRole('link').map(link => link.getAttribute('aria-label'))
    const documentsIndex = links.indexOf('Документы')
    expect(documentsIndex).toBeGreaterThan(-1)
    expect(links[documentsIndex + 1]).toBe('Шаблоны')
  })

  it('shows the document translator as a standalone destination', () => {
    render(<MemoryRouter initialEntries={['/translator']}><Sidebar /></MemoryRouter>)
    expect(screen.getByRole('link', { name: 'Переводчик' }).getAttribute('href')).toBe('/translator')
  })

  it('does not expose the retired HR section', () => {
    render(<MemoryRouter initialEntries={['/dashboard']}><Sidebar /></MemoryRouter>)
    expect(screen.queryByRole('link', { name: 'Сотрудники' })).toBeNull()
  })
})
