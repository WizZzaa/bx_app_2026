import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import FunctionCatalog, { matchesFunctionSearch } from './FunctionCatalog'
import { APP_DESTINATIONS } from '../components/layout/navigation'

vi.mock('../lib/ui/BxMotion', () => ({ BxMotion: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div> }))

afterEach(cleanup)

describe('FunctionCatalog', () => {
  it('shows the former sidebar destinations on a standalone page', () => {
    render(<MemoryRouter><FunctionCatalog /></MemoryRouter>)
    expect(screen.getByRole('heading', { level: 1, name: /Все функции/ })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Курсы валют/ })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Калькуляторы/ })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Мои документы/ })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Контроль оплат/ })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Внешние сервисы/ })).toBeTruthy()
    expect(screen.queryByText('Сотрудники')).toBeNull()
  })

  it('filters destinations and provides a recoverable empty state', () => {
    render(<MemoryRouter><FunctionCatalog /></MemoryRouter>)
    const search = screen.getByRole('searchbox', { name: 'Найти функцию' })
    fireEvent.change(search, { target: { value: 'валют' } })
    expect(screen.getByRole('link', { name: /Курсы валют/ })).toBeTruthy()
    expect(screen.queryByRole('link', { name: /Контроль оплат/ })).toBeNull()
    fireEvent.change(search, { target: { value: 'несуществующий раздел' } })
    expect(screen.getByRole('heading', { name: 'Функция не найдена' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Показать все функции' }))
    expect(screen.getByRole('link', { name: /Контроль оплат/ })).toBeTruthy()
  })

  it('searches labels and descriptions consistently', () => {
    expect(matchesFunctionSearch(APP_DESTINATIONS.tools, 'E-Imzo')).toBe(true)
    expect(matchesFunctionSearch(APP_DESTINATIONS.finance, 'долги')).toBe(true)
    expect(matchesFunctionSearch(APP_DESTINATIONS.finance, 'сотрудники')).toBe(false)
  })
})
