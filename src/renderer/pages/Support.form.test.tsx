import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Support from './Support';

const toastError = vi.fn();
const ticketMocks = vi.hoisted(() => ({
  createTicket: vi.fn(),
  openTicket: vi.fn(),
}));
const planMocks = vi.hoisted(() => ({
  plan: undefined as 'free' | 'standard' | 'premium' | undefined,
  isPro: true,
}));

vi.mock('./support/useTickets', () => ({
  useTickets: () => ({
    tickets: [],
    activeId: null,
    messages: [],
    loading: false,
    openTicket: ticketMocks.openTicket,
    createTicket: ticketMocks.createTicket,
    reply: vi.fn(),
    closeTicket: vi.fn(),
  }),
}));

vi.mock('../lib/plan', () => ({ usePlan: () => ({ plan: planMocks.plan, isPro: planMocks.isPro }) }));
vi.mock('../lib/CompanyContext', () => ({
  useCompany: () => ({ active: { name: 'ООО Тест', inn: '123456789' } }),
}));
vi.mock('../lib/ui/ToastContext', () => ({
  useToast: () => ({ error: toastError, success: vi.fn() }),
}));

afterEach(() => {
  cleanup();
  toastError.mockClear();
  localStorage.clear();
});

beforeEach(() => {
  planMocks.plan = undefined;
  planMocks.isPro = true;
  ticketMocks.createTicket.mockReset();
  ticketMocks.createTicket.mockResolvedValue('ticket-1');
  ticketMocks.openTicket.mockReset();
});

describe('Support new request form', () => {
  it('keeps the first request focused on one message and one contact', () => {
    render(<Support />);

    const createButtons = screen.getAllByRole('button', { name: /Отправить заявку/ });
    fireEvent.click(createButtons[0]);

    expect(screen.getByRole('heading', { name: 'Чем помочь?' })).toBeTruthy();
    expect(screen.getByLabelText(/Что случилось/)).toBeTruthy();
    const category = screen.getByLabelText('Раздел') as HTMLSelectElement;
    fireEvent.change(category, { target: { value: 'eimzo' } });
    expect(category.value).toBe('eimzo');
    const blocking = screen.getByRole('checkbox', { name: /Работа остановлена/ });
    fireEvent.click(blocking);
    expect((blocking as HTMLInputElement).checked).toBe(true);
    expect(screen.getByText('Дополнительные сведения')).toBeTruthy();
    expect(screen.queryByText('Короткая тема')).toBeNull();
  });

  it('shows useful inline errors instead of silently disabling submit', () => {
    render(<Support />);
    fireEvent.click(screen.getAllByRole('button', { name: /Отправить заявку/ })[0]);
    const submitButtons = screen.getAllByRole('button', { name: 'Отправить заявку' });
    fireEvent.click(submitButtons[submitButtons.length - 1]);

    expect(screen.getByText(/Добавьте хотя бы 20 символов/)).toBeTruthy();
    expect(screen.getByText('Оставьте номер для уточняющих вопросов.')).toBeTruthy();
    expect(toastError).toHaveBeenCalledWith('Проверьте обязательные поля формы');
  });

  it('generates the subject automatically and keeps the name optional', async () => {
    render(<Support />);
    fireEvent.click(screen.getAllByRole('button', { name: /Отправить заявку/ })[0]);
    fireEvent.change(screen.getByLabelText(/Что случилось/), { target: { value: 'E-Imzo не видит ключ после обновления Windows' } });
    fireEvent.change(screen.getByLabelText(/Телефон/), { target: { value: '+998 90 123-45-67' } });
    const submitButtons = screen.getAllByRole('button', { name: 'Отправить заявку' });
    fireEvent.click(submitButtons[submitButtons.length - 1]);

    await waitFor(() => expect(ticketMocks.createTicket).toHaveBeenCalled());
    expect(ticketMocks.createTicket).toHaveBeenCalledWith(
      'E-Imzo не видит ключ после обновления Windows',
      expect.stringContaining('E-Imzo не видит ключ после обновления Windows'),
      'bx',
      undefined,
      '+998 90 123-45-67',
      'ООО Тест',
      '123456789',
      undefined,
    );
  });

  it('preserves a stored draft when the current plan cannot submit it', async () => {
    const draft = JSON.stringify({ subject: 'Не удалять', body: 'Этот черновик должен остать на устройстве' });
    localStorage.setItem('bx_support_draft', draft);
    planMocks.plan = 'free';
    planMocks.isPro = false;

    render(<MemoryRouter><Support /></MemoryRouter>);

    await waitFor(() => expect(localStorage.getItem('bx_support_draft')).toBe(draft));
    expect(ticketMocks.createTicket).not.toHaveBeenCalled();
  });

  it('loads a stored draft without deleting it and clears it only after successful creation', async () => {
    const draft = JSON.stringify({ subject: 'Проблема с E-Imzo', body: 'E-Imzo не видит ключ после обновления Windows' });
    localStorage.setItem('bx_support_draft', draft);
    localStorage.setItem('bx_support_contact_phone', '+998 90 123-45-67');

    render(<Support />);

    expect(await screen.findByRole('heading', { name: 'Чем помочь?' })).toBeTruthy();
    expect((screen.getByLabelText(/Что случилось/) as HTMLTextAreaElement).value).toBe('E-Imzo не видит ключ после обновления Windows');
    expect(localStorage.getItem('bx_support_draft')).toBe(draft);

    const submitButtons = screen.getAllByRole('button', { name: 'Отправить заявку' });
    fireEvent.click(submitButtons[submitButtons.length - 1]);

    await waitFor(() => expect(ticketMocks.createTicket).toHaveBeenCalled());
    await waitFor(() => expect(localStorage.getItem('bx_support_draft')).toBeNull());
  });

  it('keeps the draft when ticket creation is not confirmed', async () => {
    const draft = JSON.stringify({ subject: 'Не отправлено', body: 'Не удаётся отправить эту заявку в поддержку' });
    localStorage.setItem('bx_support_draft', draft);
    localStorage.setItem('bx_support_contact_phone', '+998 90 123-45-67');
    ticketMocks.createTicket.mockResolvedValue(null);

    render(<Support />);
    expect(await screen.findByRole('heading', { name: 'Чем помочь?' })).toBeTruthy();
    const submitButtons = screen.getAllByRole('button', { name: 'Отправить заявку' });
    fireEvent.click(submitButtons[submitButtons.length - 1]);

    await waitFor(() => expect(ticketMocks.createTicket).toHaveBeenCalled());
    expect(localStorage.getItem('bx_support_draft')).toBe(draft);
  });
});
