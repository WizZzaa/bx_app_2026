import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ResourceHero, ResourceLayout, ResourceNavItem, ResourceSidebar } from './ResourceWorkspace'

describe('ResourceWorkspace', () => {
  it('keeps section navigation, search and hero semantics consistent', () => {
    const onSearch = vi.fn()
    const onSelect = vi.fn()

    render(
      <ResourceLayout sidebar={(
        <ResourceSidebar icon="book" title="База" subtitle="Полезные материалы" search="" searchPlaceholder="Найти материал" onSearch={onSearch} label="Разделы">
          <ResourceNavItem icon="folder" label="Все материалы" description="Проверенные статьи и инструкции" count={12} active onClick={onSelect} />
        </ResourceSidebar>
      )}>
        <ResourceHero eyebrow="Рабочий контур" title="Единый стиль" description="Описание раздела" icon="book" />
      </ResourceLayout>,
    )

    expect(screen.getByText('База')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Единый стиль' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Все материалы/ }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByText('Проверенные статьи и инструкции').className).toContain('text-blue-100')

    fireEvent.change(screen.getByRole('textbox', { name: 'Найти материал' }), { target: { value: 'налог' } })
    fireEvent.click(screen.getByRole('button', { name: /Все материалы/ }))
    expect(onSearch).toHaveBeenCalledWith('налог')
    expect(onSelect).toHaveBeenCalledOnce()
  })
})
