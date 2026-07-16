import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CompanyRoleGuide } from './CompanyRoleGuide';

afterEach(cleanup);

describe('CompanyRoleGuide', () => {
  it('explains all company roles in plain language', () => {
    render(<CompanyRoleGuide />);

    expect(screen.getByText('Кто что может делать')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Владелец/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Бухгалтер/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Помощник/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Наблюдатель/ })).toBeTruthy();
    expect(screen.getByText(/только с даты, когда принял приглашение/)).toBeTruthy();
  });

  it('opens role details and shows concrete restrictions', () => {
    render(<CompanyRoleGuide />);

    const viewer = screen.getByRole('button', { name: /Наблюдатель/ });
    expect(viewer.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(viewer);

    expect(viewer.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('Управлять чужими задачами и назначениями')).toBeTruthy();
    expect(screen.getByText('Создавать свои задачи и работать с назначенными ему задачами')).toBeTruthy();
  });
});
