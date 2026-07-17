import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Support from './Support';

const toastError = vi.fn();

vi.mock('./support/useTickets', () => ({
  useTickets: () => ({
    tickets: [],
    activeId: null,
    messages: [],
    loading: false,
    openTicket: vi.fn(),
    createTicket: vi.fn(),
    reply: vi.fn(),
    closeTicket: vi.fn(),
  }),
}));

vi.mock('../lib/plan', () => ({ usePlan: () => ({ isPro: true }) }));
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

describe('Support new request form', () => {
  it('guides the user through category, impact, description and contacts', () => {
    render(<Support />);

    const createButtons = screen.getAllByRole('button', { name: /Новое обращение/ });
    fireEvent.click(createButtons[0]);

    expect(screen.getByText('К чему относится обращение?')).toBeTruthy();
    const eimzo = screen.getByRole('button', { name: /E-Imzo \/ ЭЦП/ });
    fireEvent.click(eimzo);
    expect(eimzo.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: /Работа остановлена/ })).toBeTruthy();
    expect(screen.getByText('Удалённое подключение')).toBeTruthy();
  });

  it('shows useful inline errors instead of silently disabling submit', () => {
    render(<Support />);
    fireEvent.click(screen.getAllByRole('button', { name: /Новое обращение/ })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Отправить обращение' }));

    expect(screen.getByText('Напишите, что именно не работает.')).toBeTruthy();
    expect(screen.getByText(/Добавьте хотя бы 20 символов/)).toBeTruthy();
    expect(screen.getByText('Укажите, к кому обратиться.')).toBeTruthy();
    expect(screen.getByText('Оставьте номер для уточняющих вопросов.')).toBeTruthy();
    expect(toastError).toHaveBeenCalledWith('Проверьте обязательные поля формы');
  });
});
