import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import DailyTasksModal from './DailyTasksModal'
import type { BxBoard } from './useBoards'
import type { BxEvent } from './useEvents'

afterEach(cleanup)

const event: BxEvent = {
  id: 'event-1',
  user_id: 'user-1',
  company_id: null,
  type: 'task',
  title: 'Сверить отчёт',
  date: '2026-07-20',
  due_date: null,
  status: 'todo',
  priority: 'high',
  tags: null,
  tax_type: null,
  kind: null,
  regime: null,
  note: null,
  source: 'manual',
  reminder_at: null,
  assignee_id: null,
  created_at: '2026-07-20T09:00:00.000Z',
}

const board: BxBoard = {
  id: 'board-1',
  user_id: 'user-1',
  company_id: null,
  name: 'Клиенты',
  icon: '🏢',
  color: 'purple',
  columns: [
    { id: 'todo', title: 'К выполнению', color: 'slate', wip: null },
    { id: 'done', title: 'Готово', color: 'emerald', wip: null },
  ],
  position: 0,
  is_default: false,
  created_at: '2026-07-20T09:00:00.000Z',
}

describe('DailyTasksModal shared sheet redesign', () => {
  it('keeps status and open callbacks for events and cards', () => {
    const onClose = vi.fn()
    const onEventStatusChange = vi.fn()
    const onCardStatusChange = vi.fn()
    const onCardClick = vi.fn()
    render(
      <DailyTasksModal
        date="2026-07-20"
        events={[event]}
        cards={[{ id: 'card-1', title: 'Позвонить клиенту', due_date: '2026-07-20', board_id: board.id, column_id: 'todo', priority: 'normal' }]}
        boards={[board]}
        onEventClick={vi.fn()}
        onCardClick={onCardClick}
        onEventStatusChange={onEventStatusChange}
        onCardStatusChange={onCardStatusChange}
        onDeleteEvent={vi.fn()}
        onDeleteCard={vi.fn()}
        onAddClick={vi.fn()}
        onClose={onClose}
      />,
    )

    fireEvent.click(screen.getByRole('checkbox', { name: 'Отметить выполненным: Сверить отчёт' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Отметить выполненной: Позвонить клиенту' }))
    fireEvent.click(screen.getByRole('button', { name: /Позвонить клиенту.*Клиенты/ }))

    expect(onEventStatusChange).toHaveBeenCalledWith('event-1', 'done')
    expect(onCardStatusChange).toHaveBeenCalledWith('card-1', 'board-1', true)
    expect(onCardClick).toHaveBeenCalledWith('card-1')
    expect(onClose).toHaveBeenCalled()
  })

  it('shows a calm empty state and opens event creation for the selected date', () => {
    const onAddClick = vi.fn()
    render(
      <DailyTasksModal
        date="2026-07-20"
        events={[]}
        cards={[]}
        boards={[]}
        onEventClick={vi.fn()}
        onCardClick={vi.fn()}
        onEventStatusChange={vi.fn()}
        onCardStatusChange={vi.fn()}
        onDeleteEvent={vi.fn()}
        onDeleteCard={vi.fn()}
        onAddClick={onAddClick}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByText('На этот день всё спокойно')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Добавить задачу или событие' }))
    expect(onAddClick).toHaveBeenCalledWith('2026-07-20')
  })
})
