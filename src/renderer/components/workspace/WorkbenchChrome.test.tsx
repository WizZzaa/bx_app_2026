import React, { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { WorkbenchActions, WorkbenchCatalogNav } from './WorkbenchChrome'

describe('WorkbenchChrome', () => {
  it('keeps tools nested under categories and filters them with one search field', () => {
    function Example() {
      const [search, setSearch] = useState('')
      const items = [
        { id: 'vat', icon: 'percent', label: 'НДС', group: 'Налоги', desc: 'Расчёт НДС' },
        { id: 'salary', icon: 'hr', label: 'Зарплата', group: 'Кадры', desc: 'Расчёт зарплаты' },
      ].filter(item => item.label.toLowerCase().includes(search.toLowerCase()))

      return (
        <WorkbenchCatalogNav
          ariaLabel="Категории калькуляторов"
          activeId="vat"
          emptyText="Ничего не найдено"
          groups={['Налоги', 'Кадры']}
          items={items}
          search={search}
          searchLabel="Поиск калькулятора"
          searchPlaceholder="Найти калькулятор…"
          onSearchChange={setSearch}
          onSelect={vi.fn()}
        />
      )
    }

    render(<Example />)
    expect(screen.getByRole('heading', { name: 'Налоги' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'НДС' }).getAttribute('aria-current')).toBe('page')

    fireEvent.change(screen.getByRole('textbox', { name: 'Поиск калькулятора' }), { target: { value: 'зар' } })
    expect(screen.queryByRole('button', { name: 'НДС' })).toBeNull()
    expect(screen.getByRole('heading', { name: 'Кадры' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Зарплата' })).toBeTruthy()
  })

  it('exposes only productive module actions', () => {
    const onReset = vi.fn()

    render(
      <WorkbenchActions
        isFavorite={false}
        onToggleFavorite={vi.fn()}
        onReset={onReset}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Сбросить' }))

    expect(onReset).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: '☆ Избранное' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Как работать' })).toBeNull()
  })
})
