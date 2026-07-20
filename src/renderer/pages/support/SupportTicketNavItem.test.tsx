import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildSupportMessage, buildSupportSubject } from './supportUi';
import { SupportTicketNavItem } from './SupportTicketNavItem';
import type { BxTicket } from './useTickets';

afterEach(cleanup);

const TICKET: BxTicket = {
  id: 'ticket-1',
  user_id: 'user-1',
  subject: 'Не подписывается документ',
  status: 'closed',
  created_at: '2026-07-13T10:00:00Z',
  updated_at: '2026-07-13T11:00:00Z',
};

describe('SupportTicketNavItem', () => {
  it('keeps status and date inside the selected ticket card', () => {
    render(<SupportTicketNavItem ticket={TICKET} active onOpen={vi.fn()} />);

    const button = screen.getByRole('button', { name: /Не подписывается документ/ });
    const status = screen.getByText('Закрыт');
    expect(button.contains(status)).toBe(true);
    expect(button.getAttribute('aria-current')).toBe('page');
    expect(screen.getByText('Обновлено 13.07.2026')).toBeTruthy();
  });

  it('adds structured context to the first support message', () => {
    expect(buildSupportMessage('Не запускается подпись', 'eimzo', 'blocking')).toContain('Раздел: E-Imzo / ЭЦП');
    expect(buildSupportMessage('Не запускается подпись', 'eimzo', 'blocking')).toContain('Влияние на работу: Работа остановлена');
  });

  it('builds a concise ticket subject from the first meaningful line', () => {
    expect(buildSupportSubject('\n1. E-Imzo не видит ключ\nПерезапуск не помог', 'eimzo')).toBe('E-Imzo не видит ключ');
    expect(buildSupportSubject('А'.repeat(140), 'bx')).toHaveLength(118);
  });
});
