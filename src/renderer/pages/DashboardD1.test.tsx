// @vitest-environment jsdom
import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_PLAN_LIMITS } from '../lib/plan'
import type { BxEvent } from './planner/useEvents'
import { DashboardD1View, type DashboardD1ViewProps } from './DashboardD1'

vi.mock('motion/react-mini', () => ({
  useAnimate: () => [{ current: null }, vi.fn(() => ({ then: vi.fn(), stop: vi.fn() }))],
}))

const task: BxEvent = {
  id: 'task-1', user_id: 'user-1', company_id: null, type: 'tax_deadline', title: 'Сдать расчёт по НДС',
  date: '2026-07-21', due_date: null, status: 'todo', priority: 'high', tags: null, tax_type: 'НДС',
  kind: 'report', regime: null, note: null, source: 'tax', reminder_at: null, assignee_id: null,
  created_at: '2026-07-19T10:00:00Z',
}

const navigate = vi.fn()
const baseProps: DashboardD1ViewProps = {
  today: '2026-07-20',
  events: [task],
  eventsLoading: false,
  eventsError: null,
  rates: {
    value: [
      { code: 'USD', name: 'Доллар США', flag: '', value: 12_500, diff: 10, date: '20.07.2026' },
      { code: 'EUR', name: 'Евро', flag: '', value: 14_200, diff: -5, date: '20.07.2026' },
    ],
    loading: false,
    error: null,
    updatedAt: '2026-07-20T10:00:00Z',
  },
  ai: {
    value: {
      usage: {
        tariffCode: 'standard', tariffVersion: '2026-07-19.1', generatedAt: '2026-07-20T10:00:00Z',
        resources: {
          ai: { limit: 30, addOn: 0, reserved: 0, consumed: 4, remaining: 26, window: 'billing_cycle', startsAt: null, endsAt: null },
          translations: { limit: 30, addOn: 0, reserved: 0, consumed: 0, remaining: 30, window: 'billing_cycle', startsAt: null, endsAt: null },
          remoteSupportMinutes: { limit: 0, addOn: 0, reserved: 0, consumed: 0, remaining: 0, window: 'billing_cycle', startsAt: null, endsAt: null },
          storageBytes: { limit: 1, used: 0, remaining: 1, window: 'account_lifetime' },
        },
      },
      lastAnswerAt: '2026-07-20T09:00:00Z',
    },
    loading: false,
    error: null,
    updatedAt: '2026-07-20T10:00:00Z',
  },
  online: true,
  activeCompany: null,
  companyCount: 0,
  plan: 'standard',
  planLoading: false,
  limits: DEFAULT_PLAN_LIMITS.standard,
  onNavigate: navigate,
  onRetryEvents: vi.fn(),
  onRetryRates: vi.fn(),
  onRetryAi: vi.fn(),
  onCreateCompany: vi.fn(),
  onEditCompany: vi.fn(),
}

function mockViewport(viewport: 'mobile' | 'tablet' | 'desktop') {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('max-width') ? viewport === 'mobile' : viewport === 'desktop',
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

describe('D1 Dashboard view', () => {
  beforeEach(() => {
    document.documentElement.setAttribute('data-bx-design', 'd1')
    navigate.mockReset()
    mockViewport('desktop')
  })
  afterEach(() => cleanup())

  it('keeps desktop DOM reading order aligned with the bento priority', () => {
    const { container } = render(<DashboardD1View {...baseProps} />)
    const cards = Array.from(container.querySelectorAll('.bx-d1-dashboard-card')).map(card => card.className)

    expect(cards[0]).toContain('--today')
    expect(cards[1]).toContain('--company')
    expect(cards[2]).toContain('--tools')
    expect(cards[3]).toContain('--ai')
    expect(screen.getByRole('heading', { level: 1, name: 'Главное на сегодня' })).toBeTruthy()
    expect(screen.getByText('1', { selector: '.bx-d1-dashboard-hero__summary dd' })).toBeTruthy()
    expect(screen.getAllByText('Срок завтра')).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: /Открыть план дня/ })[0]).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Новая задача/ }))
    expect(navigate).toHaveBeenCalledWith('/planner', { newTask: {} })
    fireEvent.click(screen.getByRole('button', { name: /Все функции/ }))
    expect(navigate).toHaveBeenCalledWith('/functions')
  })

  it('uses the canonical mobile order and sends local AI draft only on submit', () => {
    mockViewport('mobile')
    const { container } = render(<DashboardD1View {...baseProps} />)
    const cards = Array.from(container.querySelectorAll('.bx-d1-dashboard-card')).map(card => card.className)
    expect(cards[0]).toContain('--today')
    expect(cards[1]).toContain('--ai')
    expect(cards[2]).toContain('--tools')
    expect(cards[3]).toContain('--company')

    fireEvent.change(screen.getByLabelText('Вопрос для BX AI'), { target: { value: 'Когда платить НДС?' } })
    fireEvent.click(screen.getByRole('button', { name: 'Задать вопрос BX AI' }))
    expect(navigate).toHaveBeenCalledWith('/ai', { prompt: 'Когда платить НДС?' })
  })

  it('uses a tablet reading order that pairs company and AI before the full-width tools row', () => {
    mockViewport('tablet')
    const { container } = render(<DashboardD1View {...baseProps} />)
    const cards = Array.from(container.querySelectorAll('.bx-d1-dashboard-card')).map(card => card.className)
    expect(cards[0]).toContain('--today')
    expect(cards[1]).toContain('--company')
    expect(cards[2]).toContain('--ai')
    expect(cards[3]).toContain('--tools')
  })

  it('renders honest locked, offline, stale and exhausted states with recovery actions', () => {
    const usage = baseProps.ai.value.usage
    if (!usage) throw new Error('Test fixture requires an AI usage snapshot')
    render(<DashboardD1View
      {...baseProps}
      online={false}
      plan="free"
      limits={DEFAULT_PLAN_LIMITS.free}
      rates={{ ...baseProps.rates, value: baseProps.rates.value.map(rate => ({ ...rate, date: '19.07.2026' })) }}
      ai={{ ...baseProps.ai, value: { ...baseProps.ai.value, usage: { ...usage, resources: { ...usage.resources, ai: { ...usage.resources.ai, remaining: 0 } } } } }}
    />)

    expect(screen.getByRole('alert').textContent).toContain('Нет соединения')
    expect(screen.getByText('Компания недоступна на текущем тарифе')).toBeTruthy()
    expect(screen.getByText('Лимит AI исчерпан')).toBeTruthy()
    expect(screen.getByText(/Курсы могут быть устаревшими/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Повторить' })).toBeTruthy()
  })

  it('shows a non-collapsing permission state and retry', () => {
    const retry = vi.fn()
    render(<DashboardD1View {...baseProps} events={[]} eventsError="42501 permission denied" onRetryEvents={retry} />)
    expect(screen.getByText('Нет доступа к задачам')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))
    expect(retry).toHaveBeenCalledOnce()
  })
})
