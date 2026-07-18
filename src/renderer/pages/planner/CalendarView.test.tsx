import React from 'react'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CalendarView from './CalendarView'
import type { BxEvent } from './useEvents'

const event: BxEvent = {
  id: 'event-1',
  user_id: 'user-1',
  company_id: 'company-1',
  type: 'task',
  title: 'Сверить обороты за месяц',
  date: '2026-07-22',
  due_date: '2026-07-22',
  status: 'in_progress',
  priority: 'normal',
  tags: null,
  tax_type: null,
  kind: null,
  regime: null,
  note: null,
  source: 'manual',
  reminder_at: null,
  assignee_id: null,
  created_at: '2026-07-16T10:00:00.000Z',
}

describe('CalendarView', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 16, 12, 0, 0))
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('shows the full day content in a stable preview when the day is hovered', () => {
    render(
      <CalendarView
        events={[event]}
        onDayClick={vi.fn()}
        onAddEvent={vi.fn()}
        onEventClick={vi.fn()}
        companyId="company-1"
        companyRegime="ОСН"
      />,
    )

    const dayCell = screen.getByRole('button', { name: /^Открыть среда, 22 июля 2026/i }).closest('[data-calendar-date]')
    expect(dayCell).not.toBeNull()
    if (!dayCell) throw new Error('Calendar day cell is missing')
    fireEvent.mouseEnter(dayCell)
    act(() => vi.advanceTimersByTime(180))

    const preview = screen.getByRole('complementary', { name: 'Предпросмотр дня' })
    expect(within(preview).getByText('среда')).toBeTruthy()
    expect(within(preview).getByText('22 июля 2026')).toBeTruthy()
    expect(within(preview).getByText('Сверить обороты за месяц')).toBeTruthy()
    expect(within(preview).getByText(/В работе/)).toBeTruthy()
  })

  it('keeps the chosen preview while the pointer passes over other days', () => {
    render(
      <CalendarView
        events={[event]}
        onDayClick={vi.fn()}
        onAddEvent={vi.fn()}
        onEventClick={vi.fn()}
        companyId="company-1"
        companyRegime="ОСН"
      />,
    )

    const target = screen.getByRole('button', { name: /^Открыть среда, 22 июля 2026/i }).closest('[data-calendar-date]')
    const crossed = screen.getByRole('button', { name: /^Открыть четверг, 23 июля 2026/i }).closest('[data-calendar-date]')
    if (!target || !crossed) throw new Error('Calendar day cell is missing')

    fireEvent.mouseEnter(target)
    act(() => vi.advanceTimersByTime(180))
    fireEvent.mouseLeave(target)
    fireEvent.mouseEnter(crossed)
    fireEvent.mouseLeave(crossed)
    act(() => vi.advanceTimersByTime(250))

    const preview = screen.getByRole('complementary', { name: 'Предпросмотр дня' })
    expect(within(preview).getByText('22 июля 2026')).toBeTruthy()
    expect(within(preview).queryByText('23 июля 2026')).toBeNull()
  })

  it('keeps the selected day visible and exposes a labeled add-task action', () => {
    const onAddEvent = vi.fn()
    render(
      <CalendarView
        events={[]}
        onDayClick={vi.fn()}
        onAddEvent={onAddEvent}
        onEventClick={vi.fn()}
        companyId="company-1"
        companyRegime="ОСН"
      />,
    )

    const selectedCell = screen.getByRole('button', { name: /^Открыть среда, 22 июля 2026/i }).closest('[data-calendar-date]')
    const hoveredCell = screen.getByRole('button', { name: /^Открыть четверг, 23 июля 2026/i }).closest('[data-calendar-date]')
    if (!(selectedCell instanceof HTMLElement) || !(hoveredCell instanceof HTMLElement)) throw new Error('Calendar day cell is missing')

    fireEvent.click(selectedCell)
    expect(selectedCell.dataset.selected).toBe('true')

    fireEvent.mouseEnter(hoveredCell)
    act(() => vi.advanceTimersByTime(180))
    expect(selectedCell.dataset.selected).toBe('true')

    const preview = screen.getByRole('complementary', { name: 'Предпросмотр дня' })
    expect(within(preview).getByText('Добавить задачу')).toBeTruthy()
    fireEvent.click(within(preview).getByRole('button', { name: /^Добавить задачу на четверг, 23 июля 2026/i }))
    expect(onAddEvent).toHaveBeenCalledWith('2026-07-23')
  })

  it('opens a day from a focusable native button instead of relying on hover', () => {
    const onDayClick = vi.fn()
    render(
      <CalendarView
        events={[]}
        onDayClick={onDayClick}
        onAddEvent={vi.fn()}
        onEventClick={vi.fn()}
        companyId="company-1"
        companyRegime="ОСН"
      />,
    )

    const dayButton = screen.getByRole('button', { name: /^Открыть среда, 22 июля 2026/i })
    dayButton.focus()
    expect(document.activeElement).toBe(dayButton)
    fireEvent.click(dayButton)
    expect(onDayClick).toHaveBeenCalledWith('2026-07-22')
  })

  it('renders the complete monthly accounting list below the calendar', () => {
    render(
      <CalendarView
        events={[]}
        onDayClick={vi.fn()}
        onAddEvent={vi.fn()}
        onEventClick={vi.fn()}
        companyId="company-1"
        companyRegime="ОСН"
      />,
    )

    expect(screen.getByText('Бухгалтерские сроки', { selector: 'h4' })).toBeTruthy()
    expect(screen.getByText('Праздники и особые дни')).toBeTruthy()
    expect(screen.getByText(/Весь месяц одним списком/)).toBeTruthy()
  })

  it('keeps deadline actions readable and clickable when all companies are shown', () => {
    const onAddDeadline = vi.fn()
    render(
      <CalendarView
        events={[]}
        onDayClick={vi.fn()}
        onAddEvent={vi.fn()}
        onEventClick={vi.fn()}
        onAddDeadline={onAddDeadline}
        companyId={null}
        companyRegime="ОСН"
      />,
    )

    const deadlineCell = screen.getByRole('button', { name: /^Открыть среда, 15 июля 2026/i }).closest('[data-calendar-date]')
    if (!(deadlineCell instanceof HTMLElement)) throw new Error('Deadline day cell is missing')
    fireEvent.mouseEnter(deadlineCell)
    act(() => vi.advanceTimersByTime(180))

    const preview = screen.getByRole('complementary', { name: 'Предпросмотр дня' })
    const addButtons = within(preview).getAllByRole('button', { name: 'Добавить в задачи' })
    expect(addButtons.length).toBeGreaterThan(0)
    expect((addButtons[0] as HTMLButtonElement).disabled).toBe(false)
    fireEvent.click(addButtons[0])
    expect(onAddDeadline).toHaveBeenCalledOnce()
  })

  it('marks ordinary weekends with a text label, not color alone', () => {
    render(
      <CalendarView
        events={[]}
        onDayClick={vi.fn()}
        onAddEvent={vi.fn()}
        onEventClick={vi.fn()}
        companyId="company-1"
        companyRegime="ОСН"
      />,
    )

    const saturday = screen.getByRole('button', { name: /^Открыть суббота, 18 июля 2026/i }).closest('[data-calendar-date]')
    expect(saturday).not.toBeNull()
    if (!(saturday instanceof HTMLElement)) throw new Error('Saturday cell is missing')
    expect(within(saturday).getByText('выходной · 5-дн.')).toBeTruthy()
    expect(saturday.className).toContain('border-rose-300')
  })

  it('renders week mode as a readable agenda with the persistent preview', () => {
    render(
      <CalendarView
        events={[]}
        onDayClick={vi.fn()}
        onAddEvent={vi.fn()}
        onEventClick={vi.fn()}
        companyId="company-1"
        companyRegime="ОСН"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Неделя' }))

    expect(screen.getByRole('heading', { name: 'Недельная повестка' })).toBeTruthy()
    expect(document.querySelectorAll('[data-calendar-layout="week"]')).toHaveLength(7)
    expect(screen.getByRole('complementary', { name: 'Предпросмотр дня' })).toBeTruthy()
    expect(screen.getAllByRole('button', { name: 'Открыть день' })).toHaveLength(7)
  })

  it('changes a task status from the right-click menu in month and week modes', async () => {
    const onEventStatusChange = vi.fn().mockResolvedValue(undefined)
    const todayEvent = { ...event, date: '2026-07-16', due_date: '2026-07-16' }
    render(
      <CalendarView
        events={[todayEvent]}
        onDayClick={vi.fn()}
        onAddEvent={vi.fn()}
        onEventClick={vi.fn()}
        onEventStatusChange={onEventStatusChange}
        companyId="company-1"
        companyRegime="ОСН"
      />,
    )

    fireEvent.contextMenu(screen.getByRole('button', { name: 'Сверить обороты за месяц' }))
    const monthMenu = screen.getByRole('menu', { name: /Быстрые действия/ })
    expect(within(monthMenu).getByText('Текущий: В работе')).toBeTruthy()
    await act(async () => fireEvent.click(within(monthMenu).getByRole('menuitemradio', { name: /^Готово/ })))
    expect(onEventStatusChange).toHaveBeenCalledWith('event-1', 'done')

    fireEvent.click(screen.getByRole('button', { name: 'Неделя' }))
    fireEvent.contextMenu(screen.getByRole('button', { name: 'Сверить обороты за месяц' }))
    expect(screen.getByRole('menu', { name: /Быстрые действия/ })).toBeTruthy()
  })

  it('opens the same status menu from the keyboard context-menu shortcut', () => {
    render(
      <CalendarView
        events={[event]}
        onDayClick={vi.fn()}
        onAddEvent={vi.fn()}
        onEventClick={vi.fn()}
        onEventStatusChange={vi.fn()}
        companyId="company-1"
        companyRegime="ОСН"
      />,
    )

    fireEvent.keyDown(screen.getByRole('button', { name: 'Сверить обороты за месяц' }), { key: 'F10', shiftKey: true })
    expect(screen.getByRole('menu', { name: /Быстрые действия/ })).toBeTruthy()
  })
})
